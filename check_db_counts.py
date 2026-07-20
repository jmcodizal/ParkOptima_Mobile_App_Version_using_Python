import os
import mysql.connector

conn = mysql.connector.connect(
    host='127.0.0.1',
    database='parkoptima_db',
    user='root',
    password='',
    autocommit=True,
    use_pure=True,
)
cur = conn.cursor(dictionary=True)
cur.execute('SELECT COUNT(*) AS total FROM parking_sessions WHERE status = %s', ('active',))
print('active', cur.fetchone())
cur.execute('SELECT COUNT(*) AS total FROM parking_sessions')
print('all_sessions', cur.fetchone())
cur.execute('SELECT COUNT(*) AS total FROM transactions')
print('transactions', cur.fetchone())
cur.execute('SELECT COUNT(*) AS total FROM vehicles WHERE is_active = 1')
print('vehicles', cur.fetchone())
conn.close()
