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
  devices.forEach(d => uniqueTypes.add((d.type || "unknown").toLowerCase()));
  deviceTypeFilter.innerHTML = '<option value="">All Device Types</option>';
  Array.from(uniqueTypes).sort().forEach(type => {
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

  const filtered = currentData.filter(d => {
    const matchesSearch =
      d.ip.toLowerCase().includes(query) ||
      (d.mac?.toLowerCase().includes(query)) ||
      (d.hostname?.toLowerCase().includes(query));
    const matchesType = !type || (d.type || "unknown").toLowerCase() === type;
    return matchesSearch && matchesType;
  });

  renderDevices(filtered);
  emptyMessage.style.display = filtered.length === 0 && currentData.length > 0 ? "block" : "none";
  if (filtered.length === 0 && currentData.length > 0) emptyMessage.textContent = "No devices match the current filters.";
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
  data.forEach(device => {
    const col = document.createElement("div");
    col.className = "col-sm-12 col-md-6 col-lg-3 d-flex";
    col.innerHTML = `
      <div class="e-card playing">
        <div class="wave"></div><div class="wave"></div><div class="wave"></div>
        <div class="infotop">
          <p class="ip-cell text-primary mb-2 cardText" data-ip="${device.ip}" style="cursor:pointer;" title="Open in browser"><strong>IP:</strong> ${device.ip}</p>
          <p><strong>MAC:</strong> ${device.mac || "Unknown"}</p>
          <p><strong>Type:</strong> ${device.type || "Unknown"}</p>
          <p class="redirect-text" style="cursor:pointer; font-size: 14px; color: #fff;">
            <strong>Web view:</strong>
            <img src="assets/icons/arrow-up-right-from-square-solid-full.svg" alt="redirect icon" style="width: 12px; height: 12px; margin-left: 5px; vertical-align: middle; cursor: pointer;" class="redirect-icon" />
          </p>
        </div>
      </div>
    `;

    col.querySelector(".e-card").addEventListener("click", () => showDeviceDetails(device));
    col.querySelector(".ip-cell").addEventListener("click", e => {
      e.stopPropagation();
      handleFetch(device);
    });
    const redirectText = col.querySelector(".redirect-text");
    if (redirectText) redirectText.addEventListener("click", e => {
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
      ${data.map(d => `<tr class="device-row" data-ip="${d.ip}"><td class="ip-cell">${d.ip}</td><td>${d.mac || "Unknown"}</td><td>${d.type || "Unknown"}</td></tr>`).join("")}
    </tbody>
  `;
  wrapper.appendChild(table);
  tableContainer.appendChild(wrapper);

  table.querySelectorAll(".ip-cell").forEach(cell => {
    cell.addEventListener("click", e => {
      e.stopPropagation();
      const device = data.find(d => d.ip === cell.textContent);
      if (device) handleFetch(device);
    });
  });

  table.querySelectorAll(".device-row").forEach(row => {
    row.addEventListener("click", () => {
      const device = data.find(d => d.ip === row.getAttribute("data-ip"));
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

// 📝 Show Device Details

// 📝 Show Device Details – System Info Only
async function showDeviceDetails(device) {
  try {
    const token = await window.api.speakerLogin(device.ip, "admin", "admin");
    const systemInfo = await window.api.speakerApi(device.ip, token, "/api/get-system-info");

    console.log("🎵 Speaker API response:", systemInfo);
    console.log("🎵 Response type:", typeof systemInfo);
    console.log("🎵 Response keys:", systemInfo ? Object.keys(systemInfo) : 'null');

    // Handle different response structures
    let displayContent = "";

    if (!systemInfo) {
      displayContent = `<div class="alert alert-warning">No system info available</div>`;
    } else if (typeof systemInfo === 'object') {
      // If response has data property (expected structure)
      if (systemInfo.data) {
        const sectionsHtml = Object.entries(systemInfo.data)
          .map(([sectionName, sectionObj]) => {
            const content = Object.entries(sectionObj)
              .map(([k,v]) => `<strong>${k}:</strong> ${v}<br>`).join("");
            return `<h5>${sectionName.replace(/_/g," ")}</h5>${content}<hr>`;
          }).join("");
        displayContent = `
          <div class="card">
            <div class="card-header">System Info - ${device.ip}</div>
            <div class="card-body">${sectionsHtml}</div>
          </div>
        `;
      }
      // If response is a direct object with properties
      else if (Object.keys(systemInfo).length > 0) {
        const content = Object.entries(systemInfo)
          .map(([k,v]) => `<strong>${k}:</strong> ${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}<br>`).join("");
        displayContent = `
          <div class="card">
            <div class="card-header">System Info - ${device.ip}</div>
            <div class="card-body">${content}</div>
          </div>
        `;
      }
      // If response has rawResponse property (fallback from HTML responses)
      else if (systemInfo.rawResponse) {
        displayContent = `
          <div class="card">
            <div class="card-header">Raw Response - ${device.ip}</div>
            <div class="card-body">
              <p><strong>Endpoint:</strong> ${systemInfo.endpoint}</p>
              <p><strong>Auth Method:</strong> ${systemInfo.authMethod}</p>
              <p><strong>Content Type:</strong> ${systemInfo.contentType}</p>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; max-height: 300px;">${systemInfo.rawResponse}</pre>
            </div>
          </div>
        `;
      } else {
        displayContent = `<div class="alert alert-warning">No system info available</div>`;
      }
    } else {
      // If response is a string or other type
      displayContent = `
        <div class="card">
          <div class="card-header">System Info - ${device.ip}</div>
          <div class="card-body">
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; max-height: 300px;">${JSON.stringify(systemInfo, null, 2)}</pre>
          </div>
        </div>
      `;
    }

    modalBody.innerHTML = displayContent;

    // Trigger modal to show (if using Bootstrap modal)
    const modal = document.getElementById('deviceModal');
    if (modal && modal.classList.contains('modal')) {
      const bootstrap = window.bootstrap;
      if (bootstrap && bootstrap.Modal) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
      } else {
        // Fallback for non-Bootstrap modals
        modal.style.display = 'block';
      }
    }

  } catch(err) {
    console.error("❌ Show device details error:", err);
    modalBody.innerHTML = `<div class="alert alert-danger">❌ ${err.message}</div>`;

    // Still try to show modal even on error
    const modal = document.getElementById('deviceModal');
    if (modal && modal.classList.contains('modal')) {
      const bootstrap = window.bootstrap;
      if (bootstrap && bootstrap.Modal) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
      } else {
        modal.style.display = 'block';
      }
    }
  }
}


// Handle fetch when user clicks IP
async function handleFetch(device) {
  try {
    if (!device.type) device.type = "unknown";
    showDeviceDetails(device);
  } catch(err) {
    console.error("Fetch failed:", err);
    alert(`Failed to fetch device ${device.ip}: ${err.message}`);
  }
}

// 🔄 Initial Scan
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const devices = await window.api.scanDevices();
    currentData = devices;
    populateDeviceTypeFilter(devices);
    updateViewToggle();
    renderDevices(devices);
  } catch(err) {
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
    currentData = devices;
    populateDeviceTypeFilter(devices);
    renderDevices(devices);
  } catch(err) {
    console.error("Scan failed:", err);
    alert("Failed to scan network.");
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Network";
  }
});

// 📁 Export to Excel
excelBtn.addEventListener("click", async () => {
  if (currentData.length === 0) { alert("No devices to export."); return; }
  try {
    const filePath = await window.api.exportExcel(currentData);
    if (filePath) alert(`Excel saved at: ${filePath}`);
    else alert("Failed to export Excel.");
  } catch(err) { console.error(err); alert("Error exporting Excel."); }
});
