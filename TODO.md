# TODO: Fix Dasscom Device Type Detection

## Completed Steps
- [x] Added `socket.io-client` to `package.json` and installed it.
- [x] Updated `arpScanner.js` to include SIP ports (5060, 5061) in the default port scan list.
- [x] Modified `utils/deviceUtils.js` to scan open ports if not available and pass them to `detectDeviceType`.
- [x] Updated `detectDeviceType` function to check for open ports (80, 443) to distinguish IP Phone from Speaker for Dasscom devices.
- [x] Ensured the application is running with the changes.

## Remaining Steps
- [x] Fixed the "scanPorts is not a function" error by exporting scanPorts from arpScanner.js.
- [x] Added vendor mapping for "hubris technologies private limited" to "IP Phone" in `config/device-mappings.json`.
- [x] Implemented API-based device type detection in `utils/dasscomUtils.js` and integrated it into `utils/deviceUtils.js`.
- [x] Fixed credentials passing in `arpScanner.js` to enable API calls.
- [x] Updated API endpoints in `utils/dasscomUtils.js` to match the correct flow from `api/dasscomClient.js`.
- [x] Simplified the logic to check which login API succeeds: first API for IP Phone, second for Speaker.
- [x] Added MAC filter to only display devices with MAC prefix '8C:1F:64' in `arpScanner.js`.
- [x] Fixed MAC normalization to handle dashes and case sensitivity.
- [x] Fixed "p is not defined" error in `arpScanner.js` by correcting the console.log variable.
- [x] Removed the problematic console.log statement to prevent "port is not defined" error.
- [x] Updated `api/dasscomClient.js` to try without auth first for alternative endpoints in speakerApi function.
- [x] Updated `src/renderer.js` to try IP Phone login first, then Speaker login in showDeviceDetails function.
- [x] Updated `src/renderer.js` to try IP Phone data fetch after login, if it fails, try Speaker login.
- [x] Fixed modal not showing on error in `src/renderer.js`.
- [x] Fixed function name mismatch: `fetchDns` to `fetchDNS`, `fetchNetmask` to `fetchNetMask`, and `fetchAllAccountInfo` to `fetchAllAcountInformation` in `src/renderer.js`.
- [x] Updated `src/renderer.js` to update the device type in `currentData` based on which login API succeeds and re-render the UI.
- [x] Modified `arpScanner.js` to determine the device type using login APIs during the initial scan, so the type is displayed from the start. Only update the type if the API succeeds, otherwise keep the original type.
- [x] Added device type determination in `src/renderer.js` for the initial scan to ensure the type is set before clicking on the IP.
- [x] Enhanced `determineDeviceType` function to try fetching IP Phone data after login to confirm it's an IP Phone, and fall back to Speaker if it fails.
- [x] Tested the changes by running the application and scanning the network to verify that the IP phone displays as "IP Phone" and the speaker as "Speaker".
- [x] Ensured all dependencies are installed and the application runs without errors.
