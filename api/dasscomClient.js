const { shell } = require("electron"); // add this at the top

// Global cookie store for session management
const cookieStore = new Map();

// Helper function to clear session cookies
function clearSession(ip) {
  cookieStore.delete(ip);
  console.log("🧹 Cleared session cookies for", ip);
}

async function login(ip, username, password) {
  console.log("🚀 ~ login ~ login:", ip, username);

  // Clear any existing session cookies before login to avoid stale sessions
  clearSession(ip);
  console.log("🧹 Cleared existing session cookies for", ip, "before login");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sec timeout

  try {
    const loginUrl = `http://${ip}/action/login?username=${username}&password=${password}`;
    console.log("🔗 Login URL:", loginUrl);

    let res = await fetch(loginUrl, {
      method: "GET", // Changed from POST to GET based on endpoint format
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      mode: 'cors',
      credentials: 'include' // Include cookies in the request
    });

    clearTimeout(timeoutId);
    console.log("🚀 ~ login ~ res (API):", res.status, res.statusText);
    console.log("🚀 ~ login ~ res headers:", res.headers);

    if (res.ok) {
      // ✅ API login worked - store cookies for session management
      // In Node.js, headers are accessed differently than in browser
      const setCookieHeaders = res.headers.get('set-cookie');
      console.log("🍪 Set-Cookie header:", setCookieHeaders);

      if (setCookieHeaders) {
        // Store the cookie string directly
        cookieStore.set(ip, setCookieHeaders);
        console.log("🍪 Stored session cookies for", ip, ":", setCookieHeaders);
      } else {
        console.warn("⚠️ No set-cookie header found in login response");
      }

      // Try to parse response as JSON, but handle cases where response might be empty
      let loginData = {};
      try {
        const responseText = await res.text();
        if (responseText) {
          loginData = JSON.parse(responseText);
        }
        console.log("📄 Login response data:", loginData);
      } catch (parseError) {
        console.log("📄 Login response is not JSON or empty:", parseError.message);
      }

      return { ...loginData, ip, hasSession: !!setCookieHeaders, loginSuccess: true };
    } else {
      // ❌ API login failed → open normal web UI
      console.warn(`⚠️ Login endpoint failed (${res.status}), opening in browser...`);
      shell.openExternal(`http://${ip}`);
      return { openedBrowser: true };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("❌ Login request error:", error.message);

    // If request itself failed (timeout / network) → still open browser
    shell.openExternal(`http://${ip}`);
    return { openedBrowser: true };
  }
}


async function fetchSystemInfo(ip, token) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

   // Build headers with session cookies
   const headers = {
     'Content-Type': 'application/json',
   };

   // Add session cookies if available
   const sessionCookies = cookieStore.get(ip);
   console.log("🍪 Fetching system info for", ip, "- Session cookies:", sessionCookies);

   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
     console.log("🍪 Added session cookies to headers for", ip);
   } else {
     console.warn("⚠️ No session cookies found for", ip, "- API call may fail with 401");
   }

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=version`;
   console.log("🔗 System info API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });

   clearTimeout(timeoutId);
   console.log("🚀 ~ fetchSystemInfo ~ res:", res.status, res.statusText);

   if (!res.ok) {
     console.error("❌ System info fetch failed:", res.status, res.statusText);
     throw new Error(`System info fetch failed: ${res.status} ${res.statusText}`);
   }

   const data = await res.json();
   console.log("📄 System info response:", data);
   return data;
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('System info request timed out');
   }
   console.error("❌ System info fetch error:", error.message);
   throw error;
 }
}

// Alternative function to try basic auth if cookies don't work
async function fetchSystemInfoWithAuth(ip, username = 'admin', password = 'admin') {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000);

   // Try basic authentication
   const authString = btoa(`${username}:${password}`);
   const headers = {
     'Authorization': `Basic ${authString}`,
     'Content-Type': 'application/json',
   };

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=version`;
   console.log("🔗 System info API URL (with basic auth):", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include'
   });

   clearTimeout(timeoutId);
   console.log("🚀 ~ fetchSystemInfoWithAuth ~ res:", res.status, res.statusText);

   if (!res.ok) {
     console.error("❌ System info fetch with auth failed:", res.status, res.statusText);
     throw new Error(`System info fetch failed: ${res.status} ${res.statusText}`);
   }

   const data = await res.json();
   console.log("📄 System info response (with auth):", data);
   return data;
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('System info request timed out');
   }
   console.error("❌ System info fetch with auth error:", error.message);
   throw error;
 }
}


