// 🌐 DOM Elements
const scanBtn = document.getElementById("scanBtn");
const excelBtn = document.getElementById("excelBtn");
const searchInput = document.getElementById("searchInput");
const deviceTypeFilter = document.getElementById("deviceTypeFilter");
const cardContainer = document.getElementById("card-container");
const emptyMessage = document.getElementById("emptyMessage");
const modalBody = document.getElementById("deviceModalBody");
const cardBtn = document.getElementById("cardViewBtn");
const tableBtn = document.getElementById("tableViewBtn");

// 📦 State
let currentData = [];
let currentView = localStorage.getItem("viewMode") || "card";
const credentials = { username: "admin", password: "admin" }; // define at top

// 🔄 View Toggle
cardBtn.addEventListener("click", () => {
  currentView = "card";
  updateViewToggle();
  applyFilters();
});

tableBtn.addEventListener("click", () => {
  currentView = "table";
  updateViewToggle();
  applyFilters();
});

function updateViewToggle() {
  cardBtn.classList.toggle("active", currentView === "card");
  tableBtn.classList.toggle("active", currentView === "table");
  localStorage.setItem("viewMode", currentView);
}

// 🔄 Device Type Filter
function populateDeviceTypeFilter(devices) {
  const uniqueTypes = new Set();
  devices.forEach((d) => uniqueTypes.add((d.type || "unknown").toLowerCase()));
  deviceTypeFilter.innerHTML = '<option value="">All Device Types</option>';
  Array.from(uniqueTypes)
    .sort()
    .forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      deviceTypeFilter.appendChild(opt);
    });
}

deviceTypeFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

// 🔍 Apply Filters
function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const type = deviceTypeFilter.value.toLowerCase();

  const filtered = currentData.filter((d) => {
    const matchesSearch =
      d.ip.toLowerCase().includes(query) ||
      d.mac?.toLowerCase().includes(query) ||
      d.hostname?.toLowerCase().includes(query);
    const matchesType = !type || (d.type || "unknown").toLowerCase() === type;
    return matchesSearch && matchesType;
  });

  renderDevices(filtered);
  emptyMessage.style.display =
    filtered.length === 0 && currentData.length > 0 ? "block" : "none";
  if (filtered.length === 0 && currentData.length > 0)
    emptyMessage.textContent = "No devices match the current filters.";
}

// 🔄 Render Devices
function renderDevices(devices) {
  cardContainer.style.display = currentView === "card" ? "flex" : "none";
  const tableContainer = document.getElementById("table-container");
  tableContainer.style.display = currentView === "table" ? "block" : "none";

  cardContainer.innerHTML = "";
  tableContainer.innerHTML = "";

  if (!devices || devices.length === 0) {
    emptyMessage.style.display = "block";
    return;
  }
  emptyMessage.style.display = "none";

  currentView === "card" ? renderCards(devices) : renderTable(devices);
}

// 🧩 Card Renderer
function renderCards(data) {
  data.forEach((device) => {
    const col = document.createElement("div");
    col.className = "col-sm-12 col-md-6 col-lg-3 d-flex";
    col.innerHTML = `
      <div class="e-card playing">
        <div class="wave"></div><div class="wave"></div><div class="wave"></div>
        <div class="infotop">
          <p class="ip-cell text-primary mb-2 cardText" data-ip="${
            device.ip
          }" style="cursor:pointer;" title="Open in browser"><strong>IP:</strong> ${
      device.ip
    }</p>
          <p><strong>MAC:</strong> ${device.mac || "Unknown"}</p>
          <p><strong>Type:</strong> ${device.type || "Unknown"}</p>
         
          <p class="redirect-text" style="cursor:pointer; font-size: 14px; color: #fff;">
            <strong>Web view:</strong>
            <img src="assets/icons/arrow-up-right-from-square-solid-full.svg" alt="redirect icon" style="width: 12px; height: 12px; margin-left: 5px; vertical-align: middle; cursor: pointer;" class="redirect-icon" />
          </p>
        </div>
      </div>
    `;

    col
      .querySelector(".e-card")
      .addEventListener("click", () => showDeviceDetails(device));
    col.querySelector(".ip-cell").addEventListener("click", (e) => {
      e.stopPropagation();
      handleFetch(device);
    });
    const redirectText = col.querySelector(".redirect-text");
    if (redirectText)
      redirectText.addEventListener("click", (e) => {
        e.stopPropagation();
        window.open(`http://${device.ip}`, "_blank");
      });

    cardContainer.appendChild(col);
  });
}

