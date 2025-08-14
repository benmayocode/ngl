# services/nodes/__init__.py
from importlib import import_module
from pkgutil import iter_modules
import pathlib

def load_builtin_nodes():
    pkg = __name__
    pkg_path = pathlib.Path(__file__).parent
    for m in iter_modules([str(pkg_path)]):
        if not m.ispkg and m.name not in ("base", "__init__"):
            import_module(f"{pkg}.{m.name}")
