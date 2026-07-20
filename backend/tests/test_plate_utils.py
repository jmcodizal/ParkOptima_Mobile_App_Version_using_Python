import unittest

from backend.vision_utils import extract_plate_candidate


class PlateUtilsTests(unittest.TestCase):
    def test_extracts_plate_like_text_from_ocr_results(self) -> None:
        ocr_results = [
            {"text": "PARKING"},
            {"text": "ABC-123"},
            {"text": "ENTRY"},
        ]
        self.assertEqual(extract_plate_candidate(ocr_results), "ABC-123")

    def test_ignores_non_plate_text(self) -> None:
        ocr_results = [{"text": "WELCOME"}, {"text": "PLEASE"}]
        self.assertIsNone(extract_plate_candidate(ocr_results))


if __name__ == "__main__":
    unittest.main()
