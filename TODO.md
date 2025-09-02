# Fix Device Status Check Issue

## Problem
When clicking on an IP in the network scanner, the status always shows "Offline" even for devices that are online.

## Root Cause
The ARP scan retrieves devices from the ARP table but does not verify if they are currently online. The `enrichDevice` function in `utils/deviceUtils.js` does not perform a ping check to determine the `alive` status.

## Plan
- [x] Modify `utils/deviceUtils.js` to import the `ping` module
- [x] Update the `enrichDevice` function to ping devices if `device.alive` is not already `true`
- [x] Set `alive` and `responseTime` based on ping results
- [x] Ensure subnet scan devices (already pinged) are not pinged again

## Files to Edit
- `utils/deviceUtils.js`

## Followup Steps
- [ ] Test the application by running a scan and clicking on device IPs
- [ ] Verify that online devices now show "Online" status
- [ ] Check console logs for ping attempts and results
- [ ] If issues persist, consider increasing ping timeout or debugging ping failures
