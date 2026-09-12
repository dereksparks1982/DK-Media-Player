from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import tkinter as tk
from tkinter import messagebox

from .paths import is_media_file


@dataclass(frozen=True)
class BrowserItem:
    label: str
    path: Path
    is_dir: bool


class MediaBrowserDialog(tk.Toplevel):
    """Simple in-app media browser so external drives do not depend on Tk file picker quirks."""

    def __init__(self, parent: tk.Misc, start_dir: Path, title: str = "EXT") -> None:
        super().__init__(parent)
        self.title(title)
        self.geometry("900x620")
        self.minsize(720, 460)
        self.configure(bg="#171719")
        self.result: str | None = None
        self.current_dir = start_dir.expanduser().resolve()
        self.items: list[BrowserItem] = []

        header = tk.Frame(self, bg="#242428")
        header.pack(fill="x")
        tk.Label(header, text="EXT", font=("TkDefaultFont", 18, "bold"), bg="#242428", fg="#f0f0f4").pack(side="left", padx=(12, 8), pady=8)
        self.path_var = tk.StringVar(value=str(self.current_dir))
        tk.Label(header, textvariable=self.path_var, bg="#242428", fg="#d7d7de", anchor="w").pack(side="left", fill="x", expand=True, padx=8)

        nav = tk.Frame(self, bg="#171719")
        nav.pack(fill="x", padx=12, pady=(10, 4))
        self._button(nav, "Up", self._go_up).pack(side="left", padx=(0, 6))
        self._button(nav, "EXT Root", lambda: self._set_dir(start_dir)).pack(side="left", padx=6)
        self._button(nav, "Open Selected", self._open_selected).pack(side="right", padx=6)
        self._button(nav, "Cancel", self._cancel).pack(side="right", padx=6)

        body = tk.Frame(self, bg="#171719")
        body.pack(fill="both", expand=True, padx=12, pady=8)
        scrollbar = tk.Scrollbar(body)
        scrollbar.pack(side="right", fill="y")
        self.listbox = tk.Listbox(
            body,
            bg="#202024",
            fg="white",
            selectbackground="#6b3fb5",
            activestyle="none",
            font=("TkDefaultFont", 13),
            yscrollcommand=scrollbar.set,
        )
        self.listbox.pack(side="left", fill="both", expand=True)
        scrollbar.configure(command=self.listbox.yview)
        self.listbox.bind("<Double-Button-1>", lambda _event: self._open_selected())
        self.listbox.bind("<Return>", lambda _event: self._open_selected())
        self.listbox.bind("<BackSpace>", lambda _event: self._go_up())
        self.bind("<Escape>", lambda _event: self._cancel())

        hint = "Double-click a folder to enter it. Double-click a media file to play it. Backspace goes up."
        tk.Label(self, text=hint, bg="#101012", fg="#aaaab0", anchor="w").pack(fill="x")

        self.transient(parent)
        self.grab_set()
        self._refresh()
        self.listbox.focus_set()

    def _button(self, parent: tk.Misc, text: str, command) -> tk.Button:
        return tk.Button(parent, text=text, command=command, bg="#4b4b52", fg="white", activebackground="#6b3fb5", relief="flat", padx=12, pady=5)

    def _set_dir(self, path: Path) -> None:
        try:
            resolved = path.expanduser().resolve()
        except OSError as exc:
            messagebox.showerror("DK Media", str(exc), parent=self)
            return
        if not resolved.exists() or not resolved.is_dir():
            messagebox.showwarning("DK Media", f"Folder not available:\n{resolved}", parent=self)
            return
        self.current_dir = resolved
        self._refresh()

    def _go_up(self) -> None:
        parent = self.current_dir.parent
        if parent != self.current_dir:
            self._set_dir(parent)

    def _refresh(self) -> None:
        self.path_var.set(str(self.current_dir))
        self.listbox.delete(0, tk.END)
        self.items = []
        try:
            entries = list(self.current_dir.iterdir())
        except OSError as exc:
            messagebox.showerror("DK Media", str(exc), parent=self)
            return

        dirs = [entry for entry in entries if entry.is_dir() and not entry.name.startswith(".")]
        files = [entry for entry in entries if is_media_file(entry)]
        for entry in sorted(dirs, key=lambda p: p.name.lower()):
            self.items.append(BrowserItem(f"📁  {entry.name}", entry, True))
        for entry in sorted(files, key=lambda p: p.name.lower()):
            self.items.append(BrowserItem(f"▶  {entry.name}", entry, False))

        if not self.items:
            self.listbox.insert(tk.END, "No media files in this folder. Use Up or EXT Root.")
            return
        for item in self.items:
            self.listbox.insert(tk.END, item.label)
        self.listbox.selection_set(0)

    def _open_selected(self) -> None:
        selection = self.listbox.curselection()
        if not selection or selection[0] >= len(self.items):
            return
        item = self.items[selection[0]]
        if item.is_dir:
            self._set_dir(item.path)
            return
        self.result = str(item.path.resolve())
        self.destroy()

    def _cancel(self) -> None:
        self.result = None
        self.destroy()


def choose_media_from_directory(parent: tk.Misc, start_dir: Path, title: str = "EXT") -> str:
    dialog = MediaBrowserDialog(parent, start_dir, title=title)
    parent.wait_window(dialog)
    return dialog.result or ""
