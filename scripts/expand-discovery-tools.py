#!/usr/bin/env python3
import os
import re
import stat
import sys
import tempfile
from pathlib import Path


def expand(path: Path, workspace: str) -> None:
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        metadata = os.fstat(descriptor)
        if not stat.S_ISREG(metadata.st_mode) or stat.S_IMODE(metadata.st_mode) != 0o600 or metadata.st_uid != os.geteuid():
            raise ValueError("discovery environment must be owned by this user, regular and 0600")
        contents = os.read(descriptor, 65537).decode("utf-8")
        if len(contents) > 65536:
            raise ValueError("discovery environment too large")
    finally:
        os.close(descriptor)
    if not re.fullmatch(r"[A-Za-z0-9_-]+", workspace):
        raise ValueError("invalid workspace")
    if contents.count(f"VIKTOR_DISCOVERY_WORKSPACE_ID={workspace}\n") != 1:
        raise ValueError("discovery workspace mismatch")
    if len(re.findall(r"^VIKTOR_DISCOVERY_TOKEN=[0-9a-f]{64}$", contents, re.MULTILINE)) != 1:
        raise ValueError("dedicated discovery bearer is missing or malformed")
    if contents.count("VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n") != 1:
        raise ValueError("expected read-only discovery scope not found exactly once")
    updated = contents.replace("VIKTOR_DISCOVERY_ALLOWED_TOOLS=read_learnings\n", "VIKTOR_DISCOVERY_ALLOWED_TOOLS=*\n")
    descriptor, temporary = tempfile.mkstemp(prefix=".viktor-discovery-", dir=path.parent)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            output.write(updated)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print("workspace discovery expanded (0600; bearer unchanged)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: expand-discovery-tools.py ENV_FILE WORKSPACE_ID")
    expand(Path(sys.argv[1]), sys.argv[2])
