import { useEffect, useState, useCallback } from "react";
import { 
  Calendar, Search, Filter, X, Check, Clock, Phone, Mail, Trash2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "../../components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "../../components/ui/alert-dialog";
import { AdminLayout } from "./AdminLayout";
import { toast } from "sonner";
import { getAdminAppointments, updateAppointmentStatus, deleteAppointment } from "../../lib/api";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      
      const res = await getAdminAppointments(params);
      setAppointments(res.data);
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      toast.success(`Rendez-vous ${newStatus === "cancelled" ? "annulé" : "mis à jour"}`);
      loadAppointments();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      await deleteAppointment(deleteDialog.id);
      toast.success("Rendez-vous supprimé");
      setDeleteDialog({ open: false, id: null });
      loadAppointments();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.service?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      completed: "bg-gray-100 text-gray-700"
    };
    const labels = {
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <AdminLayout title="Rendez-vous">
      <div data-testid="admin-appointments">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <Input
                placeholder="Rechercher par nom, email ou service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg"
                data-testid="search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="confirmed">Confirmés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-[#6B7280]">Chargement...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-[#6B7280]">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rendez-vous trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {filteredAppointments.map((apt) => (
                <div 
                  key={apt.id}
                  className="p-4 md:p-6 hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`appointment-${apt.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Client Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#F5E6E8] flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-[#1A1A1A]">
                          {apt.client_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{apt.client_name}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {apt.client_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {apt.client_phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Service & Date */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-sm">
                        <p className="font-medium text-[#1A1A1A]">{apt.service?.name}</p>
                        <p className="text-[#6B7280]">
                          {apt.service?.duration} min • {apt.service?.price}€
                        </p>
                      </div>
                      <div className="text-sm bg-[#F3F4F6] px-4 py-2 rounded-lg">
                        <p className="font-medium text-[#1A1A1A]">
                          {format(parseISO(apt.date + "T00:00:00"), "EEEE d MMMM", { locale: fr })}
                        </p>
                        <p className="text-[#6B7280] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.time}
                        </p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {apt.status === "confirmed" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(apt.id, "completed")}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            data-testid={`complete-${apt.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Terminer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(apt.id, "cancelled")}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            data-testid={`cancel-${apt.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Annuler
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteDialog({ open: true, id: apt.id })}
                        className="text-[#6B7280] hover:text-red-600"
                        data-testid={`delete-${apt.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {apt.notes && (
                    <div className="mt-4 p-3 bg-[#F3F4F6] rounded-lg text-sm text-[#6B7280]">
                      <strong>Notes:</strong> {apt.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce rendez-vous ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le rendez-vous sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
                data-testid="confirm-delete"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
