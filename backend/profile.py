from typing import Any, Dict, Optional

from fastapi import HTTPException

from db import fetch_one, get_db_connection, hash_password, verify_password


def get_owner_profile() -> Dict[str, Any]:
    row = fetch_one(
        "SELECT id, first_name, last_name, email, phone, role, is_active, created_at, updated_at FROM users WHERE role = 'parking_owner' ORDER BY id LIMIT 1"
    )
    if not row:
        raise HTTPException(status_code=404, detail="Owner profile not found")

    settings = fetch_one(
        "SELECT system_option, motor_fee, four_wheeler_fee FROM owner_settings WHERE owner_user_id = %s LIMIT 1",
        [int(row["id"])],
    )

    return {
        "id": int(row["id"]),
        "full_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
        "email": row.get("email"),
        "phone": row.get("phone"),
        "system_option": (settings or {}).get("system_option") or "Parking Owner",
        "motor_fee": float((settings or {}).get("motor_fee") or 0.0),
        "four_wheeler_fee": float((settings or {}).get("four_wheeler_fee") or 0.0),
    }


def update_owner_profile(payload: Dict[str, Any]) -> Dict[str, Any]:
    row = fetch_one("SELECT id FROM users WHERE role = 'parking_owner' ORDER BY id LIMIT 1")
    if not row:
        raise HTTPException(status_code=404, detail="Owner profile not found")

    user_id = int(row["id"])
    full_name = (payload.get("full_name") or "").strip()
    first_name = None
    last_name = None
    if full_name:
        parts = [part for part in full_name.split() if part]
        first_name = parts[0] if parts else None
        last_name = " ".join(parts[1:]) if len(parts) > 1 else None

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        updates: list[str] = []
        values: list[Any] = []
        if first_name is not None:
            updates.append("first_name = %s")
            values.append(first_name)
        if last_name is not None:
            updates.append("last_name = %s")
            values.append(last_name)
        if payload.get("email") is not None:
            updates.append("email = %s")
            values.append((payload.get("email") or "").strip())
        if payload.get("phone") is not None:
            updates.append("phone = %s")
            values.append((payload.get("phone") or "").strip())
        if updates:
            values.append(user_id)
            cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", values)

        settings_values: list[Any] = []
        settings_updates: list[str] = []
        if payload.get("motor_fee") is not None:
            settings_updates.append("motor_fee = %s")
            settings_values.append(float(payload.get("motor_fee") or 0.0))
        if payload.get("four_wheeler_fee") is not None:
            settings_updates.append("four_wheeler_fee = %s")
            settings_values.append(float(payload.get("four_wheeler_fee") or 0.0))
        if settings_updates:
            settings_values.append(user_id)
            cursor.execute(f"UPDATE owner_settings SET {', '.join(settings_updates)} WHERE owner_user_id = %s", settings_values)

        new_password = payload.get("new_password")
        if new_password:
            if len(str(new_password)) < 6:
                raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
            salt = ""
            password_hash = hash_password(str(new_password), salt)
            cursor.execute(
                "UPDATE users SET password_hash = %s, password_salt = %s WHERE id = %s",
                [password_hash, salt, user_id],
            )

        connection.commit()
        return {"message": "Profile updated"}
    except HTTPException:
        connection.rollback()
        raise
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
