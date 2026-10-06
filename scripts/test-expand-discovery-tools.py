import importlib.util
import os
import tempfile
import unittest
from pathlib import Path


script_path = Path(__file__).with_name("expand-discovery-tools.py")
loader = importlib.util.spec_from_file_location("expand_discovery_tools", script_path)
module = importlib.util.module_from_spec(loader)
loader.loader.exec_module(module)


class ExpandDiscoveryTests(unittest.TestCase):
    def test_exact_workspace_expands_only_scope_and_preserves_bearer(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bot.env"
            original = ("SLACK_BOT_TOKEN=other\nVIKTOR_DISCOVERY_TOKEN=" + ("Ab_-" * 16)
                        + "\nVIKTOR_DISCOVERY_WORKSPACE_ID=ws_test\n"
                        + "VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n")
            path.write_text(original)
            os.chmod(path, 0o600)
            module.expand(path, "ws_test")
            updated = path.read_text()
            self.assertEqual(updated.replace("VIKTOR_DISCOVERY_ALLOWED_TOOLS=*\n",
                                             "VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n"), original)
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ValueError):
                module.expand(path, "ws_test")

    def test_wrong_workspace_and_symlink_leave_file_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bot.env"
            path.write_text("VIKTOR_DISCOVERY_TOKEN=" + "b" * 64
                            + "\nVIKTOR_DISCOVERY_WORKSPACE_ID=ws_test\n"
                            + "VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n")
            os.chmod(path, 0o600)
            before = path.read_bytes()
            with self.assertRaises(ValueError):
                module.expand(path, "ws_other")
            link = Path(directory) / "link.env"
            link.symlink_to(path)
            with self.assertRaises(OSError):
                module.expand(link, "ws_test")
            self.assertEqual(path.read_bytes(), before)

    def test_shared_bearer_and_concurrent_provisioning_are_refused(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bot.env"
            token = "b" * 64
            path.write_text(f"SLACK_BOT_TOKEN={token}\nVIKTOR_DISCOVERY_TOKEN={token}\n"
                            "VIKTOR_DISCOVERY_WORKSPACE_ID=ws_test\n"
                            "VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n")
            os.chmod(path, 0o600)
            original = path.read_bytes()
            with self.assertRaises(ValueError):
                module.expand(path, "ws_test")
            self.assertEqual(path.read_bytes(), original)
            path.write_text(path.read_text().replace(f"SLACK_BOT_TOKEN={token}", "SLACK_BOT_TOKEN=other"))
            lock = Path(str(path) + ".viktor.lock")
            lock.mkdir()
            with self.assertRaises(FileExistsError):
                module.expand(path, "ws_test")
            self.assertIn(b"VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings", path.read_bytes())


if __name__ == "__main__":
    unittest.main()
