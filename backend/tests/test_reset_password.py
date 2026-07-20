import unittest
from unittest.mock import patch

from fastapi import HTTPException

from backend.main import reset_user_password


class ResetPasswordTests(unittest.TestCase):
    def test_updates_password_when_current_password_matches(self) -> None:
        class DummyCursor:
            def __init__(self) -> None:
                self.executed = []

            def execute(self, query: str, params: list[object]) -> None:
                self.executed.append((query, params))

        class DummyConnection:
            def __init__(self) -> None:
                self.cursor_obj = DummyCursor()

            def cursor(self) -> DummyCursor:
                return self.cursor_obj

            def commit(self) -> None:
                return None

            def rollback(self) -> None:
                return None

            def close(self) -> None:
                return None

        connection = DummyConnection()
        fake_row = {"id": 7, "password_hash": "oldhash", "password_salt": ""}

        with patch("backend.main.fetch_one", return_value=fake_row), patch("backend.main.verify_password", return_value=True), patch("backend.main.hash_password", return_value="newhash"), patch("backend.main.get_db_connection", return_value=connection):
            result = reset_user_password("john@example.com", "current-pass", "new-pass")

        self.assertEqual(result["message"], "Password updated")
        self.assertEqual(connection.cursor_obj.executed[0][0], "UPDATE users SET password_hash = %s, password_salt = %s WHERE id = %s")
        self.assertEqual(connection.cursor_obj.executed[0][1], ["newhash", "", 7])

    def test_rejects_when_current_password_does_not_match(self) -> None:
        fake_row = {"id": 7, "password_hash": "oldhash", "password_salt": ""}

        with patch("backend.main.fetch_one", return_value=fake_row), patch("backend.main.verify_password", return_value=False):
            with self.assertRaises(HTTPException) as exc:
                reset_user_password("john@example.com", "wrong-pass", "new-pass")

        self.assertEqual(exc.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
