param([ValidateSet('PTU', 'LIVE')][string]$Channel = 'LIVE',
      [string]$GameRoot = 'C:\Program Files\Roberts Space Industries\StarCitizen')
$ErrorActionPreference = 'Stop'
$taskChannelDir = Join-Path $GameRoot $Channel
if (-not (Test-Path -LiteralPath (Join-Path $taskChannelDir 'Bin64\StarCitizen.exe'))) {throw 'Game executable not found. Supply -GameRoot.'}
if ($Channel -eq 'LIVE') {
    [Environment]::SetEnvironmentVariable('GRPC_CLIENT_SERVER_ENABLED', 'true', 'User')
    Write-Host 'Enabled the documented 4.10.3 environment variable. Completely exit and restart the RSI launcher to inherit it. Availability depends on your game build.'
} else {
    $taskCfg = Join-Path $taskChannelDir 'user.cfg'
    $taskContent = if (Test-Path -LiteralPath $taskCfg) {Get-Content -LiteralPath $taskCfg -Raw} else {''}
    if (Test-Path -LiteralPath $taskCfg) {Copy-Item -LiteralPath $taskCfg -Destination ($taskCfg + '.bridge-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))}
    $taskContent = [regex]::Replace([string]$taskContent, '(?im)^\s*server\.game\.telemetry\.enabled\s*=?\s*[^\r\n]*', '')
    [IO.File]::WriteAllText($taskCfg, $taskContent.TrimEnd() + "`r`nserver.game.telemetry.enabled=1`r`n", [Text.UTF8Encoding]::new($false))
    Write-Host 'Added the telemetry setting with a backup if user.cfg existed. Restart the game when convenient. A disabled game build may ignore it.'
}
