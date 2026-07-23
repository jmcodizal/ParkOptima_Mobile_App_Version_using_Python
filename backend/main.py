import base64
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import mysql.connector
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .vision_utils import extract_plate_candidate
except ImportError:
    from vision_utils import extract_plate_candidate

try:
    from .db import execute, fetch_all, fetch_one, get_db_connection, hash_password, verify_password
    from .services import build_owner_analytics, build_owner_dashboard, build_owner_reports
    from .overview import get_owner_overview
    from .profile import get_owner_profile, update_owner_profile, update_user_profile
    from .analytics import get_owner_analytics
    from .transaction_log import get_owner_transactions
    from .monitor import get_monitor_summary, get_active_sessions, get_recent_transactions, get_monitor_slots
    from .payments import get_payments, mark_payment_paid
    from .scan import create_parking_session
    from .scan_out import complete_parking_session
    from .attendant_login import authenticate_attendant
    from .attendant_signup import register_attendant
    from .parking_owner_login import authenticate_parking_owner
    from .parking_owner_signup import register_parking_owner
    from .check_balance import get_vehicle_balance
    from .notifications import (
        create_notification,
        get_owner_notifications,
        mark_notification_as_read,
        mark_all_notifications_as_read,
        get_unread_notification_count,
        check_parking_lot_full,
        get_parking_lot_occupancy,
        detect_unusual_events,
        delete_notification,
    )
except ImportError:
    from db import execute, fetch_all, fetch_one, get_db_connection, hash_password, verify_password
    from services import build_owner_analytics, build_owner_dashboard, build_owner_reports
    from overview import get_owner_overview
    from profile import get_owner_profile, update_owner_profile, update_user_profile
    from analytics import get_owner_analytics
    from transaction_log import get_owner_transactions
    from monitor import get_monitor_summary, get_active_sessions, get_recent_transactions, get_monitor_slots
    from payments import get_payments, mark_payment_paid
    from scan import create_parking_session
    from scan_out import complete_parking_session
    from attendant_login import authenticate_attendant
    from attendant_signup import register_attendant
    from parking_owner_login import authenticate_parking_owner
    from parking_owner_signup import register_parking_owner
    from check_balance import get_vehicle_balance
    from notifications import (
        create_notification,
        get_owner_notifications,
        mark_notification_as_read,
        mark_all_notifications_as_read,
        get_unread_notification_count,
        check_parking_lot_full,
        get_parking_lot_occupancy,
        detect_unusual_events,
        delete_notification,
    )

try:
    import cv2  # type: ignore
except Exception:  # pragma: no cover
    cv2 = None

try:
    import easyocr  # type: ignore
except Exception:  # pragma: no cover
    easyocr = None

try:
    from ultralytics import YOLO  # type: ignore
except Exception:  # pragma: no cover
    YOLO = None


app = FastAPI(title="ParkOptima Python Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(mysql.connector.Error)
async def mysql_exception_handler(request: Request, exc: mysql.connector.Error) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"detail": "Database unavailable. Start MySQL and verify connection settings."},
    )


async def parse_json_body(request: Request) -> Dict[str, Any]:
    try:
        return await request.json()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail="Invalid JSON body") from exc


class LoginRequest(BaseModel):
    email: str
    password: str


class PasswordResetRequest(BaseModel):
    identifier: str
    current_password: str
    new_password: str


