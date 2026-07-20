#!/usr/bin/env python3
import mysql.connector
import os

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST', '127.0.0.1'),
    database=os.getenv('DB_NAME', 'parkoptima_db'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASS', ''),
    autocommit=True,
    use_pure=True
)

cur = conn.cursor(dictionary=True)
cur.execute('SELECT id, vehicle_id, start_time, status, fee FROM parking_sessions ORDER BY start_time DESC LIMIT 10')
rows = cur.fetchall()

print('Parking Sessions:')
for r in rows:
    print(f"ID: {r['id']}, Vehicle: {r['vehicle_id']}, Time: {r['start_time']}, Status: {r['status']}, Fee: {r['fee']}")

conn.close()
