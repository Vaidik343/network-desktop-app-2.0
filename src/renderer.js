// 🌐 DOM Elements
const scanBtn = document.getElementById("scanBtn");
const excelBtn = document.getElementById("excelBtn");
const searchInput = document.getElementById("searchInput");
const cardContainer = document.getElementById("card-container");
const emptyMessage = document.getElementById("emptyMessage");
const modalBody = document.getElementById("deviceModalBody");
const cardBtn = document.getElementById("cardViewBtn");
const tableBtn = document.getElementById("tableViewBtn");
// Import statements will be handled via require in Electron

// 📦 Modal and Device Functions
async function callApiAndDisplay(ip, apiType) {
  try {
    console.log(`Calling ${apiType} API for ${ip}`);

    // Show loading state
    const responseContainer = document.getElementById('api-response-container');
    const responseContent = document.getElementById('api-response-content');
    responseContainer.style.display = 'block';
    responseContent.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Loading...</div>';

    let result;
    let apiName = '';

    // Call the appropriate API based on type
    switch (apiType) {
      case 'system-info':
        apiName = 'System Info';
        result = await window.api.fetchSystemInfo(ip);
        break;
      case 'svn-version':
        apiName = 'SVN Version';
        result = await window.api.fetchSvnVersion(ip);
        break;
      case 'ip-address':
        apiName = 'IP Address';
        result = await window.api.fetchIpAddress(ip);
        break;
      case 'account-info':
        apiName = 'Account Info';
        result = await window.api.fetchAccountInfo(ip);
        break;
      case 'extensions':
        apiName = 'Extensions';
        result = await window.api.fetchExtensions(ip);
        break;
      default:
        throw new Error(`Unknown API type: ${apiType}`);
    }

    // Display the result
    const formattedResult = JSON.stringify(result, null, 2);
    responseContent.innerHTML = `
      <div class="alert alert-success mb-2">
        <strong>✅ ${apiName} API Response:</strong>
        <small class="text-muted">Authentication successful</small>
      </div>
      <pre class="mb-0" style="font-size: 12px;"><code>${formattedResult}</code></pre>
    `;

    console.log(`${apiName} API result:`, result);

  } catch (error) {
    console.error(`API call failed for ${apiType}:`, error);

    const responseContainer = document.getElementById('api-response-container');
    const responseContent = document.getElementById('api-response-content');
    responseContainer.style.display = 'block';

    responseContent.innerHTML = `
      <div class="alert alert-danger mb-2">
        <strong>❌ API Call Failed:</strong> ${error.message}
      </div>
      <div class="text-muted small">
        Check the console for more details. Make sure the device is online and the API is supported.
      </div>
    `;
  }
}

function showDeviceDetails(device) {
  const modalBody = document.getElementById("deviceModalBody");
  const ip = device.ip || "Unknown";

  modalBody.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h4>${ip}</h4>
        <hr>
        <h6>Basic Information</h6>
        <p><strong>Status:</strong> ${device.alive ? "Online" : "Offline"}</p>
        <p><strong>Hostname:</strong> ${device.hostname || "Unknown"}</p>
        <p><strong>Vendor:</strong> ${device.vendor || "Unknown"}</p>
        <p><strong>Type:</strong> ${device.type || "Unknown"}</p>
        <p><strong>MAC Address:</strong> ${device.mac || "Unknown"}</p>
        <p><strong>Response Time:</strong> ${device.responseTime || "Unknown"} ms</p>
        <p><strong>Open Ports:</strong> ${device.openPorts?.join(", ") || "None"}</p>
      </div>
      <div class="col-md-6">
        <h6>Available API Endpoints</h6>
        <div class="mb-3">
          <button class="btn btn-primary btn-sm me-2 mb-2 api-btn" data-api="system-info" data-ip="${ip}">
            📊 System Info
          </button>
          <button class="btn btn-success btn-sm me-2 mb-2 api-btn" data-api="svn-version" data-ip="${ip}">
            🔢 SVN Version
          </button>
          <button class="btn btn-info btn-sm me-2 mb-2 api-btn" data-api="ip-address" data-ip="${ip}">
            🌐 IP Address
          </button>
          <button class="btn btn-warning btn-sm me-2 mb-2 api-btn" data-api="account-info" data-ip="${ip}">
            👤 Account Info
          </button>
          <button class="btn btn-secondary btn-sm me-2 mb-2 api-btn" data-api="extensions" data-ip="${ip}">
            📞 Extensions
          </button>
        </div>
        <div id="api-response-container" class="mt-3" style="display: none;">
          <h6>API Response:</h6>
          <div id="api-response-content" class="border p-3 bg-light rounded" style="max-height: 300px; overflow-y: auto;"></div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners for API buttons
  modalBody.querySelectorAll('.api-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const apiType = e.target.getAttribute('data-api');
      const deviceIp = e.target.getAttribute('data-ip');
      await callApiAndDisplay(deviceIp, apiType);
    });
  });

  const modalElement = document.getElementById("deviceModal");
  let deviceModal = bootstrap.Modal.getInstance(modalElement);
  if (!deviceModal) deviceModal = new bootstrap.Modal(modalElement);
  deviceModal.show();
}

