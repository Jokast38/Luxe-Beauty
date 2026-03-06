import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  Sparkles, LayoutDashboard, Calendar, Scissors, Settings, 
  Image, LogOut, Menu, X, ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { getAdminMe } from "../../lib/api";

export const AdminLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    
    try {
      const res = await getAdminMe();
      setAdmin(res.data);
    } catch (error) {
      localStorage.removeItem("admin_token");
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_info");
    navigate("/admin/login");
  };

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/appointments", icon: Calendar, label: "Rendez-vous" },
    { path: "/admin/services", icon: Scissors, label: "Services" },
    { path: "/admin/images", icon: Image, label: "Images" },
    { path: "/admin/settings", icon: Settings, label: "Paramètres" },
  ];

  const isActive = (path) => location.pathname === path;

  if (!admin) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-[#D4AF37] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]" data-testid="admin-layout">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <span className="font-heading text-lg font-semibold text-[#1A1A1A]">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="mobile-sidebar-toggle">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-[#FDFCF8] border-r border-[#E5E7EB]
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[#E5E7EB]">
            <Link to="/admin" className="flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[#D4AF37]" />
              <span className="font-heading text-xl font-semibold text-[#1A1A1A]">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive(item.path) 
                    ? 'bg-[#1A1A1A] text-white' 
                    : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A]'
                  }
                `}
                data-testid={`nav-${item.path.split('/').pop() || 'dashboard'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#F5E6E8] flex items-center justify-center">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  {admin.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">{admin.name}</p>
                <p className="text-xs text-[#6B7280] truncate">{admin.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-[#6B7280] hover:text-red-600 hover:bg-red-50"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
            <Link to="/" className="block mt-2">
              <Button variant="ghost" className="w-full justify-start text-[#6B7280]">
                <ChevronRight className="w-5 h-5 mr-3 rotate-180" />
                Voir le site
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          {title && (
            <h1 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-6">
              {title}
            </h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
