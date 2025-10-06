# TODO: Add Logs Display on Screen for Easier Debugging

## Completed Tasks
- [x] Add a dedicated log display container in index.html
- [x] Implement logging utility in src/renderer.js to append logs to the container
- [x] Override console.log, console.error, console.warn, and console.info to also output logs to the on-screen container
- [x] Add a "Clear Logs" button to reset the log display

## Issues Found
- [ ] On-screen logs only show renderer process logs, not main process logs from terminal
- [ ] Need to add IPC communication to send main process logs to renderer for display

## Next Steps
- [ ] Modify main.js to override console methods and send logs via IPC to renderer
- [ ] Modify renderer.js to listen for IPC log messages and append to on-screen logs
