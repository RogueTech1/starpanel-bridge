param([string]$Version='8.30.1')
$ErrorActionPreference='Stop'
if($Version -notmatch '^\d+\.\d+\.\d+$'){throw 'Invalid scanner version'}
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskTools=Join-Path $taskRoot '.tools/gitleaks'
New-Item -ItemType Directory -Force -Path $taskTools|Out-Null
$taskName="gitleaks_${Version}_windows_x64.zip"
$taskBase="https://github.com/gitleaks/gitleaks/releases/download/v$Version"
$taskZip=Join-Path $taskTools $taskName
$taskSums=Join-Path $taskTools 'checksums.txt'
Invoke-WebRequest -Uri "$taskBase/$taskName" -OutFile $taskZip -UseBasicParsing
Invoke-WebRequest -Uri "$taskBase/gitleaks_${Version}_checksums.txt" -OutFile $taskSums -UseBasicParsing
$taskLine=(Get-Content -LiteralPath $taskSums|Where-Object {$_ -match ([regex]::Escape($taskName)+'$')})
if(!$taskLine){throw 'Scanner checksum entry missing'}
$taskExpected=($taskLine -split '\s+')[0]
if((Get-FileHash -LiteralPath $taskZip -Algorithm SHA256).Hash -ne $taskExpected){throw 'Scanner checksum mismatch'}
Expand-Archive -LiteralPath $taskZip -DestinationPath $taskTools -Force
Push-Location -LiteralPath $taskRoot
try{& (Join-Path $taskTools 'gitleaks.exe') git . --redact --no-banner;if($LASTEXITCODE -ne 0){throw 'Secret scan needs review'}}finally{Pop-Location}
