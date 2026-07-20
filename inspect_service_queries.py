from backend.db import fetch_one, fetch_all

print('owner', fetch_one("SELECT id, first_name, last_name FROM users WHERE role IN ('parking_owner', 'owner') ORDER BY id LIMIT 1"))
print('active', fetch_one("SELECT COUNT(*) AS total FROM parking_sessions WHERE status = 'active'"))
print('vehicle_count', fetch_one("SELECT COUNT(*) AS total FROM vehicles WHERE is_active = 1"))
print('capacity', fetch_one("SELECT parking_capacity FROM owner_settings WHERE owner_user_id = 1 LIMIT 1"))
print('transactions', fetch_one("SELECT COUNT(*) AS total FROM transactions"))
print('recent', fetch_all("SELECT t.id, t.amount, t.status, t.created_at, v.plate, CONCAT(u.first_name, ' ', u.last_name) AS owner_name FROM transactions t LEFT JOIN parking_sessions ps ON ps.id = t.session_id LEFT JOIN vehicles v ON v.id = ps.vehicle_id LEFT JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 5"))
