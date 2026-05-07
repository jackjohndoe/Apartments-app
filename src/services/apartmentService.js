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
      
      // Try public fallback if main API fails
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
        }
      });
      
      if (!result.image && (!result.images || result.images.length === 0)) {
        logger.warn('⚠️ WARNING: API response does not contain images!');
        logger.warn('⚠️ This confirms backend is NOT storing/returning images correctly');
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Error creating apartment:', error);
      throw error;
    }
  },

  // Update apartment listing
  updateApartment: async (id, apartmentData) => {
    try {
<<<<<<< HEAD
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
=======
      const response = await api.put(API_ENDPOINTS.APARTMENTS.UPDATE(id), apartmentData);
>>>>>>> bbd6c1646949d2ae7c70a843b92d57e1a13bb11f
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Delete apartment listing
  deleteApartment: async (id) => {
    try {
      const response = await api.delete(API_ENDPOINTS.APARTMENTS.DELETE(id));
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // Search apartments
  searchApartments: async (query) => {
    try {
      const response = await api.get(API_ENDPOINTS.APARTMENTS.SEARCH(query));
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
};
