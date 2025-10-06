const { enrichDevice } = require("./utils/deviceUtils");
const ping = require("ping");
const ip = require("ip");
const { exec } = require("child_process");
const path = require("path");
const util = require("util");
const execPromise = util.promisify(exec);

async function scanSubnet(ipAddr, netmask) {
  const subnetInfo = ip.subnet(ipAddr, netmask);
  const cidr = subnetInfo.networkAddress + '/' + subnetInfo.prefixLength;

  // Determine nmap path
  const nmapPath = process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'extraResources', 'nmap', 'nmap.exe')
    : path.join(__dirname, '..', 'assets', 'nmap', 'nmap.exe');

  try {
    console.log(`🔍 Using Nmap to scan subnet: ${cidr}`);
    const { stdout } = await execPromise(`"${nmapPath}" -sn ${cidr}`);
    const devices = parseNmapOutput(stdout);
    console.log(`✅ Nmap found ${devices.length} devices`);

    // Enrich devices
    const enrichedDevices = await Promise.all(devices.map(device => enrichDevice(device)));
    return enrichedDevices;
  } catch (nmapError) {
    console.error("❌ Nmap scanning failed:", nmapError.message);
    console.log("🔄 Falling back to ping-based scanning");

    // Fallback to ping
    const ips = [];
    for (let i = 1; i < subnetInfo.numHosts; i++) {
      ips.push(ip.fromLong(ip.toLong(subnetInfo.networkAddress) + i));
    }

    const results = await Promise.all(
      ips.map(async ip => {
        const res = await ping.promise.probe(ip);
        if (res.alive) {
          return enrichDevice({ ip, mac: null, alive: true, responseTime: res.time });
        }
      })
    );

    return results.filter(Boolean);
  }
}

// Parse Nmap -sn output
function parseNmapOutput(output) {
  const lines = output.split('\n');
  const devices = [];
  let currentDevice = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for host report
    const hostMatch = trimmed.match(/^Nmap scan report for (.+)$/);
    if (hostMatch) {
      if (currentDevice) {
        devices.push(currentDevice);
      }
      currentDevice = { ip: hostMatch[1], mac: null, alive: true, responseTime: null };
      continue;
    }

    // Check for MAC address
    const macMatch = trimmed.match(/^MAC Address: ([A-Fa-f0-9:]+) \((.+)\)$/);
    if (macMatch && currentDevice) {
      currentDevice.mac = macMatch[1].toUpperCase().replace(/-/g, ':');
    }
  }

  if (currentDevice) {
    devices.push(currentDevice);
  }

  return devices;
}

module.exports = { scanSubnet };
