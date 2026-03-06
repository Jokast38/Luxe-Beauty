import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, Users, Scissors, TrendingUp, Clock, ArrowRight 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { AdminLayout } from "./AdminLayout";
import { getDashboardStats } from "../../lib/api";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    {
      label: "Rendez-vous aujourd'hui",
      value: stats?.today_appointments || 0,
      icon: Calendar,
      color: "bg-[#D4AF37]/10 text-[#D4AF37]"
    },
    {
      label: "Rendez-vous à venir",
      value: stats?.pending_appointments || 0,
      icon: Clock,
      color: "bg-[#E07A5F]/10 text-[#E07A5F]"
    },
    {
      label: "Total rendez-vous",
      value: stats?.total_appointments || 0,
      icon: TrendingUp,
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      label: "Services actifs",
      value: stats?.total_services || 0,
      icon: Scissors,
      color: "bg-green-500/10 text-green-500"
    }
  ];

  return (
    <AdminLayout title="Dashboard">
      <div data-testid="admin-dashboard">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow"
              data-testid={`stat-card-${index}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-[#1A1A1A] mb-1">
                {loading ? "..." : stat.value}
              </p>
              <p className="text-sm text-[#6B7280]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-medium text-[#1A1A1A]">
              Derniers rendez-vous
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/admin/appointments")}
              className="text-[#D4AF37]"
              data-testid="view-all-appointments"
            >
              Voir tout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-[#6B7280]">Chargement...</div>
          ) : stats?.recent_appointments?.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              Aucun rendez-vous pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recent_appointments?.map((apt) => (
                <div 
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-[#F3F4F6] rounded-xl"
                  data-testid={`recent-apt-${apt.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F5E6E8] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{apt.client_name}</p>
                      <p className="text-sm text-[#6B7280]">{apt.service?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {format(parseISO(apt.date + "T00:00:00"), "d MMM", { locale: fr })}
                    </p>
                    <p className="text-sm text-[#6B7280]">{apt.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    apt.status === "confirmed" ? "bg-green-100 text-green-700" :
                    apt.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {apt.status === "confirmed" ? "Confirmé" :
                     apt.status === "cancelled" ? "Annulé" : "Terminé"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Button 
            onClick={() => navigate("/admin/appointments")}
            className="h-auto py-6 bg-[#1A1A1A] text-white hover:bg-[#333] rounded-xl"
            data-testid="quick-appointments"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Gérer les rendez-vous
          </Button>
          <Button 
            onClick={() => navigate("/admin/services")}
            variant="outline"
            className="h-auto py-6 rounded-xl"
            data-testid="quick-services"
          >
            <Scissors className="w-5 h-5 mr-3" />
            Gérer les services
          </Button>
          <Button 
            onClick={() => navigate("/admin/settings")}
            variant="outline"
            className="h-auto py-6 rounded-xl"
            data-testid="quick-settings"
          >
            <TrendingUp className="w-5 h-5 mr-3" />
            Paramètres du site
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
