from typing import Any, Dict

from .services import build_owner_dashboard


def get_owner_overview() -> Dict[str, Any]:
    return build_owner_dashboard()
