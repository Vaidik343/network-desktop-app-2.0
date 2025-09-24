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

/**
 * Generic function to format API data into an HTML list.
 * Supports nested objects or arrays.
 */
/**
 * Generic function to format any API JSON response into HTML
 * Supports objects, arrays, and nested structures
 */
function formatApiData(data) {
  if (data == null) return "<p>No data available.</p>";

  // Handle array
  if (Array.isArray(data)) {
    if (data.length === 0) return "<p>No data available.</p>";
    return `<ul class="list-group">
      ${data.map(item => `<li class="list-group-item">${formatApiData(item)}</li>`).join("")}
    </ul>`;
  }

  // Handle object
  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (entries.length === 0) return "<p>No data available.</p>";

    return `<ul class="list-group">
      ${entries.map(([key, value]) => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <strong>${key}</strong>
          <span>${Array.isArray(value) || typeof value === "object" ? formatApiData(value) : value}</span>
        </li>
      `).join("")}
    </ul>`;
  }

  // Handle primitive values (string, number, boolean)
  return `<span>${data}</span>`;
}


// 📝 Show Device Details

// 📝 Show Device Details – System Info Only
async function showDeviceDetails(device) {
  try {
    // Try IP Phone login first
    let token = null;
    let deviceType = "Speaker"; // Default to Speaker

    try {
      // Try IP Phone login
      const ipPhoneLoginResult = await window.api.loginDevice(device.ip, "admin", "admin");
      if (ipPhoneLoginResult && ipPhoneLoginResult.loginSuccess) {
        // Try to fetch IP Phone data to confirm it's an IP Phone
        try {
          const systemInfo = await window.api.fetchSystemInfo(device.ip, ipPhoneLoginResult.token);
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
      // Try Speaker login
      token = await window.api.speakerLogin(device.ip, "admin", "admin");
      deviceType = "Speaker";
    }

    // Update the device type in currentData
    const deviceIndex = currentData.findIndex(d => d.ip === device.ip);
    if (deviceIndex !== -1) {
      currentData[deviceIndex].type = deviceType;
      renderDevices(currentData); // Re-render to update the UI
    }

    // Now fetch data based on device type
    if (deviceType === "IP Phone") {
      // For IP Phone, use the IP Phone API functions
      const systemInfo = await window.api.fetchSystemInfo(device.ip, token);
      const svnVersion = await window.api.fetchSvnVersion(device.ip);
      const ipAddress = await window.api.fetchIpAddress(device.ip);
      const accountInfo = await window.api.fetchAccountInfo(device.ip);
      const dns = await window.api.fetchDNS(device.ip);
      const gateway = await window.api.fetchGetway(device.ip);
      const netmask = await window.api.fetchNetMask(device.ip);
      const accountStatus = await window.api.fetchAccountStatus(device.ip);
      const callStatus = await window.api.fetchCallStatus(device.ip);
      const allAccountInfo = await window.api.fetchAllAcountInformation(device.ip);

      const systemInfoHtml = formatApiData(systemInfo);
      const svnVersionHtml = formatApiData(svnVersion);
      const ipAddressHtml = formatApiData(ipAddress);
      const accountInfoHtml = formatApiData(accountInfo);
      const dnsHtml = formatApiData(dns);
      const gatewayHtml = formatApiData(gateway);
      const netmaskHtml = formatApiData(netmask);
      const accountStatusHtml = formatApiData(accountStatus);
      const callStatusHtml = formatApiData(callStatus);
      const allAccountInfoHtml = formatApiData(allAccountInfo);

      modalBody.innerHTML = `
        <div class="card">
          <div class="card-header">IP Phone Info - ${device.ip}</div>
          <div class="card-body d-flex flex-wrap">
            <h5>System Info</h5>
            ${systemInfoHtml}
            <h5>SVN Version</h5>
            ${svnVersionHtml}
            <h5>IP Address</h5>
            ${ipAddressHtml}
            <h5>Account Info</h5>
            ${accountInfoHtml}
            <h5>DNS</h5>
            ${dnsHtml}
            <h5>Gateway</h5>
            ${gatewayHtml}
            <h5>Netmask</h5>
            ${netmaskHtml}
            <h5>Account Status</h5>
            ${accountStatusHtml}
            <h5>Call Status</h5>
            ${callStatusHtml}
            <h5>All Account Info</h5>
            ${allAccountInfoHtml}
          </div>
        </div>
      `;
    } else {
      // For Speaker, use the Speaker API functions
      const systemInfo = await window.api.speakerApi(device.ip, token, "/api/get-system-info");
      const volumePriority = await window.api.speakerApi(device.ip, token, "/api/get-volume-priority");
      const provisioning = await window.api.speakerApi(device.ip, token, "/api/get-privisioning");

      //sip-slave1
      const sipSlave1Info = await window.api.speakerApi(device.ip, token, "/api/get-sip-slave1-info") 

      //sip-slave2
      const sipSlave2Info = await window.api.speakerApi(device.ip, token, "/api/get-sip-slave2-info") 

      //sip-function
      const sipFunctionInfo = await window.api.speakerApi(device.ip, token, "/api/get-sip-function-info") 

      //sip-master
      const sipMasterInfo = await window.api.speakerApi(device.ip, token, "/api/get-sip-master-info") 

      //sip-advance
      const sipAdvanceInfo = await window.api.speakerApi(device.ip, token, "/api/get-sip-advance-info") 

      const sipApi = await window.api.speakerApi(device.ip, token, "/api/get-sipapi") 

      const language = await window.api.speakerApi(device.ip, token, "/api/get-language") 

      const audioCodec = await window.api.speakerApi(device.ip, token, "/api/get-audio-codec") 

      const systemInfoHtml = formatApiData(systemInfo.data || systemInfo);
      const volumePriorityHtml = formatApiData(volumePriority.data || volumePriority);
      const provisioningHtml = formatApiData(provisioning.data || provisioning);
      const slave1Html = formatApiData(sipSlave1Info.data || sipSlave1Info);
      const slave2Html = formatApiData(sipSlave2Info.data || sipSlave2Info);
      const masterHtml = formatApiData(sipMasterInfo.data || sipMasterInfo);
      const functionHtml = formatApiData(sipFunctionInfo.data || sipFunctionInfo);
      const advanceHtml = formatApiData(sipAdvanceInfo.data || sipAdvanceInfo);
      const sipHtml = formatApiData(sipApi.data || sipApi);
      const languageHtml = formatApiData(language.data || language);
      const audioCodecHtml = formatApiData(audioCodec.data || audioCodec);

      modalBody.innerHTML = `
        <div class="card">
          <div class="card-header">Speaker Info - ${device.ip}</div>
          <div class="card-body d-flex flex-wrap">
            <h5>System Info</h5>
            ${systemInfoHtml}
            <h5>Volume Priority</h5>
            ${volumePriorityHtml}
            <h5>Provisioning</h5>
            ${provisioningHtml}
            <h5>Slave1:</h5>
            ${slave1Html}
            <h5>Master:</h5>
            ${masterHtml}
            <h5>Function:</h5>
            ${functionHtml}
            <h5>slave2:</h5>
            ${slave2Html}
            <h5>advance:</h5>
            ${advanceHtml}
            <h5>Sip:</h5>
            ${sipHtml}
            <h5>Language:</h5>
            ${languageHtml}
            <h5>Audio:</h5>
            ${audioCodecHtml}
          </div>
        </div>
      `;
    }

    // Show modal
    const modal = document.getElementById('deviceModal');
    if (modal && modal.classList.contains('modal')) {
      const bootstrap = window.bootstrap;
      if (bootstrap && bootstrap.Modal) new bootstrap.Modal(modal).show();
      else modal.style.display = 'block';
    }

  } catch (err) {
    console.error("❌ Show device details error:", err);
    modalBody.innerHTML = `<div class="alert alert-danger">❌ ${err.message}</div>`;
    // Show modal even on error
    const modal = document.getElementById('deviceModal');
    if (modal && modal.classList.contains('modal')) {
      const bootstrap = window.bootstrap;
      if (bootstrap && bootstrap.Modal) new bootstrap.Modal(modal).show();
      else modal.style.display = 'block';
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
// 🔄 Initial Scan
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const devices = await window.api.scanDevices();

    // Enrich devices safely
    const enrichedDevices = await Promise.all(
      devices.map(async device => {
        try {
          return await window.api.enrichDevice(device, credentials);
        } catch (err) {
          console.error(`Failed to enrich ${device.ip}:`, err.message);
          return { ...device, type: "Unknown" }; // fallback
        }
      })
    );

    // Determine device types
    const devicesWithType = await Promise.all(enrichedDevices.map(async device => {
      const apiType = await determineDeviceType(device.ip);
      if (apiType !== "Unknown") {
        return { ...device, type: apiType };
      }
      return device;
    }));

    currentData = devicesWithType;
    populateDeviceTypeFilter(currentData);
    updateViewToggle();
    renderDevices(currentData);
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

    const enrichedDevices = await Promise.all(
      devices.map(async device => {
        try {
          return await window.api.enrichDevice(device, credentials);
        } catch (err) {
          console.error(`Failed to enrich ${device.ip}:`, err.message);
          return { ...device, type: "Unknown" };
        }
      })
    );

    currentData = enrichedDevices;
    populateDeviceTypeFilter(currentData);
    renderDevices(currentData);
  } catch(err) {
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
    const ipPhoneLoginResult = await window.api.loginDevice(ip, "admin", "admin");
    if (ipPhoneLoginResult && ipPhoneLoginResult.loginSuccess) {
      // Try to fetch IP Phone data to confirm it's an IP Phone
      try {
        const systemInfo = await window.api.fetchSystemInfo(ip, ipPhoneLoginResult.token);
        return "IP Phone";
      } catch (dataError) {
        console.log("IP Phone data fetch failed, trying Speaker login...");
        // Try Speaker login
        const speakerLoginResult = await window.api.speakerLogin(ip, "admin", "admin");
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
    const speakerLoginResult = await window.api.speakerLogin(ip, "admin", "admin");
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
  if (currentData.length === 0) { alert("No devices to export."); return; }
  try {
    const filePath = await window.api.exportExcel(currentData);
    if (filePath) alert(`Excel saved at: ${filePath}`);
    else alert("Failed to export Excel.");
  } catch(err) { console.error(err); alert("Error exporting Excel."); }
});
