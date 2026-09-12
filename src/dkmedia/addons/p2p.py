from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def available() -> bool:
    return shutil.which("aria2c") is not None


def add_magnet(uri: str, output_dir: str | Path) -> subprocess.Popen[str]:
    exe = shutil.which("aria2c")
    if not exe:
        raise RuntimeError("P2P add-on requires aria2c. Install 'aria2'.")
    destination = Path(output_dir).expanduser()
    destination.mkdir(parents=True, exist_ok=True)
    return subprocess.Popen(
        [exe, "--dir", str(destination), "--seed-time=0", uri],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
