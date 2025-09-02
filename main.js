// main.js
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const arpScan = require("./arpScanner");
const exportToExcel = require("./excelFile");
const { login, fetchSystemInfo, fetchSvnVersion, fetchIpAddress, fetchAccountInfo, fetchDNS, fetchGetway, fetchNetMask, fetchAccountStatus, fetchCallStatus, fetchAllAcountInformation, fetchRestart, fetchReset, fetchCall } = require("./api/dasscomClient");
const preloadPath = path.join(__dirname, "src", "preload.js");

console.log("Loaded main.js from:", __filename);

const ping = require("ping");

// --- define FIRST ---
async function pingDevice(ip) {
  try {
    const res = await ping.promise.probe(ip);
    return {
      alive: res.alive,
      time: res.time,
      output: res.output,
      host: res.host
    };
  } catch (err) {
    console.error("Ping failed:", err);
    return { alive: false };
  }
}

// --- then register handlers ---
ipcMain.handle("check-device-status", async (event, ip) => {
  const result = await pingDevice(ip);
  return {
    alive: result.alive,
    type: "Unknown",
    vendor: "Unknown"
  };
});

ipcMain.handle("scan-devices", async () => arpScan());
ipcMain.handle("export-excel", async (event, devices) => {
  const win = BrowserWindow.getFocusedWindow(); // or pass your window reference

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Save Scan Results",
    defaultPath: path.join(app.getPath("documents"), "Scan result.xlsx"),
    filters: [{ name: "Excel Files", extensions: ["xlsx"] }]
  });

  if (canceled || !filePath) return null;

  try {
    const savedPath = await exportToExcel(devices, filePath); // pass filePath
    return savedPath;
  } catch (err) {
    console.error("Excel export failed:", err);
    return null;
  }
});
ipcMain.on("open-ip", async (event, ip) => {
  const res = await ping.promise.probe(ip);
  if (res.alive) {
    shell.openExternal(`http://${ip}`);
  } else {
    dialog.showErrorBox("Device Unreachable", `Cannot reach ${ip}.`);
  }
});

// API handlers for device management
ipcMain.handle("login-device", async (event, ip, username, password) => {
  try {
    const token = await login(ip, username, password);
    return token;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-system-info", async (event, ip, token) => {
  try {
    const info = await fetchSystemInfo(ip, token);
    return info;
  } catch (error) {
    console.error("System info fetch failed:", error);
    throw error;
  }
});


ipcMain.handle("fetch-svn-version", async (event, ip) => {
  try {
    console.log("Main process: Calling fetchSvnVersion for IP:", ip);
    const svnVersion = await fetchSvnVersion(ip);
    console.log("Main process: fetchSvnVersion result:", svnVersion);
    console.log("Main process: fetchSvnVersion result type:", typeof svnVersion);
    console.log("Main process: fetchSvnVersion result keys:", svnVersion ? Object.keys(svnVersion) : 'null/undefined');
    return svnVersion;
  } catch (error) {
    console.error("SVN version fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-ip-address", async (event, ip) => {
  try {
    const ipAddress = await fetchIpAddress(ip);
    return ipAddress;
  } catch (error) {
    console.error("IP address fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-account-info", async (event, ip) => {
  try {
    const accountInfo = await fetchAccountInfo(ip);
    return accountInfo;
  } catch (error) {
    console.error("Account info fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-dns", async (event, ip) => {
  try {
    const dns = await fetchDNS(ip);
    return dns;
  } catch (error) {
    console.error("DNS fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-getway", async (event, ip) => {
  try {
    const gateway = await fetchGetway(ip);
    return gateway;
  } catch (error) {
    console.error("Gateway fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-netmask", async (event, ip) => {
  try {
    const netmask = await fetchNetMask(ip);
    return netmask;
  } catch (error) {
    console.error("Netmask fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-account-status", async (event, ip) => {
  try {
    const accountStatus = await fetchAccountStatus(ip);
    return accountStatus;
  } catch (error) {
    console.error("Account status fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-call-status", async (event, ip) => {
  try {
    const callStatus = await fetchCallStatus(ip);
    return callStatus;
  } catch (error) {
    console.error("Call status fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-all-account-info", async (event, ip) => {
  try {
    const allAccountInfo = await fetchAllAcountInformation(ip);
    return allAccountInfo;
  } catch (error) {
    console.error("All account info fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-restart", async (event, ip) => {
  try {
    const restart = await fetchRestart(ip);
    return restart;
  } catch (error) {
    console.error("Restart fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-reset", async (event, ip) => {
  try {
    const reset = await fetchReset(ip);
    return reset;
  } catch (error) {
    console.error("Reset fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-call", async (event, ip) => {
  try {
    const call = await fetchCall(ip);
    return call;
  } catch (error) {
    console.error("Call fetch failed:", error);
    throw error;
  }
});





function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    icon: "C:\\Vaidik\\Desktop\\DC scan network\\assets\\dasscom\\favicon-32x32.png",
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  win.loadFile("./index.html");
}

app.whenReady().then(createWindow);
