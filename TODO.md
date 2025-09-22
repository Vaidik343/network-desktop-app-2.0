# TODO List for DC Scan Network Project - Speaker API Integration

## Current Task: Integrate New Speaker APIs with Separate Login

### Issues to Address:
- ✅ Create separate speaker login function (different from IP phone)
- ✅ Add comprehensive speaker APIs in dasscomClient.js
- ✅ Update main.js with IPC handlers for speaker APIs
- ✅ Update preload.js to expose speaker functions
- ✅ Create UI components for speaker APIs
- ✅ Handle offline functionality

### Implementation Plan:

#### 1. dasscomClient.js Updates:
- [ ] Create separate `speakerLogin` function (different from IP phone login)
- [ ] Add comprehensive speaker API functions
- [ ] Implement proper error handling and timeouts

#### 2. main.js Updates:
- [ ] Add IPC handlers for all speaker APIs
- [ ] Implement offline handling logic
- [ ] Add proper token management

#### 3. preload.js Updates:
- [ ] Expose speaker API functions to renderer
- [ ] Add offline detection and handling

#### 4. UI Integration:
- [ ] Add speaker API buttons to device details modal
- [ ] Create speaker control interface
- [ ] Add status indicators for speaker functionality

#### 5. Testing:
- [ ] Test speaker login functionality
- [ ] Test all speaker APIs
- [ ] Test offline functionality
- [ ] Test UI integration

### Current Status:
- [ ] Planning phase completed
- [ ] Implementation started
