import sys
import os
sys.path.insert(0, os.path.abspath("."))

import unittest
from backend.tests.test_lore import (
    test_security_scanner_redaction,
    test_security_scanner_diff_detection,
    test_memory_agent_lifecycle_and_override,
    test_promise_extraction,
    test_five_layer_review_detects_conflicts,
    test_onboarding_briefing_generation,
    test_qa_agent_memory_search,
    test_gitlab_service_webhook_validation,
    get_test_db
)

class TestLoreSuite(unittest.TestCase):
    def test_all_modules(self):
        print("\n=======================================================")
        print("          RUNNING LORE INTEGRATION TEST SUITE          ")
        print("=======================================================")

        # 1. Security Scanner
        test_security_scanner_redaction()
        print(" [PASS] 1. Pre-LLM Secret Redaction Engine")

        test_security_scanner_diff_detection()
        print(" [PASS] 2. Code Diff Vulnerability & Insecure Storage Scanner")

        # 2. GitLab Webhook Security
        test_gitlab_service_webhook_validation()
        print(" [PASS] 3. GitLab Webhook Token HMAC Validation")

        # 3. Memory Agent
        for db in get_test_db():
            test_memory_agent_lifecycle_and_override(db)
            print(" [PASS] 4. Memory Agent Lifecycle, Search & Override Flow")

        # 4. Promise Agent
        for db in get_test_db():
            test_promise_extraction(db)
            print(" [PASS] 5. Promise Extraction & Status Tracking Engine")

        # 5. Review Agent
        for db in get_test_db():
            test_five_layer_review_detects_conflicts(db)
            print(" [PASS] 6. 5-Layer MR Review Conflict Engine (Cookie vs localStorage)")

        # 6. Onboarding Agent
        for db in get_test_db():
            test_onboarding_briefing_generation(db)
            print(" [PASS] 7. Developer Onboarding Briefing with Citations")

        # 7. QA Engine
        for db in get_test_db():
            test_qa_agent_memory_search(db)
            print(" [PASS] 8. Ask LORE Cited Knowledge Retrieval")

        print("=======================================================")
        print("         ALL LORE BACKEND CORE TESTS PASSED!           ")
        print("=======================================================")

if __name__ == "__main__":
    unittest.main()