// 📊 Table Renderer
function renderTable(data) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "table-responsive";
  const table = document.createElement("table");
  table.className = "table table-bordered table-hover align-middle";
  table.innerHTML = `
    <thead><tr><th>IP Address</th><th>MAC Address</th><th>Type</th></tr></thead>
    <tbody>
      ${data
        .map(
          (d) =>
            `<tr class="device-row" data-ip="${d.ip}"><td class="ip-cell">${
              d.ip
            }</td><td>${d.mac || "Unknown"}</td><td>${
              d.type || "Unknown"
            }</td></tr>`
        )
        .join("")}
    </tbody>
  `;
  wrapper.appendChild(table);
  tableContainer.appendChild(wrapper);

  table.querySelectorAll(".ip-cell").forEach((cell) => {
    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      const device = data.find((d) => d.ip === cell.textContent);
      if (device) handleFetch(device);
    });
  });

  table.querySelectorAll(".device-row").forEach((row) => {
    row.addEventListener("click", () => {
      const device = data.find((d) => d.ip === row.getAttribute("data-ip"));
      if (device) showDeviceDetails(device);
    });
  });
}

// 🌟 Speaker API wrapper
async function speakerLogin(ip) {
  const token = await window.api.speakerLogin(ip);
  return token;
}

async function speakerFetch(ip, token, endpoint) {
  return await window.api.speakerApi(ip, token, endpoint);
}

/**
 * Format data as readable text
 */
function formatDataAsText(obj) {
  if (!obj || typeof obj !== "object") {
    return String(obj || "N/A");
  }

  // If obj is an array, format each item recursively
  if (Array.isArray(obj)) {
    return obj.map(item => formatDataAsText(item)).join("<br>");
  }

  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return "No data available";
  }

  // If the object has a key called "data" (case insensitive), format the value directly
  const dataEntry = entries.find(([key]) => key.toLowerCase() === "data");
  if (dataEntry && typeof dataEntry[1] === "object" && dataEntry[1] !== null) {
    return formatDataAsText(dataEntry[1]);
  }

  return entries
    .map(([key, value]) => {
      const displayKey = key
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/([A-Z])/g, " $1") // Add space before uppercase letters
        .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
        .trim(); // Remove any leading/trailing spaces
      // If value is an object, recursively format it
      const displayValue =
        typeof value === "object" && value !== null
          ? formatDataAsText(value)
          : String(value || "N/A");
      return `<strong>${displayKey}:</strong> ${displayValue}`;
    })
    .join("<br>");
}

/**
 * Format API response into a card HTML
 */
