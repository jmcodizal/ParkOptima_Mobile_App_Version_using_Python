from typing import Any, Dict

from fastapi import HTTPException

try:
    from .db import fetch_one, get_db_connection, hash_password
except ImportError:
    from db import fetch_one, get_db_connection, hash_password


def register_parking_owner(payload: Dict[str, Any]) -> Dict[str, Any]:
    first_name = (payload.get("first_name") or "").strip()
    last_name = (payload.get("last_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not first_name or not last_name or not email or not password:
        raise HTTPException(status_code=400, detail="Please fill in all required fields")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing_user = fetch_one("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", [email])
    if existing_user:
        raise HTTPException(status_code=409, detail="Email is already registered")

    salt = ""
    password_hash = hash_password(password, salt)
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (role, first_name, last_name, email, phone, password_hash, password_salt, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s, 1)",
            ["parking_owner", first_name, last_name, email, phone or None, password_hash, salt],
        )
        user_id = int(cursor.lastrowid)
        cursor.execute(
            "INSERT INTO owner_settings (owner_user_id, system_option, motor_fee, four_wheeler_fee) VALUES (%s, %s, %s, %s)",
            [user_id, "Parking Owner", 3.00, 30.00],
        )
        connection.commit()
        return {"message": "Parking owner signup successful", "user_id": user_id}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
