import { useEffect, useState, useCallback } from "react";
import { 
  Settings, Building, Palette, Clock, Instagram, Mail, 
  Phone, MapPin, Save, Send, CheckCircle, AlertCircle
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { AdminLayout } from "./AdminLayout";
import { toast } from "sonner";
import { 
  getAdminSiteSettings, updateSiteSettings,
  getSMTPSettings, updateSMTPSettings, testSMTPSettings
} from "../../lib/api";

// TikTok Icon
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState({
    business_name: "",
    tagline: "",
    phone: "",
    email: "",
    address: "",
    instagram_url: "",
    tiktok_url: "",
    primary_color: "#D4AF37",
    secondary_color: "#F5E6E8",
    accent_color: "#E07A5F",
    background_color: "#FDFCF8",
    text_color: "#1A1A1A",
    hero_image: "",
    opening_hours: {}
  });
  
  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_email: "",
    smtp_password: "",
    enabled: false
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [siteRes, smtpRes] = await Promise.all([
        getAdminSiteSettings(),
        getSMTPSettings()
      ]);
      setSiteSettings(siteRes.data);
      setSmtpSettings(smtpRes.data);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSite = async () => {
    setSaving(true);
    try {
      await updateSiteSettings(siteSettings);
      toast.success("Paramètres enregistrés");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSMTP = async () => {
    setSaving(true);
    try {
      await updateSMTPSettings(smtpSettings);
      toast.success("Configuration SMTP enregistrée");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await testSMTPSettings();
      toast.success("Email de test envoyé ! Vérifiez votre boîte mail.");
    } catch (error) {
      toast.error("Échec de l'envoi. Vérifiez vos paramètres SMTP.");
    } finally {
      setTestingEmail(false);
    }
  };

  const updateOpeningHours = (day, field, value) => {
    setSiteSettings({
      ...siteSettings,
      opening_hours: {
        ...siteSettings.opening_hours,
        [day]: {
          ...siteSettings.opening_hours?.[day],
          [field]: value
        }
      }
    });
  };

  const days = [
    { key: "monday", label: "Lundi" },
    { key: "tuesday", label: "Mardi" },
    { key: "wednesday", label: "Mercredi" },
    { key: "thursday", label: "Jeudi" },
    { key: "friday", label: "Vendredi" },
    { key: "saturday", label: "Samedi" },
    { key: "sunday", label: "Dimanche" }
  ];

  if (loading) {
    return (
      <AdminLayout title="Paramètres">
        <div className="text-center py-12 text-[#6B7280]">Chargement...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Paramètres">
      <div data-testid="admin-settings">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border border-[#E5E7EB]">
            <TabsTrigger value="general" data-testid="tab-general">
              <Building className="w-4 h-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="hours" data-testid="tab-hours">
              <Clock className="w-4 h-4 mr-2" />
              Horaires
            </TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">
              <Instagram className="w-4 h-4 mr-2" />
              Réseaux
            </TabsTrigger>
            <TabsTrigger value="colors" data-testid="tab-colors">
              <Palette className="w-4 h-4 mr-2" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="smtp" data-testid="tab-smtp">
              <Mail className="w-4 h-4 mr-2" />
              Email SMTP
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
              <h3 className="text-lg font-heading font-medium text-[#1A1A1A] flex items-center gap-2">
                <Building className="w-5 h-5 text-[#D4AF37]" />
                Informations de l'entreprise
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={siteSettings.business_name}
                    onChange={(e) => setSiteSettings({...siteSettings, business_name: e.target.value})}
                    placeholder="Luxe Beauty"
                    className="mt-1"
                    data-testid="business-name-input"
                  />
                </div>
                <div>
                  <Label>Slogan</Label>
                  <Input
                    value={siteSettings.tagline}
                    onChange={(e) => setSiteSettings({...siteSettings, tagline: e.target.value})}
                    placeholder="L'art de sublimer votre beauté"
                    className="mt-1"
                    data-testid="tagline-input"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Téléphone
                  </Label>
                  <Input
                    value={siteSettings.phone}
                    onChange={(e) => setSiteSettings({...siteSettings, phone: e.target.value})}
                    placeholder="06 12 34 56 78"
                    className="mt-1"
                    data-testid="phone-input"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email de contact
                  </Label>
                  <Input
                    value={siteSettings.email}
                    onChange={(e) => setSiteSettings({...siteSettings, email: e.target.value})}
                    placeholder="contact@exemple.com"
                    className="mt-1"
                    data-testid="email-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Adresse
                  </Label>
                  <Input
                    value={siteSettings.address}
                    onChange={(e) => setSiteSettings({...siteSettings, address: e.target.value})}
                    placeholder="123 Rue de la Beauté, 75001 Paris"
                    className="mt-1"
                    data-testid="address-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Image Hero (URL)</Label>
                  <Input
                    value={siteSettings.hero_image}
                    onChange={(e) => setSiteSettings({...siteSettings, hero_image: e.target.value})}
                    placeholder="https://..."
                    className="mt-1"
                    data-testid="hero-image-input"
                  />
                  {siteSettings.hero_image && (
                    <img 
                      src={siteSettings.hero_image}
                      alt="Hero preview"
                      className="mt-2 w-full h-40 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleSaveSite}
                disabled={saving}
                className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                data-testid="save-general-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </TabsContent>

          {/* Opening Hours */}
          <TabsContent value="hours">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
              <h3 className="text-lg font-heading font-medium text-[#1A1A1A] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                Horaires d'ouverture
              </h3>
              
              <div className="space-y-4">
                {days.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4 p-4 bg-[#F3F4F6] rounded-lg">
                    <span className="w-24 font-medium text-[#1A1A1A]">{label}</span>
                    <Input
                      type="time"
                      value={siteSettings.opening_hours?.[key]?.open || ""}
                      onChange={(e) => updateOpeningHours(key, "open", e.target.value)}
                      className="w-32"
                      data-testid={`hours-${key}-open`}
                    />
                    <span className="text-[#6B7280]">à</span>
                    <Input
                      type="time"
                      value={siteSettings.opening_hours?.[key]?.close || ""}
                      onChange={(e) => updateOpeningHours(key, "close", e.target.value)}
                      className="w-32"
                      data-testid={`hours-${key}-close`}
                    />
                    <span className="text-sm text-[#6B7280]">
                      {(!siteSettings.opening_hours?.[key]?.open && !siteSettings.opening_hours?.[key]?.close) && "Fermé"}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleSaveSite}
                disabled={saving}
                className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                data-testid="save-hours-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
              <h3 className="text-lg font-heading font-medium text-[#1A1A1A] flex items-center gap-2">
                <Instagram className="w-5 h-5 text-[#D4AF37]" />
                Réseaux sociaux
              </h3>
              <p className="text-sm text-[#6B7280]">
                Ajoutez vos liens pour les afficher sur le site et permettre à vos clients de vous suivre.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </Label>
                  <Input
                    value={siteSettings.instagram_url}
                    onChange={(e) => setSiteSettings({...siteSettings, instagram_url: e.target.value})}
                    placeholder="https://instagram.com/votrecompte"
                    className="mt-1"
                    data-testid="instagram-input"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <TikTokIcon className="w-4 h-4" />
                    TikTok
                  </Label>
                  <Input
                    value={siteSettings.tiktok_url}
                    onChange={(e) => setSiteSettings({...siteSettings, tiktok_url: e.target.value})}
                    placeholder="https://tiktok.com/@votrecompte"
                    className="mt-1"
                    data-testid="tiktok-input"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSaveSite}
                disabled={saving}
                className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                data-testid="save-social-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
              <h3 className="text-lg font-heading font-medium text-[#1A1A1A] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#D4AF37]" />
                Personnalisation des couleurs
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: "primary_color", label: "Couleur primaire (Or)", default: "#D4AF37" },
                  { key: "secondary_color", label: "Couleur secondaire (Rose)", default: "#F5E6E8" },
                  { key: "accent_color", label: "Couleur d'accent", default: "#E07A5F" },
                  { key: "background_color", label: "Fond", default: "#FDFCF8" },
                  { key: "text_color", label: "Texte", default: "#1A1A1A" }
                ].map(({ key, label, default: defaultColor }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={siteSettings[key] || defaultColor}
                        onChange={(e) => setSiteSettings({...siteSettings, [key]: e.target.value})}
                        className="w-12 h-10 rounded border cursor-pointer"
                        data-testid={`color-${key}`}
                      />
                      <Input
                        value={siteSettings[key] || defaultColor}
                        onChange={(e) => setSiteSettings({...siteSettings, [key]: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Preview */}
              <div className="p-6 rounded-xl border border-[#E5E7EB]" style={{ backgroundColor: siteSettings.background_color }}>
                <h4 className="font-heading text-xl mb-2" style={{ color: siteSettings.text_color }}>
                  Aperçu des couleurs
                </h4>
                <p className="text-sm mb-4" style={{ color: siteSettings.text_color, opacity: 0.7 }}>
                  Voici un aperçu de vos couleurs personnalisées.
                </p>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 rounded-full text-white text-sm"
                    style={{ backgroundColor: siteSettings.primary_color }}
                  >
                    Bouton primaire
                  </button>
                  <button 
                    className="px-4 py-2 rounded-full text-sm"
                    style={{ backgroundColor: siteSettings.secondary_color, color: siteSettings.text_color }}
                  >
                    Bouton secondaire
                  </button>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveSite}
                disabled={saving}
                className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                data-testid="save-colors-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </TabsContent>

          {/* SMTP Settings */}
          <TabsContent value="smtp">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-medium text-[#1A1A1A] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  Configuration SMTP
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#6B7280]">Activer</span>
                  <Switch
                    checked={smtpSettings.enabled}
                    onCheckedChange={(checked) => setSmtpSettings({...smtpSettings, enabled: checked})}
                    data-testid="smtp-enabled-switch"
                  />
                </div>
              </div>
              
              <div className={`space-y-6 ${!smtpSettings.enabled && 'opacity-50'}`}>
                <div className="p-4 bg-[#F3F4F6] rounded-lg text-sm text-[#6B7280]">
                  <p className="font-medium text-[#1A1A1A] mb-2">Comment configurer Gmail SMTP :</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Activez la validation en 2 étapes sur votre compte Google</li>
                    <li>Créez un "Mot de passe d'application" dans les paramètres de sécurité Google</li>
                    <li>Utilisez ce mot de passe ci-dessous (pas votre mot de passe habituel)</li>
                  </ol>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Serveur SMTP</Label>
                    <Input
                      value={smtpSettings.smtp_host}
                      onChange={(e) => setSmtpSettings({...smtpSettings, smtp_host: e.target.value})}
                      disabled={!smtpSettings.enabled}
                      className="mt-1"
                      data-testid="smtp-host-input"
                    />
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={smtpSettings.smtp_port}
                      onChange={(e) => setSmtpSettings({...smtpSettings, smtp_port: parseInt(e.target.value)})}
                      disabled={!smtpSettings.enabled}
                      className="mt-1"
                      data-testid="smtp-port-input"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={smtpSettings.smtp_email}
                      onChange={(e) => setSmtpSettings({...smtpSettings, smtp_email: e.target.value})}
                      placeholder="votre-email@gmail.com"
                      disabled={!smtpSettings.enabled}
                      className="mt-1"
                      data-testid="smtp-email-input"
                    />
                  </div>
                  <div>
                    <Label>Mot de passe d'application</Label>
                    <Input
                      type="password"
                      value={smtpSettings.smtp_password}
                      onChange={(e) => setSmtpSettings({...smtpSettings, smtp_password: e.target.value})}
                      placeholder="••••••••••••••••"
                      disabled={!smtpSettings.enabled}
                      className="mt-1"
                      data-testid="smtp-password-input"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleSaveSMTP}
                  disabled={saving}
                  className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                  data-testid="save-smtp-btn"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                {smtpSettings.enabled && (
                  <Button 
                    onClick={handleTestEmail}
                    disabled={testingEmail || !smtpSettings.smtp_email}
                    variant="outline"
                    data-testid="test-smtp-btn"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {testingEmail ? "Envoi..." : "Tester l'envoi"}
                  </Button>
                )}
              </div>
              
              {smtpSettings.enabled && smtpSettings.smtp_email && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Configuration sauvegardée</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
