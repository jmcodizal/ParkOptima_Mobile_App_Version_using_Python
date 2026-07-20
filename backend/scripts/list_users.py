from db import get_db_connection
conn = get_db_connection()
cur = conn.cursor(dictionary=True)
cur.execute("SELECT id,email,role,is_active,created_at,password_hash,password_salt FROM users ORDER BY created_at DESC LIMIT 20")
rows = cur.fetchall()
for r in rows:
    print(r)
conn.close()
