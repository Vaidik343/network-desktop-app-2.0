async function login(ip, username, password) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
   
   const res = await fetch(`http://${ip}/action/login?username=${username}&password=${password}`, {
     method: "POST",
     headers: {"Content-Type": "application/json"},
     signal: controller.signal,
     mode: 'cors' // Explicitly set CORS mode
   });

   clearTimeout(timeoutId);

   if (!res.ok) {
     throw new Error(`Login failed: ${res.status} ${res.statusText}`);
   }
   
   const response = await res.json();
   // New API returns: { "wait": 1, "code": 1, "name": "admin" }
   // We'll use the response as the session token
   return response; 
 } catch (error) {
   if (error.name === 'AbortError') {
     throw new Error('Login request timed out');
   }
   throw error;
 }
}

async function fetchSystemInfo(ip, token) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
   
   const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=version`, {
     method: "GET",
     signal: controller.signal,
     mode: 'cors'
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
   
   const res = await fetch(`http://${ip}/pbx/extension-digital/search-extension`, {
     headers: { Authorization: token },
     signal: controller.signal,
     mode: 'cors'
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
   
   const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=svn_version`, {
     method: "GET",
     signal: controller.signal,
     mode: 'cors'
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
   
   const res = await fetch(`http://${ip}/cgi-bin/infos.cgi?oper=query&param=ipaddr`, {
     method: "GET",
     signal: controller.signal,
     mode: 'cors'
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

module.exports = { login, fetchExtensions, fetchSystemInfo, fetchSvnVersion, fetchIpAddress };