// Apartment/Property Service
import api from './api';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import { logger } from '../utils/logger';

export const apartmentService = {
  // Get all apartments
  getApartments: async (filters = {}) => {
    try {
      // CRITICAL: Ensure no user-specific filtering happens
      // This endpoint should return ALL listings from ALL users for marketplace functionality
      // Remove any user-specific filters that might have been passed
      const cleanFilters = { ...filters };
      delete cleanFilters.createdBy;
      delete cleanFilters.hostEmail;
      delete cleanFilters.userEmail;
      delete cleanFilters.userId;
      delete cleanFilters.owner;
      delete cleanFilters.creator;
      
      // Add pagination parameters if not provided (fetch more listings for cross-platform sync)
      const page = cleanFilters.page !== undefined ? cleanFilters.page : 0;
      const size = cleanFilters.size !== undefined ? cleanFilters.size : 100; // Fetch more listings by default
      
      // Add cache-busting timestamp to prevent browser caching
      // This ensures fresh data is fetched, especially important for cross-device sync
      const cacheBuster = cleanFilters._cacheBuster || Date.now();
      
      // Explicitly request all listings (if backend supports this parameter)
      // Some backends use ?all=true to return all listings regardless of user
      const queryParams = new URLSearchParams({
        ...cleanFilters,
        page: page.toString(),
        size: size.toString(),
        _t: cacheBuster.toString(), // Cache-busting timestamp
        all: 'true', // Explicitly request ALL listings from ALL users (not just current user)
      }).toString();
      
      // CRITICAL: Use the main LIST endpoint, NOT MY_LISTINGS endpoint
      // MY_LISTINGS is for user-specific listings (used in MyListingsScreen)
      // LIST endpoint should return ALL listings for marketplace/Explore screen
      const endpoint = queryParams 
        ? `${API_ENDPOINTS.APARTMENTS.LIST}?${queryParams}` 
        : API_ENDPOINTS.APARTMENTS.LIST;
      
      // Verify we're using the correct endpoint (not my-listings)
      if (endpoint.includes('my-listings')) {
        logger.error('ERROR: getApartments() should use /api/apartments, not /api/apartments/my-listings');
        throw new Error('Incorrect endpoint: getApartments() must use LIST endpoint, not MY_LISTINGS');
      }
      
      logger.log('🔍 Fetching all listings from:', endpoint);
      const response = await api.get(endpoint);
      
      // If response is null (403, 401, etc.), return null for hybrid service to handle
      if (response === null || response === undefined) {
        logger.warn('⚠️ API returned null/undefined - backend may be filtering by user or authentication failed');
        logger.warn('⚠️ Check backend /api/apartments endpoint - it should return ALL listings, not just current user\'s');
        return null;
      }
      
      // Log response structure for debugging
      logger.log('📥 API Response received:', {
        hasData: !!response.data,
        hasContent: !!response.content,
        isArray: Array.isArray(response),
        responseType: typeof response,
        keys: response && typeof response === 'object' ? Object.keys(response) : 'N/A',
      });
      
      // Handle PageResponse structure: { content: [...], page, size, totalElements, ... }
      // Extract the content array which contains the actual listings
      let listings = null;
      
      if (response.data) {
        // If response.data exists, check if it's a PageResponse
        if (response.data.content && Array.isArray(response.data.content)) {
          listings = response.data.content; // Return the content array
          logger.log(`✅ Found ${listings.length} listings in response.data.content`);
        }
        // If response.data is already an array, return it
        else if (Array.isArray(response.data)) {
          listings = response.data;
          logger.log(`✅ Found ${listings.length} listings in response.data (array)`);
        } else {
          listings = response.data;
          logger.log('⚠️ response.data is not an array or PageResponse:', typeof response.data);
        }
      }
      // If response is a PageResponse directly
      else if (response.content && Array.isArray(response.content)) {
        listings = response.content;
        logger.log(`✅ Found ${listings.length} listings in response.content`);
      }
      // If response is already an array
      else if (Array.isArray(response)) {
        listings = response;
        logger.log(`✅ Found ${listings.length} listings in response (direct array)`);
      }
      
      // Final check: if we got listings, verify they're from multiple users and log image fields
      if (listings && Array.isArray(listings) && listings.length > 0) {
        // Log image fields for ALL listings to verify backend storage
        logger.log('🔍 Checking if backend stored images for', listings.length, 'listing(s)...');
        listings.forEach((listing, index) => {
          const listingId = listing.id || listing._id;
          const hasImage = !!(listing.image || 
                             (listing.images && Array.isArray(listing.images) && listing.images.length > 0) ||
                             (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0));
          
          if (index === 0 || !hasImage) {
            // Log first listing always, and any listing without images
            logger.log(`📋 Listing ${index + 1}/${listings.length}:`, {
              id: listingId,
              title: listing.title || 'Untitled',
              hasImages: hasImage,
              imageFields: {
                hasImage: !!listing.image,
                imageValue: listing.image ? String(listing.image).substring(0, 50) + '...' : null,
                hasImages: !!(listing.images && Array.isArray(listing.images)),
                imagesLength: listing.images?.length || 0,
                hasPhotos: !!(listing.photos && Array.isArray(listing.photos)),
                photosLength: listing.photos?.length || 0,
                hasImageUrl: !!listing.imageUrl,
                hasImageUrls: !!(listing.imageUrls && Array.isArray(listing.imageUrls)),
              },
              allKeys: listing && typeof listing === 'object' ? Object.keys(listing) : [],
            });
            
            if (!hasImage) {
              logger.warn(`⚠️ Listing "${listing.title || listingId}" has NO images stored in backend!`);
            }
          }
        });
        
        // Count listings with/without images
        const listingsWithImages = listings.filter(l => 
          !!(l.image || 
            (l.images && Array.isArray(l.images) && l.images.length > 0) ||
            (l.photos && Array.isArray(l.photos) && l.photos.length > 0))
        ).length;
        const listingsWithoutImages = listings.length - listingsWithImages;
        
        logger.log('📊 Backend image storage summary:', {
          totalListings: listings.length,
          withImages: listingsWithImages,
          withoutImages: listingsWithoutImages,
          percentageWithImages: listings.length > 0 ? Math.round((listingsWithImages / listings.length) * 100) : 0,
        });
        
        if (listingsWithoutImages > 0) {
          logger.error('❌ Backend is NOT storing images for', listingsWithoutImages, 'listing(s)!');
          logger.error('  This means other users cannot see images for these listings');
        }
        
        // Check if listings have user identifiers (createdBy, hostEmail, etc.)
        const uniqueUsers = new Set();
        listings.forEach(listing => {
          if (listing.createdBy) uniqueUsers.add(listing.createdBy);
          if (listing.hostEmail) uniqueUsers.add(listing.hostEmail);
          if (listing.hostId) uniqueUsers.add(listing.hostId);
        });
        
        if (uniqueUsers.size > 0) {
          logger.log(`✅ Listings from ${uniqueUsers.size} different user(s):`, Array.from(uniqueUsers));
          if (uniqueUsers.size === 1) {
            logger.warn('⚠️ WARNING: All listings appear to be from the same user!');
            logger.warn('⚠️ Backend may be filtering by authenticated user. Check backend /api/apartments endpoint.');
          }
        } else {
          logger.warn('⚠️ Could not determine listing ownership - listings may not have user identifiers');
        }
      } else if (listings && Array.isArray(listings) && listings.length === 0) {
        logger.warn('⚠️ API returned empty array - no listings found');
        logger.warn('⚠️ This could mean:');
        logger.warn('   1. Backend is filtering by authenticated user (WRONG for marketplace)');
        logger.warn('   2. No listings exist in database');
        logger.warn('   3. Backend endpoint needs to return ALL listings regardless of user');
      }
      
      return listings;
    } catch (error) {
      // Improved error logging to identify why API calls fail
      logger.error('❌ Error fetching apartments from API:', {
        error: error.message || error.toString(),
        errorType: error.constructor.name,
        status: error.status || error.response?.status,
        endpoint: API_ENDPOINTS.APARTMENTS.LIST,
        stack: error.stack,
      });
      
      // Log network-specific errors
      if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        logger.error('❌ Network error detected - backend may be unavailable');
        logger.error('  Check if backend is running at:', API_CONFIG.BASE_URL);
        logger.error('  Verify internet connection');
      }
      
      // Log authentication errors
      if (error.status === 401 || error.status === 403) {
        logger.error('❌ Authentication error - backend may be filtering by user');
        logger.error('  This endpoint should return ALL listings, not just current user\'s');
        logger.error('  Check backend /api/apartments endpoint configuration');
      }
      
      // Log server errors
      if (error.status >= 500) {
        logger.error('❌ Server error - backend may be experiencing issues');
        logger.error('  Check Railway deployment status and logs');
      }
      
      // Return null to allow graceful fallback, but with proper error logging
      try {
        const cleanFilters = { ...filters };
        delete cleanFilters.createdBy;
        delete cleanFilters.hostEmail;
        delete cleanFilters.userEmail;
        delete cleanFilters.userId;
        delete cleanFilters.owner;
        delete cleanFilters.creator;
        const page = cleanFilters.page !== undefined ? cleanFilters.page : 0;
        const size = cleanFilters.size !== undefined ? cleanFilters.size : 100;
        const cacheBuster = cleanFilters._cacheBuster || Date.now();
        const queryParams = new URLSearchParams({
          ...cleanFilters,
          page: page.toString(),
          size: size.toString(),
          _t: cacheBuster.toString(),
          all: 'true',
        }).toString();
        const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.APARTMENTS.LIST}${queryParams ? `?${queryParams}` : ''}`;
        logger.log('🔍 Public fetch listings from:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) {
          logger.warn('⚠️ Public fetch failed:', response.status);
          return null;
        }
        let data = null;
        const text = await response.text();
        if (text && text.trim().length > 0) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
        let listings = null;
        if (data && data.content && Array.isArray(data.content)) {
          listings = data.content;
        } else if (Array.isArray(data)) {
          listings = data;
        } else if (data && Array.isArray(data.data)) {
          listings = data.data;
        } else {
          listings = data;
        }
        if (Array.isArray(listings)) {
          logger.log(`✅ Public fetch found ${listings.length} listing(s)`);
          return listings;
        }
        return null;
      } catch (fallbackError) {
        logger.warn('⚠️ Public listings fetch error:', fallbackError.message || String(fallbackError));
        return null;
      }
    }
  },

  // Get apartment by ID
  getApartmentById: async (id) => {
    try {
      const response = await api.get(API_ENDPOINTS.APARTMENTS.DETAIL(id));
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Create apartment listing
  createApartment: async (apartmentData) => {
    try {
      // Map frontend data format to backend DTO format
      // Backend expects: title, description, price (BigDecimal), location, amenities (Set<String>), policies (Set<String>)
      // CRITICAL: Also include images so they're stored in the API
      const backendRequest = {
        title: apartmentData.title || apartmentData.name || 'Untitled Listing',
        description: apartmentData.description || '',
        price: apartmentData.price || 0,
        location: apartmentData.location || apartmentData.address || 'Nigeria',
        amenities: (() => {
          // Convert amenities object/array to Set<String> format
          if (!apartmentData.amenities) {
            return [];
          }
          if (Array.isArray(apartmentData.amenities)) {
            return apartmentData.amenities;
          }
          if (typeof apartmentData.amenities === 'object') {
            // Convert object to array of keys (amenities that are true)
            return Object.keys(apartmentData.amenities).filter(key => apartmentData.amenities[key] === true);
          }
          return [];
        })(),
        policies: apartmentData.policies || [],
        // CRITICAL: Include images so they're stored in the API and returned when fetching listings
        // Backend may accept: image, images, photos, imageUrl, imageUrls
        // Send all possible formats to ensure compatibility
        // ALWAYS include these fields - backend will process them if they have values
        image: apartmentData.image || null,
        images: apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0
          ? apartmentData.images
          : (apartmentData.image ? [apartmentData.image] : []),
        photos: apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0
          ? apartmentData.images
          : (apartmentData.image ? [apartmentData.image] : []),
        imageUrl: apartmentData.image || null,
        imageUrls: apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0
          ? apartmentData.images
          : (apartmentData.image ? [apartmentData.image] : []),
      };
      
      // CRITICAL: Verify images are actually in the request before sending
      const hasImages = !!(backendRequest.image || 
                          (backendRequest.images && Array.isArray(backendRequest.images) && backendRequest.images.length > 0) ||
                          (backendRequest.photos && Array.isArray(backendRequest.photos) && backendRequest.photos.length > 0));
      
      if (hasImages) {
        logger.log('✅ Images detected in request payload:', {
          imageField: !!backendRequest.image,
          imagesArrayLength: backendRequest.images?.length || 0,
          photosArrayLength: backendRequest.photos?.length || 0,
          firstImagePreview: backendRequest.images?.[0]?.substring(0, 50) || backendRequest.image?.substring(0, 50) || 'N/A',
        });
      } else {
        logger.warn('⚠️ WARNING: No images found in apartmentData:', {
          hasImage: !!apartmentData.image,
          hasImages: !!(apartmentData.images && Array.isArray(apartmentData.images)),
          imagesLength: apartmentData.images?.length || 0,
          allKeys: Object.keys(apartmentData),
        });
      }
      
      // Ensure price is a number (backend expects BigDecimal which will be converted from number)
      if (typeof backendRequest.price !== 'number') {
        backendRequest.price = parseFloat(backendRequest.price) || 0;
      }
      
      // Ensure required fields are present
      if (!backendRequest.title || !backendRequest.title.trim()) {
        throw new Error('Title is required');
      }
      if (!backendRequest.location || !backendRequest.location.trim()) {
        throw new Error('Location is required');
      }
      if (!backendRequest.price || backendRequest.price <= 0) {
        throw new Error('Valid price is required');
      }
      
      // Log FULL request payload to verify images are being sent
      // CRITICAL: Log the actual JSON string to verify images are in the request body
      const requestBodyString = JSON.stringify(backendRequest);
      const requestBodySize = new Blob([requestBodyString]).size;
      const hasImagesInBody = requestBodyString.includes('data:image') || requestBodyString.includes('"images"') || requestBodyString.includes('"photos"');
      
      logger.log('📤 Sending listing to API - FULL REQUEST:', {
        title: backendRequest.title,
        location: backendRequest.location,
        price: backendRequest.price,
        amenitiesCount: backendRequest.amenities.length,
        image: backendRequest.image ? backendRequest.image.substring(0, 100) + '...' : null,
        images: backendRequest.images?.length || 0,
        imagesSample: backendRequest.images?.slice(0, 2).map(img => typeof img === 'string' ? img.substring(0, 50) + '...' : typeof img),
        photos: backendRequest.photos?.length || 0,
        photosSample: backendRequest.photos?.slice(0, 2).map(img => typeof img === 'string' ? img.substring(0, 50) + '...' : typeof img),
        imageUrl: backendRequest.imageUrl ? backendRequest.imageUrl.substring(0, 100) + '...' : null,
        imageUrls: backendRequest.imageUrls?.length || 0,
        allRequestKeys: Object.keys(backendRequest),
        requestBodySize: `${(requestBodySize / 1024).toFixed(2)} KB`,
        hasImagesInBody: hasImagesInBody,
      });
      
      if (hasImages && !hasImagesInBody) {
        logger.error('❌ CRITICAL: Images exist in backendRequest but NOT in JSON body!');
        logger.error('  This means images are being lost during JSON.stringify');
        logger.error('  Check for circular references or non-serializable data');
      }
      
      const response = await api.post(API_ENDPOINTS.APARTMENTS.CREATE, backendRequest, { timeout: 120000 });
      // If response is null (403, 401, etc.), return null for hybrid service to handle
      if (response === null || response === undefined) {
        logger.error('❌ API returned null/undefined - request may have failed');
        return null;
      }
      
      const result = response.data || response;
      
      // CRITICAL: Log FULL response to verify if backend stored images
      logger.log('📥 API RESPONSE after creating listing:', {
        id: result.id || result._id,
        title: result.title,
        allResponseKeys: result && typeof result === 'object' ? Object.keys(result) : [],
        imageFields: {
          hasImage: !!result.image,
          imageValue: result.image ? String(result.image).substring(0, 100) + '...' : null,
          hasImages: !!(result.images && Array.isArray(result.images)),
          imagesLength: result.images?.length || 0,
          imagesSample: result.images?.slice(0, 2).map(img => typeof img === 'string' ? String(img).substring(0, 50) + '...' : typeof img),
          hasPhoto: !!result.photo,
          hasPhotos: !!(result.photos && Array.isArray(result.photos)),
          photosLength: result.photos?.length || 0,
          photosSample: result.photos?.slice(0, 2).map(img => typeof img === 'string' ? String(img).substring(0, 50) + '...' : typeof img),
          hasImageUrl: !!result.imageUrl,
          hasImageUrls: !!(result.imageUrls && Array.isArray(result.imageUrls)),
        },
      });
      
      // Compare what we sent vs what we got back
      const sentImages = backendRequest.images?.length || (backendRequest.image ? 1 : 0);
      const receivedImages = result.images?.length || result.photos?.length || (result.image ? 1 : 0);
      
      if (sentImages > 0 && receivedImages === 0) {
        logger.error('❌ CRITICAL: BACKEND DID NOT STORE IMAGES!');
        logger.error('  Sent:', sentImages, 'image(s)');
        logger.error('  Received:', receivedImages, 'image(s)');
        logger.error('  Backend may not be accepting/storing image fields');
        logger.error('  POSSIBLE CAUSES:');
        logger.error('    1. Backend code not deployed to Railway');
        logger.error('    2. Backend deployment failed');
        logger.error('    3. Backend processImagesFromRequest() not being called');
        logger.error('    4. Backend StorageService not configured');
        logger.error('    5. Backend file system permissions issue');
        logger.error('  ACTION REQUIRED:');
        logger.error('    - Check Railway deployment status');
        logger.error('    - Check Railway build logs for errors');
        logger.error('    - Check Railway application logs for image processing errors');
        logger.error('    - Verify backend has latest code deployed');
        logger.error('    - Test backend API directly to verify image storage');
      } else if (sentImages > 0 && receivedImages > 0) {
        logger.log('✅ Backend stored images successfully!');
        logger.log('  Sent:', sentImages, 'image(s)');
        logger.log('  Received:', receivedImages, 'image(s)');
      } else if (sentImages === 0) {
        logger.warn('⚠️ No images were sent in the request');
      }
      
      return result;
    } catch (error) {
      // Improved error logging for createApartment
      logger.error('❌ Error creating apartment via API:', {
        error: error.message || error.toString(),
        errorType: error.constructor.name,
        status: error.status || error.response?.status,
        endpoint: API_ENDPOINTS.APARTMENTS.CREATE,
        stack: error.stack,
      });
      
      // Log detailed error response if available
      if (error.response) {
        logger.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          message: error.response.data?.message || error.message,
        });
      }
      
      // Log network-specific errors
      if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        logger.error('❌ Network error - cannot connect to backend');
        logger.error('  Check if backend is running at:', API_CONFIG.BASE_URL);
        logger.error('  Verify internet connection');
      }
      
      // Log authentication errors
      if (error.status === 401 || error.status === 403) {
        logger.error('❌ Authentication error - user may not be logged in or session expired');
        logger.error('  User needs to sign in to create listings');
      }
      
      // Log validation errors
      if (error.status === 400 || error.status === 422) {
        logger.error('❌ Validation error - check listing data format');
        logger.error('  Ensure all required fields are provided');
      }
      
      // Log server errors
      if (error.status >= 500) {
        logger.error('❌ Server error - backend may be experiencing issues');
        logger.error('  Check Railway deployment status and logs');
      }
      
      // Return null to allow graceful fallback, but with proper error logging
      return null;
    }
  },

  // Update apartment listing
  updateApartment: async (id, apartmentData) => {
    try {
      // CRITICAL: Include images in update request (same as create)
      const backendRequest = {
        title: apartmentData.title || apartmentData.name || 'Untitled Listing',
        description: apartmentData.description || '',
        price: apartmentData.price || 0,
        location: apartmentData.location || apartmentData.address || 'Nigeria',
        amenities: (() => {
          if (!apartmentData.amenities) return [];
          if (Array.isArray(apartmentData.amenities)) return apartmentData.amenities;
          if (typeof apartmentData.amenities === 'object') {
            return Object.keys(apartmentData.amenities).filter(key => apartmentData.amenities[key] === true);
          }
          return [];
        })(),
        policies: apartmentData.policies || [],
        // Ensure images are included in all possible formats
        image: apartmentData.image || null,
        images: apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0
          ? apartmentData.images
          : (apartmentData.image ? [apartmentData.image] : []),
        photos: apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0
          ? apartmentData.images
          : (apartmentData.image ? [apartmentData.image] : []),
        imageUrl: apartmentData.image || null,
        imageUrls: apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0
          ? apartmentData.images
          : (apartmentData.image ? [apartmentData.image] : []),
      };
      
      // Verify images are in the request
      const hasImages = !!(backendRequest.image || 
                          (backendRequest.images && Array.isArray(backendRequest.images) && backendRequest.images.length > 0) ||
                          (backendRequest.photos && Array.isArray(backendRequest.photos) && backendRequest.photos.length > 0));
      
      if (hasImages) {
        logger.log('✅ Images detected in update request:', {
          imagesArrayLength: backendRequest.images?.length || 0,
          photosArrayLength: backendRequest.photos?.length || 0,
        });
      }
      
      logger.log('📤 Updating listing in API:', {
        id: id,
        title: backendRequest.title,
        hasImage: !!backendRequest.image,
        imagesCount: backendRequest.images?.length || 0,
        photosCount: backendRequest.photos?.length || 0,
      });
      
      const response = await api.put(API_ENDPOINTS.APARTMENTS.UPDATE(id), backendRequest, { timeout: 120000 });
      // If response is null (403, 401, etc.), return null for hybrid service to handle
      if (response === null || response === undefined) {
        return null;
      }
      return response.data || response;
    } catch (error) {
      logger.error('❌ Error updating apartment via API:', error);
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  },

  // Delete apartment listing
  deleteApartment: async (id) => {
    try {
      const response = await api.delete(API_ENDPOINTS.APARTMENTS.DELETE(id));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user's apartments
  getMyApartments: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.APARTMENTS.MY_LISTINGS);
      // If response is null (403, 401, etc.), return null for hybrid service to handle
      if (response === null || response === undefined) {
        return null;
      }
      return response.data || response;
    } catch (error) {
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  },

  // Search apartments
  searchApartments: async (query, filters = {}) => {
    try {
      const params = { ...filters, search: query };
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`${API_ENDPOINTS.APARTMENTS.SEARCH}?${queryParams}`);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Diagnostic function to check if backend is storing images
  // Call this function to verify backend image storage for all listings
  diagnoseImageStorage: async () => {
    try {
      logger.log('🔍 DIAGNOSTIC: Checking backend image storage...');
      logger.log('  Fetching all listings from API...');
      
      const listings = await apartmentService.getApartments({});
      
      if (!listings || !Array.isArray(listings) || listings.length === 0) {
        logger.error('❌ DIAGNOSTIC: No listings found in API');
        logger.error('  This could mean:');
        logger.error('    1. Backend is filtering by authenticated user (WRONG for marketplace)');
        logger.error('    2. No listings exist in database');
        logger.error('    3. Backend endpoint /api/apartments is not working');
        return {
          success: false,
          error: 'No listings found',
          totalListings: 0,
        };
      }
      
      logger.log(`✅ DIAGNOSTIC: Found ${listings.length} listing(s) in API`);
      
      // Analyze each listing
      const diagnosticReport = {
        success: true,
        totalListings: listings.length,
        listingsWithImages: 0,
        listingsWithoutImages: 0,
        listings: [],
        summary: {
          imageField: { count: 0, examples: [] },
          imagesArray: { count: 0, examples: [] },
          photosArray: { count: 0, examples: [] },
          imageUrlField: { count: 0, examples: [] },
          imageUrlsArray: { count: 0, examples: [] },
        },
      };
      
      listings.forEach((listing, index) => {
        const listingId = listing.id || listing._id || `listing-${index}`;
        const listingTitle = listing.title || 'Untitled';
        
        // Check all possible image fields
        const hasImage = !!listing.image;
        const hasImages = !!(listing.images && Array.isArray(listing.images) && listing.images.length > 0);
        const hasPhotos = !!(listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0);
        const hasImageUrl = !!listing.imageUrl;
        const hasImageUrls = !!(listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0);
        
        const hasAnyImage = hasImage || hasImages || hasPhotos || hasImageUrl || hasImageUrls;
        
        if (hasAnyImage) {
          diagnosticReport.listingsWithImages++;
        } else {
          diagnosticReport.listingsWithoutImages++;
        }
        
        // Track which fields are being used
        if (hasImage) {
          diagnosticReport.summary.imageField.count++;
          if (diagnosticReport.summary.imageField.examples.length < 3) {
            diagnosticReport.summary.imageField.examples.push({
              id: listingId,
              title: listingTitle,
              value: String(listing.image).substring(0, 100),
            });
          }
        }
        
        if (hasImages) {
          diagnosticReport.summary.imagesArray.count++;
          if (diagnosticReport.summary.imagesArray.examples.length < 3) {
            diagnosticReport.summary.imagesArray.examples.push({
              id: listingId,
              title: listingTitle,
              count: listing.images.length,
              firstImage: String(listing.images[0]).substring(0, 100),
            });
          }
        }
        
        if (hasPhotos) {
          diagnosticReport.summary.photosArray.count++;
          if (diagnosticReport.summary.photosArray.examples.length < 3) {
            const firstPhoto = listing.photos[0];
            const photoValue = typeof firstPhoto === 'string' 
              ? String(firstPhoto).substring(0, 100)
              : (typeof firstPhoto === 'object' && firstPhoto !== null
                ? JSON.stringify(firstPhoto).substring(0, 100)
                : String(firstPhoto));
            diagnosticReport.summary.photosArray.examples.push({
              id: listingId,
              title: listingTitle,
              count: listing.photos.length,
              firstPhotoType: typeof firstPhoto,
              firstPhotoValue: photoValue,
            });
          }
        }
        
        if (hasImageUrl) {
          diagnosticReport.summary.imageUrlField.count++;
        }
        
        if (hasImageUrls) {
          diagnosticReport.summary.imageUrlsArray.count++;
        }
        
        // Store detailed info for each listing
        diagnosticReport.listings.push({
          id: listingId,
          title: listingTitle,
          hasImages: hasAnyImage,
          imageFields: {
            image: hasImage,
            images: hasImages,
            photos: hasPhotos,
            imageUrl: hasImageUrl,
            imageUrls: hasImageUrls,
          },
          photosArrayLength: listing.photos?.length || 0,
          imagesArrayLength: listing.images?.length || 0,
          // Log structure of photos array if it exists but is empty or has unexpected structure
          photosArrayStructure: listing.photos && Array.isArray(listing.photos)
            ? (listing.photos.length > 0
              ? `Array(${listing.photos.length}) - first item type: ${typeof listing.photos[0]}`
              : 'Array(0) - EMPTY')
            : 'Not an array or missing',
        });
      });
      
      // Log comprehensive report
      logger.log('📊 DIAGNOSTIC REPORT: Backend Image Storage');
      logger.log('  Total listings:', diagnosticReport.totalListings);
      logger.log('  Listings WITH images:', diagnosticReport.listingsWithImages);
      logger.log('  Listings WITHOUT images:', diagnosticReport.listingsWithoutImages);
      logger.log('  Percentage with images:', diagnosticReport.totalListings > 0
        ? Math.round((diagnosticReport.listingsWithImages / diagnosticReport.totalListings) * 100) + '%'
        : '0%');
      
      logger.log('  Image field usage:');
      logger.log('    - image field:', diagnosticReport.summary.imageField.count, 'listings');
      logger.log('    - images array:', diagnosticReport.summary.imagesArray.count, 'listings');
      logger.log('    - photos array:', diagnosticReport.summary.photosArray.count, 'listings');
      logger.log('    - imageUrl field:', diagnosticReport.summary.imageUrlField.count, 'listings');
      logger.log('    - imageUrls array:', diagnosticReport.summary.imageUrlsArray.count, 'listings');
      
      // Log examples
      if (diagnosticReport.summary.imageField.examples.length > 0) {
        logger.log('  Examples using "image" field:');
        diagnosticReport.summary.imageField.examples.forEach(ex => {
          logger.log(`    - ${ex.id} (${ex.title}): ${ex.value}...`);
        });
      }
      
      if (diagnosticReport.summary.imagesArray.examples.length > 0) {
        logger.log('  Examples using "images" array:');
        diagnosticReport.summary.imagesArray.examples.forEach(ex => {
          logger.log(`    - ${ex.id} (${ex.title}): ${ex.count} image(s), first: ${ex.firstImage}...`);
        });
      }
      
      if (diagnosticReport.summary.photosArray.examples.length > 0) {
        logger.log('  Examples using "photos" array:');
        diagnosticReport.summary.photosArray.examples.forEach(ex => {
          logger.log(`    - ${ex.id} (${ex.title}): ${ex.count} photo(s), type: ${ex.firstPhotoType}, value: ${ex.firstPhotoValue}...`);
        });
      }
      
      // Log listings without images
      const listingsWithoutImages = diagnosticReport.listings.filter(l => !l.hasImages);
      if (listingsWithoutImages.length > 0) {
        logger.error('❌ Listings WITHOUT images:');
        listingsWithoutImages.forEach(l => {
          logger.error(`    - ${l.id} (${l.title})`);
          logger.error(`      photos array: ${l.photosArrayStructure}`);
          logger.error(`      images array length: ${l.imagesArrayLength}`);
        });
      }
      
      // Final verdict
      if (diagnosticReport.listingsWithoutImages === diagnosticReport.totalListings) {
        logger.error('❌ CRITICAL: Backend is NOT storing images for ANY listings!');
        logger.error('  This means other users cannot see images for these listings');
        logger.error('');
        logger.error('  🔧 IMMEDIATE ACTION REQUIRED:');
        logger.error('    1. Go to Railway Dashboard: https://railway.app');
        logger.error('    2. Select your backend service');
        logger.error('    3. Check "Deployments" tab - is latest deployment "Active"?');
        logger.error('    4. Check build logs for compilation errors');
        logger.error('    5. Verify backend has these files deployed:');
        logger.error('       - ListingRequest.java (with image fields)');
        logger.error('       - Base64ToMultipartFile.java');
        logger.error('       - ListingServiceImpl.java (with processImagesFromRequest method)');
        logger.error('    6. If code is updated but not deployed: Click "Redeploy" in Railway');
        logger.error('    7. After redeploy, create a new test listing with images');
        logger.error('    8. Check backend logs for image processing messages');
        logger.error('');
        logger.error('  📋 BACKEND CODE REQUIREMENTS:');
        logger.error('    1. Backend DTO must accept image fields (image, images, photos, imageUrl, imageUrls)');
        logger.error('    2. Backend must have processImagesFromRequest() method');
        logger.error('    3. Backend must call processImagesFromRequest() in createListing() and updateListing()');
        logger.error('    4. Backend must persist images to database via ListingPhoto entity');
        logger.error('    5. Backend must return photos array in API responses');
        logger.error('');
        logger.error('  ⚠️ CURRENT WORKAROUND: Images are stored locally, visible only to the user who uploaded them');
        logger.error('  📖 See: URGENT_BACKEND_IMAGE_FIX.md for detailed troubleshooting steps');
      } else if (diagnosticReport.listingsWithoutImages > 0) {
        logger.error(`❌ Backend is NOT storing images for ${diagnosticReport.listingsWithoutImages} listing(s)!`);
        logger.error('  This means other users cannot see images for these listings');
        logger.warn('  Some listings have images, but others do not');
        logger.warn('  This suggests inconsistent backend storage or some listings were created without images');
        logger.error('  ACTION REQUIRED: Backend needs to be configured to accept and store image fields for ALL listings');
      } else {
        logger.log('✅ SUCCESS: All listings have images stored in backend!');
        logger.log('  Other users can see images for all listings');
      }
      
      // Add helpful summary
      logger.log('');
      logger.log('📊 DIAGNOSTIC SUMMARY:');
      logger.log(`  Total listings checked: ${diagnosticReport.totalListings}`);
      logger.log(`  Listings WITH images: ${diagnosticReport.listingsWithImages}`);
      logger.log(`  Listings WITHOUT images: ${diagnosticReport.listingsWithoutImages}`);
      logger.log(`  Image storage success rate: ${diagnosticReport.totalListings > 0 
        ? Math.round((diagnosticReport.listingsWithImages / diagnosticReport.totalListings) * 100) 
        : 0}%`);
      
      if (diagnosticReport.listingsWithoutImages > 0) {
        logger.log('');
        logger.log('🔍 TO TEST BACKEND DIRECTLY:');
        logger.log('  Run this in browser console after getting your auth token:');
        logger.log('  See: CHECK_BACKEND_IMAGE_STORAGE.md for test code');
      }
      
      return diagnosticReport;
    } catch (error) {
      logger.error('❌ DIAGNOSTIC ERROR:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        totalListings: 0,
      };
    }
  },
};
