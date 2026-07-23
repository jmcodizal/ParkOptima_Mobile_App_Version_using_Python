import hashlib
import os
from typing import Any, Dict, List, Optional

import mysql.connector

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_NAME = os.getenv("DB_NAME", "parkoptima_db")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")


def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        autocommit=True,
        use_pure=True,
    )


def fetch_all(query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or [])
        rows = cursor.fetchall()
        return rows or []
    finally:
        connection.close()


def fetch_one(query: str, params: Optional[List[Any]] = None) -> Optional[Dict[str, Any]]:
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or [])
        return cursor.fetchone()
    finally:
        connection.close()


def execute(query: str, params: Optional[List[Any]] = None) -> int:
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(query, params or [])
        return int(cursor.lastrowid or 0)
    finally:
        connection.close()


def hash_password(password: str, salt: str = "") -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: Optional[str], password_salt: Optional[str] = None) -> bool:
    if password_hash is None:
        return False
    return hash_password(password, password_salt or "") == password_hash
