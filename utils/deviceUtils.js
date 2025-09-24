const { lookupVendor, normalizeMac } = require("./arpUtils");
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const ping = require("ping");

// Dasscom special handling
const { detectDasscomDeviceType } = require('./dasscomUtils');

// 🔧 Configurable device type mappings
const DEVICE_TYPE_MAPPINGS = {
  vendor: {
    'apple': 'Phone / Tablet',
    'iphone': 'Phone / Tablet', 
    'ipad': 'Phone / Tablet',
    'samsung': 'Phone / TV',
    'cisco': 'Switch / Router',
    'juniper': 'Switch / Router',
    'hikvision': 'IP Camera',
    'dahua': 'IP Camera',
    'intel': 'Computer',
    'amd': 'Computer',
    'lenovo': 'Computer',
    'dell': 'Computer',
    'tp-link': 'Network Device',
    'netgear': 'Network Device',
    'd-link': 'Network Device',
    'brother': 'Printer',
    'hp': 'Printer',
    'canon': 'Printer',
    'epson': 'Printer',
    'google': 'Smart Home',
    'nest': 'Smart Home',
    'amazon': 'Amazon Device',
    'echo': 'Amazon Device',
    'kindle': 'Amazon Device',
    'microsoft': 'Microsoft Device',
    'surface': 'Microsoft Device',
    'sony': 'Sony Device',
    'playstation': 'Sony Device',
    'xiaomi': 'Xiaomi Device',
    'redmi': 'Xiaomi Device',
    'huawei': 'Huawei Device',
    'honor': 'Huawei Device',
    'oneplus': 'OnePlus Device',
    'oppo': 'Mobile Device',
    'vivo': 'Mobile Device',
    'realme': 'Mobile Device',
    'lg': 'LG Device',
    'motorola': 'Motorola Device',
    'nokia': 'Nokia Device',
    'zte': 'ZTE Device',
    'asus': 'ASUS Device',
    'acer': 'Acer Device',
    'toshiba': 'Toshiba Device',
    'fujitsu': 'Fujitsu Device',
    'ibm': 'IBM Device',
    'qualcomm': 'Qualcomm Device',
    'mediatek': 'MediaTek Device',
    'broadcom': 'Broadcom Device',
    'marvell': 'Marvell Device',
    'texas instruments': 'Texas Instruments Device',
    'infineon': 'Infineon Device',
    'nvidia': 'NVIDIA Device',
    'dasscom': 'Speaker',
    "xi'an jizhong": 'Speaker',
    "xi'an jizhong digital communication co.,ltd": 'Speaker',
    'ieee registration authority': 'Speaker'
  },
  patterns: {
    'router|gateway|access point': 'Network Device',
    'camera|surveillance|dvr|nvr': 'IP Camera',
    'phone|mobile|smartphone|tablet': 'Phone / Tablet',
    'computer|pc|laptop|notebook': 'Computer',
    'printer|scanner|mfp': 'Printer',
    'tv|television|display|monitor': 'TV / Display',
    'iot|smart|home|hub': 'Smart Home',
    'server|storage|nas': 'Server / Storage'
  },
  categories: {
    'networking': 'Network Device',
    'computing': 'Computer',
    'mobile': 'Phone / Tablet',
    'imaging': 'Printer',
    'entertainment': 'TV / Display',
    'smart': 'Smart Home',
    'storage': 'Server / Storage',
    'security': 'IP Camera'
  }
};

// 🔍 Enhanced device type detection
function detectDeviceType(mac, vendor, openPorts = []) {
  const v = (vendor || "Unknown").toLowerCase();
  if (v === "unknown") return "Unknown";

  // Special Dasscom handling (fallback if API not used)
  if (v.includes("dasscom speaker")) return "Speaker";
  if (v.includes("dasscom ip phone") || v.includes("dasscom voip phone")) return "IP Phone";

  // Exact match
  for (const [vendorPattern, deviceType] of Object.entries(DEVICE_TYPE_MAPPINGS.vendor)) {
    if (v === vendorPattern.toLowerCase()) return deviceType;
  }

  // Substring match
  for (const [vendorPattern, deviceType] of Object.entries(DEVICE_TYPE_MAPPINGS.vendor)) {
    if (v.includes(vendorPattern.toLowerCase())) return deviceType;
  }

  // Pattern match
  for (const [pattern, deviceType] of Object.entries(DEVICE_TYPE_MAPPINGS.patterns)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(v)) return deviceType;
  }

  return "Unknown";
}

// 🌟 Main device enrichment
async function enrichDevice(device, credentials = {}) {
  const vendor = lookupVendor(device.mac) || "Unknown";
  let alive = device.alive;
  let responseTime = device.responseTime || "unknown";

  // Ping if not alive
  if (!alive && device.ip) {
    try {
      const pingResult = await ping.promise.probe(device.ip, { timeout: 2 });
      alive = pingResult.alive;
      responseTime = pingResult.time;
    } catch {
      alive = false;
      responseTime = "unknown";
    }
  }

  // Scan open ports if not provided
  let openPorts = device.openPorts || [];
  if (openPorts.length === 0 && device.ip && device.ip !== "Unknown") {
    const { scanPorts } = require("../arpScanner");
    openPorts = await scanPorts(device.ip);
  }

  // Dasscom device check via login API
  let type;
  if (vendor.toLowerCase().includes("dasscom") || vendor.toLowerCase().includes("xi'an jizhong")) {
    type = await detectDasscomDeviceType(device.ip, credentials);
  }

  // Fallback type detection
  if (!type || type === "Unknown") {
    type = detectDeviceType(device.mac, vendor, openPorts);
  }

  // Hostname resolution
  let hostname = device.hostname || "Unknown";
  if (hostname === "Unknown" && device.ip && device.ip !== "Unknown") {
    try {
      const hostnames = await dns.reverse(device.ip);
      hostname = hostnames[0] || "Unknown";
    } catch {}
  }

  return {
    ip: device.ip || "Unknown",
    mac: device.mac ? normalizeMac(device.mac) : "Unknown",
    alive,
    hostname,
    vendor,
    type,
    openPorts,
    responseTime
  };
}

// Load mappings from external JSON
function loadDeviceMappingsFromFile(filePath = './config/device-mappings.json') {
  const possiblePaths = [
    path.join(__dirname, "../config/device-mappings.json"),
    path.join(process.cwd(), "config/device-mappings.json"),
    filePath
  ];

  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const mappings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        for (const [k, v] of Object.entries(mappings.vendor || {})) {
          if (!DEVICE_TYPE_MAPPINGS.vendor[k.toLowerCase()]) {
            DEVICE_TYPE_MAPPINGS.vendor[k.toLowerCase()] = v;
          }
        }
        Object.assign(DEVICE_TYPE_MAPPINGS.patterns, mappings.patterns || {});
        return true;
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  return false;
}

function addVendorMapping(vendorPattern, deviceType) {
  DEVICE_TYPE_MAPPINGS.vendor[vendorPattern.toLowerCase()] = deviceType;
}

function addPatternMapping(pattern, deviceType) {
  DEVICE_TYPE_MAPPINGS.patterns[pattern] = deviceType;
}

// Load mappings on module load
loadDeviceMappingsFromFile();

module.exports = {
  enrichDevice,
  detectDeviceType,
  addVendorMapping,
  addPatternMapping,
  loadDeviceMappingsFromFile
};
