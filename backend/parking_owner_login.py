from typing import Any, Dict

from fastapi import HTTPException

try:
    from .db import fetch_one, verify_password
except ImportError:
    from db import fetch_one, verify_password


def authenticate_parking_owner(identifier: str, password: str) -> Dict[str, Any]:
    identifier = (identifier or "").strip()
    password = password or ""

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    normalized_identifier = identifier.lower()

    # Allow login with either email or phone number from the UI
    row = fetch_one(
        "SELECT id, role, first_name, last_name, email, phone, password_hash, password_salt FROM users WHERE (LOWER(email) = %s OR phone = %s) AND role = 'parking_owner' AND is_active = 1 LIMIT 1",
        [normalized_identifier, identifier],
    )

    # Debug logging for failed logins (remove in production)
    if not row:
        print(f"[auth] parking owner not found for identifier={identifier}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    ph = row.get("password_hash")
    ps = row.get("password_salt")
    ok = verify_password(password, ph, ps)
    print(f"[auth] parking owner id={row.get('id')} identifier={identifier} verify_ok={ok} salt_present={ps is not None}")
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user_id": int(row["id"]),
        "role": row["role"],
        "full_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
        "email": row.get("email"),
    }
