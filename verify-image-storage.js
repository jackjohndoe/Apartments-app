// Image Storage Verification Script
// Run this in your browser console (F12) while on your app

(async function verifyImageStorage() {
  console.log('🔍 Starting Image Storage Verification...\n');
  
  try {
    // Step 1: Get auth token
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.error('❌ No user data found. Please log in first.');
      return;
    }
    
    const user = JSON.parse(userData);
    const token = user.token || user.accessToken;
    
    if (!token) {
      console.error('❌ No auth token found. Please log in again.');
      return;
    }
    
    console.log('✅ Auth token found');
    console.log('📋 Token preview:', token.substring(0, 30) + '...\n');
    
    const API_BASE = 'https://booking-backend-staging.up.railway.app';
    
    // Step 2: Check existing listings
    console.log('📊 Step 1: Checking existing listings for images...');
    const listingsResponse = await fetch(`${API_BASE}/api/apartments?all=true&size=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!listingsResponse.ok) {
      console.error('❌ Failed to fetch listings:', listingsResponse.status, listingsResponse.statusText);
      const errorData = await listingsResponse.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return;
    }
    
    const listingsData = await listingsResponse.json();
    const listings = listingsData.content || listingsData || [];
    
    console.log(`📊 Found ${listings.length} listing(s)`);
    
    let withImages = 0;
    let withoutImages = 0;
    const missingListings = [];
    
    listings.forEach(listing => {
      const hasPhotos = listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0;
      if (hasPhotos) {
        withImages++;
        console.log(`  ✅ Listing ${listing.id} (${listing.title}): HAS ${listing.photos.length} image(s)`);
      } else {
        withoutImages++;
        missingListings.push({ id: listing.id, title: listing.title });
        console.log(`  ❌ Listing ${listing.id} (${listing.title}): NO IMAGES`);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total listings: ${listings.length}`);
    console.log(`  With images: ${withImages}`);
    console.log(`  Without images: ${withoutImages}`);
    
    if (withoutImages > 0) {
      console.log(`\n⚠️ ${withoutImages} listing(s) are missing images:`);
      missingListings.forEach(l => console.log(`    - ID ${l.id}: ${l.title}`));
    }
    
    // Step 3: Test creating a listing with images
    console.log('\n🧪 Step 2: Testing image storage by creating a test listing...');
    
    // Small test image (1x1 red pixel PNG)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const testListing = {
      title: `TEST - Image Storage Verification - ${new Date().toISOString()}`,
      description: 'This is a test listing to verify image storage is working.',
      price: 100,
      location: 'Test Location',
      amenities: ['WiFi'],
      policies: ['No smoking'],
      images: [testImage],
      photos: [testImage],
      image: testImage
    };
    
    console.log('📤 Creating test listing with image...');
    console.log('  Image format: base64 data URI');
    console.log('  Image size:', testImage.length, 'characters');
    
    const createResponse = await fetch(`${API_BASE}/api/apartments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testListing)
    });
    
    if (!createResponse.ok) {
      console.error('❌ Failed to create test listing:', createResponse.status);
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return;
    }
    
    const createdListing = await createResponse.json();
    console.log('✅ Test listing created:', createdListing.id);
    console.log('  Title:', createdListing.title);
    
    // Check if images were stored
    const hasPhotos = createdListing.photos && Array.isArray(createdListing.photos) && createdListing.photos.length > 0;
    
    if (hasPhotos) {
      console.log('\n✅ SUCCESS: Backend stored images!');
      console.log(`  Photos array length: ${createdListing.photos.length}`);
      console.log('  Photos:', createdListing.photos);
      console.log('\n🎉 Image storage is WORKING correctly!');
    } else {
      console.log('\n❌ FAILED: Backend did NOT store images!');
      console.log('  Photos array:', createdListing.photos);
      console.log('  Photos length:', createdListing.photos?.length || 0);
      console.log('\n⚠️ Image storage is NOT working. Possible causes:');
      console.log('  1. Backend code not deployed to Railway');
      console.log('  2. Backend deployment failed');
      console.log('  3. StorageService not configured');
      console.log('  4. File system permissions issue');
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('  - Check Railway deployment status');
      console.log('  - Check Railway build logs');
      console.log('  - Check Railway application logs');
      console.log('  - Verify backend has latest code deployed');
    }
    
    // Step 4: Verify the listing we just created
    if (hasPhotos && createdListing.id) {
      console.log('\n🔍 Step 3: Verifying created listing...');
      const verifyResponse = await fetch(`${API_BASE}/api/apartments/${createdListing.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verifyResponse.ok) {
        const verifiedListing = await verifyResponse.json();
        const verifiedHasPhotos = verifiedListing.photos && Array.isArray(verifiedListing.photos) && verifiedListing.photos.length > 0;
        
        if (verifiedHasPhotos) {
          console.log('✅ Verified: Listing has images when fetched separately');
          console.log(`  Photos: ${verifiedListing.photos.length} image(s)`);
        } else {
          console.log('⚠️ Warning: Listing lost images when fetched separately');
          console.log('  This suggests images are not being persisted to database');
        }
      }
    }
    
    // Final summary
    console.log('\n📋 VERIFICATION SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (hasPhotos) {
      console.log('✅ Image storage: WORKING');
      console.log('✅ Backend is processing and storing images correctly');
      console.log('✅ Latest code appears to be deployed');
    } else {
      console.log('❌ Image storage: NOT WORKING');
      console.log('❌ Backend is not storing images');
      console.log('⚠️ Latest code may not be deployed to Railway');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.error('Error details:', error.message);
  }
})();



