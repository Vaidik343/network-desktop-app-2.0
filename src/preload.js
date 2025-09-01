const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  scanDevices: () => ipcRenderer.invoke("scan-devices"),
  exportExcel: (data) => ipcRenderer.invoke("export-excel", data),
  openIP: (ip) => ipcRenderer.send("open-ip", ip),
  checkDeviceStatus: (ip) => ipcRenderer.invoke("check-device-status", ip),
  // API functions for device management
  loginDevice: (ip, username, password) => ipcRenderer.invoke("login-device", ip, username, password),
  fetchSystemInfo: (ip, token) => ipcRenderer.invoke("fetch-system-info", ip, token),
  // fetchExtensions: (ip, token) => ipcRenderer.invoke("fetch-extensions", ip, token),
  fetchSvnVersion: (ip) => ipcRenderer.invoke("fetch-svn-version", ip),
  fetchIpAddress: (ip) => ipcRenderer.invoke("fetch-ip-address", ip),
  fetchAccountInfo: (ip) => ipcRenderer.invoke("fetch-account-info", ip),
  fetchDNS: (ip) => ipcRenderer.invoke("fetch-dns", ip),
  fetchGetway: (ip) => ipcRenderer.invoke("fetch-getway", ip),
  fetchNetMask: (ip) => ipcRenderer.invoke("fetch-netmask", ip),
  fetchAccountStatus: (ip) => ipcRenderer.invoke("fetch-account-status", ip),
  fetchCallStatus: (ip) => ipcRenderer.invoke("fetch-call-status", ip),
  fetchAllAcountInformation: (ip) => ipcRenderer.invoke("fetch-all-account-info", ip),
  fetchRestart: (ip) => ipcRenderer.invoke("fetch-restart", ip),
  fetchReset: (ip) => ipcRenderer.invoke("fetch-reset", ip),
  fetchCall: (ip) => ipcRenderer.invoke("fetch-call", ip)
});
