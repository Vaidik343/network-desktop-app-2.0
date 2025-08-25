const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  scanDevices: () => ipcRenderer.invoke("scan-devices"),
  exportExcel: (data) => ipcRenderer.invoke("export-excel", data),
  openIP: (ip) => ipcRenderer.send("open-ip", ip),
   checkDeviceStatus: (ip) => ipcRenderer.invoke("check-device-status", ip)
});
