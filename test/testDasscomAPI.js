const { login, fetchExtensions, fetchSystemInfo, fetchSvnVersion, fetchIpAddress, fetchAccountInfo } = require('../api/dasscomClient');

// Test configuration
const TEST_CONFIG = {
  ip: 'localhost:3001',
  username: 'admin',
  password: 'admin',
  authToken: 'mock-token-12345'
};

// Test runner
async function runTests() {
  console.log('🧪 Starting Dasscom API Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Login
  console.log('1. Testing login function...');
  try {
    const loginResult = await login(TEST_CONFIG.ip, TEST_CONFIG.username, TEST_CONFIG.password);
    if (loginResult && loginResult.code === 1) {
      console.log('✅ Login test PASSED');
      passed++;
    } else {
      console.log('❌ Login test FAILED - Invalid response');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Login test FAILED - ${error.message}`);
    failed++;
  }
  
  // Test 2: System Info
  console.log('\n2. Testing system info function...');
  try {
    const systemInfo = await fetchSystemInfo(TEST_CONFIG.ip, TEST_CONFIG.authToken);
    if (systemInfo && systemInfo.version) {
      console.log('✅ System info test PASSED');
      passed++;
    } else {
      console.log('❌ System info test FAILED - Invalid response');
      failed++;
    }
  } catch (error) {
    console.log(`❌ System info test FAILED - ${error.message}`);
    failed++;
  }
  
  // Test 3: Extensions
  console.log('\n3. Testing extensions function...');
  try {
    const extensions = await fetchExtensions(TEST_CONFIG.ip, TEST_CONFIG.authToken);
    if (extensions && Array.isArray(extensions.extensions)) {
      console.log('✅ Extensions test PASSED');
      passed++;
    } else {
      console.log('❌ Extensions test FAILED - Invalid response');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Extensions test FAILED - ${error.message}`);
    failed++;
  }
  
  // Test 4: SVN Version
  console.log('\n4. Testing SVN version function...');
  try {
    const svnVersion = await fetchSvnVersion(TEST_CONFIG.ip);
    if (svnVersion && svnVersion.svn_version) {
      console.log('✅ SVN version test PASSED');
      passed++;
    } else {
      console.log('❌ SVN version test FAILED - Invalid response');
      failed++;
    }
  } catch (error) {
    console.log(`❌ SVN version test FAILED - ${error.message}`);
    failed++;
  }
  
  // Test 5: IP Address
  console.log('\n5. Testing IP address function...');
  try {
    const ipInfo = await fetchIpAddress(TEST_CONFIG.ip);
    if (ipInfo && ipInfo.ip_address) {
      console.log('✅ IP address test PASSED');
      passed++;
    } else {
      console.log('❌ IP address test FAILED - Invalid response');
      failed++;
    }
  } catch (error) {
    console.log(`❌ IP address test FAILED - ${error.message}`);
    failed++;
  }
  
  // Test 6: Account Info
  console.log('\n6. Testing account info function...');
  try {
    const accountInfo = await fetchAccountInfo(TEST_CONFIG.ip);
    if (accountInfo && Array.isArray(accountInfo.accounts)) {
      console.log('✅ Account info test PASSED');
      passed++;
    } else {
      console.log('❌ Account info test FAILED - Invalid response');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Account info test FAILED - ${error.message}`);
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 All tests PASSED! The Dasscom API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above.');
  }
}

// Error scenario tests
async function runErrorTests() {
  console.log('\n\n🔧 Testing error scenarios...\n');
  
  // Test invalid login
  console.log('1. Testing invalid login...');
  try {
    await login(TEST_CONFIG.ip, 'wronguser', 'wrongpass');
    console.log('❌ Invalid login test FAILED - Should have thrown error');
  } catch (error) {
    console.log('✅ Invalid login test PASSED - Error handled correctly');
  }
  
  // Test timeout scenario (using non-responsive endpoint)
  console.log('\n2. Testing timeout scenario...');
  try {
    await login('192.168.1.999:3001', TEST_CONFIG.username, TEST_CONFIG.password);
    console.log('❌ Timeout test FAILED - Should have timed out');
  } catch (error) {
    if (error.message.includes('timed out')) {
      console.log('✅ Timeout test PASSED - Timeout handled correctly');
    } else {
      console.log(`❌ Timeout test FAILED - Unexpected error: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Dasscom API Test Runner');
  console.log('📡 Mock server should be running on http://localhost:3001\n');
  
  try {
    await runTests();
    await runErrorTests();
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    console.log('\n💡 Make sure the mock server is running:');
    console.log('   node test/mockDasscomServer.js');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { runTests, runErrorTests };
