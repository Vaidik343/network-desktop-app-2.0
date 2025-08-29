const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  scanDevices: () => ipcRenderer.invoke("scan-devices"),
  exportExcel: (data) => ipcRenderer.invoke("export-excel", data),
  openIP: (ip) => ipcRenderer.send("open-ip", ip),
  checkDeviceStatus: (ip) => ipcRenderer.invoke("check-device-status", ip),
  // API functions for device management
  loginDevice: (ip, username, password) => ipcRenderer.invoke("login-device", ip, username, password),
  fetchSystemInfo: (ip, token) => ipcRenderer.invoke("fetch-system-info", ip, token),
  fetchExtensions: (ip, token) => ipcRenderer.invoke("fetch-extensions", ip, token),
  fetchSvnVersion: (ip) => ipcRenderer.invoke("fetch-svn-version", ip),
  fetchIpAddress: (ip) => ipcRenderer.invoke("fetch-ip-address", ip),
  fetchAccountInfo: (ip) => ipcRenderer.invoke("fetch-account-info", ip),
  clearSession: (ip) => ipcRenderer.invoke("clear-session", ip)
});
