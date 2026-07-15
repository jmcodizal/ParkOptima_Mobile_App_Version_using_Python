from typing import Any, Dict

from fastapi import HTTPException

from db import fetch_one, get_db_connection


def complete_parking_session(payload: Dict[str, Any]) -> Dict[str, Any]:
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session id is required")

    session = fetch_one("SELECT id, vehicle_id, owner_user_id, fee, status FROM parking_sessions WHERE id = %s LIMIT 1", [session_id])
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
            [payload.get("transaction_uuid") or f"txn-{session_id}", int(session_id), int(session["owner_user_id"]), payload.get("attendant_id"), float(payload.get("amount") or 0.0), payload.get("currency") or "PHP", payload.get("method") or "cash", payload.get("status") or "pending", payload.get("reference") or f"ref-{session_id}"],
        )
        connection.commit()
        return {"message": "Parking session completed", "session_id": int(session_id)}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
