$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskCompiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
& $taskCompiler /nologo /target:exe /platform:anycpu (('/out:')+(Join-Path $taskRoot 'native/StarPanelKeyboard.exe')) (Join-Path $taskRoot 'native/Keyboard.cs')
if($LASTEXITCODE -ne 0){throw 'Native keyboard helper build failed'}
& (Join-Path $taskRoot 'native/StarPanelKeyboard.exe') --self-test
if($LASTEXITCODE -ne 0){throw 'Native keyboard helper self-test failed'}
