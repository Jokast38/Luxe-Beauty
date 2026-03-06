import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { adminLogin, adminRegister } from "../../lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    setLoading(true);
    try {
      const res = await adminLogin(loginData);
      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("admin_info", JSON.stringify(res.data.admin));
      toast.success("Connexion réussie");
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (registerData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setLoading(true);
    try {
      const res = await adminRegister({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password
      });
      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("admin_info", JSON.stringify(res.data.admin));
      toast.success("Compte créé avec succès");
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-8 h-8 text-[#D4AF37]" />
          <span className="font-heading text-2xl font-semibold text-[#1A1A1A]">
            Admin
          </span>
        </Link>
        
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" data-testid="login-tab">Connexion</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Inscription</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="login-email" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    placeholder="admin@exemple.com"
                    className="rounded-lg"
                    data-testid="login-email-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="login-password" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                    Mot de passe
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="••••••••"
                    className="rounded-lg"
                    data-testid="login-password-input"
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-6 bg-[#1A1A1A] text-white hover:bg-[#333]"
                  data-testid="login-submit-btn"
                >
                  {loading ? (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <Label htmlFor="register-name" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    Nom
                  </Label>
                  <Input
                    id="register-name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    placeholder="Marie Admin"
                    className="rounded-lg"
                    data-testid="register-name-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="register-email" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="admin@exemple.com"
                    className="rounded-lg"
                    data-testid="register-email-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="register-password" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                    Mot de passe
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    placeholder="••••••••"
                    className="rounded-lg"
                    data-testid="register-password-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="register-confirm" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                    className="rounded-lg"
                    data-testid="register-confirm-input"
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-6 bg-[#1A1A1A] text-white hover:bg-[#333]"
                  data-testid="register-submit-btn"
                >
                  {loading ? (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  ) : (
                    <>
                      Créer un compte
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        
        <p className="text-center mt-6 text-sm text-[#6B7280]">
          <Link to="/" className="hover:text-[#D4AF37] transition-colors">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