async function handleFetch(deviceOrIp) {
  try {
    // Handle both device object and IP string
    const ip = typeof deviceOrIp === 'string' ? deviceOrIp : deviceOrIp.ip;
    const device = typeof deviceOrIp === 'string' ? { ip: deviceOrIp } : deviceOrIp;
    
    console.log(`Attempting to fetch system info for IP: ${ip}`);
    
    // Use the IPC-based API to fetch comprehensive system information
    const loginResult = await window.api.loginDevice(ip, "admin", "admin");
    console.log("Login result:", loginResult);

    // Show success alert if login worked
    if (loginResult && loginResult.loginSuccess) {
      alert(`✅ Login successful for ${ip}! Session established.`);
    }
    
    // Fetch all available information in parallel
    const [versionInfo, svnVersion, ipAddress] = await Promise.all([
      window.api.fetchSystemInfo(ip, loginResult),
      window.api.fetchSvnVersion(ip),
      window.api.fetchIpAddress(ip)
    ]);

    const enrichedDevice = {
      ...device,
      // Login information
      loginCode: loginResult.code,
      loginName: loginResult.name,
      loginWait: loginResult.wait,
      // Version information
      version: versionInfo.version,
      svnVersion: svnVersion.svn_version,
      // Network information
      deviceIpAddress: ipAddress.ipaddr
    };
    
    showDeviceDetails(enrichedDevice);
  } catch (error) {
    console.error("Device fetch failed:", error);
    
    // Show more specific error messages
    if (error.message.includes('fetch')) {
      alert(`Network error: Could not connect to ${typeof deviceOrIp === 'string' ? deviceOrIp : deviceOrIp.ip}. Please check if the device is reachable and supports the API.`);
    } else if (error.message.includes('Login failed')) {
      alert(`Authentication failed for ${typeof deviceOrIp === 'string' ? deviceOrIp : deviceOrIp.ip}. Please check credentials.`);
    } else {
      alert(`Could not fetch system info from ${typeof deviceOrIp === 'string' ? deviceOrIp : deviceOrIp.ip}. Error: ${error.message}`);
    }
  }
}

// 📦 State
let currentData = [];
let currentView = localStorage.getItem("viewMode") || "card";

// 🔄 View Toggle
cardBtn.addEventListener("click", () => {
  currentView = "card";
  updateViewToggle();
  renderDevices(currentData);
});

tableBtn.addEventListener("click", () => {
  currentView = "table";
  updateViewToggle();
  renderDevices(currentData);
});

function updateViewToggle() {
  cardBtn.classList.toggle("active", currentView === "card");
  tableBtn.classList.toggle("active", currentView === "table");
  localStorage.setItem("viewMode", currentView);
}

// 🧠 Unified Renderer
function renderDevices(devices) {
  console.log("renderDevices called with:", devices?.length, "devices");
  console.log("Current view:", currentView);
  
  const tableContainer = document.getElementById("table-container");

  // 🔄 Toggle visibility based on current view
  cardContainer.style.display = currentView === "card" ? "flex" : "none";
  tableContainer.style.display = currentView === "table" ? "block" : "none";

  // Clear both containers
  cardContainer.innerHTML = "";
  tableContainer.innerHTML = "";

  if (!devices || devices.length === 0) {
    console.log("No devices to render, showing empty message");
    emptyMessage.style.display = "block";
    return;
  }

  console.log("Rendering", devices.length, "devices in", currentView, "view");
  emptyMessage.style.display = "none";
  currentView === "card" ? renderCards(devices) : renderTable(devices);
}


