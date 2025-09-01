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
 


              case 'account-info':
        apiName = 'Account info';
        result = await window.api.fetchAccountInfo(ip);
        break;
              case 'dns':
        apiName = 'DNS';
        result = await window.api.fetchDNS(ip);
        break;
              case 'getway':
        apiName = 'Getway';
        result = await window.api.fetchGetway(ip);
        break;
              case 'net-Mask':
        apiName = 'Net Mask';
        result = await window.api.fetchNetMask(ip);
        break;
              case 'call-status':
        apiName = 'Call status ';
        result = await window.api.fetchCallStatus(ip);
        break;
       
              case 'all-account-info':
        apiName = 'All Account Info';
        result = await window.api.fetchAllAcountInformation(ip);
        break;
              case 'restart':
        apiName = 'Restart';
        result = await window.api.fetchRestart(ip);
        break;
              case 'reset':
        apiName = 'Reset';
        result = await window.api.fetchReset(ip);
        break;
              case 'call':
        apiName = 'Call';
        result = await window.api.fetchCall(ip);
        break;
      default:
        throw new Error(`Unknown API type: ${apiType}`);
    }

    // Display the result
    console.log(`${apiName} API result received in renderer:`, result);
    console.log(`${apiName} API result type:`, typeof result);
    console.log(`${apiName} API result keys:`, result ? Object.keys(result) : 'null/undefined');

    const formattedResult = JSON.stringify(result, null, 2);
    console.log(`${apiName} API formatted result:`, formattedResult);

    responseContent.innerHTML = `
      <div class="alert alert-success mb-2">
        <strong>✅ ${apiName} API Response:</strong>
        <small class="text-muted">Authentication successful</small>
      </div>
      <pre class="mb-0" style="font-size: 12px; color: #000000; background-color: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #dee2e6;">
        <code style="color: #000000; font-family: 'Courier New', monospace;">${formattedResult}</code>
      </pre>
      <div class="mt-2 small text-muted">
        <strong>Debug Info:</strong><br>
        Type: ${typeof result}<br>
        Keys: ${result ? Object.keys(result).join(', ') : 'null/undefined'}<br>
        Raw: ${JSON.stringify(result)}
      </div>
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

async function showDeviceDetails(device) {
  const modalBody = document.getElementById("deviceModalBody");
  const ip = device.ip || "Unknown";

  // Show loading state initially
  modalBody.innerHTML = `
    <div class="text-center">
      <h4>${ip}</h4>
      <hr>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Fetching API data...</p>
    </div>
  `;

  // Show modal immediately
  const modalElement = document.getElementById("deviceModal");
  let deviceModal = bootstrap.Modal.getInstance(modalElement);
  if (!deviceModal) deviceModal = new bootstrap.Modal(modalElement);
  deviceModal.show();

  try {
    // Fetch all API data in parallel
    console.log(`Fetching all API data for ${ip}`);
    const [systemInfo, svnVersion, ipAddress, accountInfo, extensions] = await Promise.allSettled([
      window.api.fetchSystemInfo(ip).catch(err => ({ error: err.message })),
      window.api.fetchSvnVersion(ip).catch(err => ({ error: err.message })),
      window.api.fetchIpAddress(ip).catch(err => ({ error: err.message })),
      window.api.fetchAccountInfo(ip).catch(err => ({ error: err.message })),
      // window.api.fetchExtensions(ip).catch(err => ({ error: err.message }))
    ]);

    // Format API responses
    const formatApiResponse = (result, title, icon) => {
      if (result.status === 'rejected' || result.value?.error) {
        return `
          <div class="col-md-6 mb-3">
            <div class="card h-100 border-danger">
              <div class="card-header bg-danger text-white">
                <h6 class="mb-0">${icon} ${title}</h6>
              </div>
              <div class="card-body">
                <div class="alert alert-danger mb-0">
                  <strong>❌ Failed:</strong> ${result.value?.error || result.reason?.message || 'Unknown error'}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      const data = result.value;

      // Format data as readable text instead of JSON
      const formatDataAsText = (obj) => {
        if (!obj || typeof obj !== 'object') {
          return String(obj || 'N/A');
        }

        const entries = Object.entries(obj);
        if (entries.length === 0) {
          return 'No data available';
        }

        return entries.map(([key, value]) => {
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value || 'N/A');
          return `<strong>${displayKey}:</strong> ${displayValue}`;
        }).join('<br>');
      };

      const formattedData = formatDataAsText(data);

      return `
        <div class="col-md-6 mb-3">
          <div class="card h-100 api-data-card">
            <div class="card-header api-data-header">
              <h6 class="mb-0">${icon} ${title}</h6>
            </div>
            <div class="card-body">
              <div class="api-data-content" style="font-size: 14px; color: #333; line-height: 1.5; max-height: 200px; overflow-y: auto;">
                ${formattedData}
              </div>
            </div>
          </div>
        </div>
      `;
    };

    // Update modal with all data
    modalBody.innerHTML = `
      <div class="row">
        <div class="col-md-12 mb-3">
          <h4 class="text-center">${ip}</h4>
          <hr>
        </div>

        <!-- Basic Information -->
        <div class="col-md-12 mb-4">
          <div class="card">
            <div class="card-header text-white">
              <h6 class="mb-0">📋 Basic Information</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Status:</strong> <span class="badge ${device.alive ? 'bg-success' : 'bg-danger'}">${device.alive ? "Online" : "Offline"}</span></p>
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
          <h5 class="text-center mb-3"> API Data</h5>
          <div class="row">
            ${formatApiResponse(systemInfo, 'System Info', '📊')}
            ${formatApiResponse(svnVersion, 'SVN Version', '🔢')}
            ${formatApiResponse(ipAddress, 'IP Address', '🌐')}
            ${formatApiResponse(accountInfo, 'Account Info', '👤')}

            ${formatApiResponse(await window.api.fetchDNS(ip).catch(err => ({ error: err.message })), 'DNS', '🌐')}
            ${formatApiResponse(await window.api.fetchGetway(ip).catch(err => ({ error: err.message })), 'Gateway', '🚪')}
            ${formatApiResponse(await window.api.fetchNetMask(ip).catch(err => ({ error: err.message })), 'Netmask', '📶')}
            ${formatApiResponse(await window.api.fetchAccountStatus(ip).catch(err => ({ error: err.message })), 'Account Status', '👤')}
            ${formatApiResponse(await window.api.fetchCallStatus(ip).catch(err => ({ error: err.message })), 'Call Status', '📞')}
            ${formatApiResponse(await window.api.fetchAllAcountInformation(ip).catch(err => ({ error: err.message })), 'All Account Information', '📋')}
            ${formatApiResponse(await window.api.fetchCall(ip).catch(err => ({ error: err.message })), 'Call', '📞')}
          </div>

          <!-- Action Buttons -->
          <div class="col-md-12 mt-4">
            <h5 class="text-center mb-3"> Device Actions</h5>
            <div class="row justify-content-center">
              <div class="col-md-4 mb-3">
                <button id="restartBtn" class="btn btn-warning btn-lg w-100" onclick="confirmRestart('${ip}')">
                  <i class="fas fa-redo"></i> Restart Device
                </button>
              </div>
              <div class="col-md-4 mb-3">
                <button id="resetBtn" class="btn btn-danger btn-lg w-100" onclick="confirmReset('${ip}')">
                  <i class="fas fa-power-off"></i> Reset Device
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add action button event listeners
    setTimeout(() => {
      const restartBtn = document.getElementById('restartBtn');
      const resetBtn = document.getElementById('resetBtn');

      if (restartBtn) {
        restartBtn.addEventListener('click', () => confirmRestart(ip));
      }
      if (resetBtn) {
        resetBtn.addEventListener('click', () => confirmReset(ip));
      }
    }, 100);

  } catch (error) {
    console.error("Error fetching API data:", error);
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <h4>${ip}</h4>
        <hr>
        <h6>❌ Error Loading Device Data</h6>
        <p>Could not fetch API data for this device.</p>
        <p><strong>Error:</strong> ${error.message}</p>
      </div>
    `;
  }
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

