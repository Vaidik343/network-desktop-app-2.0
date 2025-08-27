import { login, fetchSystemInfo } from '../api/dasscomClient';
import { showDeviceDetails } from '../utils/modalRenderer.js'; // ✅ reuse modal

export async function handleFetch(deviceOrIp) {
  try {
    // Handle both device object and IP string
    const ip = typeof deviceOrIp === 'string' ? deviceOrIp : deviceOrIp.ip;
    const device = typeof deviceOrIp === 'string' ? { ip: deviceOrIp } : deviceOrIp;
    
    console.log(`Attempting to fetch system info for IP: ${ip}`);
    
    const token = await login(ip, "admin", "admin");
    const info = await fetchSystemInfo(ip, token);

    const enrichedDevice = {
      ...device,
      version: info.version,
      build: info.build,
      model: info.model
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
