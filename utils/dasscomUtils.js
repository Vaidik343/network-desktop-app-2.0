const axios = require('axios');

/**
 * Try both Dasscom login APIs to determine device type
 * @param {string} ip - Device IP
 * @param {object} credentials - { username, password }
 * @returns {Promise<'IP Phone'|'Speaker'|'Unknown'>}
 */
async function detectDasscomDeviceType(ip, credentials) {
  if (!ip || !credentials || !credentials.username || !credentials.password) {
    return "Unknown";
  }

  // Define the two possible login URLs/APIs
  const loginUrls = [
    `http://${ip}/action/login?username=${credentials.username}&password=${credentials.password}`,  // API 1 - IP Phone login
    `http://${ip}/api/login`  // API 2 - Speaker login
  ];

  // Try each login API
  for (let i = 0; i < loginUrls.length; i++) {
    try {
      const loginUrl = loginUrls[i];

      // Attempt to login (POST request)
      const loginResponse = await axios.post(loginUrl, {
        username: credentials.username,
        password: credentials.password
      }, {
        timeout: 5000, // 5 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (loginResponse && loginResponse.data) {
        // Login successful
        if (i === 0) {
          return "IP Phone";  // First API succeeded - IP Phone
        } else {
          return "Speaker";  // Second API succeeded - Speaker
        }
      }
    } catch (err) {
      console.log(`❌ Failed login API: ${loginUrls[i]}`, err.message);
      continue; // try next API
    }
  }

  return "Unknown"; // if none worked
}

module.exports = { detectDasscomDeviceType };
