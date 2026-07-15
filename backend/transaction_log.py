from typing import Any, Dict, List

from db import fetch_all


def get_owner_transactions() -> List[Dict[str, Any]]:
    rows = fetch_all(
        "SELECT t.id, t.transaction_uuid, t.amount, t.currency, t.method, t.status, t.reference, t.created_at, v.plate, v.type AS vehicle_type, CONCAT(u.first_name, ' ', u.last_name) AS owner_name FROM transactions t LEFT JOIN parking_sessions ps ON ps.id = t.session_id LEFT JOIN vehicles v ON v.id = ps.vehicle_id LEFT JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC"
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
            "vehicle_type": row["vehicle_type"],
        }
        for row in rows
    ]