function formatApiResponse(result, title, icon) {
  if (result.status === "rejected" || result.value?.error) {
    return `
      <div class="col-md-6 mb-3">
        <div class="card h-100 border-danger">
          <div class="card-header bg-danger text-white">
            <h6 class="mb-0">${icon} ${title}</h6>
          </div>
          <div class="card-body">
            <div class="alert alert-danger mb-0">
              <strong>❌ Failed:</strong> ${
                result.value?.error ||
                result.reason?.message ||
                "Unknown error"
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const data = result.value;
  const formattedData = formatDataAsText(data);

  return `
    <div class="col-md-6 mb-3">
      <div class="card h-100 api-data-card">
        <div class="card-header api-data-header">
          <h6 class="mb-0">${icon} ${title}</h6>
        </div>
        <div class="card-body">
          <div class="api-data-content" style="font-size: 14px;  line-height: 1.5; max-height: 200px; overflow-y: auto;">
            ${formattedData}
          </div>
        </div>
      </div>
    </div>
  `;
}

// 📝 Show Device Details

async function showDeviceDetails(device) {
  try {
    let token = null;
    let deviceType = "Speaker"; // Default to Speaker

    // Try IP Phone login first
    try {
      const ipPhoneLoginResult = await window.api.loginDevice(
        device.ip,
        "admin",
        "admin"
      );
      if (ipPhoneLoginResult && ipPhoneLoginResult.loginSuccess) {
        // Try to fetch IP Phone data to confirm it's an IP Phone
        try {
          await window.api.fetchSystemInfo(device.ip, ipPhoneLoginResult.token);
          deviceType = "IP Phone";
          token = ipPhoneLoginResult.token;
        } catch (dataError) {
          console.log("IP Phone data fetch failed, trying Speaker login...");
          throw new Error("IP Phone data fetch failed");
        }
      } else {
        throw new Error("IP Phone login failed");
      }
    } catch (ipPhoneError) {
      console.log("IP Phone login failed, trying Speaker login...");
      token = await window.api.speakerLogin(device.ip, "admin", "admin");
      deviceType = "Speaker";
    }

    // Update the device type in currentData
    const deviceIndex = currentData.findIndex((d) => d.ip === device.ip);
    if (deviceIndex !== -1) {
      currentData[deviceIndex].type = deviceType;
      renderDevices(currentData);
    }

    // Define API calls based on device type
    let apiCalls = [];
    if (deviceType === "IP Phone") {
      apiCalls = [
        { name: "System Info", icon: "📊", fetch: () => window.api.fetchSystemInfo(device.ip, token) },
        { name: "SVN Version", icon: "🔢", fetch: () => window.api.fetchSvnVersion(device.ip) },
        { name: "IP Address", icon: "🌐", fetch: () => window.api.fetchIpAddress(device.ip) },
        { name: "Account Info", icon: "👤", fetch: () => window.api.fetchAccountInfo(device.ip) },
        { name: "DNS", icon: "🌐", fetch: () => window.api.fetchDNS(device.ip) },
        { name: "Gateway", icon: "🚪", fetch: () => window.api.fetchGetway(device.ip) },
        { name: "Netmask", icon: "📶", fetch: () => window.api.fetchNetMask(device.ip) },
        { name: "Account Status", icon: "👤", fetch: () => window.api.fetchAccountStatus(device.ip) },
        // { name: "Call Status", icon: "📞", fetch: () => window.api.fetchCallStatus(device.ip) },
        { name: "All Account Information", icon: "📋", fetch: () => window.api.fetchAllAcountInformation(device.ip) },
        // { name: "Call", icon: "📞", fetch: () => window.api.fetchCall(device.ip) }
      ];
    } else if (deviceType === "Speaker") {
      apiCalls = [
        { name: "System Info", icon: "📊", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-system-info") },
        { name: "Volume Priority", icon: "🔊", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-volume-priority") },
        { name: "Provisioning", icon: "⚙️", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-privisioning") },
        { name: "Slave1", icon: "1️⃣", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-sip-slave1-info") },
        { name: "Slave2", icon: "2️⃣", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-sip-slave2-info") },
        { name: "Function", icon: "🔧", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-sip-function-info") },
        { name: "Master", icon: "👑", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-sip-master-info") },
        { name: "Advance", icon: "⚡", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-sip-advance-info") },
        { name: "Sip", icon: "📡", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-sipapi") },
        { name: "Language", icon: "🗣️", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-language") },
        { name: "Audio", icon: "🔈", fetch: () => window.api.speakerApi(device.ip, token, "/api/get-audio-codec") }
      ];
    } else {
      modalBody.innerHTML = `<div class="alert alert-warning">Unknown device type. Cannot fetch details.</div>`;
      return;
    }

    // Fetch all APIs in parallel
    const results = await Promise.allSettled(apiCalls.map(api => api.fetch()));

    // Build modal content
    let modalHtml = `
      <div class="row">
        <div class="col-md-12 mb-3">
          <h4 class="text-center">${device.ip}</h4>
          <hr>
        </div>
        <!-- Basic Information -->
        <div class="col-md-12 mb-4">
          <div class="card">
            <div class="card-header text-white ">
              <h6 class="mb-0">📋 Basic Information</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Status:</strong> <span class="badge ${device.alive ? "bg-success" : "bg-danger"}">${device.alive ? "Online" : "Offline"}</span></p>
                  <p><strong>Hostname:</strong> ${device.hostname || "Unknown"}</p>
                  <p><strong>Vendor:</strong> ${device.vendor || "Unknown"}</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Type:</strong> ${device.type || "Unknown"}</p>
                  <p><strong>MAC Address:</strong> ${device.mac || "Unknown"}</p>
                  <p><strong>Response Time:</strong> ${device.responseTime || "Unknown"} ms</p>
                  <p><strong>Open Ports:</strong> ${device.openPorts?.join(", ") || "None"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- API Data Section -->
        <div class="col-md-12">
          <h5 class="text-center mb-3">Advanced Data</h5>
          <div class="row">
    `;

    for (let i = 0; i < apiCalls.length; i++) {
      modalHtml += formatApiResponse(results[i], apiCalls[i].name, apiCalls[i].icon);
    }

    modalHtml += `
          </div>
    `;

    // Only show action buttons for IP Phone devices
    if (deviceType === "IP Phone") {
      modalHtml += `
          <!-- Action Buttons -->
          <div class="col-md-12 mt-4">
            <h5 class="text-center mb-3">Device Actions</h5>
            <div class="row justify-content-center">
              <div class="col-md-4 mb-3">
                <button id="restartBtn" class="btn btn-warning btn-lg w-100">🔄 Restart Device</button>
              </div>
              <div class="col-md-4 mb-3">
                <button id="resetBtn" class="btn btn-danger btn-lg w-100">⚠️ Reset Device</button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      modalHtml += `
        </div>
      `;
    }

    modalBody.innerHTML = modalHtml;

    // Add event listeners for action buttons
    const restartBtn = document.getElementById("restartBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (restartBtn) {
      restartBtn.addEventListener("click", () => confirmRestart(device.ip));
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => confirmReset(device.ip));
    }

    // Show modal
    const modal = document.getElementById("deviceModal");
    if (modal && modal.classList.contains("modal")) {
      const bootstrap = window.bootstrap;
      if (bootstrap && bootstrap.Modal) new bootstrap.Modal(modal).show();
      else modal.style.display = "block";
    }
  } catch (err) {
    console.error("❌ Show device details error:", err);
    modalBody.innerHTML = `<div class="alert alert-danger">❌ ${err.message}</div>`;
    // Show modal even on error
    const modal = document.getElementById("deviceModal");
    if (modal && modal.classList.contains("modal")) {
      const bootstrap = window.bootstrap;
      if (bootstrap && bootstrap.Modal) new bootstrap.Modal(modal).show();
      else modal.style.display = "block";
    }
  }
}

