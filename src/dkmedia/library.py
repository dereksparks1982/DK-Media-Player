from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .paths import default_media_directory

APP_DIR = Path.home() / ".local" / "share" / "dkmedia"
STATE_FILE = APP_DIR / "state.json"


class MediaState:
    def __init__(self) -> None:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        self.data: dict[str, Any] = {
            "recent": [],
            "resume_ms": {},
            "media_preferences": {},
            "settings": {},
            "downloads": str(Path.home() / "Downloads" / "DK Media"),
            "last_media_dir": str(default_media_directory()),
            "last_subtitle_dir": str(default_media_directory()),
            "volume": 100,
        }
        self.load()

    def load(self) -> None:
        try:
            loaded = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                self.data.update(loaded)
        except (OSError, ValueError, TypeError):
            pass

    def save(self) -> None:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        temporary = STATE_FILE.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.data, indent=2), encoding="utf-8")
        temporary.chmod(0o600)
        temporary.replace(STATE_FILE)

    def remember(self, path: str, position_ms: int | None = None) -> None:
        recent = [item for item in self.data.get("recent", []) if item != path]
        self.data["recent"] = [path, *recent][:50]
        if position_ms is not None and position_ms >= 0:
            self.data.setdefault("resume_ms", {})[path] = int(position_ms)
        self.save()

    def resume_position(self, path: str) -> int:
        return int(self.data.get("resume_ms", {}).get(path, 0))

    def media_preference(self, path: str, key: str, default: Any = None) -> Any:
        return self.data.get("media_preferences", {}).get(path, {}).get(key, default)

    def set_media_preference(self, path: str, key: str, value: Any) -> None:
        media = self.data.setdefault("media_preferences", {}).setdefault(path, {})
        media[key] = value
        self.save()

    def setting(self, key: str, default: Any = None) -> Any:
        return self.data.get("settings", {}).get(key, default)

    def set_setting(self, key: str, value: Any) -> None:
        settings = self.data.setdefault("settings", {})
        if value in (None, ""):
            settings.pop(key, None)
        else:
            settings[key] = value
        self.save()

    def subtitle_cache_directory(self) -> Path:
        directory = APP_DIR / "subtitles"
        directory.mkdir(parents=True, exist_ok=True)
        return directory

    def volume(self) -> int:
        try:
            return max(0, min(200, int(self.data.get("volume", 100))))
        except (TypeError, ValueError):
            return 100

    def set_volume(self, value: int) -> None:
        self.data["volume"] = max(0, min(200, int(value)))
        self.save()

    def last_directory(self, key: str) -> str:
        value = self.data.get(key, str(Path.home()))
        path = Path(str(value)).expanduser()
        if not path.exists() or not path.is_dir():
            return str(default_media_directory())
        return str(path)

    def remember_directory(self, key: str, file_path: str) -> None:
        path = Path(file_path).expanduser()
        directory = path if path.is_dir() else path.parent
        if directory.exists():
            self.data[key] = str(directory.resolve())
            self.save()
