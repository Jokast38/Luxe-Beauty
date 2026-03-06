import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Sparkles, Calendar, Clock, ArrowLeft, ArrowRight, Check, 
  User, Mail, Phone, MessageSquare 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { toast } from "sonner";
import { 
  getSiteSettings, getServices, getService, getAvailableSlots, createAppointment 
} from "../lib/api";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function BookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: ""
  });

  const loadData = useCallback(async () => {
    try {
      const [settingsRes, servicesRes] = await Promise.all([
        getSiteSettings(),
        getServices()
      ]);
      setSettings(settingsRes.data);
      setServices(servicesRes.data);
      
      // If serviceId provided, select that service
      if (serviceId) {
        const service = servicesRes.data.find(s => s.id === serviceId);
        if (service) {
          setSelectedService(service);
          setStep(2);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    }
  }, [serviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load available slots when date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDate || !selectedService) return;
      
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await getAvailableSlots(dateStr, selectedService.id);
        setAvailableSlots(res.data.slots || []);
        setSelectedTime(null);
      } catch (error) {
        console.error("Error loading slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    loadSlots();
  }, [selectedDate, selectedService]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error("Veuillez compléter toutes les étapes");
      return;
    }
    
    if (!formData.client_name || !formData.client_email || !formData.client_phone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await createAppointment({
        ...formData,
        service_id: selectedService.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime
      });
      
      setBookingDetails({
        ...res.data,
        service: selectedService,
        formatted_date: format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
      });
      setBookingComplete(true);
      toast.success("Rendez-vous confirmé !");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error(error.response?.data?.detail || "Erreur lors de la réservation");
    } finally {
      setSubmitting(false);
    }
  };

  const businessName = settings?.business_name || "Luxe Beauty";
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  // Booking Complete Screen
  if (bookingComplete && bookingDetails) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4" data-testid="booking-complete">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-heading font-medium text-[#1A1A1A] mb-4">
            Rendez-vous confirmé !
          </h1>
          <p className="text-[#6B7280] mb-8">
            Un email de confirmation a été envoyé à {bookingDetails.client_email}
          </p>
          
          <div className="bg-[#F5E6E8] rounded-xl p-6 text-left mb-8">
            <h3 className="font-heading font-medium text-[#1A1A1A] mb-4">Récapitulatif</h3>
            <div className="space-y-3 text-sm">
              <p className="flex justify-between">
                <span className="text-[#6B7280]">Service:</span>
                <span className="font-medium text-[#1A1A1A]">{bookingDetails.service?.name}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#6B7280]">Date:</span>
                <span className="font-medium text-[#1A1A1A]">{bookingDetails.formatted_date}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#6B7280]">Heure:</span>
                <span className="font-medium text-[#1A1A1A]">{bookingDetails.time}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#6B7280]">Durée:</span>
                <span className="font-medium text-[#1A1A1A]">{bookingDetails.service?.duration} min</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#6B7280]">Prix:</span>
                <span className="font-medium text-[#D4AF37]">{bookingDetails.service?.price}€</span>
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate("/")}
            className="rounded-full px-8 py-6 bg-[#1A1A1A] text-white hover:bg-[#333]"
            data-testid="back-home-btn"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]" data-testid="booking-page">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" data-testid="booking-logo">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <span className="font-heading text-xl font-semibold text-[#1A1A1A]">
                {businessName}
              </span>
            </Link>
            <Button 
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-[#6B7280] hover:text-[#1A1A1A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-[#E5E7EB] py-4">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: "Service" },
              { num: 2, label: "Date & Heure" },
              { num: 3, label: "Informations" },
              { num: 4, label: "Confirmation" }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s.num 
                      ? "bg-[#1A1A1A] text-white" 
                      : "bg-[#E5E7EB] text-[#6B7280]"
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${
                  step >= s.num ? "text-[#1A1A1A]" : "text-[#6B7280]"
                }`}>
                  {s.label}
                </span>
                {i < 3 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 ${
                    step > s.num ? "bg-[#1A1A1A]" : "bg-[#E5E7EB]"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="fade-in" data-testid="step-1">
            <h2 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-8 text-center">
              Choisissez votre prestation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    selectedService?.id === service.id
                      ? "border-[#D4AF37] bg-[#F5E6E8]"
                      : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]/50"
                  }`}
                  data-testid={`select-service-${service.id}`}
                >
                  <div className="flex gap-4">
                    <img 
                      src={service.image_url || "https://images.unsplash.com/photo-1772322586649-fc11154e76b9"}
                      alt={service.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-heading font-medium text-[#1A1A1A] mb-1">
                        {service.name}
                      </h3>
                      <p className="text-sm text-[#6B7280] mb-2 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-[#6B7280]">
                          <Clock className="w-4 h-4" />
                          {service.duration} min
                        </span>
                        <span className="font-semibold text-[#D4AF37]">
                          {service.price}€
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="fade-in" data-testid="step-2">
            <h2 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-8 text-center">
              Choisissez la date et l'heure
            </h2>
            
            {/* Selected Service Summary */}
            {selectedService && (
              <div className="bg-[#F5E6E8] rounded-xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedService.image_url || "https://images.unsplash.com/photo-1772322586649-fc11154e76b9"}
                    alt={selectedService.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{selectedService.name}</p>
                    <p className="text-sm text-[#6B7280]">{selectedService.duration} min • {selectedService.price}€</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-[#6B7280]"
                >
                  Modifier
                </Button>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-heading font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  Sélectionnez une date
                </h3>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => 
                    isBefore(date, today) || 
                    isBefore(maxDate, date) ||
                    date.getDay() === 0 // Sunday
                  }
                  locale={fr}
                  className="rounded-md"
                  data-testid="booking-calendar"
                />
              </div>
              
              {/* Time Slots */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-heading font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  Sélectionnez une heure
                </h3>
                
                {!selectedDate ? (
                  <p className="text-[#6B7280] text-center py-8">
                    Sélectionnez d'abord une date
                  </p>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Sparkles className="w-6 h-6 text-[#D4AF37] animate-pulse" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-[#6B7280] text-center py-8">
                    Aucun créneau disponible ce jour
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          selectedTime === slot.time
                            ? "bg-[#1A1A1A] text-white"
                            : slot.available
                              ? "bg-[#F3F4F6] text-[#1A1A1A] hover:bg-[#E5E7EB]"
                              : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed line-through"
                        }`}
                        data-testid={`time-slot-${slot.time}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-full px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="rounded-full px-6 bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
                data-testid="step-2-next"
              >
                Continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Client Information */}
        {step === 3 && (
          <div className="fade-in max-w-xl mx-auto" data-testid="step-3">
            <h2 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-8 text-center">
              Vos informations
            </h2>
            
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 md:p-8 space-y-6">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  Nom complet *
                </Label>
                <Input
                  id="name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  placeholder="Marie Dupont"
                  className="rounded-lg border-[#E5E7EB] focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  data-testid="input-name"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                  placeholder="marie@exemple.com"
                  className="rounded-lg border-[#E5E7EB] focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                  placeholder="06 12 34 56 78"
                  className="rounded-lg border-[#E5E7EB] focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  data-testid="input-phone"
                />
              </div>
              
              <div>
                <Label htmlFor="notes" className="flex items-center gap-2 text-[#1A1A1A] mb-2">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  Notes (optionnel)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Informations supplémentaires..."
                  className="rounded-lg border-[#E5E7EB] focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  rows={3}
                  data-testid="input-notes"
                />
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline"
                onClick={() => setStep(2)}
                className="rounded-full px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={() => setStep(4)}
                disabled={!formData.client_name || !formData.client_email || !formData.client_phone}
                className="rounded-full px-6 bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
                data-testid="step-3-next"
              >
                Continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="fade-in max-w-xl mx-auto" data-testid="step-4">
            <h2 className="text-2xl md:text-3xl font-heading font-medium text-[#1A1A1A] mb-8 text-center">
              Confirmation
            </h2>
            
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 md:p-8">
              <h3 className="font-heading font-medium text-[#1A1A1A] mb-6">Récapitulatif de votre rendez-vous</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 bg-[#F5E6E8] rounded-lg">
                  <img 
                    src={selectedService?.image_url || "https://images.unsplash.com/photo-1772322586649-fc11154e76b9"}
                    alt={selectedService?.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{selectedService?.name}</p>
                    <p className="text-sm text-[#6B7280]">{selectedService?.duration} min</p>
                    <p className="font-semibold text-[#D4AF37]">{selectedService?.price}€</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-[#F3F4F6] rounded-lg">
                    <p className="text-[#6B7280] mb-1">Date</p>
                    <p className="font-medium text-[#1A1A1A]">
                      {selectedDate && format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F3F4F6] rounded-lg">
                    <p className="text-[#6B7280] mb-1">Heure</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedTime}</p>
                  </div>
                </div>
                
                <div className="border-t border-[#E5E7EB] pt-4">
                  <p className="text-[#6B7280] mb-2 text-sm">Vos informations</p>
                  <p className="font-medium text-[#1A1A1A]">{formData.client_name}</p>
                  <p className="text-sm text-[#6B7280]">{formData.client_email}</p>
                  <p className="text-sm text-[#6B7280]">{formData.client_phone}</p>
                </div>
              </div>
              
              <p className="text-xs text-[#6B7280] mb-6">
                En confirmant, vous acceptez de recevoir un email de confirmation avec les détails de votre rendez-vous.
              </p>
              
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-full py-6 bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50"
                data-testid="confirm-booking-btn"
              >
                {submitting ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Confirmer le rendez-vous
                  </>
                )}
              </Button>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-start mt-8">
              <Button 
                variant="outline"
                onClick={() => setStep(3)}
                className="rounded-full px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
