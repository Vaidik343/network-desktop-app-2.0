const { shell } = require("electron"); // add this at the top

// Global cookie store for session management
const cookieStore = new Map();

async function login(ip, username, password) {
  console.log("🚀 ~ login ~ login:", ip, username);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sec timeout

  try {
    const loginUrl = `http://${ip}/action/login?username=${username}&password=${password}`;
    let res = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("🚀 ~ login ~ res (API):", res.status, res.statusText);

    if (res.ok) {
      // ✅ API login worked - store cookies for session management
      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader) {
        cookieStore.set(ip, setCookieHeader);
        console.log("🍪 Stored session cookies for", ip);
      }
      
      const loginData = await res.json();
      return { ...loginData, ip, sessionCookies: setCookieHeader };
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
   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
   }
   
   const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=version`, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });
   
   clearTimeout(timeoutId);
   
   if (!res.ok) {
     throw new Error(`System info fetch failed: ${res.status} ${res.statusText}`);
   }
   
   return await res.json();
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('System info request timed out');
   }
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
   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
   }
   
   const res = await fetch(`http://${ip}/pbx/extension-digital/search-extension`, {
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });
   
   clearTimeout(timeoutId);
   
   if (!res.ok) {
     throw new Error(`Extensions fetch failed: ${res.status} ${res.statusText}`);
   }
   
   return await res.json();
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('Extensions request timed out');
   }
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
   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
   }
   
   const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=svn_version`, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });
   
   clearTimeout(timeoutId);
   
   if (!res.ok) {
     throw new Error(`SVN version fetch failed: ${res.status} ${res.statusText}`);
   }
   
   return await res.json();
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('SVN version request timed out');
   }
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
   if (sessionCookies) {
     headers['Cookie'] = sessionCookies;
   }
   
   const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=ipaddr`, {
     method: "GET",
     headers: headers,
     signal: controller.signal,
     mode: 'cors',
     credentials: 'include' // Include cookies in the request
   });
   
   clearTimeout(timeoutId);
   
   if (!res.ok) {
     throw new Error(`IP address fetch failed: ${res.status} ${res.statusText}`);
   }
   
   return await res.json();
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('IP address request timed out');
   }
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
module.exports = { login, fetchExtensions, fetchSystemInfo, fetchSvnVersion, fetchIpAddress , fetchAccountInfo};