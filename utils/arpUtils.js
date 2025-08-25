// utils/arpUtils.js
const fs = require("fs");
const path = require("path");

const OUI_DB = {};
const ouiFile = path.join(__dirname, "../assets/data/oui.txt"); // adjust path if needed

if (fs.existsSync(ouiFile)) {
  const lines = fs.readFileSync(ouiFile, "utf8").split("\n");

  for (const line of lines) {
    // Each valid line looks like: "00-1A-2B   (hex)    Cisco Systems, Inc."
    if (line.includes("(hex)")) {
      const [hex, vendor] = line.split("(hex)").map(s => s.trim());
      const prefix = hex.replace(/-/g, ":").toUpperCase();
      OUI_DB[prefix] = vendor;
    }
  }
}

function normalizeMac(mac) {
  if (!mac || typeof mac !== "string") return null;
  return mac.replace(/-/g, ":").toUpperCase();
}

function lookupVendor(mac) {
  const normalized = normalizeMac(mac);
  if (!normalized) return "Unknown";

  const prefix = normalized.split(":").slice(0, 3).join(":");
  return OUI_DB[prefix] || "Unknown";
}

module.exports = { lookupVendor, normalizeMac };
