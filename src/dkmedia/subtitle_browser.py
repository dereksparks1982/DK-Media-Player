from __future__ import annotations

from pathlib import Path as _Path

_parts = _Path(__file__).with_name("_subtitle_browser_fragments")
_source = "".join(path.read_text(encoding="utf-8") for path in sorted(_parts.glob("part*.pyfrag")))
exec(compile(_source, str(_Path(__file__).with_name("subtitle_browser_original.py")), "exec"), globals(), globals())
del _source, _parts, _Path
