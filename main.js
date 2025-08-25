// main.js
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const arpScan = require("./arpScanner");
const exportToExcel = require("./excelFile");
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
