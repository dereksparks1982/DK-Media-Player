from __future__ import annotations

import os
from pathlib import Path

EXT_LABEL = "3T EXT"
EXT_ENV_VAR = "DKMEDIA_EXT_PATH"
EXPECTED_EXT_PATH = Path("/run/media/dereksparks1982/3T EXT")
MEDIA_EXTENSIONS = {
    ".3gp", ".aac", ".aiff", ".avi", ".flac", ".flv", ".m4a", ".m4v",
    ".mkv", ".mov", ".mp3", ".mp4", ".mpeg", ".mpg", ".ogg", ".ogv",
    ".opus", ".ts", ".wav", ".webm", ".wmv",
}
SUBTITLE_EXTENSIONS = {".srt", ".ass", ".ssa", ".sub", ".vtt"}
ENGLISH_SUBTITLE_MARKERS = {"en", "eng", "english"}


def _valid_dir(path: Path) -> Path | None:
    try:
        expanded = path.expanduser()
        if expanded.exists() and expanded.is_dir():
            return expanded.resolve()
    except OSError:
        return None
    return None


def find_ext_drive() -> Path | None:
    """Return Derek's external media drive when it is mounted.

    The common path is hard-wired because the first priority is an obvious EXT
    button for this machine. A small fallback search keeps the build usable if
    the user name or mount base changes later.
    """
    env_value = os.environ.get(EXT_ENV_VAR, "").strip()
    if env_value:
        found = _valid_dir(Path(env_value))
        if found:
            return found

    found = _valid_dir(EXPECTED_EXT_PATH)
    if found:
        return found

    for base in (Path("/run/media"), Path("/media")):
        try:
            candidates = list(base.glob(f"*/{EXT_LABEL}")) + list(base.glob(EXT_LABEL))
        except OSError:
            candidates = []
        for candidate in candidates:
            found = _valid_dir(candidate)
            if found:
                return found
    return None


def default_media_directory() -> Path:
    return find_ext_drive() or Path.home()


def is_media_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in MEDIA_EXTENSIONS


def is_subtitle_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in SUBTITLE_EXTENSIONS

def find_matching_subtitle(media_path: str | Path) -> Path | None:
    """Return the safest matching subtitle beside a media file.

    Exact same-stem files are preferred, followed by English-tagged variants
    such as ``episode.en.srt`` or ``episode.english.ass``. Explicitly
    different-language variants are not guessed or auto-selected.
    """
    media = Path(media_path).expanduser()
    try:
        media = media.resolve()
        directory = media.parent
        if not directory.exists() or not directory.is_dir():
            return None
        subtitles = sorted(
            (candidate for candidate in directory.iterdir() if is_subtitle_file(candidate)),
            key=lambda candidate: candidate.name.casefold(),
        )
    except OSError:
        return None

    media_stem = media.stem.casefold()
    exact = [candidate for candidate in subtitles if candidate.stem.casefold() == media_stem]
    if exact:
        return exact[0]

    english: list[Path] = []
    for candidate in subtitles:
        candidate_stem = candidate.stem.casefold()
        if not candidate_stem.startswith(media_stem):
            continue
        remainder = candidate_stem[len(media_stem):]
        if not remainder or remainder[0] not in ".-_ []()":
            continue
        normalised = remainder
        for separator in ".-_[]()":
            normalised = normalised.replace(separator, " ")
        markers = {part for part in normalised.split() if part}
        if markers & ENGLISH_SUBTITLE_MARKERS:
            english.append(candidate)
    return english[0] if english else None

