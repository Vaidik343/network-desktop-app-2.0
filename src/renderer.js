const scanBtn = document.getElementById("scanBtn");
const excelBtn = document.getElementById("excelBtn");
const searchInput = document.getElementById("searchInput");
const cardContainer = document.getElementById("card-container");
const emptyMessage = document.getElementById("emptyMessage");
const modalBody = document.getElementById("deviceModalBody");

let currentData = [];
console.log("🚀 ~ currentData:", currentData)

// 🔍 Render device cards
function renderCards(data) {
  cardContainer.innerHTML = "";

  if (!data || data.length === 0) {
    emptyMessage.style.display = "block";
    return;
  }

  emptyMessage.style.display = "none";

  data.forEach((device) => {
    const card = document.createElement("div");
    card.className = "col-sm-12 col-md-6 col-lg-4";

    card.innerHTML = `
      <div class="card h-100 shadow-sm" style="cursor:pointer;">
        <div class="card-body">
          <h5 class="card-title text-primary ip-cell" data-ip="${device.ip}" title="Open in browser">${device.ip}</h5>
          <p class="card-text mb-1"><strong>MAC:</strong> ${device.mac || "Unknown"}</p>
          <p class="card-text mb-1"><strong>Type:</strong> ${device.type || "Unknown"}</p>
      
        </div>
      </div>
    `;

    // 📌 Full card click: show device details
    card.querySelector(".card").addEventListener("click", () => {
      showDeviceDetails(device);
    });

    // 🌐 IP click: open in browser
    card.querySelector(".ip-cell").addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering card click
      const ip = e.target.getAttribute("data-ip");
      window.api.openIP(ip);
    });

    cardContainer.appendChild(card);
  });
}

// 📊 Show device details in modal
function showDeviceDetails(result) {
  console.log("🚀 ~ showDeviceDetails ~ result:", result);

  const modalBody = document.getElementById("deviceModalBody");
  if (!modalBody) {
  console.error("❌ Modal body element not found!");
  return;
}
  modalBody.innerHTML = `
    <h4>${result.ip || "Unknown"}</h4>
    <p><strong>Status:</strong> ${result.alive ? "Online" : "Offline"}</p>
    
    <p><strong>Hostname:</strong> ${result.hostname || "Unknown"}</p>
    <p><strong>Vendor:</strong> ${result.vendor || "Unknown"}</p>
    
    <p><strong>Open Ports:</strong> ${result.openPorts?.join(", ") || "None"}</p>
    <p><strong>Response Time:</strong> ${result.responseTime || "Unknown"} ms</p>
  `;


   const deviceModal = new bootstrap.Modal(document.getElementById("deviceModal"));
  deviceModal.show();
}

// 🚀 Initial scan on load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const devices = await window.api.scanDevices();
    currentData = devices;
    renderCards(devices);
  } catch (err) {
    console.error("Initial scan failed:", err);
    emptyMessage.textContent = "Failed to load devices.";
    emptyMessage.style.display = "block";
  }
});

// 🔄 Manual scan
scanBtn.addEventListener("click", async () => {
  try {
    const devices = await window.api.scanDevices();
    currentData = devices;
    renderCards(devices);
  } catch (err) {
    console.error("Scan failed:", err);
    alert("Failed to scan network.");
  }
});

//  Search filter
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = currentData.filter(
    (d) =>
      d.ip.toLowerCase().includes(query) ||
      d.mac?.toLowerCase().includes(query) ||
      d.hostname?.toLowerCase().includes(query)
  );
  renderCards(filtered);
});

//  Export to Excel
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
    const filePath = await window.api.exportExcel(filtered); // IPC call to main
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
