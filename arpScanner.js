const { lookupVendor, normalizeMac } = require("./utils/arpUtils");
const { enrichDevice } = require("./utils/deviceUtils");
const { exec } = require("child_process");
const os = require("os");
const dns = require("dns");
const util = require("util");
const ping = require("ping");
const net = require("net");
const { scanSubnet } = require("./subnetScanner");
const reverseLookup = util.promisify(dns.reverse);
const ip = require("ip");
const log = require('electron-log');
const { loginDevice, speakerLogin } = require("./api/dasscomClient");

// 🧠 Parse ARP output based on platform
function parseARP(output) {
  const lines = output.split("\n").filter(line => line.trim());
  const devices = [];
  console.log("🚀 ~ parseARP ~ devices:", devices);

  for (const line of lines) {
    let ip, mac;

    if (os.platform() === "win32") {
      const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([a-fA-F0-9:-]+)\s+\w+/);
      if (match) {
        ip = match[1];
        mac = match[2];
      }
    } else {
      const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+\w+\s+([a-fA-F0-9:-]+)/);
      if (match) {
        ip = match[1];
        mac = match[2];
      }
    }

    if (ip && mac) {
      const normalizedMac = mac.replace(/-/g, ':').toUpperCase();
      if (normalizedMac.startsWith('8C:1F:64')) {
        devices.push({ ip, mac: normalizedMac });
      }
    }
  }

  return devices;
}

// ⚡ Quick port scanner (few common ports)
async function scanPorts(ip, ports = [80, 443, 22, 23, 554, 3389, 9100, 5060, 5061]) {
  const open = [];

  await Promise.all(
    ports.map(port => {
      return new Promise(resolve => {
        const socket = new net.Socket();
        socket.setTimeout(400);

        socket.once("connect", () => {
          open.push(port);
          socket.destroy();
          resolve();
        });

        socket.once("timeout", () => {
          socket.destroy();
          resolve();
        });

        socket.once("error", () => resolve());

        socket.connect(port, ip);
      });
    })
  );

  return open;
}

// 🚀 Main scan function
module.exports = async function scanDevices({ useSubnetScan = true, ipAddr, netmask } = {}) {
  console.log("🚀 Starting device scan...");

  // Try subnet scanning first (more reliable in packaged apps)
  if (useSubnetScan) {
    try {
      console.log("🔍 Using subnet scanning method");
      const subnetDevices = await scanSubnet(ipAddr, netmask);
      console.log(`✅ Subnet scan found ${subnetDevices.length} devices`);

      // Enrich devices with type detection
      const devicesWithType = await Promise.all(subnetDevices.map(async device => {
        const apiType = await determineDeviceType(device.ip);
        if (apiType !== "Unknown") {
          return { ...device, type: apiType };
        }
        return device;
      }));

      return devicesWithType;
    } catch (subnetError) {
      console.error("❌ Subnet scanning failed:", subnetError.message);
      // Fall back to ARP scanning
    }
  }

  // Fallback to ARP scan
  console.log("🔍 Falling back to ARP scanning method");
  return new Promise((resolve, reject) => {
    const command = os.platform() === "win32" ? "arp -a" : "arp -n";

    exec(command, async (err, stdout) => {
      if (err) {
        console.error("❌ ARP command failed:", err.message);
        // If ARP also fails, return empty array instead of rejecting
        console.log("⚠️ Both scanning methods failed, returning empty results");
        return resolve([]);
      }

      try {
        const rawDevices = parseARP(stdout);
        console.log(`✅ ARP scan found ${rawDevices.length} raw devices`);

        const enrichedDevices = await Promise.all(rawDevices.map(device => enrichDevice(device, { username: "admin", password: "admin" })));
        const devicesWithType = await Promise.all(enrichedDevices.map(async device => {
          const apiType = await determineDeviceType(device.ip);
          if (apiType !== "Unknown") {
            return { ...device, type: apiType };
          }
          return device;
        }));

        resolve(devicesWithType);
      } catch (e) {
        console.error("❌ Error enriching devices:", e);
        // Return empty array instead of rejecting to prevent app crash
        resolve([]);
      }
    });
  });
};

// 🚀 Determine device type using login APIs
async function determineDeviceType(ip) {
  try {
    // Try IP Phone login first
    const ipPhoneLoginResult = await loginDevice(ip, "admin", "admin");
    if (ipPhoneLoginResult && ipPhoneLoginResult.loginSuccess) {
      return "IP Phone";
    }
  } catch (error) {
    console.log(`IP Phone login failed for ${ip}:`, error.message);
  }

  try {
    // Try Speaker login
    const speakerLoginResult = await speakerLogin(ip, "admin", "admin");
    if (speakerLoginResult) {
      return "Speaker";
    }
  } catch (error) {
    console.log(`Speaker login failed for ${ip}:`, error.message);
  }

  return "Unknown";
}

// Export scanPorts for use in other modules
module.exports.scanPorts = scanPorts;
