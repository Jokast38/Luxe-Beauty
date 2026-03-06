import { useEffect, useState, useCallback, useRef } from "react";
import { 
  Image as ImageIcon, Upload, Trash2, Copy, Check, Plus, X
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "../../components/ui/alert-dialog";
import { AdminLayout } from "./AdminLayout";
import { toast } from "sonner";
import { 
  uploadImage, getImages, deleteImage,
  getAdminSiteSettings, updateSiteSettings 
} from "../../lib/api";

export default function AdminImages() {
  const [images, setImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [copiedId, setCopiedId] = useState(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [imagesRes, settingsRes] = await Promise.all([
        getImages(),
        getAdminSiteSettings()
      ]);
      setImages(imagesRes.data);
      setGalleryImages(settingsRes.data.gallery_images || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      await uploadImage(formData);
      toast.success("Image uploadée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      await deleteImage(deleteDialog.id);
      toast.success("Image supprimée");
      setDeleteDialog({ open: false, id: null });
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const copyUrl = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("URL copiée");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Impossible de copier");
    }
  };

  const addGalleryImage = async () => {
    if (!newGalleryUrl.trim()) return;
    
    const newGallery = [...galleryImages, newGalleryUrl.trim()];
    try {
      const settingsRes = await getAdminSiteSettings();
      await updateSiteSettings({
        ...settingsRes.data,
        gallery_images: newGallery
      });
      setGalleryImages(newGallery);
      setNewGalleryUrl("");
      toast.success("Image ajoutée à la galerie");
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const removeGalleryImage = async (index) => {
    const newGallery = galleryImages.filter((_, i) => i !== index);
    try {
      const settingsRes = await getAdminSiteSettings();
      await updateSiteSettings({
        ...settingsRes.data,
        gallery_images: newGallery
      });
      setGalleryImages(newGallery);
      toast.success("Image retirée de la galerie");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <AdminLayout title="Images">
      <div data-testid="admin-images">
        {/* Gallery Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
          <h3 className="text-lg font-heading font-medium text-[#1A1A1A] mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#D4AF37]" />
            Galerie du site
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Ces images sont affichées dans la section galerie de votre site.
          </p>
          
          {/* Add new gallery image */}
          <div className="flex gap-2 mb-6">
            <Input
              value={newGalleryUrl}
              onChange={(e) => setNewGalleryUrl(e.target.value)}
              placeholder="URL de l'image (https://...)"
              className="flex-1"
              data-testid="gallery-url-input"
            />
            <Button 
              onClick={addGalleryImage}
              disabled={!newGalleryUrl.trim()}
              className="bg-[#1A1A1A] text-white hover:bg-[#333]"
              data-testid="add-gallery-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
          
          {/* Gallery grid */}
          {galleryImages.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              Aucune image dans la galerie
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.map((url, index) => (
                <div 
                  key={index}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-[#E5E7EB]"
                  data-testid={`gallery-image-${index}`}
                >
                  <img 
                    src={url}
                    alt={`Galerie ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeGalleryImage(index)}
                      data-testid={`remove-gallery-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-heading font-medium text-[#1A1A1A] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#D4AF37]" />
                Images uploadées
              </h3>
              <p className="text-sm text-[#6B7280] mt-1">
                Uploadez vos images et copiez l'URL pour les utiliser sur le site.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-[#1A1A1A] text-white hover:bg-[#333]"
                data-testid="upload-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Upload..." : "Uploader"}
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-[#6B7280]">Chargement...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-[#6B7280]">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune image uploadée</p>
              <p className="text-sm mt-2">Uploadez des images pour les utiliser sur votre site</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div 
                  key={image.id}
                  className="group relative rounded-xl overflow-hidden border border-[#E5E7EB]"
                  data-testid={`uploaded-image-${image.id}`}
                >
                  <div className="aspect-square">
                    <img 
                      src={image.data_url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyUrl(image.data_url, image.id)}
                      data-testid={`copy-url-${image.id}`}
                    >
                      {copiedId === image.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, id: image.id })}
                      data-testid={`delete-image-${image.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-[#6B7280] truncate">{image.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette image ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'image sera définitivement supprimée.
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
