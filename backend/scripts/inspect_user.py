from db import get_db_connection, verify_password
import sys

email = 'testowner@example.local'
if len(sys.argv) > 1:
    email = sys.argv[1]

conn = get_db_connection()
cur = conn.cursor(dictionary=True)
cur.execute("SELECT id,email,role,password_hash,password_salt FROM users WHERE email=%s", (email,))
row = cur.fetchone()
print('db row:', row)
if row:
    ph = row.get('password_hash')
    ps = row.get('password_salt')
    ok = verify_password('secret123', ph, ps)
    print('verify with "secret123":', ok)
conn.close()
