from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Callable

from .paths import default_media_directory


def choose_file_native(
    *,
    title: str = "Open file",
    initial_dir: str | Path | None = None,
    fallback: Callable[..., str] | None = None,
) -> str:
    """Choose a file while avoiding Tk's bad Linux default path.

    Prefer zenity when available because it shows mounted drives clearly in GNOME.
    Fall back to Tk with an explicit initialdir, never bare /media.
    """
    start = Path(initial_dir).expanduser() if initial_dir else default_media_directory()
    try:
        start = start if start.is_dir() else start.parent
    except OSError:
        start = default_media_directory()

    zenity = shutil.which("zenity")
    if zenity:
        filename = str(start) + "/"
        try:
            result = subprocess.run(
                [zenity, "--file-selection", f"--title={title}", f"--filename={filename}"],
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
            )
            if result.returncode == 0:
                return result.stdout.strip()
            return ""
        except OSError:
            pass

    if fallback:
        try:
            return fallback(title=title, initialdir=str(start)) or ""
        except TypeError:
            return fallback(title=title) or ""
    return ""
