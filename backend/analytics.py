from .services import build_owner_analytics


def get_owner_analytics(period: str = "Daily"):
    return build_owner_analytics(period)
