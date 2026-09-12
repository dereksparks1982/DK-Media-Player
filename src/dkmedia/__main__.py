from __future__ import annotations

import traceback

from .app import main


def _show_startup_error(message: str) -> None:
    try:
        import tkinter as tk
        from tkinter import messagebox

        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("DK Media", message)
        root.destroy()
    except Exception:
        print(message)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        detail = traceback.format_exc()
        _show_startup_error("DK Media failed to start.\n\n" + detail)
        raise