async function fetchExtensions(ip, token) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

   // Build headers with session cookies and authorization token
   const headers = {
     'Content-Type': 'application/json',
   };

   // Add authorization token if provided
   if (token) {
     headers['Authorization'] = token;
   }

   // Add session cookies if available
   const sessionCookies = cookieStore.get(ip);
   console.log("🍪 Fetching extensions for", ip, "- Session cookies:", sessionCookies);

   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
     console.log("🍪 Added session cookies to headers for", ip);
   } else {
     console.warn("⚠️ No session cookies found for", ip, "- API call may fail with 401");
   }

   const apiUrl = `http://${ip}/pbx/extension-digital/search-extension`;
   console.log("🔗 Extensions API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });

   clearTimeout(timeoutId);
   console.log("🚀 ~ fetchExtensions ~ res:", res.status, res.statusText);

   if (!res.ok) {
     console.error("❌ Extensions fetch failed:", res.status, res.statusText);
     throw new Error(`Extensions fetch failed: ${res.status} ${res.statusText}`);
   }

   const data = await res.json();
   console.log("📄 Extensions response:", data);
   return data;
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('Extensions request timed out');
   }
   console.error("❌ Extensions fetch error:", error.message);
   throw error;
 }
}

// Query SVN version number
async function fetchSvnVersion(ip) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

   // Build headers with session cookies
   const headers = {
     'Content-Type': 'application/json',
   };

   // Add session cookies if available
   const sessionCookies = cookieStore.get(ip);
   console.log("🍪 Fetching SVN version for", ip, "- Session cookies:", sessionCookies);

   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
     console.log("🍪 Added session cookies to headers for", ip);
   } else {
     console.warn("⚠️ No session cookies found for", ip, "- API call may fail with 401");
   }

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=svn_version`;
   console.log("🔗 SVN version API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });

   clearTimeout(timeoutId);
   console.log("🚀 ~ fetchSvnVersion ~ res:", res.status, res.statusText);

   if (!res.ok) {
     console.error("❌ SVN version fetch failed:", res.status, res.statusText);
     throw new Error(`SVN version fetch failed: ${res.status} ${res.statusText}`);
   }

   const data = await res.json();
   console.log("📄 SVN version response:", data);
   return data;
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('SVN version request timed out');
   }
   console.error("❌ SVN version fetch error:", error.message);
   throw error;
 }
}

// Get IP Address
async function fetchIpAddress(ip) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

   // Build headers with session cookies
   const headers = {
     'Content-Type': 'application/json',
   };

   // Add session cookies if available
   const sessionCookies = cookieStore.get(ip);
   console.log("🍪 Fetching IP address for", ip, "- Session cookies:", sessionCookies);

   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
     console.log("🍪 Added session cookies to headers for", ip);
   } else {
     console.warn("⚠️ No session cookies found for", ip, "- API call may fail with 401");
   }

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=ipaddr`;
   console.log("🔗 IP address API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });

   clearTimeout(timeoutId);
   console.log("🚀 ~ fetchIpAddress ~ res:", res.status, res.statusText);

   if (!res.ok) {
     console.error("❌ IP address fetch failed:", res.status, res.statusText);
     throw new Error(`IP address fetch failed: ${res.status} ${res.statusText}`);
   }

   const data = await res.json();
   console.log("📄 IP address response:", data);
   return data;
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('IP address request timed out');
   }
   console.error("❌ IP address fetch error:", error.message);
   throw error;
 }
}

//get account information
async function fetchAccountInfo(ip) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Build headers with session cookies
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add session cookies if available
    const sessionCookies = cookieStore.get(ip);
    if (sessionCookies) {
      headers['Cookie'] = sessionCookies;
    }

    const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=account_infos`, {
      method: "GET",
      headers: headers,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'include' // Include cookies in the request
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Account info fetch failed: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Account info request timed out');
    }

    throw error;
  }
}
module.exports = { login, fetchExtensions, fetchSystemInfo, fetchSystemInfoWithAuth, fetchSvnVersion, fetchIpAddress, fetchAccountInfo, clearSession };
