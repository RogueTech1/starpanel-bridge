param([switch]$Demo)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $taskNode) {throw 'Node.js 22 or newer is required.'}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/electron/dist/electron.exe'))) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) {throw 'Dependency setup failed.'}
    & node node_modules/electron/install.js
    if ($LASTEXITCODE -ne 0) {throw 'Electron setup failed.'}
}
# Electron is a desktop app here, even when launched from an Electron-hosted terminal.
$previousElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    $taskElectron = Join-Path $PSScriptRoot 'node_modules/electron/dist/electron.exe'
    $taskArguments = @('"' + (Join-Path $PSScriptRoot 'desktop/main.cjs') + '"')
    if ($Demo) {$taskArguments += '--demo'}
    Start-Process -FilePath $taskElectron -ArgumentList $taskArguments -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
} finally {
    if ($null -ne $previousElectronMode) {$env:ELECTRON_RUN_AS_NODE = $previousElectronMode}
}
