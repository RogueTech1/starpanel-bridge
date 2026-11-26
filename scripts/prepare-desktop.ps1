$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
if(!(Get-Command uv -ErrorAction SilentlyContinue)){throw 'Install uv, then rerun. See docs/REPRODUCING.md.'}
Push-Location -LiteralPath $taskRoot
try{
 & node scripts/verify-images.mjs
 if($LASTEXITCODE -ne 0){throw 'Bundled image verification failed'}
 & uv run --with platformio pio pkg install --global --tool 'platformio/tool-avrdude@~1.60300.0'
 if($LASTEXITCODE -ne 0){throw 'AVR uploader package setup failed'}
 & node scripts/prepare-tools.mjs
 if($LASTEXITCODE -ne 0){throw 'AVR uploader copy failed'}
}finally{Pop-Location}