// Handle fetch when user clicks IP
async function handleFetch(device) {
  try {
    if (!device.type) device.type = "unknown";
    showDeviceDetails(device);
  } catch (err) {
    console.error("Fetch failed:", err);
    alert(`Failed to fetch device ${device.ip}: ${err.message}`);
  }
}

// 🔄 Initial Scan
// 🔄 Initial Scan
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const devices = await window.api.scanDevices();

    // Enrich devices safely
    const enrichedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          return await window.api.enrichDevice(device, credentials);
        } catch (err) {
          console.error(`Failed to enrich ${device.ip}:`, err.message);
          return { ...device, type: "Unknown" }; // fallback
        }
      })
    );

    // Determine device types
    const devicesWithType = await Promise.all(
      enrichedDevices.map(async (device) => {
        const apiType = await determineDeviceType(device.ip);
        if (apiType !== "Unknown") {
          return { ...device, type: apiType };
        }
        return device;
      })
    );

    currentData = devicesWithType;
    populateDeviceTypeFilter(currentData);
    updateViewToggle();
    renderDevices(currentData);
  } catch (err) {
    console.error("Initial scan failed:", err);
    emptyMessage.textContent = "Failed to load devices.";
    emptyMessage.style.display = "block";
  }
});

// 🔄 Manual Scan
scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanning...";
  try {
    const devices = await window.api.scanDevices();

    const enrichedDevices = await Promise.all(
      devices.map(async (device) => {
        try {
          return await window.api.enrichDevice(device, credentials);
        } catch (err) {
          console.error(`Failed to enrich ${device.ip}:`, err.message);
          return { ...device, type: "Unknown" };
        }
      })
    );

    // Determine device types
    const devicesWithType = await Promise.all(
      enrichedDevices.map(async (device) => {
        const apiType = await determineDeviceType(device.ip);
        if (apiType !== "Unknown") {
          return { ...device, type: apiType };
        }
        return device;
      })
    );

    currentData = devicesWithType;
    populateDeviceTypeFilter(currentData);
    renderDevices(currentData);
  } catch (err) {
    console.error("Scan failed:", err);
    alert("Failed to scan network.");
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Network";
  }
});

// 🚀 Determine device type using login APIs
async function determineDeviceType(ip) {
  try {
    // Try IP Phone login first
    const ipPhoneLoginResult = await window.api.loginDevice(
      ip,
      "admin",
      "admin"
    );
    if (ipPhoneLoginResult && ipPhoneLoginResult.loginSuccess) {
      // Try to fetch IP Phone data to confirm it's an IP Phone
      try {
        const systemInfo = await window.api.fetchSystemInfo(
          ip,
          ipPhoneLoginResult.token
        );
        return "IP Phone";
      } catch (dataError) {
        console.log("IP Phone data fetch failed, trying Speaker login...");
        // Try Speaker login
        const speakerLoginResult = await window.api.speakerLogin(
          ip,
          "admin",
          "admin"
        );
        if (speakerLoginResult) {
          return "Speaker";
        }
      }
    }
  } catch (error) {
    console.log(`IP Phone login failed for ${ip}:`, error.message);
  }

  try {
    // Try Speaker login
    const speakerLoginResult = await window.api.speakerLogin(
      ip,
      "admin",
      "admin"
    );
    if (speakerLoginResult) {
      return "Speaker";
    }
  } catch (error) {
    console.log(`Speaker login failed for ${ip}:`, error.message);
  }

  return "Unknown";
}

// 📁 Export to Excel
excelBtn.addEventListener("click", async () => {
  if (currentData.length === 0) {
    alert("No devices to export.");
    return;
  }
  try {
    const filePath = await window.api.exportExcel(currentData);
    if (filePath) alert(`Excel saved at: ${filePath}`);
    else alert("Failed to export Excel.");
  } catch (err) {
    console.error(err);
    alert("Error exporting Excel.");
  }
});
