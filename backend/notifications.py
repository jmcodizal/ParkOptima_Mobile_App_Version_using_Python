"""
Notifications module for ParkOptima.
Handles notification creation, retrieval, and marking as read.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from .db import execute, fetch_all, fetch_one


def create_notification(
    owner_user_id: int,
    notification_type: str,
    title: str,
    message: str,
    severity: str = "info",
    related_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a new notification for a parking owner.

    Args:
        owner_user_id: The ID of the parking owner
        notification_type: Type of notification (parking_full, unusual_event, high_occupancy, low_availability)
        title: Short title for the notification
        message: Detailed message
        severity: Severity level (info, warning, critical)
        related_data: Optional JSON data related to the notification

    Returns:
        Dictionary with notification details
    """
    import json

    related_data_json = json.dumps(related_data) if related_data else None

    result = execute(
        """
        INSERT INTO notifications 
        (owner_user_id, notification_type, title, message, severity, related_data)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (owner_user_id, notification_type, title, message, severity, related_data_json),
    )

    if result:
        return {
            "id": result,
            "owner_user_id": owner_user_id,
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "severity": severity,
            "is_read": False,
            "created_at": datetime.now().isoformat(),
        }
    return {}


def get_owner_notifications(owner_user_id: int, limit: int = 20, offset: int = 0, unread_only: bool = False) -> List[Dict[str, Any]]:
    """
    Retrieve notifications for a parking owner.

    Args:
        owner_user_id: The ID of the parking owner
        limit: Maximum number of notifications to return
        offset: Number of notifications to skip
        unread_only: If True, return only unread notifications

    Returns:
        List of notification dictionaries
    """
    import json

    where_clause = "WHERE owner_user_id = %s"
    params = [owner_user_id]

    if unread_only:
        where_clause += " AND is_read = 0"

    query = f"""
        SELECT id, owner_user_id, notification_type, title, message, 
               severity, is_read, related_data, created_at, read_at
        FROM notifications
        {where_clause}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """
    params.extend([limit, offset])

    notifications = fetch_all(query, params)

    result = []
    for row in notifications:
        notification = {
            "id": row[0],
            "owner_user_id": row[1],
            "notification_type": row[2],
            "title": row[3],
            "message": row[4],
            "severity": row[5],
            "is_read": bool(row[6]),
            "related_data": json.loads(row[7]) if row[7] else None,
            "created_at": row[8].isoformat() if row[8] else None,
            "read_at": row[9].isoformat() if row[9] else None,
        }
        result.append(notification)

    return result


def mark_notification_as_read(notification_id: int) -> bool:
    """
    Mark a notification as read.

    Args:
        notification_id: The ID of the notification

    Returns:
        True if successful, False otherwise
    """
    result = execute(
        """
        UPDATE notifications 
        SET is_read = 1, read_at = NOW()
        WHERE id = %s
        """,
        (notification_id,),
    )
    return bool(result)


def mark_all_notifications_as_read(owner_user_id: int) -> bool:
    """
    Mark all notifications for an owner as read.

    Args:
        owner_user_id: The ID of the parking owner

    Returns:
        True if successful, False otherwise
    """
    result = execute(
        """
        UPDATE notifications 
        SET is_read = 1, read_at = NOW()
        WHERE owner_user_id = %s AND is_read = 0
        """,
        (owner_user_id,),
    )
    return True


def get_unread_notification_count(owner_user_id: int) -> int:
    """
    Get the count of unread notifications for an owner.

    Args:
        owner_user_id: The ID of the parking owner

    Returns:
        Count of unread notifications
    """
    row = fetch_one(
        "SELECT COUNT(*) FROM notifications WHERE owner_user_id = %s AND is_read = 0",
        (owner_user_id,),
    )
    return row[0] if row else 0


def check_parking_lot_full(owner_user_id: int) -> bool:
    """
    Check if the parking lot is at full capacity.

    Args:
        owner_user_id: The ID of the parking owner

    Returns:
        True if parking lot is full, False otherwise
    """
    # Get owner's parking capacity
    owner_settings = fetch_one(
        "SELECT parking_capacity FROM owner_settings WHERE owner_user_id = %s",
        (owner_user_id,),
    )

    if not owner_settings:
        return False

    parking_capacity = owner_settings[0]

    # Count active parking sessions
    active_sessions = fetch_one(
        """
        SELECT COUNT(*) FROM parking_sessions 
        WHERE owner_user_id = %s AND status = 'active'
        """,
        (owner_user_id,),
    )

    active_count = active_sessions[0] if active_sessions else 0

    return active_count >= parking_capacity


def get_parking_lot_occupancy(owner_user_id: int) -> Dict[str, Any]:
    """
    Get the current occupancy of the parking lot.

    Args:
        owner_user_id: The ID of the parking owner

    Returns:
        Dictionary with occupancy information
    """
    # Get owner's parking capacity
    owner_settings = fetch_one(
        "SELECT parking_capacity FROM owner_settings WHERE owner_user_id = %s",
        (owner_user_id,),
    )

    if not owner_settings:
        return {"current": 0, "capacity": 0, "percentage": 0}

    parking_capacity = owner_settings[0]

    # Count active parking sessions
    active_sessions = fetch_one(
        """
        SELECT COUNT(*) FROM parking_sessions 
        WHERE owner_user_id = %s AND status = 'active'
        """,
        (owner_user_id,),
    )

    active_count = active_sessions[0] if active_sessions else 0
    percentage = (active_count / parking_capacity * 100) if parking_capacity > 0 else 0

    return {
        "current": active_count,
        "capacity": parking_capacity,
        "percentage": round(percentage, 2),
        "available": parking_capacity - active_count,
    }


def detect_unusual_events(owner_user_id: int) -> List[Dict[str, Any]]:
    """
    Detect unusual events in the parking lot.

    Unusual events include:
    - Multiple vehicles with same plate in active sessions
    - Extended parking durations (> 24 hours)
    - High volume of short sessions in a period

    Args:
        owner_user_id: The ID of the parking owner

    Returns:
        List of detected unusual events
    """
    events = []

    # Check for duplicate active plates (unusual event)
    duplicate_plates = fetch_all(
        """
        SELECT v.plate, COUNT(*) as count
        FROM parking_sessions ps
        JOIN vehicles v ON ps.vehicle_id = v.id
        WHERE ps.owner_user_id = %s AND ps.status = 'active'
        GROUP BY v.plate
        HAVING count > 1
        """,
        (owner_user_id,),
    )

    for plate_row in duplicate_plates:
        events.append(
            {
                "type": "duplicate_plate",
                "severity": "critical",
                "description": f"Multiple active sessions for plate {plate_row[0]}",
                "data": {"plate": plate_row[0], "count": plate_row[1]},
            }
        )

    # Check for extended parking (> 24 hours)
    extended_sessions = fetch_all(
        """
        SELECT ps.id, v.plate, 
               TIMESTAMPDIFF(HOUR, ps.start_time, NOW()) as hours_parked
        FROM parking_sessions ps
        JOIN vehicles v ON ps.vehicle_id = v.id
        WHERE ps.owner_user_id = %s AND ps.status = 'active'
        AND TIMESTAMPDIFF(HOUR, ps.start_time, NOW()) > 24
        """,
        (owner_user_id,),
    )

    for session_row in extended_sessions:
        events.append(
            {
                "type": "extended_parking",
                "severity": "warning",
                "description": f"Vehicle {session_row[1]} parked for {session_row[2]} hours",
                "data": {"session_id": session_row[0], "plate": session_row[1], "hours": session_row[2]},
            }
        )

    return events


def delete_notification(notification_id: int) -> bool:
    """
    Delete a notification.

    Args:
        notification_id: The ID of the notification

    Returns:
        True if successful, False otherwise
    """
    result = execute(
        "DELETE FROM notifications WHERE id = %s",
        (notification_id,),
    )
    return bool(result)


def delete_old_notifications(owner_user_id: int, days: int = 30) -> bool:
    """
    Delete old notifications (older than specified days) that have been read.

    Args:
        owner_user_id: The ID of the parking owner
        days: Number of days to keep (default 30)

    Returns:
        True if successful
    """
    result = execute(
        """
        DELETE FROM notifications 
        WHERE owner_user_id = %s 
        AND is_read = 1 
        AND created_at < DATE_SUB(NOW(), INTERVAL %s DAY)
        """,
        (owner_user_id, days),
    )
    return True
