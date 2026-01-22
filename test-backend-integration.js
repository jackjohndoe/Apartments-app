/**
 * Backend Integration Test Script
 * Run this in browser console to verify backend integration
 */

const API_BASE = 'https://booking-backend-staging.up.railway.app';

// Test results storage
const testResults = {
  connectivity: null,
  authentication: null,
  listings: null,
  imageStorage: null,
  cors: null,
};

// Helper function to make API requests
async function testRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } else {
      data = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      isNetworkError: true,
    };
  }
}

// Test 1: Backend Connectivity
async function testConnectivity() {
  console.log('🔍 Test 1: Backend Connectivity');
  console.log('Testing:', `${API_BASE}/api/apartments`);
  
  const result = await testRequest('/api/apartments?size=1');
  
  if (result.isNetworkError) {
    testResults.connectivity = {
      success: false,
      error: 'Network error - Backend may be down or unreachable',
      details: result.error,
    };
    console.error('❌ Backend is NOT reachable:', result.error);
    return false;
  }
  
  if (result.success || result.status === 200 || result.status === 401) {
    // 401 is OK - means backend is up but requires auth
    testResults.connectivity = {
      success: true,
      status: result.status,
      message: 'Backend is reachable',
    };
    console.log('✅ Backend is reachable (Status:', result.status + ')');
    return true;
  }
  
  testResults.connectivity = {
    success: false,
    status: result.status,
    error: 'Backend returned unexpected status',
  };
  console.error('❌ Backend connectivity issue:', result.status);
  return false;
}

// Test 2: CORS Configuration
async function testCORS() {
  console.log('\n🔍 Test 2: CORS Configuration');
  
  const result = await testRequest('/api/apartments?size=1');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': result.headers['access-control-allow-origin'],
    'Access-Control-Allow-Methods': result.headers['access-control-allow-methods'],
    'Access-Control-Allow-Headers': result.headers['access-control-allow-headers'],
  };
  
  if (result.isNetworkError && result.error.includes('CORS')) {
    testResults.cors = {
      success: false,
      error: 'CORS error detected',
      details: result.error,
    };
    console.error('❌ CORS Error:', result.error);
    return false;
  }
  
  if (corsHeaders['Access-Control-Allow-Origin']) {
    testResults.cors = {
      success: true,
      headers: corsHeaders,
      message: 'CORS is configured',
    };
    console.log('✅ CORS is configured:', corsHeaders);
    return true;
  }
  
  // CORS might be working even if headers aren't visible (preflight might have succeeded)
  if (!result.isNetworkError) {
    testResults.cors = {
      success: true,
      message: 'CORS appears to be working (no CORS errors)',
    };
    console.log('✅ CORS appears to be working');
    return true;
  }
  
  testResults.cors = {
    success: false,
    error: 'CORS configuration unclear',
  };
  console.warn('⚠️ CORS status unclear');
  return false;
}

// Test 3: Authentication Endpoints
async function testAuthentication() {
  console.log('\n🔍 Test 3: Authentication Endpoints');
  
  // Test register endpoint (should return validation error, not 404)
  const registerResult = await testRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@test.com',
      password: 'test',
    }),
  });
  
  // Test login endpoint (should return validation error, not 404)
  const loginResult = await testRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@test.com',
      password: 'test',
    }),
  });
  
  // Both endpoints should exist (not 404)
  const registerExists = registerResult.status !== 404;
  const loginExists = loginResult.status !== 404;
  
  if (registerExists && loginExists) {
    testResults.authentication = {
      success: true,
      register: registerResult.status,
      login: loginResult.status,
      message: 'Authentication endpoints are available',
    };
    console.log('✅ Authentication endpoints are available');
    console.log('  Register endpoint:', registerResult.status);
    console.log('  Login endpoint:', loginResult.status);
    return true;
  }
  
  testResults.authentication = {
    success: false,
    register: registerResult.status,
    login: loginResult.status,
    error: 'Some authentication endpoints may be missing',
  };
  console.error('❌ Authentication endpoints issue');
  console.error('  Register:', registerResult.status);
  console.error('  Login:', loginResult.status);
  return false;
}

