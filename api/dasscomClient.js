async function login(ip, username, password) {
 try {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
   
   const res = await fetch(`http://${ip}/auth/login`, {
     method: "POST",
     headers: {"Content-Type": "application/json"},
     body: JSON.stringify({username, password}),
     signal: controller.signal,
     mode: 'cors' // Explicitly set CORS mode
   });

   clearTimeout(timeoutId);

   if (!res.ok) {
     throw new Error(`Login failed: ${res.status} ${res.statusText}`);
   }
   
   const response = await res.json();
   const {data: token} = response;
   return token; 
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
   
   const res = await fetch(`http://${ip}/pbx/systeminfo/version`, {
     headers: { Authorization: token },
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

module.exports = {login, fetchExtensions, fetchSystemInfo}