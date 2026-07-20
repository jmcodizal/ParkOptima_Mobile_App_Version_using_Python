import mysql.connector

from backend.services import build_owner_dashboard


def test_build_owner_dashboard_falls_back_when_database_unavailable(monkeypatch):
    def raising_fetch_one(query, params=None):
        raise mysql.connector.Error("db down")

    def raising_fetch_all(query, params=None):
        raise mysql.connector.Error("db down")

    monkeypatch.setattr("backend.services.fetch_one", raising_fetch_one)
    monkeypatch.setattr("backend.services.fetch_all", raising_fetch_all)

    result = build_owner_dashboard()

    assert result["active_count"] == 0
    assert result["parking_capacity"] == 100
    assert result["owner_name"] == ""
    assert result["recent_transactions"] == []
