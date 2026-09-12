from __future__ import annotations

import sys
from pathlib import Path
from typing import Callable


class VLCUnavailable(RuntimeError):
    """Raised when python-vlc or the system libVLC runtime is unavailable."""


class VLCMediaController:
    """Linux-first libVLC playback controller recovered from DK Media."""

    def __init__(self, log: Callable[[str], None] | None = None):
        self.log = log or (lambda _message: None)
        try:
            import vlc  # type: ignore
        except Exception as exc:
            raise VLCUnavailable(
                "python-vlc could not load libVLC. Install 'vlc' and 'python3-vlc'."
            ) from exc
        self.vlc = vlc
        self.instance = vlc.Instance("--no-video-title-show", "--quiet")
        if self.instance is None:
            raise VLCUnavailable("libVLC could not create a playback instance.")
        self.player = self.instance.media_player_new()
        self.current_path: Path | None = None
        self.current_media = None

    def set_output_window(self, native_id: int) -> None:
        if sys.platform.startswith("win"):
            self.player.set_hwnd(int(native_id))
        elif sys.platform == "darwin":
            self.player.set_nsobject(int(native_id))
        else:
            self.player.set_xwindow(int(native_id))
        try:
            self.player.video_set_mouse_input(False)
            self.player.video_set_key_input(False)
        except Exception:
            pass

    def load(self, path: str | Path, native_id: int | None = None, autoplay: bool = True) -> None:
        media_path = Path(path).expanduser().resolve()
        if not media_path.exists():
            raise FileNotFoundError(media_path)
        media = self.instance.media_new_path(str(media_path))
        self.current_media = media
        self.player.set_media(media)
        self.current_path = media_path
        if native_id is not None:
            self.set_output_window(native_id)
        if autoplay:
            self.player.play()
        self.log(f"Media loaded: {media_path}")

    def play(self) -> None:
        self.player.play()

    def pause_toggle(self) -> None:
        if self.player.get_state() == self.vlc.State.Paused:
            self.player.set_pause(0)
        elif self.player.is_playing():
            self.player.set_pause(1)
        else:
            self.player.play()

    def stop(self) -> None:
        self.player.stop()

    def pause(self) -> None:
        self.player.set_pause(1)

    def next_frame(self) -> None:
        self.player.next_frame()

    def get_time_ms(self) -> int:
        value = self.player.get_time()
        return max(0, int(value if value is not None else 0))

    def get_length_ms(self) -> int:
        value = self.player.get_length()
        return max(0, int(value if value is not None else 0))

    def set_time_ms(self, value: int) -> bool:
        length = self.get_length_ms()
        if length <= 0:
            return False
        target = max(0, min(int(value), max(0, length - 1)))
        result = self.player.set_time(target)
        return result in (None, 0)

    def seek_relative(self, seconds: int) -> bool:
        return self.set_time_ms(self.get_time_ms() + int(seconds * 1000))

    def seek_relative_ms(self, milliseconds: int) -> bool:
        return self.set_time_ms(self.get_time_ms() + int(milliseconds))

    def set_volume(self, value: int) -> None:
        self.player.audio_set_volume(max(0, min(200, int(value))))

    def set_rate(self, rate: float) -> None:
        self.player.set_rate(float(rate))

    def set_aspect(self, aspect: str) -> None:
        clean = aspect.strip()
        self.player.video_set_aspect_ratio(None if clean in ("Fit", "Original", "") else clean)

    @staticmethod
    def _track_name(value) -> str:
        return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else str(value)

    def audio_tracks(self) -> list[tuple[int, str]]:
        return [(int(i), self._track_name(n)) for i, n in (self.player.audio_get_track_description() or [])]

    def subtitle_tracks(self) -> list[tuple[int, str]]:
        return [(int(i), self._track_name(n)) for i, n in (self.player.video_get_spu_description() or [])]

    def set_audio_track(self, track_id: int) -> bool:
        return self.player.audio_set_track(int(track_id)) == 0

    def set_subtitle_track(self, track_id: int) -> bool:
        return self.player.video_set_spu(int(track_id)) == 0

    def add_subtitle(self, path: str | Path) -> bool:
        subtitle_path = Path(path).expanduser().resolve()
        if not subtitle_path.exists():
            return False
        add_slave = getattr(self.player, "add_slave", None)
        if callable(add_slave):
            slave_type = getattr(self.vlc.MediaSlaveType, "subtitle", 0)
            try:
                return add_slave(slave_type, subtitle_path.as_uri(), True) == 0
            except Exception:
                pass
        fallback = getattr(self.player, "video_set_subtitle_file", None)
        return bool(callable(fallback) and fallback(str(subtitle_path)) == 0)

    def set_audio_delay_us(self, value: int) -> None:
        self.player.audio_set_delay(int(value))

    def set_subtitle_delay_us(self, value: int) -> None:
        self.player.video_set_spu_delay(int(value))

    def snapshot(self, path: str | Path) -> bool:
        destination = Path(path).expanduser().resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        return self.player.video_take_snapshot(0, str(destination), 0, 0) == 0

    def release(self) -> None:
        try:
            self.player.stop()
            self.player.release()
            self.instance.release()
        except Exception:
            pass
