from typing import Any, Dict

from fastapi import HTTPException

from db import fetch_one, get_db_connection


def create_parking_session(payload: Dict[str, Any]) -> Dict[str, Any]:
    plate = (payload.get("plate") or "").strip().upper()
    if not plate:
        raise HTTPException(status_code=400, detail="Plate number is required")

    vehicle = fetch_one(
        "SELECT id, owner_id FROM vehicles WHERE plate = %s AND is_active = 1 LIMIT 1",
        [plate],
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO parking_sessions (session_uuid, vehicle_id, owner_user_id, attendant_id, start_time, status, fee, currency, notes) VALUES (%s, %s, %s, %s, NOW(), 'active', 0.00, 'PHP', 'Scanned in')",
            [payload.get("session_uuid") or f"sess-{vehicle['id']}", int(vehicle["id"]), int(vehicle["owner_id"]), payload.get("attendant_id")],
        )
        session_id = int(cursor.lastrowid)
        connection.commit()
        return {"message": "Parking session started", "session_id": session_id, "plate": plate}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
