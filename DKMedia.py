#!/usr/bin/env python3
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
os.environ["PYTHONPATH"] = str(SRC) + os.pathsep + os.environ.get("PYTHONPATH", "")
sys.path.insert(0, str(SRC))

from dkmedia.__main__ import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
