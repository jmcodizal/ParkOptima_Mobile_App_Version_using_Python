import unittest
from unittest.mock import patch

from backend.scan import create_parking_session
from backend.services import build_owner_analytics, build_owner_reports


class DummyCursor:
    def __init__(self) -> None:
        self.executed = []
        self.lastrowid = 1

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


class DbBackedInterfacesTests(unittest.TestCase):
    def test_create_parking_session_uses_owner_settings_fee(self) -> None:
        connection = DummyConnection()
        fake_vehicle = {"id": 7, "owner_id": 3, "vehicle_type": "Car", "motor_fee": 5.0, "four_wheeler_fee": 30.0, "currency": "PHP"}

        with patch("backend.scan.fetch_one", return_value=fake_vehicle), patch("backend.scan.get_db_connection", return_value=connection):
            result = create_parking_session({"plate": "ABC-123", "attendant_id": 2, "session_uuid": "sess-123"})

        self.assertEqual(result["session_id"], 1)
        insert_query, insert_params = connection.cursor_obj.executed[0]
        self.assertIn("INSERT INTO parking_sessions", insert_query)
        self.assertEqual(insert_params[4], 30.0)

    def test_build_owner_reports_uses_database_counts(self) -> None:
        with patch("backend.services.fetch_one", side_effect=[
            {"total_entries": 4, "revenue": 120.0},
            {"hour": 14, "total": 4},
            {"total": 10},
            {"total": 2},
            {"total": 10, "completed": 8},
            {"total": 6},
        ]):
            report = build_owner_reports()

        self.assertEqual(report["system_reliability"], 80)
        self.assertEqual(report["returning"], "6 returning visitors")
        self.assertEqual(report["peak_entry_time"], "14:00")

    def test_build_owner_analytics_supports_weekly_period(self) -> None:
        with patch("backend.services.fetch_all", return_value=[
            {"day": "2026-07-20", "entry_count": 3, "revenue": 150.0},
            {"day": "2026-07-19", "entry_count": 2, "revenue": 80.0},
        ]):
            analytics = build_owner_analytics("Weekly")

        self.assertEqual(analytics["period"], "weekly")
        self.assertEqual(analytics["total_transactions"], 5)
        self.assertEqual(analytics["total_revenue"], 230.0)

    def test_build_owner_analytics_daily_total_uses_series_revenue(self) -> None:
        with patch("backend.services.fetch_all", return_value=[
            {"day": "2026-07-20", "entry_count": 1, "revenue": 20.0},
            {"day": "2026-07-19", "entry_count": 1, "revenue": 0.0},
        ]):
            analytics = build_owner_analytics("Daily")

        self.assertEqual(analytics["total_revenue"], 20.0)

    def test_build_owner_analytics_uses_transactions_for_revenue(self) -> None:
        with patch("backend.services.fetch_all") as mock_fetch_all:
            build_owner_analytics("Daily")

        query = mock_fetch_all.call_args[0][0]
        self.assertIn("transactions", query)
        self.assertIn("status = 'completed'", query)
        self.assertIn("SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)", query)


if __name__ == "__main__":
    unittest.main()
