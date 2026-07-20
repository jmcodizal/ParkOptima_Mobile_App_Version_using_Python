from typing import Any, Dict, List

from .db import fetch_all, fetch_one


def _get_parking_capacity(default_capacity: int = 100) -> int:
    try:
        settings = fetch_one(
            "SELECT COALESCE(parking_capacity, 0) AS total_capacity FROM owner_settings ORDER BY id LIMIT 1"
        )
        configured_capacity = int((settings or {}).get("total_capacity") or 0)
        return max(1, configured_capacity if configured_capacity > 0 else default_capacity)
    except Exception:
        return default_capacity


def _get_active_session_rows() -> List[Dict[str, Any]]:
    try:
        return fetch_all(
            "SELECT ps.id, ps.session_uuid, ps.vehicle_id, ps.owner_user_id, ps.attendant_id, ps.start_time, ps.duration_seconds, ps.status, ps.fee, ps.currency, v.plate, v.make, v.model, v.color, u.first_name, u.last_name FROM parking_sessions ps JOIN vehicles v ON v.id = ps.vehicle_id JOIN users u ON u.id = ps.owner_user_id WHERE ps.status = 'active' ORDER BY ps.start_time ASC"
        )
    except Exception:
        return []


def assign_slot_numbers(rows: List[Dict[str, Any]], capacity: int = 100) -> List[Dict[str, Any]]:
    slot_capacity = max(1, capacity)
    assigned_rows: List[Dict[str, Any]] = []
    for index, row in enumerate(rows, start=1):
        assigned_rows.append({**row, "slot_number": index if index <= slot_capacity else None})
    return assigned_rows


def get_monitor_summary() -> Dict[str, Any]:
    try:
        summary = fetch_one("SELECT COUNT(*) AS active_count FROM parking_sessions WHERE status = 'active'")
        settings = fetch_one("SELECT COALESCE(parking_capacity, 0) AS total_capacity FROM owner_settings ORDER BY id LIMIT 1")
        active_count = int((summary or {}).get("active_count") or 0)
        configured_capacity = int((settings or {}).get("total_capacity") or 0)
        total_capacity = max(configured_capacity, active_count, 1)
        occupancy_percent = 0 if total_capacity == 0 else min(100, round((active_count / total_capacity) * 100))
        traffic_level = "High" if occupancy_percent >= 80 else "Medium" if occupancy_percent >= 50 else "Low"
        return {
            "active_count": active_count,
            "occupancy_percent": occupancy_percent,
            "traffic_level": traffic_level,
            "total_capacity": total_capacity,
        }
    except Exception:
        return {
            "active_count": 0,
            "occupancy_percent": 0,
            "traffic_level": "Low",
            "total_capacity": 1,
        }


def get_active_sessions() -> List[Dict[str, Any]]:
    rows = _get_active_session_rows()
    capacity = _get_parking_capacity()
    assigned_rows = assign_slot_numbers(rows, capacity)
    result: List[Dict[str, Any]] = []
    for row in assigned_rows:
        result.append(
            {
                "id": int(row["id"]),
                "session_uuid": row["session_uuid"],
                "vehicle_id": int(row["vehicle_id"]),
                "owner_user_id": int(row["owner_user_id"]),
                "attendant_id": int(row["attendant_id"]) if row.get("attendant_id") is not None else None,
                "start_time": row["start_time"],
                "duration_seconds": int(row["duration_seconds"]) if row.get("duration_seconds") is not None else None,
                "status": row["status"],
                "fee": float(row["fee"]),
                "currency": row["currency"],
                "plate": row["plate"],
                "make": row["make"],
                "model": row["model"],
                "color": row["color"],
                "owner_name": f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
                "slot_number": row.get("slot_number"),
            }
        )
    return result[-50:] if len(result) > 50 else result


def get_recent_transactions() -> List[Dict[str, Any]]:
    try:
        rows = fetch_all(
            "SELECT t.id, t.transaction_uuid, t.session_id, t.user_id, t.attendant_id, t.amount, t.currency, t.method, t.status, t.reference, t.created_at, v.plate AS vehicle_plate, CONCAT(u.first_name, ' ', u.last_name) AS owner_name FROM transactions t LEFT JOIN parking_sessions ps ON ps.id = t.session_id LEFT JOIN vehicles v ON ps.vehicle_id = v.id LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 50"
        )
    except Exception:
        rows = []
    return [
        {
            "id": int(row["id"]),
            "transaction_uuid": row["transaction_uuid"],
            "session_id": int(row["session_id"]) if row.get("session_id") is not None else None,
            "user_id": int(row["user_id"]),
            "attendant_id": int(row["attendant_id"]) if row.get("attendant_id") is not None else None,
            "amount": float(row["amount"]),
            "currency": row["currency"],
            "method": row["method"],
            "status": row["status"],
            "reference": row["reference"],
            "created_at": row["created_at"],
            "vehicle_plate": row["vehicle_plate"],
            "owner_name": row["owner_name"],
        }
        for row in rows
    ]


def get_monitor_slots(slots: int = 100) -> List[Dict[str, Any]]:
    slots_requested = max(1, slots)
    capacity = _get_parking_capacity()
    slots_requested = max(1, min(slots_requested, capacity))
    rows = assign_slot_numbers(_get_active_session_rows(), capacity)
    result: List[Dict[str, Any]] = []
    for index in range(1, slots_requested + 1):
        row = rows[index - 1] if index - 1 < len(rows) else None
        result.append(
            {
                "id": f"S{index}",
                "index": index,
                "occupied": row is not None,
                "session_id": int(row["id"]) if row else None,
                "plate": row["plate"] if row else None,
                "start_time": row["start_time"] if row else None,
            }
        )
    return result
