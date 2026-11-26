param([Parameter(Mandatory=$true)][string]$Ssid)
$ErrorActionPreference='Stop'
if((Get-NetAdapter -Name 'Wi-Fi').Status -eq 'Up'){throw 'Wi-Fi is already connected; leave the active connection unchanged'}
$taskFile=Join-Path $env:TEMP 'starpanel-setup-test.xml'
$taskXml=@'
<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1"><name>StarPanelSetupTest</name><SSIDConfig><SSID><name>__SSID__</name></SSID></SSIDConfig><connectionType>ESS</connectionType><connectionMode>manual</connectionMode><MSM><security><authEncryption><authentication>WPA2PSK</authentication><encryption>AES</encryption><useOneX>false</useOneX></authEncryption><sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>StarPanel123</keyMaterial></sharedKey></security></MSM></WLANProfile>
'@
$taskXml.Replace('__SSID__',[Security.SecurityElement]::Escape($Ssid))|Set-Content -LiteralPath $taskFile
try{
 netsh wlan add profile filename="$taskFile" user=current
 netsh wlan connect name=StarPanelSetupTest ssid="$Ssid"
 $taskResponse=$null
 for($attempt=0;$attempt -lt 10;$attempt++){
  Start-Sleep -Seconds 1
  try{$taskResponse=Invoke-WebRequest -Uri 'http://192.168.4.1/' -TimeoutSec 2 -UseBasicParsing;break}catch{}
 }
 if(!$taskResponse){throw 'Setup HTTP page did not respond'}
 $taskOut=Join-Path (Split-Path $PSScriptRoot -Parent) 'validation/wifi-setup-page.html'
 $taskResponse.Content|Set-Content -LiteralPath $taskOut
 [pscustomobject]@{status=$taskResponse.StatusCode;hasWifiForm=$taskResponse.Content.Contains('Wi-Fi name');hasPairingField=$taskResponse.Content.Contains('Panel pairing key');bytes=$taskResponse.RawContentLength}|ConvertTo-Json
}finally{
 netsh wlan disconnect
 netsh wlan delete profile name=StarPanelSetupTest
 Remove-Item -LiteralPath $taskFile -ErrorAction SilentlyContinue
}
