# Dasscom IP Phone API Test Suite

This test suite provides a complete testing environment for the Dasscom IP Phone API when you don't have physical access to the phone.

## 📁 Project Structure

```
test/
├── mockDasscomServer.js     # Mock server simulating Dasscom phone API
├── testDasscomAPI.js        # Test runner for all API functions
├── package.json             # Test dependencies
├── config/
│   └── testConfig.json      # Test configuration
└── testData/
    └── sampleResponses.json # Sample API responses
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd test
npm install
```

### 2. Start the Mock Server

```bash
npm run start-server
```

The mock server will start on `http://localhost:3001`

### 3. Run Tests (in a new terminal)

```bash
npm test
```

### 4. Or run both together

```bash
npm run dev
```

## 🧪 Available Tests

The test suite covers all API functions:

- **Login Authentication** - Tests successful and failed login scenarios
- **System Information** - Retrieves version and build information
- **Extensions** - Fetches phone extension data (requires auth)
- **SVN Version** - Gets software revision information
- **IP Address** - Retrieves network configuration
- **Account Information** - Gets user account details
- **Error Handling** - Tests timeout and error scenarios

## 🔧 Configuration

Edit `test/config/testConfig.json` to customize test parameters:

```json
{
  "ip": "localhost:3001",
  "username": "admin",
  "password": "admin"
}
```

## 📊 Sample Responses

The mock server returns realistic responses based on actual Dasscom phone behavior:

**Login Success:**
```json
{
  "wait": 1,
  "code": 1,
  "name": "admin"
}
```

**System Info:**
```json
{
  "version": "2.0.1.12",
  "build_date": "2023-10-15",
  "hardware": "Dasscom IP Phone v2"
}
```

**Extensions:**
```json
{
  "extensions": [
    {
      "id": 1001,
      "number": "1001",
      "name": "John Doe",
      "status": "registered",
      "ip_address": "192.168.1.101"
    }
  ]
}
```

## 🎯 Testing Scenarios

### Normal Operation
- ✅ Successful authentication
- ✅ Valid API responses
- ✅ Proper data parsing

### Error Conditions
- ❌ Invalid credentials
- ⏰ Request timeouts
- 🔌 Network failures
- 🚫 Unauthorized access

## 🔍 Manual Testing

You can also test the API manually using curl:

```bash
# Test login
curl -X POST "http://localhost:3001/action/login?username=admin&password=admin"

# Test system info
curl "http://localhost:3001/cgi-bin/infos.cgi?oper=query&param=version"

# Test extensions (with auth)
curl -H "Authorization: mock-token-12345" "http://localhost:3001/pbx/extension-digital/search-extension"
```

## 🛠️ Customization

To modify the mock responses, edit the response objects in:
- `test/mockDasscomServer.js` - For dynamic responses
- `test/testData/sampleResponses.json` - For static response data

## 📝 Notes

- The mock server runs on port 3001 by default
- All API endpoints match the actual Dasscom phone API structure
- Error scenarios can be tested using the `/simulate-error/` endpoints
- Timeout testing uses non-responsive IP addresses

## 🎯 Next Steps

After testing with the mock server, you can:
1. Update your main application to use the tested API functions
2. Add more comprehensive error handling based on test results
3. Create integration tests with your actual application logic
4. Prepare for real device testing once available
