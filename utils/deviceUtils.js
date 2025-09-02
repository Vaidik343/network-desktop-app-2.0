const { lookupVendor, normalizeMac } = require("./arpUtils");
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const http = require('http');

// 🔧 Configurable device type mappings
const DEVICE_TYPE_MAPPINGS = {
  // Vendor-specific mappings
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
    'nvidia': 'NVIDIA Device'
  },
  
  // Pattern-based mappings (for unknown vendors)
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
  
  // Category-based mappings (broad categories)
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

// 🔍 Enhanced device type detection with multiple fallback strategies
function detectDeviceType(mac, vendor) {
  const v = (vendor || "Unknown").toLowerCase();
  
  if (v === "unknown") return "Unknown";
  
  // 1. First try exact vendor name matching
  for (const [vendorPattern, deviceType] of Object.entries(DEVICE_TYPE_MAPPINGS.vendor)) {
    if (v === vendorPattern.toLowerCase()) {
      return deviceType;
    }
  }
  
  // 2. Try vendor substring matching (more flexible)
  for (const [vendorPattern, deviceType] of Object.entries(DEVICE_TYPE_MAPPINGS.vendor)) {
    if (v.includes(vendorPattern.toLowerCase())) {
      console.log(`🔍 Matched vendor substring: "${vendorPattern}" -> "${deviceType}"`);
      return deviceType;
    }
  }
  
  // 3. Try pattern matching in vendor string
  for (const [pattern, deviceType] of Object.entries(DEVICE_TYPE_MAPPINGS.patterns)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(v)) {
      console.log(`🔍 Matched pattern: "${pattern}" -> "${deviceType}"`);
      return deviceType;
    }
  }
  
  // 4. Try to infer from common vendor patterns
  const inferredType = inferDeviceTypeFromVendor(v);
  if (inferredType !== "Unknown") {
    console.log(`🔍 Inferred type from vendor: "${v}" -> "${inferredType}"`);
    return inferredType;
  }
  
  // 5. Log unknown vendor for future analysis
  console.log(`❓ Unknown vendor detected: "${vendor}" (MAC: ${mac})`);
  
  return "Unknown";
}

// 🔮 Infer device type based on vendor name patterns
function inferDeviceTypeFromVendor(vendor) {
  const vendorLower = vendor.toLowerCase();
  
  // Common vendor patterns that suggest device type
  if (vendorLower.includes('systems') || vendorLower.includes('technologies') || 
      vendorLower.includes('electronics') || vendorLower.includes('corporation') ||
      vendorLower.includes('inc') || vendorLower.includes('llc') || vendorLower.includes('ltd')) {
    // These are usually companies that make various devices, so we need more context
    return "Unknown";
  }
  
  // Look for specific product indicators
  if (vendorLower.includes('router') || vendorLower.includes('switch') || vendorLower.includes('ap')) {
    return "Network Device";
  }
  if (vendorLower.includes('camera') || vendorLower.includes('surveillance')) {
    return "IP Camera";
  }
  if (vendorLower.includes('phone') || vendorLower.includes('mobile')) {
    return "Phone / Tablet";
  }
  if (vendorLower.includes('computer') || vendorLower.includes('pc') || vendorLower.includes('laptop')) {
    return "Computer";
  }
  if (vendorLower.includes('printer') || vendorLower.includes('print')) {
    return "Printer";
  }
  if (vendorLower.includes('tv') || vendorLower.includes('television')) {
    return "TV / Display";
  }
  if (vendorLower.includes('smart') || vendorLower.includes('iot')) {
    return "Smart Home";
  }
  
  return "Unknown";
}

