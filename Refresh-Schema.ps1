param([ValidateSet('LIVE','PTU')][string]$Channel='LIVE',
      [string]$GameExe='')
$ErrorActionPreference='Stop'
if(!$GameExe){$GameExe=Join-Path ('C:\Program Files\Roberts Space Industries\StarCitizen\'+$Channel) 'Bin64/StarCitizen.exe'}
if(!(Test-Path -LiteralPath $GameExe)){throw 'Game executable not found. Supply -GameExe.'}
$taskExtractor=Join-Path $PSScriptRoot 'vendor/sc-telemetry-deck/tools/sc_extract_proto.py'
if(!(Test-Path -LiteralPath $taskExtractor)){throw 'Clone the pinned sc-telemetry-deck research checkout under vendor first. See docs/DEVELOPMENT.md.'}
$taskDir=Join-Path $PSScriptRoot $(if($Channel -eq 'LIVE'){'schema/live'}else{'schema'})
New-Item -ItemType Directory -Force -Path $taskDir|Out-Null
$taskDesc=Join-Path $taskDir $(if($Channel -eq 'LIVE'){'sc_extrait.desc'}else{'local.desc'})
$taskProto=Join-Path $taskDir $(if($Channel -eq 'LIVE'){'sc_extrait.proto'}else{'local.proto'})
foreach($taskFile in @($taskDesc,$taskProto)){if(Test-Path -LiteralPath $taskFile){Copy-Item -LiteralPath $taskFile -Destination ($taskFile+'.bak') -Force}}
Push-Location -LiteralPath $taskDir
try{
 & uv run --with protobuf python $taskExtractor $GameExe
 if($LASTEXITCODE -ne 0){throw 'Descriptor extraction failed'}
 if($Channel -eq 'PTU'){
  Move-Item -LiteralPath sc_extrait.desc -Destination $taskDesc -Force
  Move-Item -LiteralPath sc_extrait.proto -Destination $taskProto -Force
 }
}finally{Pop-Location}
$taskMetadata=@{fileVersion=[Diagnostics.FileVersionInfo]::GetVersionInfo($GameExe).FileVersion;descriptorSha256=(Get-FileHash -LiteralPath $taskDesc -Algorithm SHA256).Hash;extractedUtc=[DateTime]::UtcNow.ToString('o');method='Read-only descriptor extraction from executable on disk'}
$taskMetadata|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $taskDir 'extraction.metadata.json')
Push-Location -LiteralPath $PSScriptRoot
try{
 & node (Join-Path $PSScriptRoot 'scripts/catalog-schema.mjs') $taskDesc (Join-Path $taskDir 'field-catalog.json')
 if($LASTEXITCODE -ne 0){throw 'Catalog generation failed'}
}finally{Pop-Location}
Write-Host "Updated $Channel interoperability definitions. Review the diff and run tests before distributing. No game process memory or executable was modified."
