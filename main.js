// main.js
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const arpScan = require("./arpScanner");
const exportToExcel = require("./excelFile");
const { login, fetchSystemInfo, fetchSystemInfoWithAuth, fetchExtensions, fetchSvnVersion, fetchIpAddress, fetchAccountInfo, clearSession } = require("./api/dasscomClient");

// Fallback function for system info with basic auth
async function fetchSystemInfoWithFallback(ip) {
  try {
    // First try with session cookies
    return await fetchSystemInfo(ip);
  } catch (error) {
    console.log("🍪 Cookie-based auth failed, trying basic auth...");
    // If cookies fail, try basic authentication
    return await fetchSystemInfoWithAuth(ip, 'admin', 'admin');
  }
}

// Fallback function for SVN version with basic auth
async function fetchSvnVersionWithFallback(ip) {
  try {
    return await fetchSvnVersion(ip);
  } catch (error) {
    console.log("🍪 SVN version cookie auth failed, trying basic auth...");
    const authString = btoa('admin:admin');
    const headers = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    };
    const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=svn_version`;
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
      mode: 'cors',
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error(`SVN version fetch failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
}

// Fallback function for IP address with basic auth
async function fetchIpAddressWithFallback(ip) {
  try {
    return await fetchIpAddress(ip);
  } catch (error) {
    console.log("🍪 IP address cookie auth failed, trying basic auth...");
    const authString = btoa('admin:admin');
    const headers = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    };
    const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=ipaddr`;
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
      mode: 'cors',
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error(`IP address fetch failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
}
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
    const info = await fetchSystemInfoWithFallback(ip);
    return info;
  } catch (error) {
    console.error("System info fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-extensions", async (event, ip, token) => {
  try {
    const extensions = await fetchExtensions(ip, token);
    return extensions;
  } catch (error) {
    console.error("Extensions fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-svn-version", async (event, ip) => {
  try {
    const svnVersion = await fetchSvnVersionWithFallback(ip);
    return svnVersion;
  } catch (error) {
    console.error("SVN version fetch failed:", error);
    throw error;
  }
});

ipcMain.handle("fetch-ip-address", async (event, ip) => {
  try {
    const ipAddress = await fetchIpAddressWithFallback(ip);
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

ipcMain.handle("clear-session", async (event, ip) => {
  try {
    clearSession(ip);
    return { success: true };
  } catch (error) {
    console.error("Clear session failed:", error);
    throw error;
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "assets", "image2.ico"),
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  win.loadFile("./index.html");
}

app.whenReady().then(createWindow);