// Test 4: Listings Endpoint
async function testListings() {
  console.log('\n🔍 Test 4: Listings Endpoint');
  
  const result = await testRequest('/api/apartments?size=5&all=true');
  
  if (result.isNetworkError) {
    testResults.listings = {
      success: false,
      error: 'Network error',
      details: result.error,
    };
    console.error('❌ Listings endpoint error:', result.error);
    return false;
  }
  
  if (result.status === 404) {
    testResults.listings = {
      success: false,
      error: 'Listings endpoint not found (404)',
    };
    console.error('❌ Listings endpoint not found');
    return false;
  }
  
  // 200 or 401 is OK (401 means auth required, which is expected)
  if (result.status === 200 || result.status === 401) {
    const hasData = result.data && (result.data.content || Array.isArray(result.data));
    const listings = result.data?.content || result.data || [];
    
    testResults.listings = {
      success: true,
      status: result.status,
      hasData,
      listingCount: Array.isArray(listings) ? listings.length : 0,
      message: 'Listings endpoint is working',
    };
    console.log('✅ Listings endpoint is working');
    console.log('  Status:', result.status);
    console.log('  Has data:', hasData);
    if (Array.isArray(listings)) {
      console.log('  Listings count:', listings.length);
    }
    return true;
  }
  
  testResults.listings = {
    success: false,
    status: result.status,
    error: 'Unexpected status code',
  };
  console.error('❌ Listings endpoint issue:', result.status);
  return false;
}

// Test 5: Image Storage (Check if listings have photos)
async function testImageStorage() {
  console.log('\n🔍 Test 5: Image Storage');
  
  const result = await testRequest('/api/apartments?size=10&all=true');
  
  if (result.isNetworkError || result.status !== 200) {
    testResults.imageStorage = {
      success: false,
      error: 'Cannot test image storage - listings endpoint not accessible',
      status: result.status,
    };
    console.error('❌ Cannot test image storage');
    return false;
  }
  
  const listings = result.data?.content || result.data || [];
  
  if (!Array.isArray(listings) || listings.length === 0) {
    testResults.imageStorage = {
      success: false,
      error: 'No listings found to test image storage',
    };
    console.warn('⚠️ No listings found to test image storage');
    return false;
  }
  
  let withImages = 0;
  let withoutImages = 0;
  const missingDetails = [];
  
  listings.forEach(listing => {
    const hasPhotos = listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0;
    if (hasPhotos) {
      withImages++;
    } else {
      withoutImages++;
      missingDetails.push({
        id: listing.id,
        title: listing.title,
      });
    }
  });
  
  const allHaveImages = withoutImages === 0;
  const someHaveImages = withImages > 0;
  
  testResults.imageStorage = {
    success: allHaveImages,
    withImages,
    withoutImages,
    total: listings.length,
    missingDetails: allHaveImages ? [] : missingDetails.slice(0, 5), // First 5
    message: allHaveImages 
      ? 'All listings have images stored' 
      : someHaveImages 
        ? `Some listings (${withImages}/${listings.length}) have images` 
        : 'No listings have images stored',
  };
  
  if (allHaveImages) {
    console.log('✅ All listings have images stored');
  } else if (someHaveImages) {
    console.warn(`⚠️ Only ${withImages}/${listings.length} listings have images`);
    console.warn('  This may be because:');
    console.warn('    1. Some listings were created before the image storage fix');
    console.warn('    2. Backend deployment is not complete');
    console.warn('    3. Backend image processing has errors');
  } else {
    console.error('❌ No listings have images stored');
    console.error('  Backend image storage is NOT working');
  }
  
  return allHaveImages;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Backend Integration Tests');
  console.log('Backend URL:', API_BASE);
  console.log('='.repeat(60));
  
  const results = {
    connectivity: await testConnectivity(),
    cors: await testCORS(),
    authentication: await testAuthentication(),
    listings: await testListings(),
    imageStorage: await testImageStorage(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`${icon} ${test.toUpperCase()}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(r => r === true);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Backend is properly integrated!');
  } else {
    console.log('❌ SOME TESTS FAILED - Check details above');
  }
  console.log('='.repeat(60));
  
  // Store results globally for inspection
  window.backendTestResults = testResults;
  console.log('\n💡 Full test results stored in: window.backendTestResults');
  
  return {
    allPassed,
    results,
    details: testResults,
  };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('💡 To run tests, execute: runAllTests()');
  console.log('💡 Or copy and paste the entire script into console');
}



