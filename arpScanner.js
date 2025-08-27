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
const ip = require("ip")
const log = require('electron-log');
// 🧠 Parse ARP output based on platform
function parseARP(output) {
  const lines = output.split("\n").filter(line => line.trim());
  const devices = [];
  console.log("🚀 ~ parseARP ~ devices:", devices)

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


// 🚀 Main scan function
module.exports =  function scanDevices({ useSubnetScan = false, ipAddr, netmask } = {}) {
  if (useSubnetScan && ipAddr && netmask) {
    return scanSubnet(ipAddr, netmask);
  }

  // fallback to ARP scan
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