// 🔄 Device Action Functions
async function confirmRestart(ip) {
  const result = confirm(`⚠️ WARNING: Restart Device\n\nAre you sure you want to restart the device at ${ip}?\n\nThis will temporarily disconnect the device from the network.`);
  if (result) {
    try {
      const response = await window.api.fetchRestart(ip);
      alert(`✅ Device restart initiated successfully!\n\nDevice: ${ip}\nResponse: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      alert(`❌ Failed to restart device ${ip}\n\nError: ${error.message}`);
    }
  }
}

async function confirmReset(ip) {
  const result = confirm(`🚨 DANGER: Reset Device\n\nAre you sure you want to RESET the device at ${ip}?\n\n⚠️ WARNING: This will restore the device to factory settings and may cause data loss!`);
  if (result) {
    const secondConfirm = confirm(`🔴 FINAL CONFIRMATION\n\nYou are about to RESET device ${ip} to factory settings.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`);
    if (secondConfirm) {
      try {
        const response = await window.api.fetchReset(ip);
        alert(`✅ Device reset initiated successfully!\n\nDevice: ${ip}\nResponse: ${JSON.stringify(response, null, 2)}`);
      } catch (error) {
        alert(`❌ Failed to reset device ${ip}\n\nError: ${error.message}`);
      }
    }
  }
}
