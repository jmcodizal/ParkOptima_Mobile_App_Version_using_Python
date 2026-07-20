import re
from typing import Any, Dict, List, Optional


PLATE_PATTERN = re.compile(r"([A-Za-z]{1,3}[-\s]?[0-9A-Za-z]{1,4})")


def normalize_plate(text: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text.upper())
    if len(cleaned) <= 4:
        return cleaned
    if len(cleaned) <= 8:
        return cleaned[:3] + "-" + cleaned[3:]
    return cleaned[:3] + "-" + cleaned[3:7]


def extract_plate_candidate(ocr_results: List[Dict[str, Any]]) -> Optional[str]:
    for item in ocr_results:
        text = str(item.get("text") or "").strip()
        if not text:
            continue
        cleaned = re.sub(r"[^A-Za-z0-9]", "", text.upper())
        if len(cleaned) < 3:
            continue
        if not any(char.isdigit() for char in cleaned) and "-" not in text:
            continue
        if re.fullmatch(r"[A-Z0-9]{3,8}", cleaned):
            candidate = normalize_plate(text)
            if len(candidate.replace("-", "")) >= 3:
                return candidate
    return None
