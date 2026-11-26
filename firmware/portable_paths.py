"""Keep local workstation paths out of firmware diagnostics/debug metadata."""
Import("env")
from pathlib import Path

home = str(Path.home()).replace("\\", "/")
env.Append(CCFLAGS=["-ffile-prefix-map=" + home + "=/build/home"])
