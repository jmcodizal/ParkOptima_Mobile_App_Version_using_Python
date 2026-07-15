from typing import Any, Dict, List

from fastapi import HTTPException

from db import fetch_all, fetch_one, get_db_connection


def get_payments(limit: int = 50) -> List[Dict[str, Any]]:
    rows = fetch_all(
        "SELECT t.id, t.transaction_uuid, t.amount, t.currency, t.status, t.method, t.reference, t.created_at, v.plate, CONCAT(u.first_name, ' ', u.last_name) AS owner_name FROM transactions t LEFT JOIN parking_sessions ps ON ps.id = t.session_id LEFT JOIN vehicles v ON v.id = ps.vehicle_id LEFT JOIN users u ON u.id = t.user_id WHERE t.status IN ('pending', 'completed') ORDER BY t.created_at DESC LIMIT %s",
        [max(1, limit)],
    )
    return [
        {
            "id": int(row["id"]),
            "transaction_uuid": row["transaction_uuid"],
            "plate": row["plate"] or "N/A",
            "owner_name": row["owner_name"] or "Unknown",
            "amount": float(row["amount"]),
            "currency": row["currency"],
            "method": row["method"],
            "status": row["status"],
            "reference": row["reference"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def mark_payment_paid(transaction_id: int) -> Dict[str, Any]:
    row = fetch_one("SELECT id, status FROM transactions WHERE id = %s LIMIT 1", [transaction_id])
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if str(row.get("status") or "") == "completed":
        return {"message": "Payment already completed", "id": int(transaction_id)}

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("UPDATE transactions SET status = 'completed' WHERE id = %s", [transaction_id])
        connection.commit()
        return {"message": "Payment marked as completed", "id": int(transaction_id)}
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        connection.close()
