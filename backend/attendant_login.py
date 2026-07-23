from typing import Any, Dict

from fastapi import HTTPException

try:
    from .db import fetch_one, verify_password
except ImportError:
    from db import fetch_one, verify_password


def authenticate_attendant(identifier: str, password: str) -> Dict[str, Any]:
    identifier = (identifier or "").strip()
    password = password or ""

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    normalized_identifier = identifier.lower()

    # Allow login with either email or phone number from the UI
    row = fetch_one(
        "SELECT id, role, first_name, last_name, email, phone, password_hash FROM users WHERE (LOWER(email) = %s OR phone = %s) AND role = 'parking_attendant' AND is_active = 1 LIMIT 1",
        [normalized_identifier, identifier],
    )
    if not row or not verify_password(password, row.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user_id": int(row["id"]),
        "role": row["role"],
        "full_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
        "email": row.get("email"),
    }
