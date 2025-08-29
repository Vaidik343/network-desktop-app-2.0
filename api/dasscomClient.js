const { shell } = require("electron"); // add this at the top



async function login(ip, username, password) {
  console.log("🚀 ~ login ~ login:", ip, username);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sec timeout

  try {
    const loginUrl = `http://${ip}/action/login?username=${username}&password=${password}`;
    console.log("🔗 Login URL:", loginUrl);

    let res = await fetch(loginUrl, {
      method: "POST", // Use POST method as per API documentation
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      mode: 'cors'
    });

    clearTimeout(timeoutId);
    console.log("🚀 ~ login ~ res (API):", res.status, res.statusText);

    if (res.ok) {
      // ✅ API login worked - parse response
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

      return { ...loginData, ip, loginSuccess: true };
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

   // Use Basic Auth directly as per API documentation
   const authString = btoa('admin:admin');
   const headers = {
     'Authorization': `Basic ${authString}`,
     'Content-Type': 'application/json',
   };

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=version`;
   console.log("🔗 System info API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors'
   });

   clearTimeout(timeoutId);
   console.log("🚀 ~ fetchSystemInfo ~ res:", res.status, res.statusText);

   if (!res.ok) {
     console.error("❌ System info fetch failed:", res.status, res.statusText);
     throw new Error(`System info fetch failed: ${res.status} ${res.statusText}`);
   }

   const responseText = await res.text();
   console.log("📄 System info raw response text:", responseText);

   let data;
   try {
     data = JSON.parse(responseText);
     console.log("📄 System info parsed response:", data);
   } catch (parseError) {
     console.error("❌ Failed to parse system info response as JSON:", parseError.message);
     console.log("📄 Response text that failed to parse:", responseText);
     // Return the raw text if JSON parsing fails
     return { rawResponse: responseText };
   }

   return data;
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('System info request timed out');
   }
   console.error("❌ System info fetch error:", error.message);
   throw error;
 }
}




async function fetchExtensions(ip, token) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

   // Use Basic Auth directly as per API documentation
   const authString = btoa('admin:admin');
   const headers = {
     'Authorization': `Basic ${authString}`,
     'Content-Type': 'application/json',
   };

   const apiUrl = `http://${ip}/pbx/extension-digital/search-extension`;
   console.log("🔗 Extensions API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     headers: headers,
     signal: controller.signal,
     mode: 'cors'
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

   // Use Basic Auth directly as per API documentation
   const authString = btoa('admin:admin');
   const headers = {
     'Authorization': `Basic ${authString}`,
     'Content-Type': 'application/json',
   };

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=svn_version`;
   console.log("🔗 SVN version API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors'
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

   // Use Basic Auth directly as per API documentation
   const authString = btoa('admin:admin');
   const headers = {
     'Authorization': `Basic ${authString}`,
     'Content-Type': 'application/json',
   };

   const apiUrl = `http://${ip}/cgi-bin/infos.cgi?oper=query&param=ipaddr`;
   console.log("🔗 IP address API URL:", apiUrl);

   const res = await fetch(apiUrl, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors'
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

    // Use Basic Auth directly as per API documentation
    const authString = btoa('admin:admin');
    const headers = {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=account_infos`, {
      method: "GET",
      headers: headers,
      signal: controller.signal,
      mode: 'cors'
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
module.exports = { login, fetchExtensions, fetchSystemInfo, fetchSvnVersion, fetchIpAddress, fetchAccountInfo };
