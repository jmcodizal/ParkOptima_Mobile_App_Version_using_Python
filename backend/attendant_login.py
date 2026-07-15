from typing import Any, Dict

from fastapi import HTTPException

from db import fetch_one, verify_password


def authenticate_attendant(email: str, password: str) -> Dict[str, Any]:
    email = (email or "").strip()
    password = password or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    row = fetch_one(
        "SELECT id, role, first_name, last_name, email, password_hash, password_salt FROM users WHERE email = %s AND role = 'parking_attendant' AND is_active = 1 LIMIT 1",
        [email],
    )
    if not row or not verify_password(password, row.get("password_hash"), row.get("password_salt")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user_id": int(row["id"]),
        "role": row["role"],
        "full_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
        "email": row.get("email"),
    }
