# DK Media v0.1.11 Public Preservation Release

This repository is a runnable public packaging of the original DK Media v0.1.11 source recovered from the supplied historical archive.

Public-release changes are deliberately narrow: the embedded personal SubDL API credential was removed, machine-specific launcher paths were replaced with portable Linux launchers, and Ubuntu/Debian install and package-building support was added.

The original player behavior and UI were not redesigned. The supplied historical preservation bundle, kept separately from this lean GitHub tree, contains the original documentation, regression tests, and compiled ELF launcher.

The GitHub-upload connector has per-write text limits, so the three largest original Python modules are reconstructed at import time from ordered source fragments. The resulting layout was validated with `python3 -m dkmedia --help`, direct module imports, and Python `compileall` before publication.
