import { useEffect, useState, useCallback } from "react";
import { 
  Scissors, Plus, Pencil, Trash2, Clock, DollarSign, X
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "../../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "../../components/ui/alert-dialog";
import { AdminLayout } from "./AdminLayout";
import { toast } from "sonner";
import { getServices, createService, updateService, deleteService } from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "nails",
    description: "",
    duration: 60,
    price: 0,
    image_url: ""
  });

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getServices();
      setServices(res.data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "nails",
      description: "",
      duration: 60,
      price: 0,
      image_url: ""
    });
    setEditingService(null);
  };

  const openDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category: service.category,
        description: service.description,
        duration: service.duration,
        price: service.price,
        image_url: service.image_url || ""
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      if (editingService) {
        await updateService(editingService.id, formData);
        toast.success("Service mis à jour");
      } else {
        await createService(formData);
        toast.success("Service créé");
      }
      setDialogOpen(false);
      resetForm();
      loadServices();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      await deleteService(deleteDialog.id);
      toast.success("Service supprimé");
      setDeleteDialog({ open: false, id: null });
      loadServices();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const nailServices = services.filter(s => s.category === "nails");
  const lashServices = services.filter(s => s.category === "lashes");

  const ServiceCard = ({ service }) => (
    <div 
      className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow"
      data-testid={`service-card-${service.id}`}
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={service.image_url || "https://images.unsplash.com/photo-1772322586649-fc11154e76b9"}
          alt={service.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-heading font-medium text-[#1A1A1A] mb-2">{service.name}</h3>
        <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">{service.description}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.duration}min
            </span>
            <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
              <DollarSign className="w-4 h-4" />
              {service.price}€
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openDialog(service)}
              data-testid={`edit-service-${service.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteDialog({ open: true, id: service.id })}
              className="text-red-600 hover:text-red-700"
              data-testid={`delete-service-${service.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Services">
      <div data-testid="admin-services">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#6B7280]">Gérez vos prestations</p>
          <Button 
            onClick={() => openDialog()}
            className="rounded-full bg-[#1A1A1A] text-white hover:bg-[#333]"
            data-testid="add-service-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un service
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#6B7280]">Chargement...</div>
        ) : (
          <>
            {/* Nails */}
            {nailServices.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-heading font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-[#D4AF37]" />
                  Onglerie ({nailServices.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nailServices.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            )}

            {/* Lashes */}
            {lashServices.length > 0 && (
              <div>
                <h2 className="text-xl font-heading font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-[#D4AF37]" />
                  Extensions de cils ({lashServices.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lashServices.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            )}

            {services.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-[#E5E7EB]">
                <Scissors className="w-12 h-12 mx-auto mb-4 text-[#6B7280] opacity-50" />
                <p className="text-[#6B7280]">Aucun service pour le moment</p>
                <Button 
                  onClick={() => openDialog()}
                  className="mt-4"
                  variant="outline"
                >
                  Ajouter votre premier service
                </Button>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingService ? "Modifier le service" : "Nouveau service"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>Nom du service *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Pose de gel"
                  className="mt-1"
                  data-testid="service-name-input"
                />
              </div>
              
              <div>
                <Label>Catégorie *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger className="mt-1" data-testid="service-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nails">Onglerie</SelectItem>
                    <SelectItem value="lashes">Extensions de cils</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez le service..."
                  className="mt-1"
                  rows={3}
                  data-testid="service-description-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Durée (minutes) *</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                    className="mt-1"
                    data-testid="service-duration-input"
                  />
                </div>
                <div>
                  <Label>Prix (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="mt-1"
                    data-testid="service-price-input"
                  />
                </div>
              </div>
              
              <div>
                <Label>URL de l'image (optionnel)</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://..."
                  className="mt-1"
                  data-testid="service-image-input"
                />
                {formData.image_url && (
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                data-testid="save-service-btn"
              >
                {editingService ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce service ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action désactivera le service. Il ne sera plus visible pour les clients.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
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
