import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Sparkles, Calendar, Clock, MapPin, Instagram, Mail, Phone, 
  ArrowRight, Star, Menu, X, ChevronRight, ExternalLink
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getSiteSettings, getServices, seedData } from "../lib/api";

// TikTok Icon Component
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Seed data first
      await seedData();
      
      const [settingsRes, servicesRes] = await Promise.all([
        getSiteSettings(),
        getServices()
      ]);
      setSettings(settingsRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nailServices = services.filter(s => s.category === "nails");
  const lashServices = services.filter(s => s.category === "lashes");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#D4AF37] animate-pulse mx-auto mb-4" />
          <p className="text-[#6B7280] font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  const businessName = settings?.business_name || "Luxe Beauty";
  const tagline = settings?.tagline || "L'art de sublimer votre beauté";
  const heroImage = settings?.hero_image || "https://images.unsplash.com/photo-1719760518176-e124a5bcd025";
  const galleryImages = settings?.gallery_images || [];

  return (
    <div className="min-h-screen bg-[#FDFCF8] grain-overlay" data-testid="landing-page">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 glass-header border-b border-[#E5E7EB]/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <span className="font-heading text-xl font-semibold text-[#1A1A1A]">
                {businessName}
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors font-body text-sm tracking-wide">
                Services
              </a>
              <a href="#gallery" className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors font-body text-sm tracking-wide">
                Galerie
              </a>
              <a href="#contact" className="text-[#1A1A1A] hover:text-[#D4AF37] transition-colors font-body text-sm tracking-wide">
                Contact
              </a>
              <Button 
                onClick={() => navigate("/booking")}
                className="rounded-full px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] transition-all"
                data-testid="nav-book-btn"
              >
                Réserver
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-[#1A1A1A]"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="mobile-menu-btn"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-[#E5E7EB] px-4 py-6 space-y-4">
            <a href="#services" className="block text-[#1A1A1A] py-2" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#gallery" className="block text-[#1A1A1A] py-2" onClick={() => setMenuOpen(false)}>Galerie</a>
            <a href="#contact" className="block text-[#1A1A1A] py-2" onClick={() => setMenuOpen(false)}>Contact</a>
            <Button 
              onClick={() => { navigate("/booking"); setMenuOpen(false); }}
              className="w-full rounded-full bg-[#1A1A1A] text-white"
            >
              Réserver
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-20 min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FDFCF8] via-[#FDFCF8]/90 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-20 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="fade-in">
              <p className="text-sm tracking-widest uppercase font-medium text-[#D4AF37] mb-6">
                Bienvenue chez {businessName}
              </p>
              <h1 className="text-5xl md:text-7xl font-heading font-medium tracking-tight leading-none text-[#1A1A1A] mb-6">
                {tagline}
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-[#6B7280] mb-8 max-w-lg">
                Des soins personnalisés pour vos ongles et cils. Sublimez votre beauté naturelle avec nos experts passionnés.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => navigate("/booking")}
                  className="rounded-full px-8 py-6 text-sm font-medium tracking-wide bg-[#1A1A1A] text-white hover:bg-[#333] transition-all btn-primary"
                  data-testid="hero-book-btn"
                >
                  Prendre rendez-vous
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-full px-8 py-6 text-sm font-medium tracking-wide border-[#E5E7EB] hover:bg-[#F3F4F6]"
                  data-testid="hero-services-btn"
                >
                  Nos services
                </Button>
              </div>
            </div>
            
            <div className="hidden md:block fade-in-delay-2">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#F5E6E8] rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-[#D4AF37]/20 rounded-full blur-3xl opacity-60" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl image-zoom">
                  <img 
                    src={heroImage}
                    alt="Salon de beauté"
                    className="w-full h-[500px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest uppercase font-medium text-[#D4AF37] mb-4">
              Nos prestations
            </p>
            <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-[#1A1A1A]">
              Services sur mesure
            </h2>
          </div>

          {/* Nails Services */}
          {nailServices.length > 0 && (
            <div className="mb-20">
              <h3 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-8 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                Onglerie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {nailServices.map((service, index) => (
                  <div 
                    key={service.id}
                    className="service-card group relative overflow-hidden rounded-2xl bg-white border border-[#E5E7EB] hover:shadow-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`service-card-${service.id}`}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img 
                        src={service.image_url || "https://images.unsplash.com/photo-1772322586649-fc11154e76b9"} 
                        alt={service.name}
                        className="service-image w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="font-heading text-lg font-medium text-[#1A1A1A] mb-2">
                        {service.name}
                      </h4>
                      <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration}min
                          </span>
                          <span className="font-semibold text-[#D4AF37]">
                            {service.price}€
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/booking/${service.id}`)}
                          className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#333]"
                          data-testid={`book-service-${service.id}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lash Services */}
          {lashServices.length > 0 && (
            <div>
              <h3 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-8 flex items-center gap-3">
                <Star className="w-6 h-6 text-[#D4AF37]" />
                Extensions de cils
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {lashServices.map((service, index) => (
                  <div 
                    key={service.id}
                    className="service-card group relative overflow-hidden rounded-2xl bg-white border border-[#E5E7EB] hover:shadow-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`service-card-${service.id}`}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img 
                        src={service.image_url || "https://images.unsplash.com/photo-1645735123314-d11fcfdd0000"} 
                        alt={service.name}
                        className="service-image w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="font-heading text-lg font-medium text-[#1A1A1A] mb-2">
                        {service.name}
                      </h4>
                      <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration}min
                          </span>
                          <span className="font-semibold text-[#D4AF37]">
                            {service.price}€
                          </span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/booking/${service.id}`)}
                          className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#333]"
                          data-testid={`book-service-${service.id}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-20 md:py-32 bg-[#FDFCF8]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <div className="text-center mb-16">
              <p className="text-sm tracking-widest uppercase font-medium text-[#D4AF37] mb-4">
                Notre travail
              </p>
              <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-[#1A1A1A]">
                Galerie
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.slice(0, 8).map((img, index) => (
                <div 
                  key={index}
                  className={`image-zoom rounded-2xl overflow-hidden ${
                    index === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Galerie ${index + 1}`}
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Media Section */}
      {(settings?.instagram_url || settings?.tiktok_url) && (
        <section className="py-20 md:py-32 bg-[#F5E6E8]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
            <div className="text-center mb-16">
              <p className="text-sm tracking-widest uppercase font-medium text-[#D4AF37] mb-4">
                Suivez-nous
              </p>
              <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-[#1A1A1A]">
                Nos réseaux sociaux
              </h2>
              <p className="text-[#6B7280] mt-4 max-w-lg mx-auto">
                Découvrez nos dernières créations et inspirations sur nos réseaux sociaux
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {settings?.instagram_url && (
                <a 
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-white rounded-2xl px-8 py-6 shadow-sm hover:shadow-lg transition-all"
                  data-testid="instagram-link"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                    <Instagram className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-medium text-[#1A1A1A]">Instagram</p>
                    <p className="text-sm text-[#6B7280]">Suivez notre actualité</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                </a>
              )}
              
              {settings?.tiktok_url && (
                <a 
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-white rounded-2xl px-8 py-6 shadow-sm hover:shadow-lg transition-all"
                  data-testid="tiktok-link"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                    <TikTokIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-medium text-[#1A1A1A]">TikTok</p>
                    <p className="text-sm text-[#6B7280]">Nos vidéos tendances</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#6B7280] group-hover:text-[#D4AF37] transition-colors" />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-white mb-6">
            Prête à vous sublimer ?
          </h2>
          <p className="text-[#9CA3AF] text-lg mb-8 max-w-lg mx-auto">
            Réservez dès maintenant votre rendez-vous et laissez nos experts prendre soin de vous.
          </p>
          <Button 
            onClick={() => navigate("/booking")}
            className="rounded-full px-10 py-6 text-base font-medium tracking-wide bg-[#D4AF37] text-[#1A1A1A] hover:bg-[#c4a030] transition-all btn-primary"
            data-testid="cta-book-btn"
          >
            Prendre rendez-vous
            <Calendar className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer id="contact" className="py-20 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                <span className="font-heading text-xl font-semibold text-[#1A1A1A]">
                  {businessName}
                </span>
              </div>
              <p className="text-[#6B7280] mb-6 max-w-md">
                {tagline}. Des soins d'exception pour sublimer votre beauté naturelle.
              </p>
              <div className="flex gap-4">
                {settings?.instagram_url && (
                  <a 
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#F5E6E8] flex items-center justify-center hover:bg-[#EBD5D8] transition-colors"
                  >
                    <Instagram className="w-5 h-5 text-[#1A1A1A]" />
                  </a>
                )}
                {settings?.tiktok_url && (
                  <a 
                    href={settings.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#F5E6E8] flex items-center justify-center hover:bg-[#EBD5D8] transition-colors"
                  >
                    <TikTokIcon className="w-5 h-5 text-[#1A1A1A]" />
                  </a>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold text-[#1A1A1A] mb-4">Contact</h4>
              <div className="space-y-3 text-[#6B7280]">
                {settings?.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    {settings.phone}
                  </p>
                )}
                {settings?.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D4AF37]" />
                    {settings.email}
                  </p>
                )}
                {settings?.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    {settings.address}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold text-[#1A1A1A] mb-4">Liens</h4>
              <div className="space-y-3">
                <a href="#services" className="block text-[#6B7280] hover:text-[#D4AF37] transition-colors">Services</a>
                <a href="#gallery" className="block text-[#6B7280] hover:text-[#D4AF37] transition-colors">Galerie</a>
                <Link to="/booking" className="block text-[#6B7280] hover:text-[#D4AF37] transition-colors">Réserver</Link>
                <Link to="/admin/login" className="block text-[#6B7280] hover:text-[#D4AF37] transition-colors text-sm">Admin</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#E5E7EB] pt-8 text-center text-[#6B7280] text-sm">
            <p>&copy; {new Date().getFullYear()} {businessName}. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
