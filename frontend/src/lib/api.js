import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      if (window.location.pathname.startsWith("/admin") && 
          window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// Public API
export const getSiteSettings = () => api.get("/site-settings");
export const getServices = () => api.get("/services");
export const getService = (id) => api.get(`/services/${id}`);
export const getAvailableSlots = (date, serviceId) => 
  api.get(`/available-slots/${date}?service_id=${serviceId}`);
export const createAppointment = (data) => api.post("/appointments", data);
export const getAppointment = (id) => api.get(`/appointments/${id}`);
export const seedData = () => api.post("/seed");

// Admin Auth
export const adminLogin = (data) => api.post("/admin/login", data);
export const adminRegister = (data) => api.post("/admin/register", data);
export const getAdminMe = () => api.get("/admin/me");

// Admin Services
export const createService = (data) => api.post("/admin/services", data);
export const updateService = (id, data) => api.put(`/admin/services/${id}`, data);
export const deleteService = (id) => api.delete(`/admin/services/${id}`);

// Admin Appointments
export const getAdminAppointments = (params) => api.get("/admin/appointments", { params });
export const updateAppointmentStatus = (id, status) => 
  api.put(`/admin/appointments/${id}/status?status=${status}`);
export const deleteAppointment = (id) => api.delete(`/admin/appointments/${id}`);

// Admin Settings
export const getAdminSiteSettings = () => api.get("/admin/settings/site");
export const updateSiteSettings = (data) => api.put("/admin/settings/site", data);
export const getSMTPSettings = () => api.get("/admin/settings/smtp");
export const updateSMTPSettings = (data) => api.put("/admin/settings/smtp", data);
export const testSMTPSettings = () => api.post("/admin/settings/smtp/test");
export const getCalendarSettings = () => api.get("/admin/settings/calendar");
export const updateCalendarSettings = (data) => api.put("/admin/settings/calendar", data);

// Admin Images
export const uploadImage = (formData) => 
  api.post("/admin/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getImages = () => api.get("/admin/images");
export const deleteImage = (id) => api.delete(`/admin/images/${id}`);

// Admin Stats
export const getDashboardStats = () => api.get("/admin/stats");

export default api;
