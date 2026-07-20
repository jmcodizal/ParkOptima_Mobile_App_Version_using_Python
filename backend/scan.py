from typing import Any, Dict

from fastapi import HTTPException

from .db import fetch_one, get_db_connection


def create_parking_session(payload: Dict[str, Any]) -> Dict[str, Any]:
    plate = (payload.get("plate") or "").strip().upper()
    if not plate:
        raise HTTPException(status_code=400, detail="Plate number is required")

    vehicle = fetch_one(
        "SELECT v.id, v.owner_id, v.type AS vehicle_type, os.motor_fee, os.four_wheeler_fee, w.currency FROM vehicles v JOIN users u ON u.id = v.owner_id LEFT JOIN owner_settings os ON os.owner_user_id = u.id LEFT JOIN wallets w ON w.user_id = u.id WHERE v.plate = %s AND v.is_active = 1 LIMIT 1",
        [plate],
    )

    owner = fetch_one(
        "SELECT id, first_name, last_name FROM users WHERE role IN ('parking_owner', 'owner') ORDER BY id LIMIT 1"
    )
    owner_id = int((owner or {}).get("id") or 0)

    vehicle_type = str(payload.get("vehicle_type") or (vehicle or {}).get("vehicle_type") or "Car")
    normalized_vehicle_type = vehicle_type.lower().replace(" ", "")
    if normalized_vehicle_type in {"motor", "2wheels", "2wheel", "2-wheels", "2-wheel"}:
        fee = float((vehicle or {}).get("motor_fee") or 5.0)
    else:
        fee = float((vehicle or {}).get("four_wheeler_fee") or 20.0)
    currency = str(payload.get("currency") or (vehicle or {}).get("currency") or "PHP")

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        vehicle_id = int((vehicle or {}).get("id") or 0)
        owner_user_id = int((vehicle or {}).get("owner_id") or owner_id)
        cursor.execute(
            "INSERT INTO parking_sessions (session_uuid, vehicle_id, owner_user_id, attendant_id, start_time, status, fee, currency, notes) VALUES (%s, %s, %s, %s, NOW(), 'active', %s, %s, %s)",
            [payload.get("session_uuid") or f"sess-{plate}", vehicle_id or None, owner_user_id or None, payload.get("attendant_id"), fee, currency, "Manual entry"],
        )
        session_id = int(cursor.lastrowid)
        connection.commit()
        return {"message": "Parking session started", "session_id": session_id, "plate": plate, "fee": fee, "currency": currency}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
