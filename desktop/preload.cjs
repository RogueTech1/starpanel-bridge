const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('bridge', {
  hardware:()=>ipcRenderer.invoke('hardware'),help:key=>ipcRenderer.invoke('help',key),enableTelemetry:()=>ipcRenderer.invoke('enable-telemetry'),
  sharePanel:id=>ipcRenderer.invoke('share-panel',id),importPanel:()=>ipcRenderer.invoke('import-panel'),
  wifiSetup:port=>ipcRenderer.invoke('wifi-setup',port),
  snapshot: () => ipcRenderer.invoke('snapshot'), ports: () => ipcRenderer.invoke('ports'),
  catalog: () => ipcRenderer.invoke('catalog'), mode: demo => ipcRenderer.invoke('mode', demo),
  inputReference:()=>ipcRenderer.invoke('input-reference'),
  reference:()=>ipcRenderer.invoke('reference-data'),copyReference:(id,format)=>ipcRenderer.invoke('reference-copy',id,format),
  hardwareProduct:id=>ipcRenderer.invoke('hardware-product',id),
  telemetryPort:port=>ipcRenderer.invoke('telemetry-port',port),
  arm: enabled => ipcRenderer.invoke('arm', enabled), device: (port, attach, protocol = 'json') => ipcRenderer.invoke('device', port, attach, protocol),
  press: button => ipcRenderer.invoke('press', button), saveConfig: text => ipcRenderer.invoke('save-config', text),
  network: enabled => ipcRenderer.invoke('network', enabled), networkToken: () => ipcRenderer.invoke('network-token'),
  panels:()=>ipcRenderer.invoke('panels'),savePanel:p=>ipcRenderer.invoke('save-panel',p),
  programPanel:(id,port,wifi)=>ipcRenderer.invoke('program-panel',id,port,wifi),
  flash:(port,profile,confirmed)=>ipcRenderer.invoke('flash',port,profile,confirmed)
  ,flashMaster:(port,confirmed)=>ipcRenderer.invoke('flash-master',port,confirmed)
});
