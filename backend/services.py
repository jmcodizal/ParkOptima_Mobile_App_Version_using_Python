from datetime import datetime, timedelta
from typing import Any, Dict, List

import mysql.connector

from .db import fetch_all, fetch_one


def _normalize_date_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if hasattr(value, "strftime"):
        return value.strftime("%Y-%m-%d")
    return str(value)


def build_owner_dashboard() -> Dict[str, Any]:
    try:
        owner = fetch_one(
            "SELECT id, first_name, last_name FROM users WHERE role IN ('parking_owner', 'owner') ORDER BY id LIMIT 1"
        )
        active_sessions = fetch_one("SELECT COUNT(*) AS total FROM parking_sessions WHERE status = 'active'")
        vehicle_count = fetch_one("SELECT COUNT(*) AS total FROM vehicles WHERE is_active = 1")
        owner_id = int((owner or {}).get("id") or 0)
        parking_capacity_value = None
        transaction_summary = fetch_one(
            "SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS completed_amount, COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount FROM transactions"
        )
        recent_transactions = fetch_all(
            "SELECT t.id, t.amount, t.status, t.created_at, v.plate, CONCAT(u.first_name, ' ', u.last_name) AS owner_name FROM transactions t LEFT JOIN parking_sessions ps ON ps.id = t.session_id LEFT JOIN vehicles v ON v.id = ps.vehicle_id LEFT JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 5"
        )

        completed_amount = float((transaction_summary or {}).get("completed_amount") or 0.0)
        pending_amount = float((transaction_summary or {}).get("pending_amount") or 0.0)
        total_transactions = int((transaction_summary or {}).get("total") or 0)
        collection_rate = round((completed_amount / max(1.0, completed_amount + pending_amount)) * 100) if total_transactions > 0 else 0

        hourly_flow: List[int] = []
        for hour in range(24):
            row = fetch_one(
                "SELECT COUNT(*) AS total FROM parking_sessions WHERE HOUR(start_time) = %s AND DATE(start_time) = CURDATE()",
                [hour],
            )
            hourly_flow.append(int((row or {}).get("total") or 0))

        return {
            "owner_id": owner_id,
            "owner_name": f"{(owner or {}).get('first_name') or ''} {(owner or {}).get('last_name') or ''}".strip(),
            "active_count": int((active_sessions or {}).get("total") or 0),
            "vehicle_count": int((vehicle_count or {}).get("total") or 0),
            "parking_capacity": int(parking_capacity_value) if parking_capacity_value is not None else 100,
            "total_transactions": total_transactions,
            "completed_transactions": int((fetch_one("SELECT COUNT(*) AS total FROM transactions WHERE status = 'completed'") or {}).get("total") or 0),
            "pending_transactions": int((fetch_one("SELECT COUNT(*) AS total FROM transactions WHERE status = 'pending'") or {}).get("total") or 0),
            "revenue_total": completed_amount,
            "uncollected_amount": pending_amount,
            "collection_rate": collection_rate,
            "hourly_flow": hourly_flow,
            "recent_transactions": [
                {
                    "id": int(item["id"]),
                    "plate": item["plate"] or "N/A",
                    "owner_name": item["owner_name"] or "Unknown",
                    "amount": float(item["amount"]),
                    "status": item["status"],
                    "created_at": item["created_at"],
                }
                for item in recent_transactions
            ],
        }
    except Exception as exc:
        print('build_owner_dashboard failed:', exc)
        return {
            "owner_id": 0,
            "owner_name": "",
            "active_count": 0,
            "vehicle_count": 0,
            "parking_capacity": 100,
            "total_transactions": 0,
            "completed_transactions": 0,
            "pending_transactions": 0,
            "revenue_total": 0.0,
            "uncollected_amount": 0.0,
            "collection_rate": 0,
            "hourly_flow": [0] * 24,
            "recent_transactions": [],
        }


