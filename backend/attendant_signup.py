from typing import Any, Dict

from fastapi import HTTPException

try:
    from .db import fetch_one, get_db_connection, hash_password
except ImportError:
    from db import fetch_one, get_db_connection, hash_password


def register_attendant(payload: Dict[str, Any]) -> Dict[str, Any]:
    first_name = (payload.get("first_name") or "").strip()
    last_name = (payload.get("last_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not first_name or not last_name or not email or not password:
        raise HTTPException(status_code=400, detail="Please fill in all required fields")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing_user = fetch_one(
        "SELECT id FROM users WHERE TRIM(LOWER(email)) = %s LIMIT 1",
        [email],
    )
    if existing_user:
        raise HTTPException(status_code=409, detail="Email is already registered. Please use a different email address.")

    if phone:
        existing_phone = fetch_one(
            "SELECT id FROM users WHERE phone = %s LIMIT 1",
            [phone],
        )
        if existing_phone:
            raise HTTPException(status_code=409, detail="Phone number is already registered. Please use a different phone number.")

    password_hash = hash_password(password)
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (role, first_name, last_name, email, phone, password_hash, is_active) VALUES (%s, %s, %s, %s, %s, %s, 1)",
            ["parking_attendant", first_name, last_name, email, phone or None, password_hash],
        )
        user_id = int(cursor.lastrowid)
        connection.commit()
        return {"message": "Attendant signup successful", "user_id": user_id}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
