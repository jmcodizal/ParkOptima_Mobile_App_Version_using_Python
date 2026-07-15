from typing import Any, Dict

from fastapi import HTTPException

from db import fetch_one


def get_vehicle_balance(plate: str) -> Dict[str, Any]:
    plate = (plate or "").strip().upper()
    if not plate:
        raise HTTPException(status_code=400, detail="Plate number is required")

    row = fetch_one(
        "SELECT v.plate, v.type AS vehicle_type, v.registered_at, u.first_name, u.last_name, w.balance, w.currency FROM vehicles v JOIN users u ON u.id = v.owner_id LEFT JOIN wallets w ON w.user_id = u.id WHERE v.plate = %s AND v.is_active = 1 LIMIT 1",
        [plate],
    )
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return {
        "plate": row["plate"],
        "owner_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
        "vehicle_type": row.get("vehicle_type") or "Car",
        "registered_at": row.get("registered_at"),
        "balance": float(row.get("balance") or 0.0),
        "currency": row.get("currency") or "USD",
    }