class SignupRequest(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str
    phone: str = ""
    password: str
    role: str = "parking_attendant"
    plate: str = ""
    pin: str = ""


class VehicleRegisterRequest(BaseModel):
    owner_name: str
    phone: str = ""
    vehicle_type: str
    brand: str
    plate: str
    pin: str


class OwnerProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    motor_fee: Optional[float] = None
    four_wheeler_fee: Optional[float] = None
    new_password: Optional[str] = None
    current_password: Optional[str] = None


@app.get("/api/ping")
async def ping() -> Dict[str, Any]:
    return {"message": "ParkOptima Python backend is ready"}


@app.post("/api/auth/login")
async def login(payload: LoginRequest) -> Dict[str, Any]:
    email = (payload.email or "").strip().lower()
    password = payload.password or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    row = fetch_one(
        "SELECT id, role, password_hash FROM users WHERE LOWER(email) = %s AND is_active = 1 LIMIT 1",
        [email],
    )
    if not row or not verify_password(password, row.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": str(uuid.uuid4()),
        "user_id": int(row["id"]),
        "role": row["role"],
    }


@app.post("/api/attendant/login")
async def attendant_login(payload: LoginRequest) -> Dict[str, Any]:
    return authenticate_attendant(payload.email, payload.password)


@app.post("/api/attendant/signup")
async def attendant_signup(payload: SignupRequest) -> Dict[str, Any]:
    return register_attendant(payload.dict())


@app.post("/api/parking-owner/login")
async def parking_owner_login(payload: LoginRequest) -> Dict[str, Any]:
    return authenticate_parking_owner(payload.email, payload.password)


@app.post("/api/parking-owner/signup")
async def parking_owner_signup(payload: SignupRequest) -> Dict[str, Any]:
    return register_parking_owner(payload.dict())


@app.post("/api/auth/signup")
async def signup(payload: SignupRequest) -> Dict[str, Any]:
    role = payload.role.strip() or "parking_attendant"
    if role not in {"parking_attendant", "parking_owner", "vehicle_owner"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    payload.email = (payload.email or "").strip().lower()
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email, password, and role are required")

    if role == "vehicle_owner" and (not payload.plate or not payload.pin):
        raise HTTPException(status_code=400, detail="Plate and PIN are required for vehicle owner signup")

    if role == "vehicle_owner" and (not payload.pin.isdigit() or len(payload.pin) != 4):
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    # Basic duplicate checks
    existing_user = fetch_one("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", [payload.email])
    if existing_user:
        raise HTTPException(status_code=409, detail="Email is already registered")

    if role == "vehicle_owner":
        existing_vehicle = fetch_one("SELECT id FROM vehicles WHERE plate = %s LIMIT 1", [payload.plate.upper()])
        if existing_vehicle:
            raise HTTPException(status_code=409, detail="Vehicle plate is already registered")

    salt = ""
    password_hash = hash_password(payload.password, salt)

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (role, first_name, last_name, email, phone, password_hash, is_active) VALUES (%s, %s, %s, %s, %s, %s, 1)",
            [
                role,
                payload.first_name or None,
                payload.last_name or None,
                payload.email,
                payload.phone or None,
                password_hash,
            ],
        )
        user_id = int(cursor.lastrowid)

        if role == "parking_owner":
            cursor.execute(
                "INSERT INTO owner_settings (owner_user_id) VALUES (%s)",
                [user_id],
            )

        if role == "vehicle_owner":
            cursor.execute(
                "INSERT INTO wallets (user_id) VALUES (%s)",
                [user_id],
            )
            pin_hash = hash_password(payload.pin)
            cursor.execute(
                "INSERT INTO vehicles (owner_id, plate, type, registered_at, pin_hash, is_active) VALUES (%s, %s, %s, NOW(), %s, 1)",
                [user_id, payload.plate.upper(), "Car", pin_hash],
            )

        connection.commit()
        return {"message": "Signup successful", "user_id": user_id}
    except mysql.connector.Error as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()


def reset_user_password(identifier: str, current_password: str, new_password: str) -> Dict[str, Any]:
    normalized_identifier = (identifier or "").strip().lower()
    if not normalized_identifier or not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Identifier, current password, and new password are required")
    if len(str(new_password)) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    row = fetch_one(
        "SELECT id, password_hash FROM users WHERE (LOWER(email) = %s OR phone = %s) AND is_active = 1 LIMIT 1",
        [normalized_identifier, normalized_identifier],
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(str(current_password), row.get("password_hash")):
        raise HTTPException(status_code=401, detail="Current password is invalid")

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        salt = ""
        password_hash = hash_password(str(new_password), salt)
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            [password_hash, int(row["id"])],
        )
        connection.commit()
        return {"message": "Password updated"}
    except mysql.connector.Error as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()


@app.post("/api/auth/password-reset")
async def password_reset(payload: PasswordResetRequest) -> Dict[str, Any]:
    return reset_user_password(payload.identifier, payload.current_password, payload.new_password)


@app.post("/api/auth/vehicle-login")
async def vehicle_login(payload: dict[str, str]) -> Dict[str, Any]:
    plate = (payload.get("plate") or "").strip().upper()
    pin = payload.get("pin") or ""
    if not plate or not pin:
        raise HTTPException(status_code=400, detail="Plate and PIN are required")

    row = fetch_one(
        "SELECT v.id AS vehicle_id, v.owner_id, v.pin_hash, u.is_active FROM vehicles v JOIN users u ON u.id = v.owner_id WHERE v.plate = %s AND v.is_active = 1 LIMIT 1",
        [plate],
    )
    if not row or not verify_password(pin, row.get("pin_hash")):
        raise HTTPException(status_code=401, detail="Invalid plate or PIN")
    if not int(row.get("is_active") or 0):
        raise HTTPException(status_code=403, detail="Vehicle owner is not active")

    return {
        "access_token": str(uuid.uuid4()),
        "user_id": int(row["owner_id"]),
        "vehicle_id": int(row["vehicle_id"]),
    }


@app.post("/api/vehicle/register")
async def vehicle_register(payload: VehicleRegisterRequest) -> Dict[str, Any]:
    plate = payload.plate.strip().upper()
    if not payload.vehicle_type or not payload.brand or not plate or not payload.pin:
        raise HTTPException(status_code=400, detail="Vehicle type, brand, plate, and PIN are required")
    if not payload.pin.isdigit() or len(payload.pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")
    if not all(ch.isalnum() or ch in "- " for ch in plate):
        raise HTTPException(status_code=400, detail="Plate number contains invalid characters")

    existing_vehicle = fetch_one("SELECT id FROM vehicles WHERE plate = %s LIMIT 1", [plate])
    if existing_vehicle:
        raise HTTPException(status_code=409, detail="Vehicle plate is already registered")

    names = [part for part in payload.owner_name.split() if part]
    first_name = names[0] if names else None
    last_name = " ".join(names[1:]) if len(names) > 1 else None
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (role, first_name, last_name, email, phone, password_hash, is_active) VALUES (%s, %s, %s, %s, %s, NULL, 1)",
            ["vehicle_owner", first_name, last_name, None, payload.phone or None],
        )
        user_id = int(cursor.lastrowid)
        cursor.execute("INSERT INTO wallets (user_id) VALUES (%s)", [user_id])
        pin_hash = hash_password(payload.pin)
        cursor.execute(
            "INSERT INTO vehicles (owner_id, plate, make, type, registered_at, pin_hash, is_active) VALUES (%s, %s, %s, %s, NOW(), %s, 1)",
            [user_id, plate, payload.brand, payload.vehicle_type, pin_hash],
        )
        vehicle_id = int(cursor.lastrowid)
        connection.commit()
        return {"message": "Vehicle registration successful", "user_id": user_id, "vehicle_id": vehicle_id}
    except mysql.connector.Error as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()


@app.get("/api/monitor/summary")
async def monitor_summary() -> Dict[str, Any]:
    return get_monitor_summary()


@app.get("/api/sessions/active")
async def active_sessions() -> List[Dict[str, Any]]:
    return get_active_sessions()


@app.get("/api/transactions/recent")
async def recent_transactions() -> List[Dict[str, Any]]:
    return get_recent_transactions()


@app.get("/api/monitor/slots")
async def monitor_slots(slots: int = Query(default=100)) -> List[Dict[str, Any]]:
    return get_monitor_slots(slots)


@app.get("/api/vehicles/balance")
async def vehicle_balance(plate: str = Query(...)) -> Dict[str, Any]:
    return get_vehicle_balance(plate)


@app.get("/api/users/{user_id}")
async def user_profile(user_id: int) -> Dict[str, Any]:
    row = fetch_one(
        "SELECT id, first_name, last_name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = %s LIMIT 1",
        [user_id],
    )
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@app.put("/api/users/{user_id}")
async def user_profile_update(user_id: int, payload: OwnerProfileUpdateRequest) -> Dict[str, Any]:
    return update_user_profile(user_id, payload.dict())


@app.get("/api/owner/dashboard")
async def owner_dashboard() -> Dict[str, Any]:
    return get_owner_overview()


@app.get("/api/owner/analytics")
async def owner_analytics(period: str = Query(default="Daily")) -> Dict[str, Any]:
    return get_owner_analytics(period)


@app.get("/api/owner/reports")
async def owner_reports(period: str = Query(default="Daily")) -> Dict[str, Any]:
    return build_owner_reports(period)


@app.get("/api/owner/transactions")
async def owner_transactions() -> List[Dict[str, Any]]:
    return get_owner_transactions()


@app.get("/api/owner/vehicles")
async def owner_vehicles() -> List[Dict[str, Any]]:
    rows = fetch_all(
        "SELECT v.id, v.plate, v.make, v.model, v.color, v.type, v.registered_at, v.is_active, u.first_name, u.last_name, (SELECT ps.status FROM parking_sessions ps WHERE ps.vehicle_id = v.id ORDER BY ps.start_time DESC LIMIT 1) AS latest_status FROM vehicles v LEFT JOIN users u ON u.id = v.owner_id ORDER BY v.registered_at DESC"
    )
    return [
        {
            "id": int(row["id"]),
            "plate": row["plate"],
            "owner_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
            "vehicle_details": f"{row.get('make') or ''} {row.get('model') or ''} {row.get('color') or ''}".strip(),
            "type": row["type"],
            "date_registered": row["registered_at"],
            "status": row["latest_status"] or ("active" if row["is_active"] else "inactive"),
        }
        for row in rows
    ]


@app.post("/api/owner/vehicles")
async def owner_vehicle_create(payload: VehicleRegisterRequest) -> Dict[str, Any]:
    return await vehicle_register(payload)


@app.get("/api/owner/users")
async def owner_users() -> List[Dict[str, Any]]:
    rows = fetch_all("SELECT id, first_name, last_name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC")
    return [
        {
            "id": int(row["id"]),
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "email": row["email"],
            "phone": row["phone"],
            "role": row["role"],
            "is_active": bool(row["is_active"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


@app.post("/api/owner/users")
async def owner_user_create(payload: SignupRequest) -> Dict[str, Any]:
    return await signup(payload)


@app.get("/api/owner/audit-trail")
async def owner_audit_trail() -> List[Dict[str, Any]]:
    rows = fetch_all("SELECT id, user_id, role, action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 50")
    return [
        {
            "id": int(row["id"]),
            "user_id": int(row["user_id"]),
            "role": row["role"],
            "action": row["action"],
            "details": row["details"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


@app.get("/api/owner/profile")
async def owner_profile() -> Dict[str, Any]:
    return get_owner_profile()


@app.post("/api/owner/profile")
async def owner_profile_update(payload: OwnerProfileUpdateRequest) -> Dict[str, Any]:
    return update_owner_profile(payload.dict())


@app.get("/api/payments")
async def payments(limit: int = Query(default=50)) -> List[Dict[str, Any]]:
    return get_payments(limit)


@app.post("/api/payments/{transaction_id}/pay")
async def payment_mark_paid(transaction_id: int) -> Dict[str, Any]:
    return mark_payment_paid(transaction_id)


@app.post("/api/scan")
async def scan(payload: dict[str, Any]) -> Dict[str, Any]:
    return create_parking_session(payload)


@app.post("/api/scan-out")
async def scan_out(payload: dict[str, Any]) -> Dict[str, Any]:
    return complete_parking_session(payload)


@app.post("/api/vision/detect")
async def vision_detect(request: Request) -> Dict[str, Any]:
    if cv2 is None or easyocr is None or YOLO is None:
        return {
            "status": "unavailable",
            "message": "Vision dependencies are not installed. Install the packages from requirements.txt first.",
            "objects": [],
            "text": [],
        }

    contents = None
    filename = "upload.jpg"
    
    # Try to parse as JSON with base64 first
    try:
        json_data = await request.json()
        if json_data.get("image_base64"):
            try:
                contents = base64.b64decode(json_data["image_base64"])
                filename = json_data.get("filename", "plate.jpg")
            except Exception:
                pass
    except Exception:
        pass
    
    # If no JSON base64, try multipart form data
    if not contents:
        try:
            form_data = await request.form()
            uploaded_file = form_data.get("image") or form_data.get("file")
            if uploaded_file:
                contents = await uploaded_file.read()
                filename = uploaded_file.filename or "upload.jpg"
        except Exception:
            pass
    
    if not contents:
        raise HTTPException(status_code=400, detail="No image uploaded")

    suffix = Path(filename).suffix or ".jpg"
    with tempfile.NamedTemporaryFile("wb", suffix=suffix, delete=False) as handle:
        handle.write(contents)
        temp_path = handle.name

    try:
        image = cv2.imread(temp_path)
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read uploaded image")

        # YOLOv8 object detection
        model = YOLO("yolov8n.pt")
        detection_results = model(temp_path, stream=True, conf=0.25)

        detected_objects: List[Dict[str, Any]] = []
        for result in detection_results:
            for box in result.boxes:
                class_id = int(box.cls[0]) if len(box.cls) else -1
                class_name = model.names.get(class_id, str(class_id)) if hasattr(model, "names") else str(class_id)
                detected_objects.append(
                    {
                        "class": class_name,
                        "confidence": float(box.conf[0]) if len(box.conf) else 0.0,
                        "bbox": [float(value) for value in box.xyxy[0]],
                    }
                )

        # OCR
        reader = easyocr.Reader(["en"], gpu=False)
        text_results = reader.readtext(temp_path, detail=0, paragraph=False)
        normalized_plate = extract_plate_candidate(text_results)

        return {
            "status": "ok",
            "objects": detected_objects,
            "text": text_results,
            "plate": normalized_plate,
        }
    except HTTPException:
        raise
    except Exception as exc:
        return {
            "status": "error",
            "message": f"Vision processing failed: {exc}",
            "objects": [],
            "text": [],
            "plate": None,
        }
    finally:
        try:
            os.remove(temp_path)
        except FileNotFoundError:
            pass


# Notification Endpoints
@app.get("/api/notifications")
async def get_notifications(
    owner_id: int = Query(...),
    limit: int = Query(default=20),
    offset: int = Query(default=0),
    unread_only: bool = Query(default=False),
) -> Dict[str, Any]:
    """Get notifications for a parking owner."""
    notifications = get_owner_notifications(owner_id, limit, offset, unread_only)
    unread_count = get_unread_notification_count(owner_id)
    return {
        "status": "ok",
        "notifications": notifications,
        "unread_count": unread_count,
        "total": len(notifications),
    }


@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int) -> Dict[str, Any]:
    """Mark a notification as read."""
    success = mark_notification_as_read(notification_id)
    return {"status": "ok" if success else "error", "message": "Notification marked as read" if success else "Failed to mark notification"}


@app.post("/api/notifications/mark-all-read")
async def mark_all_read(owner_id: int = Query(...)) -> Dict[str, Any]:
    """Mark all notifications as read for an owner."""
    success = mark_all_notifications_as_read(owner_id)
    return {"status": "ok" if success else "error", "message": "All notifications marked as read" if success else "Failed to mark notifications"}


@app.delete("/api/notifications/{notification_id}")
async def delete_notif(notification_id: int) -> Dict[str, Any]:
    """Delete a notification."""
    success = delete_notification(notification_id)
    return {"status": "ok" if success else "error", "message": "Notification deleted" if success else "Failed to delete notification"}


@app.get("/api/notifications/occupancy/{owner_id}")
async def get_occupancy(owner_id: int) -> Dict[str, Any]:
    """Get current parking lot occupancy."""
    occupancy = get_parking_lot_occupancy(owner_id)
    is_full = check_parking_lot_full(owner_id)
    return {
        "status": "ok",
        "occupancy": occupancy,
        "is_full": is_full,
        "percentage": occupancy.get("percentage", 0),
    }


@app.get("/api/notifications/unusual-events/{owner_id}")
async def get_unusual_events(owner_id: int) -> Dict[str, Any]:
    """Detect and return unusual events in the parking lot."""
    events = detect_unusual_events(owner_id)
    
    # Create notifications for critical events
    for event in events:
        if event["severity"] == "critical":
            create_notification(
                owner_id,
                "unusual_event",
                f"Alert: {event['description']}",
                f"Detected {event['type']} in your parking lot. Details: {event['description']}",
                "critical",
                event.get("data"),
            )
    
    return {
        "status": "ok",
        "events": events,
        "count": len(events),
        "critical_count": sum(1 for e in events if e["severity"] == "critical"),
    }


@app.post("/api/notifications/create")
async def create_notif(
    owner_id: int = Query(...),
    notification_type: str = Query(...),
    title: str = Query(...),
    message: str = Query(...),
    severity: str = Query(default="info"),
) -> Dict[str, Any]:
    """Create a new notification (admin/system endpoint)."""
    notification = create_notification(
        owner_id,
        notification_type,
        title,
        message,
        severity,
    )
    return {"status": "ok", "notification": notification}


@app.get("/api/notifications/unread-count/{owner_id}")
async def get_unread_count(owner_id: int) -> Dict[str, Any]:
    """Get unread notification count for an owner."""
    count = get_unread_notification_count(owner_id)
    return {"status": "ok", "unread_count": count}


@app.get("/")
async def root() -> Dict[str, Any]:
    return {"message": "ParkOptima Python backend is running"}