// 🌐 Enrich device with ping, hostname, vendor, type
async function enrichDevice(device) {
  const vendor = lookupVendor(device.mac) || "Unknown";
  const type = detectDeviceType(device.mac, vendor);

  // Try to resolve hostname if not available
  let hostname = device.hostname || "Unknown";
  if (hostname === "Unknown" && device.ip && device.ip !== "Unknown") {
    try {
      console.log(`🔍 Attempting reverse DNS lookup for ${device.ip}`);
      const hostnames = await dns.reverse(device.ip);
      hostname = hostnames[0] || "Unknown";
      console.log(`✅ Reverse DNS resolved ${device.ip} to ${hostname}`);
    } catch (error) {
      console.log(`❌ Reverse DNS lookup failed for ${device.ip}: ${error.message}`);
      hostname = "Unknown";
    }
  }

  // If still unknown, try forward DNS lookup (resolve IP to hostname)
  if (hostname === "Unknown" && device.ip && device.ip !== "Unknown") {
    try {
      console.log(`🔍 Attempting forward DNS lookup for ${device.ip}`);
      const lookupResult = await dns.lookup(device.ip);
      if (lookupResult && lookupResult.hostname) {
        hostname = lookupResult.hostname;
        console.log(`✅ Forward DNS resolved ${device.ip} to ${hostname}`);
      }
    } catch (error) {
      console.log(`❌ Forward DNS lookup failed for ${device.ip}: ${error.message}`);
    }
  }

  // Fallback hostname for IP Phone devices
  if (hostname === "Unknown" && type === "IP Phone" && device.ip && device.ip !== "Unknown") {
    hostname = "IP-Phone-" + device.ip.replace(/\./g, '-');
    console.log(`📞 Assigned fallback hostname for IP Phone: ${hostname}`);
  }

  return {
    ip: device.ip || "Unknown",
    mac: device.mac ? normalizeMac(device.mac) : "Unknown",
    alive: device.alive || false,
    hostname,
    vendor,
    type,
    openPorts: device.openPorts || [],
    responseTime: device.responseTime || "unknown",
  };
}

// 💾 Function to add new vendor mappings (for future extensibility)
function addVendorMapping(vendorPattern, deviceType) {
  DEVICE_TYPE_MAPPINGS.vendor[vendorPattern.toLowerCase()] = deviceType;
  console.log(`✅ Added vendor mapping: "${vendorPattern}" -> "${deviceType}"`);
}

// 💾 Function to add new pattern mappings (for future extensibility)
function addPatternMapping(pattern, deviceType) {
  DEVICE_TYPE_MAPPINGS.patterns[pattern] = deviceType;
  console.log(`✅ Added pattern mapping: "${pattern}" -> "${deviceType}"`);
}

// 🔄 Load device type mappings from external JSON file (dynamic option)
function loadDeviceMappingsFromFile(filePath = './config/device-mappings.json') {
  try {
    if (fs.existsSync(filePath)) {
      const mappings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      Object.assign(DEVICE_TYPE_MAPPINGS.vendor, mappings.vendor || {});
      Object.assign(DEVICE_TYPE_MAPPINGS.patterns, mappings.patterns || {});
      console.log(`✅ Loaded device mappings from ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error loading device mappings from ${filePath}:`, error.message);
  }
  return false;
}

// 💾 Save current mappings to external JSON file
function saveDeviceMappingsToFile(filePath = './config/device-mappings.json') {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(DEVICE_TYPE_MAPPINGS, null, 2));
    console.log(`✅ Saved device mappings to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving device mappings to ${filePath}:`, error.message);
    return false;
  }
}

// 🤖 AI/ML-based device type prediction (placeholder for future implementation)
async function predictDeviceTypeAI(mac, vendor, openPorts = []) {
  // This is a placeholder for future AI/ML integration
  // Could use machine learning to predict device type based on:
  // - Vendor name patterns
  // - MAC address patterns (OUI lookup)
  // - Open ports and services
  // - Network behavior patterns
  
  console.log(`🤖 AI prediction requested for: ${vendor} (MAC: ${mac})`);
  
  // Simple heuristic based on open ports as example
  if (openPorts.includes(80) || openPorts.includes(443)) {
    return "Web Server / Router";
  }
  if (openPorts.includes(554)) {
    return "IP Camera / Streaming Device";
  }
  if (openPorts.includes(9100)) {
    return "Printer";
  }
  
  return "Unknown (AI)";
}

// 🌐 Dynamic device type detection with multiple strategies
async function detectDeviceTypeDynamic(mac, vendor, openPorts = []) {
  const v = (vendor || "Unknown").toLowerCase();
  
  if (v === "unknown") return "Unknown";
  
  // 1. Try traditional static mappings first
  const staticType = detectDeviceType(mac, vendor);
  if (staticType !== "Unknown") {
    return staticType;
  }
  
  // 2. Try AI/ML prediction if available
  try {
    const aiType = await predictDeviceTypeAI(mac, vendor, openPorts);
    if (aiType !== "Unknown (AI)") {
      console.log(`🤖 AI predicted: "${vendor}" -> "${aiType}"`);
      return aiType;
    }
  } catch (error) {
    console.error('AI prediction failed:', error.message);
  }
  
  // 3. Fallback to enhanced pattern matching
  return detectDeviceType(mac, vendor);
}

// Load mappings from config file on module load
loadDeviceMappingsFromFile();

module.exports = {
  enrichDevice,
  detectDeviceType,
  detectDeviceTypeDynamic,
  addVendorMapping,
  addPatternMapping,
  loadDeviceMappingsFromFile,
  saveDeviceMappingsToFile,
  predictDeviceTypeAI
};
