const { lookupVendor,normalizeMac  } = require("./utils/arpUtils");
const { exec } = require("child_process");
const os = require("os");
const dns = require("dns");
const util = require("util");
const ping = require("ping");
const net = require("net");

const reverseLookup = util.promisify(dns.reverse);

// 🧠 Parse ARP output based on platform
function parseARP(output) {
  const lines = output.split("\n").filter(line => line.trim());
  const devices = [];

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
      devices.push({ ip, mac });
    }
  }

  return devices;
}

// 🔍 Guess device type based on vendor + TTL + ports
function detectDeviceType(mac, vendor) {
  const v = (vendor || "Unknown").toLowerCase();

  if (v.includes("apple") || v.includes("iphone") || v.includes("ipad")) {
    return "Phone / Tablet";
  }
  if (v.includes("samsung")) return "Phone / TV";
  if (v.includes("cisco") || v.includes("juniper")) return "Switch / Router";
  if (v.includes("hikvision") || v.includes("dahua")) return "IP Camera";
  if (v.includes("intel") || v.includes("amd") || v.includes("lenovo") || v.includes("dell"))
    return "Computer";
  if (v.includes("tp-link") || v.includes("netgear") || v.includes("d-link"))
    return "Network Device";

  // fallback
  return "Unknown";
}


// ⚡ Quick port scanner (few common ports)
async function scanPorts(ip, ports = [80, 443, 22, 23, 554, 3389, 9100]) {
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

// 🌐 Enrich device with ping, hostname, vendor, type
async function enrichDevice(device) {
  const vendor = lookupVendor(device.mac) || "Unknown";
  const type = detectDeviceType(device.mac, vendor);

  return {
    ip: device.ip || "Unknown",
    mac: device.mac ? normalizeMac(device.mac) : "Unknown",
    alive: device.alive || false,
    hostname: device.hostname || "Unknown",
    vendor,
    type,
    openPorts: device.openPorts || [],
    responseTime: device.responseTime || "unknown",
  };
}


// 🚀 Main scan function
module.exports = function scanDevices() {
  return new Promise((resolve, reject) => {
    const command = os.platform() === "win32" ? "arp -a" : "arp -n";

    exec(command, async (err, stdout) => {
      if (err) return reject(err);

      try {
        const rawDevices = parseARP(stdout);
        const enrichedDevices = await Promise.all(rawDevices.map(enrichDevice));
        resolve(enrichedDevices);
      } catch (e) {
        console.error("Error enriching devices:", e);
        reject(e);
      }
    });
  });
};
