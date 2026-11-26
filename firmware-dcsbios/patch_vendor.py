"""Remove an identical duplicate definition in the pinned vendor fork.

Applied only to PlatformIO's downloaded dependency, never the user's installed
Arduino library. Fail if the source changes unexpectedly.
"""
Import("env")
from pathlib import Path
import re

def fix(*args, **kwargs):
    root = Path(env.subst("$PROJECT_LIBDEPS_DIR")) / env.subst("$PIOENV")
    for source in root.glob("*/src/internal/DcsBiosNgRS485Slave.cpp.inc"):
        text = source.read_text(encoding="utf-8")
        function = r"\s*void resetAllStates\(\)\s*\{\s*PollingInput::resetAllStates\(\);\s*\}"
        matches = list(re.finditer(function, text))
        if len(matches) == 2:
            duplicate = matches[1]
            source.write_text(text[:duplicate.start()] + text[duplicate.end():], encoding="utf-8")
            print("Applied documented duplicate resetAllStates build fix:", source)
        elif len(matches) != 1:
            raise RuntimeError("Unexpected vendor source; review duplicate-definition patch")
fix()
env.AddPreAction("$BUILD_DIR/src/master.cpp.o", fix)
env.AddPreAction("$BUILD_DIR/src/configured.cpp.o", fix)
