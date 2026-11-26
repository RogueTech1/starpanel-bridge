param([string]$LauncherPath = 'C:\Program Files\Roberts Space Industries\RSI Launcher\RSI Launcher.exe')
$ErrorActionPreference='Stop'
if(Get-Process StarCitizen -ErrorAction SilentlyContinue){throw 'Safely exit Star Citizen first. The running game cannot inherit a new startup environment.'}
if(-not(Test-Path -LiteralPath $LauncherPath)){throw 'RSI Launcher not found; supply -LauncherPath.'}
[Environment]::SetEnvironmentVariable('GRPC_CLIENT_SERVER_ENABLED','true','User')
[Environment]::SetEnvironmentVariable('SERVER_GAME_TELEMETRY_ENABLED','true','User')
$taskLauncherProcesses=Get-CimInstance Win32_Process -Filter "Name='RSI Launcher.exe'" | Where-Object {$_.ExecutablePath -eq $LauncherPath}
foreach($taskLauncherProcess in $taskLauncherProcesses){Stop-Process -Id $taskLauncherProcess.ProcessId -ErrorAction SilentlyContinue}
$taskStart=[Diagnostics.ProcessStartInfo]::new()
$taskStart.FileName=$LauncherPath
$taskStart.WorkingDirectory=Split-Path -Parent $LauncherPath
$taskStart.UseShellExecute=$false
$taskStart.EnvironmentVariables['GRPC_CLIENT_SERVER_ENABLED']='true'
$taskStart.EnvironmentVariables['SERVER_GAME_TELEMETRY_ENABLED']='true'
[Diagnostics.Process]::Start($taskStart)|Out-Null
Write-Host 'RSI Launcher started with GRPC_CLIENT_SERVER_ENABLED=true and SERVER_GAME_TELEMETRY_ENABLED=true. Start the desired game channel and spawn your character.'
