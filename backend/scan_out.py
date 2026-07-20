from typing import Any, Dict

from fastapi import HTTPException

from .db import fetch_one, get_db_connection


def complete_parking_session(payload: Dict[str, Any]) -> Dict[str, Any]:
    session_id = payload.get("session_id")
    plate = (payload.get("plate") or "").strip().upper()

    if not session_id and not plate:
        raise HTTPException(status_code=400, detail="Session id or plate number is required")

    if not session_id:
        session = fetch_one(
            "SELECT ps.id, ps.vehicle_id, ps.owner_user_id, ps.fee, ps.status FROM parking_sessions ps JOIN vehicles v ON v.id = ps.vehicle_id WHERE v.plate = %s AND ps.status = 'active' ORDER BY ps.start_time DESC LIMIT 1",
            [plate],
        )
        if not session:
            raise HTTPException(status_code=404, detail="Active parking session not found for this plate")
        session_id = session["id"]
    else:
        session = fetch_one(
            "SELECT id, vehicle_id, owner_user_id, fee, status FROM parking_sessions WHERE id = %s LIMIT 1",
            [session_id],
        )
        if not session:
            raise HTTPException(status_code=404, detail="Parking session not found")

    if str(session.get("status") or "") != "active":
        return {"message": "Session already completed", "session_id": int(session_id)}

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE parking_sessions SET status = 'completed', end_time = NOW(), duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW()), fee = COALESCE(fee, 0) WHERE id = %s",
            [session_id],
        )
        cursor.execute(
            "INSERT INTO transactions (transaction_uuid, session_id, user_id, attendant_id, amount, currency, method, status, reference, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())",
            [
                payload.get("transaction_uuid") or f"txn-{session_id}",
                int(session_id),
                int(session["owner_user_id"]),
                payload.get("attendant_id"),
                float(payload.get("amount") or 0.0),
                payload.get("currency") or "PHP",
                payload.get("method") or "cash",
                payload.get("status") or "pending",
                payload.get("reference") or f"ref-{session_id}",
            ],
        )
        connection.commit()
        return {"message": "Parking session completed", "session_id": int(session_id)}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
