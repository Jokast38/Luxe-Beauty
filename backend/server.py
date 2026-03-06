from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'beauty-salon-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# ===================== MODELS =====================

class ServiceCreate(BaseModel):
    name: str
    category: str  # "nails" or "lashes"
    description: str
    duration: int  # minutes
    price: float
    image_url: Optional[str] = None

class Service(ServiceCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    active: bool = True

class AppointmentCreate(BaseModel):
    client_name: str
    client_email: EmailStr
    client_phone: str
    service_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    notes: Optional[str] = None

class Appointment(AppointmentCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "confirmed"  # confirmed, cancelled, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    calendar_event_id: Optional[str] = None

class SiteSettings(BaseModel):
    business_name: str = "Luxe Beauty"
    tagline: str = "L'art de sublimer votre beauté"
    phone: str = ""
    email: str = ""
    address: str = ""
    instagram_url: str = ""
    tiktok_url: str = ""
    primary_color: str = "#D4AF37"
    secondary_color: str = "#F5E6E8"
    accent_color: str = "#E07A5F"
    background_color: str = "#FDFCF8"
    text_color: str = "#1A1A1A"
    hero_image: str = "https://images.unsplash.com/photo-1719760518176-e124a5bcd025"
    gallery_images: List[str] = []
    opening_hours: Dict[str, Dict[str, str]] = {
        "monday": {"open": "09:00", "close": "19:00"},
        "tuesday": {"open": "09:00", "close": "19:00"},
        "wednesday": {"open": "09:00", "close": "19:00"},
        "thursday": {"open": "09:00", "close": "19:00"},
        "friday": {"open": "09:00", "close": "19:00"},
        "saturday": {"open": "10:00", "close": "18:00"},
        "sunday": {"open": "", "close": ""}
    }

class SMTPSettings(BaseModel):
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_email: str = ""
    smtp_password: str = ""
    enabled: bool = False

class CalendarSettings(BaseModel):
    google_client_id: str = ""
    google_client_secret: str = ""
    enabled: bool = False
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

class TimeSlot(BaseModel):
    time: str
    available: bool

# ===================== HELPER FUNCTIONS =====================

def create_jwt_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_jwt_token(credentials.credentials)
    admin = await db.admins.find_one({"id": payload["sub"]}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SMTP settings from database"""
    smtp_settings = await db.settings.find_one({"type": "smtp"}, {"_id": 0})
    if not smtp_settings or not smtp_settings.get("enabled"):
        logging.warning("SMTP not configured or disabled")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_settings['smtp_email']
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(smtp_settings['smtp_host'], smtp_settings['smtp_port']) as server:
            server.starttls()
            server.login(smtp_settings['smtp_email'], smtp_settings['smtp_password'])
            server.sendmail(smtp_settings['smtp_email'], to_email, msg.as_string())
        
        return True
    except Exception as e:
        logging.error(f"Failed to send email: {e}")
        return False

async def get_site_settings() -> dict:
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if not settings:
        default = SiteSettings().model_dump()
        default["type"] = "site"
        await db.settings.insert_one(default)
        return default
    return settings

# ===================== PUBLIC ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "Beauty Salon API"}

@api_router.get("/site-settings")
async def get_public_site_settings():
    settings = await get_site_settings()
    # Remove type field for cleaner response
    settings.pop("type", None)
    return settings

@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({"active": True}, {"_id": 0}).to_list(100)
    return services

@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@api_router.get("/available-slots/{date}")
async def get_available_slots(date: str, service_id: str):
    """Get available time slots for a specific date"""
    # Get site settings for opening hours
    settings = await get_site_settings()
    
    # Get service duration
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    duration = service.get("duration", 60)
    
    # Parse date and get day of week
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    day_name = date_obj.strftime("%A").lower()
    hours = settings.get("opening_hours", {}).get(day_name, {})
    
    if not hours.get("open") or not hours.get("close"):
        return {"slots": [], "message": "Closed on this day"}
    
    # Generate time slots
    slots = []
    open_time = datetime.strptime(hours["open"], "%H:%M")
    close_time = datetime.strptime(hours["close"], "%H:%M")
    
    # Get existing appointments for this date
    existing = await db.appointments.find({
        "date": date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    booked_times = set()
    for apt in existing:
        apt_service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
        apt_duration = apt_service.get("duration", 60) if apt_service else 60
        apt_start = datetime.strptime(apt["time"], "%H:%M")
        
        # Block all slots during the appointment
        for i in range(0, apt_duration, 30):
            blocked_time = (apt_start + timedelta(minutes=i)).strftime("%H:%M")
            booked_times.add(blocked_time)
    
    current = open_time
    while current + timedelta(minutes=duration) <= close_time:
        time_str = current.strftime("%H:%M")
        
        # Check if slot is available (all required slots must be free)
        is_available = True
        for i in range(0, duration, 30):
            check_time = (current + timedelta(minutes=i)).strftime("%H:%M")
            if check_time in booked_times:
                is_available = False
                break
        
        slots.append(TimeSlot(time=time_str, available=is_available))
        current += timedelta(minutes=30)
    
    return {"slots": slots}

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate):
    """Create a new appointment"""
    # Validate service exists
    service = await db.services.find_one({"id": appointment.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check slot availability
    slots_response = await get_available_slots(appointment.date, appointment.service_id)
    available_slot = next(
        (s for s in slots_response["slots"] if s.time == appointment.time and s.available),
        None
    )
    
    if not available_slot:
        raise HTTPException(status_code=400, detail="Time slot not available")
    
    # Create appointment
    apt_obj = Appointment(**appointment.model_dump())
    apt_dict = apt_obj.model_dump()
    apt_dict['created_at'] = apt_dict['created_at'].isoformat()
    
    await db.appointments.insert_one(apt_dict)
    
    # Get site settings for email
    settings = await get_site_settings()
    
    # Send confirmation email
    email_html = f"""
    <html>
    <body style="font-family: 'Manrope', sans-serif; background-color: #FDFCF8; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <h1 style="font-family: 'Playfair Display', serif; color: #1A1A1A; margin-bottom: 24px;">
                Confirmation de votre rendez-vous
            </h1>
            <p style="color: #6B7280; line-height: 1.6;">
                Bonjour {appointment.client_name},
            </p>
            <p style="color: #6B7280; line-height: 1.6;">
                Votre rendez-vous chez <strong>{settings.get('business_name', 'Luxe Beauty')}</strong> est confirmé.
            </p>
            <div style="background: #F5E6E8; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <p style="margin: 8px 0; color: #1A1A1A;"><strong>Service:</strong> {service['name']}</p>
                <p style="margin: 8px 0; color: #1A1A1A;"><strong>Date:</strong> {appointment.date}</p>
                <p style="margin: 8px 0; color: #1A1A1A;"><strong>Heure:</strong> {appointment.time}</p>
                <p style="margin: 8px 0; color: #1A1A1A;"><strong>Durée:</strong> {service['duration']} minutes</p>
                <p style="margin: 8px 0; color: #1A1A1A;"><strong>Prix:</strong> {service['price']}€</p>
            </div>
            <p style="color: #6B7280; line-height: 1.6;">
                À très bientôt !
            </p>
            <p style="color: #D4AF37; font-weight: 600;">
                {settings.get('business_name', 'Luxe Beauty')}
            </p>
        </div>
    </body>
    </html>
    """
    
    await send_email(
        appointment.client_email,
        f"Confirmation de rendez-vous - {settings.get('business_name', 'Luxe Beauty')}",
        email_html
    )
    
    return apt_obj

@api_router.get("/appointments/{appointment_id}")
async def get_appointment(appointment_id: str):
    appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

# ===================== ADMIN AUTH ROUTES =====================

@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    admin = await db.admins.find_one({"email": login.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(login.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(admin["id"], admin["email"])
    return {"token": token, "admin": {"id": admin["id"], "email": admin["email"], "name": admin["name"]}}

@api_router.post("/admin/register")
async def admin_register(admin: AdminCreate):
    # Check if admin already exists
    existing = await db.admins.find_one({"email": admin.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed = bcrypt.hashpw(admin.password.encode(), bcrypt.gensalt())
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": admin.email,
        "password": hashed.decode(),
        "name": admin.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admins.insert_one(admin_doc)
    
    token = create_jwt_token(admin_doc["id"], admin_doc["email"])
    return {"token": token, "admin": {"id": admin_doc["id"], "email": admin_doc["email"], "name": admin_doc["name"]}}

@api_router.get("/admin/me")
async def get_current_admin_info(admin: dict = Depends(get_current_admin)):
    return {"id": admin["id"], "email": admin["email"], "name": admin["name"]}

# ===================== ADMIN SERVICES ROUTES =====================

@api_router.post("/admin/services", response_model=Service)
async def create_service(service: ServiceCreate, admin: dict = Depends(get_current_admin)):
    service_obj = Service(**service.model_dump())
    await db.services.insert_one(service_obj.model_dump())
    return service_obj

@api_router.put("/admin/services/{service_id}")
async def update_service(service_id: str, service: ServiceCreate, admin: dict = Depends(get_current_admin)):
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": service.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service updated"}

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# ===================== ADMIN APPOINTMENTS ROUTES =====================

@api_router.get("/admin/appointments")
async def get_all_appointments(
    status: Optional[str] = None,
    date: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    query = {}
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Enrich with service info
    for apt in appointments:
        service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
        apt["service"] = service
    
    return appointments

@api_router.put("/admin/appointments/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status: str,
    admin: dict = Depends(get_current_admin)
):
    if status not in ["confirmed", "cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Send cancellation email if cancelled
    if status == "cancelled":
        appointment = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
        settings = await get_site_settings()
        
        email_html = f"""
        <html>
        <body style="font-family: 'Manrope', sans-serif; background-color: #FDFCF8; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
                <h1 style="font-family: 'Playfair Display', serif; color: #1A1A1A;">
                    Annulation de votre rendez-vous
                </h1>
                <p style="color: #6B7280;">
                    Bonjour {appointment['client_name']},
                </p>
                <p style="color: #6B7280;">
                    Votre rendez-vous du {appointment['date']} à {appointment['time']} a été annulé.
                </p>
                <p style="color: #6B7280;">
                    N'hésitez pas à reprendre rendez-vous sur notre site.
                </p>
                <p style="color: #D4AF37; font-weight: 600;">
                    {settings.get('business_name', 'Luxe Beauty')}
                </p>
            </div>
        </body>
        </html>
        """
        
        await send_email(
            appointment['client_email'],
            f"Annulation de rendez-vous - {settings.get('business_name', 'Luxe Beauty')}",
            email_html
        )
    
    return {"message": f"Appointment {status}"}

@api_router.delete("/admin/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.appointments.delete_one({"id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted"}

# ===================== ADMIN SETTINGS ROUTES =====================

@api_router.get("/admin/settings/site")
async def get_admin_site_settings(admin: dict = Depends(get_current_admin)):
    return await get_site_settings()

@api_router.put("/admin/settings/site")
async def update_site_settings(settings: SiteSettings, admin: dict = Depends(get_current_admin)):
    settings_dict = settings.model_dump()
    settings_dict["type"] = "site"
    
    await db.settings.update_one(
        {"type": "site"},
        {"$set": settings_dict},
        upsert=True
    )
    return {"message": "Settings updated"}

@api_router.get("/admin/settings/smtp")
async def get_smtp_settings(admin: dict = Depends(get_current_admin)):
    settings = await db.settings.find_one({"type": "smtp"}, {"_id": 0})
    if not settings:
        return SMTPSettings().model_dump()
    settings.pop("type", None)
    return settings

@api_router.put("/admin/settings/smtp")
async def update_smtp_settings(settings: SMTPSettings, admin: dict = Depends(get_current_admin)):
    settings_dict = settings.model_dump()
    settings_dict["type"] = "smtp"
    
    await db.settings.update_one(
        {"type": "smtp"},
        {"$set": settings_dict},
        upsert=True
    )
    return {"message": "SMTP settings updated"}

@api_router.post("/admin/settings/smtp/test")
async def test_smtp_settings(admin: dict = Depends(get_current_admin)):
    """Test SMTP configuration by sending a test email"""
    admin_info = await db.admins.find_one({"id": admin["id"]}, {"_id": 0})
    
    result = await send_email(
        admin_info["email"],
        "Test Email - Configuration SMTP",
        "<h1>Configuration SMTP réussie!</h1><p>Votre configuration email fonctionne correctement.</p>"
    )
    
    if result:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")

@api_router.get("/admin/settings/calendar")
async def get_calendar_settings(admin: dict = Depends(get_current_admin)):
    settings = await db.settings.find_one({"type": "calendar"}, {"_id": 0})
    if not settings:
        return CalendarSettings().model_dump()
    settings.pop("type", None)
    # Don't expose tokens
    settings.pop("access_token", None)
    settings.pop("refresh_token", None)
    return settings

@api_router.put("/admin/settings/calendar")
async def update_calendar_settings(settings: CalendarSettings, admin: dict = Depends(get_current_admin)):
    settings_dict = settings.model_dump()
    settings_dict["type"] = "calendar"
    
    await db.settings.update_one(
        {"type": "calendar"},
        {"$set": settings_dict},
        upsert=True
    )
    return {"message": "Calendar settings updated"}

# ===================== IMAGE UPLOAD =====================

@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    """Upload an image and return base64 data URL"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    
    # Limit file size (5MB)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Create base64 data URL
    base64_data = base64.b64encode(contents).decode()
    data_url = f"data:{file.content_type};base64,{base64_data}"
    
    # Store in database
    image_doc = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "content_type": file.content_type,
        "data_url": data_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.images.insert_one(image_doc)
    
    return {"id": image_doc["id"], "url": data_url}

@api_router.get("/admin/images")
async def get_uploaded_images(admin: dict = Depends(get_current_admin)):
    images = await db.images.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return images

@api_router.delete("/admin/images/{image_id}")
async def delete_image(image_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.images.delete_one({"id": image_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted"}

# ===================== DASHBOARD STATS =====================

@api_router.get("/admin/stats")
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Total appointments
    total_appointments = await db.appointments.count_documents({})
    
    # Today's appointments
    today_appointments = await db.appointments.count_documents({"date": today})
    
    # Pending appointments (confirmed, future date)
    pending_appointments = await db.appointments.count_documents({
        "status": "confirmed",
        "date": {"$gte": today}
    })
    
    # Total services
    total_services = await db.services.count_documents({"active": True})
    
    # Recent appointments
    recent = await db.appointments.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    for apt in recent:
        service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
        apt["service"] = service
    
    return {
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "pending_appointments": pending_appointments,
        "total_services": total_services,
        "recent_appointments": recent
    }

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial services data"""
    # Check if services already exist
    existing = await db.services.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    services = [
        {
            "id": str(uuid.uuid4()),
            "name": "Pose de gel",
            "category": "nails",
            "description": "Pose complète de gel avec préparation des ongles et finition parfaite",
            "duration": 90,
            "price": 55.0,
            "image_url": "https://images.unsplash.com/photo-1772322586649-fc11154e76b9",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Remplissage gel",
            "category": "nails",
            "description": "Remplissage et entretien de vos ongles en gel",
            "duration": 60,
            "price": 40.0,
            "image_url": "https://images.unsplash.com/photo-1754799670312-8e7da8e40ad7",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vernis semi-permanent",
            "category": "nails",
            "description": "Application de vernis semi-permanent longue tenue",
            "duration": 45,
            "price": 35.0,
            "image_url": "https://images.unsplash.com/photo-1772322586649-fc11154e76b9",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Manucure classique",
            "category": "nails",
            "description": "Soin complet des mains avec limage, cuticules et pose de vernis",
            "duration": 30,
            "price": 25.0,
            "image_url": "https://images.unsplash.com/photo-1754799670312-8e7da8e40ad7",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Extensions de cils Volume Russe",
            "category": "lashes",
            "description": "Pose complète d'extensions volume russe pour un regard intense",
            "duration": 120,
            "price": 85.0,
            "image_url": "https://images.unsplash.com/photo-1645735123314-d11fcfdd0000",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Extensions de cils Classique",
            "category": "lashes",
            "description": "Pose d'extensions cil à cil pour un look naturel",
            "duration": 90,
            "price": 65.0,
            "image_url": "https://images.unsplash.com/photo-1747823490861-1fa6d0132fee",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Remplissage extensions",
            "category": "lashes",
            "description": "Entretien et remplissage de vos extensions de cils",
            "duration": 60,
            "price": 45.0,
            "image_url": "https://images.unsplash.com/photo-1645735123314-d11fcfdd0000",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rehaussement de cils",
            "category": "lashes",
            "description": "Rehaussement naturel de vos cils avec teinture incluse",
            "duration": 60,
            "price": 50.0,
            "image_url": "https://images.unsplash.com/photo-1747823490861-1fa6d0132fee",
            "active": True
        }
    ]
    
    await db.services.insert_many(services)
    
    # Seed default site settings
    default_settings = SiteSettings().model_dump()
    default_settings["type"] = "site"
    default_settings["gallery_images"] = [
        "https://images.unsplash.com/photo-1772322586649-fc11154e76b9",
        "https://images.unsplash.com/photo-1754799670312-8e7da8e40ad7",
        "https://images.unsplash.com/photo-1645735123314-d11fcfdd0000",
        "https://images.unsplash.com/photo-1747823490861-1fa6d0132fee"
    ]
    await db.settings.update_one({"type": "site"}, {"$set": default_settings}, upsert=True)
    
    return {"message": "Data seeded successfully"}

# Include the router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