// 🧩 Card Renderer
function renderCards(data) {
  console.log("renderCards called with", data.length, "devices");
  data.forEach((device, index) => {
    console.log(`Rendering device ${index + 1}:`, device);
    const col = document.createElement("div");
    col.className = "col-sm-12 col-md-6 col-lg-3 d-flex ";

    col.innerHTML = `
      <div class="e-card playing">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="infotop">
          <p class="ip-cell text-primary mb-2 cardText" data-ip="${device.ip}"
           style="cursor:pointer;" title="Open in browser"><strong>IP:</strong> ${device.ip}</p>
          <p><strong>MAC:</strong> ${device.mac || "Unknown"}</p>
          <p><strong>Type:</strong> ${device.type || "Unknown"}</p>
          
        </div>
      </div>
    `;

    // Clicking card opens modal
    col.querySelector(".e-card").addEventListener("click", () => showDeviceDetails(device));

    // Clicking IP opens in browser
    col.querySelector(".ip-cell").addEventListener("click", (e) => {
      e.stopPropagation();
      handleFetch(device);
    });

    cardContainer.appendChild(col);
  });
}


// 📊 Table Renderer
function renderTable(data) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = ""; // Clear previous table

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "table-responsive";

  const table = document.createElement("table");
  table.className = "table table-bordered table-hover align-middle";

  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">IP Address</th>
        <th scope="col">MAC Address</th>
        <th scope="col">Type</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(device => `
        <tr class="device-row" data-ip="${device.ip}">
          <td class="ip-cell text" title="Open in browser">${device.ip}</td>
          <td>${device.mac || "Unknown"}</td>
          <td>${device.type || "Unknown"}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  tableWrapper.appendChild(table);
  tableContainer.appendChild(tableWrapper); // ✅ Correct target

  table.querySelectorAll(".ip-cell").forEach(cell => {
    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      const ip = cell.textContent;
      const device = data.find(d => d.ip === ip);
      if (device) {
        handleFetch(device);
      }
    });
  });

  table.querySelectorAll(".device-row").forEach(row => {
    row.addEventListener("click", () => {
      const ip = row.getAttribute("data-ip");
      const device = data.find(d => d.ip === ip);
      if (device) showDeviceDetails(device);
    });
  });
}

// 📌 Modal Renderer
// function showDeviceDetails(device) {
//   modalBody.innerHTML = `
//     <h4>${device.ip || "Unknown"}</h4>
//     <p><strong>Status:</strong> ${device.alive ? "Online" : "Offline"}</p>
//     <p><strong>Hostname:</strong> ${device.hostname || "Unknown"}</p>
//     <p><strong>Vendor:</strong> ${device.vendor || "Unknown"}</p>
//     <p><strong>Open Ports:</strong> ${device.openPorts?.join(", ") || "None"}</p>
//     <p><strong>Response Time:</strong> ${device.responseTime || "Unknown"} ms</p>
//   `;

//   const modalElement = document.getElementById("deviceModal");
//   let deviceModal = bootstrap.Modal.getInstance(modalElement);
//   if (!deviceModal) deviceModal = new bootstrap.Modal(modalElement);
//   deviceModal.show();
// }

// 🚀 Initial Scan
window.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Starting initial scan...");
    const devices = await window.api.scanDevices();
    console.log("Scan completed, devices found:", devices.length);
    console.log("Sample device:", devices[0]);
    
    currentData = devices;
    window.currentData = devices;
    updateViewToggle();
    renderDevices(devices);
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
    currentData = devices;
    window.currentData = devices;
    renderDevices(devices);
  } catch (err) {
    console.error("Scan failed:", err);
    alert("Failed to scan network.");
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Network";
  }
});

// 🔍 Search Filter
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = currentData.filter(
    (d) =>
      d.ip.toLowerCase().includes(query) ||
      d.mac?.toLowerCase().includes(query) ||
      d.hostname?.toLowerCase().includes(query)
  );
  renderDevices(filtered);
});

// 📁 Export to Excel
excelBtn.addEventListener("click", async () => {
  const query = searchInput.value.toLowerCase();
  const filtered = currentData.filter(
    (d) =>
      d.ip.toLowerCase().includes(query) ||
      d.mac?.toLowerCase().includes(query) ||
      d.hostname?.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    alert("No matching devices to export.");
    return;
  }

  try {
    const filePath = await window.api.exportExcel(filtered);
    if (filePath) {
      alert(`Excel file saved at:\n${filePath}`);
    } else {
      alert("Failed to save Excel file.");
    }
  } catch (err) {
    console.error("Export failed:", err);
    alert("Error exporting to Excel.");
  }
});
