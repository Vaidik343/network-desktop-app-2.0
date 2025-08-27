// modalRenderer.js
export function showDeviceDetails(device) {
  const modalBody = document.getElementById("deviceModalBody");
  modalBody.innerHTML = `
    <h4>${device.ip || "Unknown"}</h4>
    <p><strong>Status:</strong> ${device.alive ? "Online" : "Offline"}</p>
    <p><strong>Hostname:</strong> ${device.hostname || "Unknown"}</p>
    <p><strong>Vendor:</strong> ${device.vendor || "Unknown"}</p>
    <p><strong>Open Ports:</strong> ${device.openPorts?.join(", ") || "None"}</p>
    <p><strong>Response Time:</strong> ${device.responseTime || "Unknown"} ms</p>
    <p><strong>Version:</strong> ${device.version || "Unknown"}</p>
    <p><strong>Build:</strong> ${device.build || "Unknown"}</p>
    <p><strong>Model:</strong> ${device.model || "Unknown"}</p>
  `;

  const modalElement = document.getElementById("deviceModal");
  let deviceModal = bootstrap.Modal.getInstance(modalElement);
  if (!deviceModal) deviceModal = new bootstrap.Modal(modalElement);
  deviceModal.show();
}
