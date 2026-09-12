from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Callable


def available() -> bool:
    return shutil.which("yt-dlp") is not None


def download(url: str, output_dir: str | Path, audio_only: bool, log: Callable[[str], None]) -> int:
    exe = shutil.which("yt-dlp")
    if not exe:
        raise RuntimeError("yt-dlp is not installed. Install the 'yt-dlp' package first.")
    destination = Path(output_dir).expanduser()
    destination.mkdir(parents=True, exist_ok=True)
    cmd = [exe, "--newline", "--write-subs", "--write-auto-subs", "-P", str(destination)]
    if audio_only:
        cmd += ["-x", "--audio-format", "mp3"]
    else:
        cmd += ["-f", "bv*+ba/b", "--merge-output-format", "mkv"]
    cmd.append(url)
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    assert process.stdout is not None
    for line in process.stdout:
        log(line.rstrip())
    return int(process.wait())
