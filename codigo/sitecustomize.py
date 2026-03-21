"""
sitecustomize.py
Politica global de cache Python para a pasta `codigo`.
"""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
GLOBAL_PYCACHE_DIR = Path(tempfile.gettempdir()) / "esi_python_cache"


def _apply_python_cache_policy():
    GLOBAL_PYCACHE_DIR.mkdir(parents=True, exist_ok=True)

    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    os.environ.setdefault("PYTHONPYCACHEPREFIX", str(GLOBAL_PYCACHE_DIR))

    sys.dont_write_bytecode = True

    if hasattr(sys, "pycache_prefix"):
        sys.pycache_prefix = str(GLOBAL_PYCACHE_DIR)


def _cleanup_local_pycache_dirs():
    for pycache_dir in PROJECT_ROOT.rglob("__pycache__"):
        shutil.rmtree(pycache_dir, ignore_errors=True)

    for pattern in ("*.pyc", "*.pyo"):
        for cache_file in PROJECT_ROOT.rglob(pattern):
            try:
                cache_file.unlink()
            except FileNotFoundError:
                pass


_apply_python_cache_policy()
_cleanup_local_pycache_dirs()