def build_owner_analytics(period: str = "Daily") -> Dict[str, Any]:
    period_key = (period or "Daily").lower()
    now = datetime.now()

    if period_key == "weekly":
        rows = fetch_all(
            "SELECT DATE(created_at) AS day, COUNT(*) AS entry_count, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue FROM transactions WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at) ORDER BY day ASC"
        )
        series = []
        for offset in range(6, -1, -1):
            day = (now.date() - timedelta(days=offset)).strftime("%Y-%m-%d")
            row = next((item for item in rows if _normalize_date_value(item.get("day")) == day), None)
            series.append(
                {
                    "day": day,
                    "label": datetime.strptime(day, "%Y-%m-%d").strftime("%b %d"),
                    "transactions": int((row or {}).get("entry_count") or 0),
                    "revenue": float((row or {}).get("revenue") or 0.0),
                }
            )
        return {
            "period": "weekly",
            "series": series,
            "total_transactions": sum(item["transactions"] for item in series),
            "total_revenue": sum(item["revenue"] for item in series),
        }

    if period_key == "monthly":
        rows = fetch_all(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS entry_count, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue FROM transactions WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH) GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC"
        )
        series = []
        for offset in range(5, -1, -1):
            month = (now - timedelta(days=30 * offset)).strftime("%Y-%m")
            row = next((item for item in rows if item.get("month") == month), None)
            series.append(
                {
                    "month": month,
                    "label": month,
                    "transactions": int((row or {}).get("entry_count") or 0),
                    "revenue": float((row or {}).get("revenue") or 0.0),
                }
            )
        return {
            "period": "monthly",
            "series": series,
            "total_transactions": sum(item["transactions"] for item in series),
            "total_revenue": sum(item["revenue"] for item in series),
        }

    rows = fetch_all(
        "SELECT DATE(created_at) AS day, COUNT(*) AS entry_count, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue FROM transactions WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at) ORDER BY day ASC"
    )
    series = []
    for offset in range(6, -1, -1):
        day = (now.date() - timedelta(days=offset)).strftime("%Y-%m-%d")
        row = next((item for item in rows if _normalize_date_value(item.get("day")) == day), None)
        series.append(
            {
                "day": day,
                "label": datetime.strptime(day, "%Y-%m-%d").strftime("%b %d"),
                "transactions": int((row or {}).get("entry_count") or 0),
                "revenue": float((row or {}).get("revenue") or 0.0),
            }
        )

    total_revenue = float(sum(item["revenue"] for item in series))
    if total_revenue > 0:
        total_revenue = round(total_revenue, 2)

    return {
        "period": "daily",
        "series": series,
        "total_transactions": sum(item["transactions"] for item in series),
        "total_revenue": total_revenue,
    }


def build_owner_reports(period: str = "Daily") -> Dict[str, Any]:
    period_key = (period or "Daily").lower()

    if period_key == "weekly":
        stats_row = fetch_one(
            "SELECT COUNT(*) AS total_entries, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue FROM transactions WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"
        )
        peak_hour_row = fetch_one(
            "SELECT HOUR(start_time) AS hour, COUNT(*) AS total FROM parking_sessions WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY HOUR(start_time) ORDER BY total DESC LIMIT 1"
        )
    elif period_key == "monthly":
        stats_row = fetch_one(
            "SELECT COUNT(*) AS total_entries, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue FROM transactions WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
        )
        peak_hour_row = fetch_one(
            "SELECT HOUR(start_time) AS hour, COUNT(*) AS total FROM parking_sessions WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY HOUR(start_time) ORDER BY total DESC LIMIT 1"
        )
    else:
        stats_row = fetch_one(
            "SELECT COUNT(*) AS total_entries, COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS revenue FROM transactions WHERE DATE(created_at) = CURDATE()"
        )
        peak_hour_row = fetch_one(
            "SELECT HOUR(start_time) AS hour, COUNT(*) AS total FROM parking_sessions WHERE DATE(start_time) = CURDATE() GROUP BY HOUR(start_time) ORDER BY total DESC LIMIT 1"
        )

    paid_row = fetch_one("SELECT COUNT(*) AS total FROM transactions WHERE status = 'completed'")
    unpaid_row = fetch_one("SELECT COUNT(*) AS total FROM transactions WHERE status = 'pending'")
    reliability_row = fetch_one(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed FROM transactions"
    )
    returning_row = fetch_one(
        "SELECT COUNT(DISTINCT user_id) AS total FROM transactions WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
    )

    total_transactions = int((reliability_row or {}).get("total") or 0)
    completed_transactions = int((reliability_row or {}).get("completed") or 0)
    system_reliability = round((completed_transactions / total_transactions) * 100) if total_transactions > 0 else 0
    returning_visitors = int((returning_row or {}).get("total") or 0)

    return {
        "total_entries_today": int((stats_row or {}).get("total_entries") or 0),
        "todays_revenue": float((stats_row or {}).get("revenue") or 0.0),
        "system_reliability": system_reliability,
        "date_range": datetime.now().strftime("%a %b %d %Y"),
        "generated_at": datetime.now().strftime("%I:%M:%S %p"),
        "returning": f"{returning_visitors} returning visitors" if returning_visitors else "No returning visitors",
        "paid": int((paid_row or {}).get("total") or 0),
        "unpaid": int((unpaid_row or {}).get("total") or 0),
        "peak_load": f"{int((peak_hour_row or {}).get('total') or 0)} entries" if peak_hour_row else "N/A",
        "paid_trans": int((paid_row or {}).get("total") or 0),
        "peak_entry_time": f"{int((peak_hour_row or {}).get('hour') or 0):02d}:00" if peak_hour_row else "N/A",
    }
