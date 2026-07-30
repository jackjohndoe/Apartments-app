// Hybrid Service - Uses API with AsyncStorage fallback
// This ensures the app works offline and maintains the same UI
import { apartmentService } from './apartmentService';
import { bookingService } from './bookingService';
import { walletService } from './walletService';
import { favoriteService } from './favoriteService';
import { getBookings, addBooking } from '../utils/bookings';
import { getListings, addListing, deleteListing } from '../utils/listings';
import { getWalletBalance, getTransactions, addFunds, makePayment } from '../utils/wallet';
import { queueListingForSync, getPendingSyncListings, removeFromSyncQueue } from './listingSyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { API_CONFIG } from '../api/api';

// Helper to check if API is available
const isApiAvailable = async () => {
  try {
    // Try a simple health check or just assume API is available
    // In production, you might want to ping a health endpoint
    return true;
  } catch {
    return false;
  }
};

// Import placeholder utility
import { getApartmentPlaceholder } from '../utils/imagePlaceholder';

// Get default placeholder at module level so it's available everywhere
const DEFAULT_PLACEHOLDER = getApartmentPlaceholder();

// Helper to get default apartments (matches ExploreScreen default apartments)
const getDefaultApartments = () => {
  // Return empty array to remove placeholder listings as requested
  return [];
};

// Helper to check if an image URI is valid (not empty, not null, not undefined)
const isValidImageUri = (uri) => {
  return uri && typeof uri === 'string' && uri.trim() !== '';
};

const resolveImageUri = (uri) => {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  try {
    if (trimmed.startsWith('data:image')) {
      return trimmed;
    }
    if (trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.startsWith('http')) {
      const u = new URL(trimmed);
      const base = API_CONFIG.BASE_URL.replace(/\/+$/, '');
      const baseUrl = new URL(base);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        return `${baseUrl.origin}${u.pathname}${u.search || ''}`;
      }
      if (u.protocol === 'http:' && baseUrl.protocol === 'https:' && u.hostname === baseUrl.hostname) {
        return `${baseUrl.origin}${u.pathname}${u.search || ''}`;
      }
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      const base = API_CONFIG.BASE_URL.replace(/\/+$/, '');
      return `${base}${trimmed}`;
    }
    const base = API_CONFIG.BASE_URL.replace(/\/+$/, '');
    return `${base}/api/files/${trimmed}`;
  } catch {
    return trimmed;
  }
};

// Enhanced helper to extract image URL from various photo structures
// Handles: strings, objects with URL properties, base64 data URIs, nested objects (up to 2 levels)
const extractImageFromPhoto = (photo, depth = 0) => {
  // Prevent infinite recursion
  if (depth > 2) return null;
  
  // If it's a string, validate and return
  if (typeof photo === 'string') {
    const trimmed = photo.trim();
    if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
      return trimmed;
    }
    return null;
  }
  
  // If it's an object, check common URL properties
  if (photo && typeof photo === 'object' && !Array.isArray(photo)) {
    // Check common URL properties (order matters - prioritize direct URLs)
    const urlProperties = ['url', 'imageUrl', 'src', 'thumbnail', 'original', 'path', 'file', 'link', 'image', 'photo'];
    
    for (const prop of urlProperties) {
      if (photo[prop]) {
        // If the property value is a string, validate and return
        if (typeof photo[prop] === 'string') {
          const trimmed = photo[prop].trim();
          if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
            return trimmed;
          }
        }
        // If the property value is an object, recurse (up to 2 levels)
        else if (typeof photo[prop] === 'object' && depth < 2) {
          const nestedUrl = extractImageFromPhoto(photo[prop], depth + 1);
          if (nestedUrl) return nestedUrl;
        }
      }
    }
    
    // Check all string values in the object (for unexpected structures)
    for (const key in photo) {
      if (photo.hasOwnProperty(key) && typeof photo[key] === 'string') {
        const trimmed = photo[key].trim();
        if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
          return trimmed;
        }
      }
    }
  }
  
  return null;
};

// Enhanced helper to extract images from photos array
// Returns array of valid image URLs found in the photos array
const extractImagesFromPhotosArray = (photos) => {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return [];
  }
  
  const validImages = [];
  
  for (const photo of photos) {
    const imageUrl = extractImageFromPhoto(photo);
    if (imageUrl && !validImages.includes(imageUrl)) {
      validImages.push(imageUrl);
    }
  }
  
  return validImages;
};

// Helper to normalize text for fuzzy matching
const normalizeText = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
};

// Try to find a matching local listing by title (and optional price/location)
const findLocalListingByTitle = (rawLocalListingsMap, apiListing) => {
  try {
    const apiTitleNorm = normalizeText(apiListing.title || apiListing.name);
    if (!apiTitleNorm) return null;
    
    let bestMatch = null;
    for (const [, local] of rawLocalListingsMap.entries()) {
      const localTitleNorm = normalizeText(local.title || local.name);
      if (!localTitleNorm) continue;
      
      // Exact normalized title match
      if (localTitleNorm === apiTitleNorm) {
        bestMatch = local;
        break;
      }
      
      // Partial match heuristic for short titles
      if (apiTitleNorm.length >= 3 && localTitleNorm.includes(apiTitleNorm)) {
        bestMatch = local;
        break;
      }
    }
    
    return bestMatch || null;
  } catch {
    return null;
  }
};

// Helper to format listings for ExploreScreen
const formatListingsForExplore = (listings) => {
  return listings.map(listing => {
    // Get the primary image - prioritize uploaded images, only use placeholder if truly no image
    // CRITICAL: Preserve images from API listings (other users' listings)
    let primaryImage = null;
    
    // Debug: Log all image-related fields to understand API structure
    const listingId = (listing && (listing.id || listing._id)) || 'unknown';
    const listingTitle = (listing && listing.title) || 'Untitled';
    
    // Check main image field first
    if (listing && isValidImageUri(listing.image)) {
      primaryImage = resolveImageUri(listing.image);
      logger.log('✅ Using listing.image for listing:', listingId, listingTitle, 'URL:', listing.image.substring(0, 50));
    } 
    // Check images array (may contain multiple images from API)
    else if (listing && listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
      // Find first valid image in images array
      const validImage = listing.images.find(img => isValidImageUri(img));
      if (validImage) {
        primaryImage = resolveImageUri(validImage);
        logger.log('✅ Using listing.images[0] for listing:', listingId, listingTitle, 'URL:', validImage.substring(0, 50));
      } else {
        logger.warn('⚠️ listing.images array exists but no valid image found for:', listingId, listingTitle, 'Array:', listing.images);
      }
    } 
    // Check photos array EARLY - it's a common field in API responses
    // CRITICAL: photos array might contain strings OR objects with url/imageUrl properties
    // Use enhanced extraction function to handle all possible structures
    else if (listing && listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      const extractedImages = extractImagesFromPhotosArray(listing.photos);
      if (extractedImages.length > 0) {
        primaryImage = resolveImageUri(extractedImages[0]);
        logger.log('✅ Using listing.photos[0] for listing:', listingId, listingTitle, 'URL:', primaryImage.substring(0, 50));
        logger.log('  Found', extractedImages.length, 'valid image(s) in photos array');
      } else {
        // Log what's actually in the photos array for debugging
        logger.warn('⚠️ listing.photos array exists but no valid image found for:', listingId, listingTitle);
        logger.warn('  Photos array length:', listing.photos.length);
        logger.warn('  Photos array sample (first 2):', JSON.stringify(listing.photos.slice(0, 2), null, 2));
        // Log structure of first photo item for detailed debugging
        if (listing.photos[0]) {
          const firstPhoto = listing.photos[0];
          logger.warn('  First photo type:', typeof firstPhoto);
          if (typeof firstPhoto === 'object' && firstPhoto !== null) {
            logger.warn('  First photo keys:', Object.keys(firstPhoto));
            logger.warn('  First photo sample:', JSON.stringify(firstPhoto, null, 2));
          }
        }
      }
    }
    // Check photo field (alternative field name) - after photos array
    else if (listing && isValidImageUri(listing.photo)) {
      primaryImage = resolveImageUri(listing.photo);
      logger.log('✅ Using listing.photo for listing:', listingId, listingTitle, 'URL:', listing.photo.substring(0, 50));
    }
    // Check imageUrl field (some APIs use this)
    else if (listing && isValidImageUri(listing.imageUrl)) {
      primaryImage = resolveImageUri(listing.imageUrl);
      logger.log('✅ Using listing.imageUrl for listing:', listingId, listingTitle, 'URL:', listing.imageUrl.substring(0, 50));
    }
    // Check imageUrls (plural) - some APIs use this
    else if (listing && listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0) {
      const validImage = listing.imageUrls.find(img => isValidImageUri(img));
      if (validImage) {
        primaryImage = resolveImageUri(validImage);
        logger.log('✅ Using listing.imageUrls[0] for listing:', listingId, listingTitle, 'URL:', validImage.substring(0, 50));
      }
    }
    
    // CRITICAL: If still no image, check ALL fields in the listing for image data
    // Backend might store images in unexpected fields
    if (!primaryImage) {
      const allKeys = (listing && typeof listing === 'object') ? Object.keys(listing) : [];
      logger.log('🔍 No image found in standard fields, checking ALL listing fields for ID:', listingId);
      
      // Check every field that might contain image data
      for (const key of allKeys) {
        const value = listing[key];
        if (!value || value === null || value === undefined) continue;
        
        // Check if it's a string that looks like an image URL
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
            primaryImage = resolveImageUri(trimmed);
            logger.log('✅ Found image in unexpected field:', key, 'for listing:', listingId, listingTitle, 'URL:', trimmed.substring(0, 50));
            break;
          }
        }
        
        // Check if it's an array that might contain image URLs
        if (Array.isArray(value) && value.length > 0) {
          // Try to extract images from the array
          const extractedImages = extractImagesFromPhotosArray(value);
          if (extractedImages.length > 0) {
            primaryImage = resolveImageUri(extractedImages[0]);
            logger.log('✅ Found images in unexpected array field:', key, 'for listing:', listingId, listingTitle, 'URL:', primaryImage.substring(0, 50));
            break;
          }
        }
        
        // Check if it's an object that might contain image URLs
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          // Check common image properties in the object
          const imageProps = ['url', 'imageUrl', 'src', 'thumbnail', 'original', 'path', 'file', 'link', 'image', 'photo'];
          for (const prop of imageProps) {
            if (value[prop] && typeof value[prop] === 'string') {
              const trimmed = value[prop].trim();
              if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
                primaryImage = resolveImageUri(trimmed);
                logger.log('✅ Found image in unexpected object field:', key + '.' + prop, 'for listing:', listingId, listingTitle, 'URL:', trimmed.substring(0, 50));
                break;
              }
            }
          }
          if (primaryImage) break;
        }
      }
    }
    
    // Only use placeholder if we truly have no valid image
    if (!primaryImage) {
      // Debug: Log what fields the listing actually has
      const imageFields = {
        hasImage: !!(listing && listing.image),
        imageValue: listing && listing.image,
        hasImages: !!(listing && listing.images && Array.isArray(listing.images)),
        imagesLength: listing && listing.images ? (listing.images.length || 0) : 0,
        hasPhoto: !!(listing && listing.photo),
        photoValue: listing && listing.photo,
        hasImageUrl: !!(listing && listing.imageUrl),
        imageUrlValue: listing && listing.imageUrl,
        hasImageUrls: !!(listing && listing.imageUrls && Array.isArray(listing.imageUrls)),
        hasPhotos: !!(listing && listing.photos && Array.isArray(listing.photos)),
        photosLength: listing && listing.photos ? (listing.photos.length || 0) : 0,
        photosSample: listing && listing.photos ? listing.photos.slice(0, 2).map(p => {
          if (typeof p === 'string') return p.substring(0, 50);
          if (typeof p === 'object' && p !== null) {
            return { type: 'object', keys: Object.keys(p), url: p.url || p.imageUrl || p.src || 'none' };
          }
          return String(p);
        }) : null,
        allKeys: (listing && typeof listing === 'object') ? Object.keys(listing).filter(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('photo')) : [],
      };
      logger.warn('⚠️ No valid image found for listing:', listingId, listingTitle);
      logger.warn('  Image fields debug:', JSON.stringify(imageFields, null, 2));
      
      // Log ALL keys in the listing to see what fields are available
      const allListingKeys = (listing && typeof listing === 'object') ? Object.keys(listing) : [];
      logger.warn('  All listing keys:', allListingKeys);
      
      // Check for any field that might contain image data (case-insensitive)
      const possibleImageFields = allListingKeys.filter(k => {
        const lowerKey = k.toLowerCase();
        return lowerKey.includes('image') || 
               lowerKey.includes('photo') || 
               lowerKey.includes('picture') || 
               lowerKey.includes('pic') ||
               lowerKey.includes('media') ||
               lowerKey.includes('url') ||
               lowerKey.includes('file');
      });
      if (possibleImageFields.length > 0) {
        logger.warn('  Possible image-related fields found:', possibleImageFields);
        // Log values of these fields
        possibleImageFields.forEach(field => {
          const value = listing[field];
          if (value !== null && value !== undefined) {
            logger.warn(`    ${field}:`, typeof value === 'string' ? value.substring(0, 100) : 
                       Array.isArray(value) ? `Array(${value.length})` : 
                       typeof value === 'object' ? JSON.stringify(value).substring(0, 200) : value);
          }
        });
      }
      
      primaryImage = DEFAULT_PLACEHOLDER;
    }
    
    return {
      id: (listing && (listing.id || listing._id)) || String(listing && listing.id),
      title: (listing && (listing.title || listing.name)) || 'Apartment',
      price: (listing && (listing.price || listing.rent)) || 0,
      location: (listing && (listing.location || listing.address)) || 'Nigeria',
      beds: (listing && (listing.bedrooms || listing.beds)) || 1,
      baths: (listing && (listing.bathrooms || listing.baths)) || 1,
      bedrooms: listing && (listing.bedrooms || listing.beds) || null,
      bathrooms: listing && (listing.bathrooms || listing.baths) || null,
      area: listing && listing.area || null,
      maxGuests: listing && listing.maxGuests || null,
      description: listing && listing.description || null,
      amenities: listing && listing.amenities || null,
      image: primaryImage,
      images: (() => {
        // CRITICAL: Preserve all images from API listings (other users' listings)
        // Check multiple possible image field names from API
        const allImages = [];
        
        // Check images array
        if (listing && listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
          const validImages = listing.images.filter(img => isValidImageUri(img)).map(resolveImageUri);
          allImages.push(...validImages);
        }
        
        // Check imageUrls array (alternative field name)
        if (listing && listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0) {
          const validImages = listing.imageUrls.filter(img => isValidImageUri(img)).map(resolveImageUri);
          allImages.push(...validImages);
        }
        
        // Check photos array (alternative field name)
        // CRITICAL: Use enhanced extraction function to handle all possible structures
        if (listing && listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
          const validImages = extractImagesFromPhotosArray(listing.photos).map(resolveImageUri);
          if (validImages.length > 0) {
            allImages.push(...validImages);
            logger.log('✅ Extracted', validImages.length, 'image(s) from photos array for:', (listing && (listing.id || listing._id)) || 'unknown');
          }
        }
        
        // If we found images in arrays, return them (deduplicate)
        if (allImages.length > 0) {
          const uniqueImages = [...new Set(allImages)]; // Remove duplicates
          logger.log('✅ Preserved', uniqueImages.length, 'images from arrays for:', (listing && (listing.id || listing._id)) || 'unknown');
          return uniqueImages;
        }
        
        // If no images array but we have a valid main image, create array with it
        if (listing && isValidImageUri(listing.image)) {
          logger.log('✅ Created images array from listing.image for:', (listing && (listing.id || listing._id)) || 'unknown');
          return [resolveImageUri(listing.image)];
        }
        
        // If we have photo field, use it
        if (listing && isValidImageUri(listing.photo)) {
          logger.log('✅ Created images array from listing.photo for:', (listing && (listing.id || listing._id)) || 'unknown');
          return [resolveImageUri(listing.photo)];
        }
        
        // If we have imageUrl field, use it
        if (listing && isValidImageUri(listing.imageUrl)) {
          logger.log('✅ Created images array from listing.imageUrl for:', (listing && (listing.id || listing._id)) || 'unknown');
          return [resolveImageUri(listing.imageUrl)];
        }
        
        // Return empty array (will use default in details screen)
        return [];
      })(),
      isFavorite: false,
      rating: (listing && listing.rating) || 4.5,
      createdAt: (listing && listing.createdAt) || new Date().toISOString(),
      createdBy: (listing && listing.createdBy) || null,
      hostName: (listing && listing.hostName) || null,
      isSuperhost: (listing && listing.isSuperhost) || false,
      hostEmail: (listing && listing.hostEmail) || null,
      hostProfilePicture: (listing && listing.hostProfilePicture) || null,
    };
  });
};

// Helper to merge API listings with local listings (API first, then local-only)
const mergeWithUserListings = async (apiApartments = [], userListings = null) => {
  try {
    // Get user listings if not provided
    if (!userListings) {
      userListings = await getListings();
    }
    
    // Format API apartments FIRST (these are from ALL devices - cross-platform)
    const formattedApiApartments = apiApartments && apiApartments.length > 0
      ? formatListingsForExplore(apiApartments)
      : [];
    
    // Get pending sync listings (local-only listings that haven't been synced yet)
    const pendingSync = await getPendingSyncListings();
    const pendingLocalIds = new Set(pendingSync.map(p => p.localId));
    
    // Format local listings (only include those that are pending sync)
    const localOnlyListings = userListings && userListings.length > 0
      ? userListings.filter(listing => {
          const listingId = listing.id || listing._id || String(listing.id);
          return pendingLocalIds.has(listingId);
        })
      : [];
    
    const formattedLocalListings = localOnlyListings.length > 0
      ? formatListingsForExplore(localOnlyListings)
      : [];
    
    // Create a set of API listing IDs for deduplication
    const apiListingIds = new Set(formattedApiApartments.map(apt => {
      const id = apt.id || apt._id || String(apt.id);
      return id;
    }));
    
    // Filter out local listings that already exist in API (prefer API version)
    const uniqueLocalListings = formattedLocalListings.filter(listing => {
      const listingId = listing.id || listing._id || String(listing.id);
      return !apiListingIds.has(listingId);
    });
    
    // Sort both arrays by most recent first
    const sortedApiApartments = formattedApiApartments.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Most recent first
    });
    
    const sortedLocalListings = uniqueLocalListings.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Most recent first
    });
    
    // Combine: API listings first (cross-platform), then local-only listings (pending sync)
    const result = [...sortedApiApartments, ...sortedLocalListings];
    logger.log('Final merged result:', result.length, 'API:', sortedApiApartments.length, 'Local-only:', sortedLocalListings.length);
    return result;
  } catch (error) {
    logger.error('Error merging listings:', error);
    // Fallback: return API apartments if available, otherwise local listings
    try {
      if (apiApartments && apiApartments.length > 0) {
        return formatListingsForExplore(apiApartments);
      }
      const userListings = await getListings();
      if (userListings && userListings.length > 0) {
        return formatListingsForExplore(userListings);
      }
    } catch (fallbackError) {
      logger.error('Fallback error:', fallbackError);
    }
    return [];
  }
};

// Helper to format listing for ExploreScreen
const formatListingForExplore = (listing) => {
  return {
    id: listing.id || listing._id || String(listing.id),
    title: listing.title || listing.name || 'Apartment',
    price: listing.price || listing.rent || 0,
    location: listing.location || listing.address || 'Nigeria',
    beds: listing.bedrooms || listing.beds || 1,
    baths: listing.bathrooms || listing.baths || 1,
    image: listing.image || listing.images?.[0] || listing.photo || DEFAULT_PLACEHOLDER,
    isFavorite: false,
    rating: listing.rating || 4.5,
    createdAt: listing.createdAt || new Date().toISOString(),
  };
};

// Helper to add new listing to cached apartments at the top
// Note: User listings are stored in 'userListings' and will always be loaded
// This function is kept for backward compatibility but user listings take priority
const addToCachedApartments = async (newListing) => {
  try {
    // User listings are stored separately in 'userListings' key
    // They will be automatically included when getApartments() is called
    // No need to add to cached_apartments as user listings are always loaded first
    logger.log('Listing added to userListings, will appear at top of ExploreScreen');
  } catch (error) {
    logger.error('Error in addToCachedApartments:', error);
    // Continue even if this fails - user listings are stored separately
  }
};

// Helper to remove listing from cached apartments
const removeFromCachedApartments = async (listingId) => {
  try {
    // User listings are stored in 'userListings' and will be removed by deleteListing()
    // Also remove from cached_api_apartments if it exists there
    try {
      const cached = await AsyncStorage.getItem('cached_api_apartments');
      if (cached) {
        const cachedApartments = JSON.parse(cached);
        const filteredApartments = cachedApartments.filter(apt => {
          const aptId = apt.id || apt._id || String(apt.id);
          return aptId !== listingId && String(aptId) !== String(listingId);
        });
        await AsyncStorage.setItem('cached_api_apartments', JSON.stringify(filteredApartments));
      }
    } catch (error) {
      // Continue even if this fails
    }
  } catch (error) {
    logger.error('Error removing from cached apartments:', error);
    // Continue even if cache update fails
  }
};

// Hybrid Apartment Service
export const hybridApartmentService = {
  getApartments: async (filters = {}) => {
    try {
      // PRIORITY 1: Fetch from API first (these contain listings from ALL devices/users)
      // This ensures cross-platform visibility (iOS users see Android listings and vice versa)
      // CRITICAL: API returns ALL listings regardless of platform - no filtering by device type
      let apiApartments = [];
      try {
        // CRITICAL: Ensure no user-specific or platform-specific filters are applied
        const cleanFilters = { ...filters };
        // Remove any potential platform-specific filters
        delete cleanFilters.platform;
        delete cleanFilters.deviceType;
        delete cleanFilters.os;
        // Remove any user-specific filters (these should NEVER be in filters for getAllApartments)
        delete cleanFilters.createdBy;
        delete cleanFilters.hostEmail;
        delete cleanFilters.userEmail;
        delete cleanFilters.userId;
        delete cleanFilters.owner;
        delete cleanFilters.creator;
        
        const apartments = await apartmentService.getApartments(cleanFilters);
        if (apartments !== null && apartments !== undefined) {
          apiApartments = Array.isArray(apartments) ? apartments : [];
          // Cache API apartments for offline access
          if (apiApartments.length > 0) {
            await AsyncStorage.setItem('cached_api_apartments', JSON.stringify(apiApartments));
            logger.log('✅ Loaded', apiApartments.length, 'listings from API (cross-platform - Android & iOS)');
          }
        }
      } catch (apiError) {
        logger.log('⚠️ API fetch failed, using cached listings:', apiError.message);
        // If API fails, try to load cached API apartments
        try {
          const cached = await AsyncStorage.getItem('cached_api_apartments');
          if (cached) {
            apiApartments = JSON.parse(cached);
            logger.log('✅ Using cached API listings:', apiApartments.length);
          }
        } catch (cacheError) {
          logger.log('No cached API apartments available');
        }
      }
      
      // PRIORITY 2: Get local-only listings (those pending sync)
      const allListings = await getListings();
      
      // Merge: API listings first (cross-platform), then local-only listings (pending sync)
      const merged = await mergeWithUserListings(apiApartments, allListings);
      logger.log('✅ Merged apartments:', merged.length, 'API:', apiApartments.length, 'Local-only:', allListings.length);
      return merged;
    } catch (error) {
      logger.error('Error getting apartments:', error);
      // Fallback: try cached API listings first, then local listings
      try {
        const cached = await AsyncStorage.getItem('cached_api_apartments');
        if (cached) {
          const apiApartments = JSON.parse(cached);
          return formatListingsForExplore(apiApartments);
        }
        const allListings = await getListings();
        if (allListings && allListings.length > 0) {
          return formatListingsForExplore(allListings);
        }
      } catch (fallbackError) {
        logger.error('Error in fallback:', fallbackError);
      }
      return [];
    }
  },
  
  // Get all apartments including default ones for ExploreScreen
  getAllApartmentsForExplore: async (forceRefresh = false) => {
    try {
      // PRIORITY 1: Check API health first
      const { checkApiHealth } = await import('../utils/apiHealthCheck');
      const apiHealth = await checkApiHealth(forceRefresh);
      
      // PRIORITY 2: Get API apartments first (these contain listings from ALL devices/users)
      // This ensures cross-platform visibility (iPhone users see Android listings and vice versa)
      // CRITICAL: API returns ALL listings regardless of platform - no filtering by device type
      let apiApartments = [];
      let apiAvailable = false;
      
      // Only try API if health check indicates it's available
      if (apiHealth.available) {
        try {
          // CRITICAL: Fetch ALL listings from ALL users - no user filtering
          // Pass empty filters object to ensure no user-specific filtering
          const apartments = await apartmentService.getApartments({});
          if (apartments !== null && apartments !== undefined) {
            apiApartments = Array.isArray(apartments) ? apartments : [];
            apiAvailable = true;
            
            // Cache API apartments for offline access
            if (apiApartments.length > 0) {
              await AsyncStorage.setItem('cached_api_apartments', JSON.stringify(apiApartments));
              logger.log('✅ Loaded', apiApartments.length, 'listings from API (all users, all devices)');
              logger.log('🔄 These listings are visible on ALL devices (iPhone, Android, Web)');
              
              // Run diagnostic check for backend image storage (only in development, only once per session)
              if (__DEV__ && forceRefresh && !global._imageStorageDiagnosticRun) {
                global._imageStorageDiagnosticRun = true;
                // Run diagnostic asynchronously (don't block the main flow)
                apartmentService.diagnoseImageStorage().catch(err => {
                  logger.warn('⚠️ Diagnostic check failed:', err.message);
                });
              }
            } else {
              // API returned empty array - this is valid (no listings exist)
              logger.log('ℹ️ API returned empty array - no listings exist in database yet');
              logger.log('  This is normal for a new deployment. Create listings to see them here.');
            }
          } else {
            // API returned null - this indicates an error
            logger.warn('⚠️ API returned null - check error logs for details');
            apiAvailable = false;
          }
        } catch (apiError) {
          logger.error('❌ API fetch failed:', apiError.message);
          apiAvailable = false;
          
          // If API fails, try cached API apartments (from previous successful fetch)
          try {
            const cached = await AsyncStorage.getItem('cached_api_apartments');
            if (cached) {
              apiApartments = JSON.parse(cached);
              logger.log('✅ Using cached API listings:', apiApartments.length);
              logger.log('  Note: These are from a previous successful API fetch');
            }
          } catch (cacheError) {
            logger.log('No cached API apartments available');
          }
        }
      } else {
        // API is not available - log the reason
        logger.warn('⚠️ API is not available:', apiHealth.message);
        logger.warn('  Falling back to local storage and cached API listings');
        
        // Try to use cached API listings if available
        try {
          const cached = await AsyncStorage.getItem('cached_api_apartments');
          if (cached) {
            apiApartments = JSON.parse(cached);
            logger.log('✅ Using cached API listings:', apiApartments.length);
          }
        } catch (cacheError) {
          logger.log('No cached API apartments available');
        }
      }
      
      // PRIORITY 2: Get local listings ONLY if API is unavailable
      // If API is available (even if empty), we trust API as source of truth
      // Only use local listings when API is truly unavailable (offline mode)
      let localOnlyListings = [];
      
      if (!apiAvailable) {
        // API is unavailable - use local listings as fallback
        const allListings = await getListings();
        logger.log('🔄 API unavailable - using local listings as fallback:', allListings.length);
        localOnlyListings = allListings;
      } else {
        // API is available - only include local listings that haven't synced yet
        // These are listings created offline that need to be synced
        const allListings = await getListings();
        logger.log('🔄 API available - checking for unsynced local listings:', allListings.length);
        
        // Only include local listings that don't exist in API (pending sync)
        const apiListingIds = new Set(apiApartments.map(apt => String(apt.id || apt._id || '')));
        localOnlyListings = allListings.filter(listing => {
          const listingId = String(listing.id || listing._id || '');
          return !apiListingIds.has(listingId);
        });
        
        if (localOnlyListings.length > 0) {
          logger.log('✅ Found', localOnlyListings.length, 'unsynced local listings');
        }
      }
      
      // Create a map of RAW local listings by ID for image enhancement (before formatting)
      const rawLocalListingsMap = new Map();
      localOnlyListings.forEach(listing => {
        const listingId = String(listing.id || listing._id || '');
        if (listingId && listingId !== 'undefined' && listingId !== 'null' && listingId !== '') {
          rawLocalListingsMap.set(listingId, listing);
        }
      });
      
      // Format local-only listings
      const formattedLocalListings = localOnlyListings && localOnlyListings.length > 0
        ? formatListingsForExplore(localOnlyListings)
        : [];
      
      // Enhance API listings with images from local listings if they're missing images
      let formattedApiApartments = apiApartments && apiApartments.length > 0
        ? formatListingsForExplore(apiApartments)
        : [];
      
      formattedApiApartments = formattedApiApartments.map(apiListing => {
        const apiId = String(apiListing.id || apiListing._id || '');
        const apiHasImage = apiListing.image && apiListing.image !== DEFAULT_PLACEHOLDER;
        
        let rawLocalListing = null;
        if (rawLocalListingsMap.has(apiId)) {
          rawLocalListing = rawLocalListingsMap.get(apiId);
        } else {
          // Fallback: try to find local listing by title if still not found
          const byTitle = findLocalListingByTitle(rawLocalListingsMap, apiListing);
          if (byTitle) rawLocalListing = byTitle;
        }
        
        if (!apiHasImage && rawLocalListing) {
          let localImage = null;
          let localImages = [];
          
          if (isValidImageUri(rawLocalListing.image)) {
            localImage = resolveImageUri(rawLocalListing.image);
            localImages.push(localImage);
          }
          
          if (rawLocalListing.images && Array.isArray(rawLocalListing.images) && rawLocalListing.images.length > 0) {
            const validImages = rawLocalListing.images.filter(img => isValidImageUri(img)).map(resolveImageUri);
            if (validImages.length > 0) {
              if (!localImage) localImage = validImages[0];
              localImages.push(...validImages);
            }
          }
          
          if (localImage) {
            const uniqueImages = [...new Set(localImages)];
            return {
              ...apiListing,
              image: localImage,
              images: uniqueImages,
            };
          }
        }
        
        return apiListing;
      });
      
      // Get default apartments
      const defaultApartments = getDefaultApartments();
      
      // Combine all: API apartments first (cross-platform), then local-only listings, then defaults
      const allIds = new Set();
      const combined = [];
      
      // PRIORITY 1: Add API apartments first
      formattedApiApartments.forEach(apt => {
        const id = String(apt.id || apt._id || '');
        if (!allIds.has(id)) {
          allIds.add(id);
          combined.push(apt);
        }
      });
      
      // PRIORITY 2: Add local-only listings (pending sync)
      formattedLocalListings.forEach(apt => {
        const id = String(apt.id || apt._id || '');
        if (!allIds.has(id)) {
          allIds.add(id);
          combined.push(apt);
        }
      });
      
      // PRIORITY 3: Add default apartments
      defaultApartments.forEach(apt => {
        const id = String(apt.id || apt._id || '');
        if (!allIds.has(id)) {
          allIds.add(id);
          combined.push(apt);
        }
      });
      
      return combined;
    } catch (error) {
      logger.error('Error in getAllApartmentsForExplore:', error);
      // Fallback: try cached API listings first, then local listings
      try {
        const cached = await AsyncStorage.getItem('cached_api_apartments');
        if (cached) {
          const apiApartments = JSON.parse(cached);
          return formatListingsForExplore(apiApartments);
        }
        const allListings = await getListings();
        if (allListings && allListings.length > 0) {
          return formatListingsForExplore(allListings);
        }
      } catch (fallbackError) {
        logger.error('Error in fallback:', fallbackError);
      }
      return [];
    }
  },

  getApartmentById: async (id) => {
    try {
      const apartment = await apartmentService.getApartmentById(id);
      if (apartment === null || apartment === undefined) {
        throw new Error('API returned null');
      }
      return apartment;
    } catch (error) {
      // Silent fallback - FRONTEND PRESERVED
      const cached = await AsyncStorage.getItem('cached_apartments');
      if (cached) {
        const apartments = JSON.parse(cached);
        return apartments.find(apt => apt.id === id || apt._id === id) || null;
      }
      return null;
    }
  },

  createApartment: async (apartmentData) => {
    // Save directly to API - makes listing available to all users immediately
    // Also save locally as fallback so it appears immediately on home screen
    let apiResult = null;
    let isOffline = false;
    
    try {
      apiResult = await apartmentService.createApartment(apartmentData);
    } catch (error) {
      logger.error('Error creating apartment in API:', error);
      // Fallback to local storage
      apiResult = null;
    }
    
    if (apiResult === null || apiResult === undefined) {
      logger.warn('⚠️ API creation failed or returned null - falling back to local storage');
      isOffline = true;
      
      // Create a local-only result object
      // Generate a unique ID for local storage
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      apiResult = {
        ...apartmentData,
        id: localId,
        _id: localId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _offline: true, // Mark as offline/local-only
      };
    }
    
    if (!isOffline) {
      logger.log('✅ Listing saved to API - available to all users:', apiResult.id || apiResult._id);
    } else {
      logger.log('⚠️ Listing saved LOCALLY only - will sync when online:', apiResult.id);
    }
    
    // CRITICAL: Verify if backend stored images by checking API response
    const apiHasImages = (apiResult.image || 
                         (apiResult.images && Array.isArray(apiResult.images) && apiResult.images.length > 0) ||
                         (apiResult.photos && Array.isArray(apiResult.photos) && apiResult.photos.length > 0));
    const weHaveImages = (apartmentData.image || 
                         (apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0));
    
    if (!apiHasImages && weHaveImages) {
      logger.error('❌ CRITICAL: Backend did not store images!');
      logger.warn('⚠️ Attempting to update listing with images...');
      try {
        const updatedResult = await apartmentService.updateApartment(apiResult.id || apiResult._id, apartmentData);
        if (updatedResult) {
          const updateHasImages = (updatedResult.image || 
                                  (updatedResult.images && Array.isArray(updatedResult.images) && updatedResult.images.length > 0) ||
                                  (updatedResult.photos && Array.isArray(updatedResult.photos) && updatedResult.photos.length > 0));
          if (updateHasImages) {
            logger.log('✅ Update successful - images now stored in API');
            Object.assign(apiResult, updatedResult);
          }
        }
      } catch (updateError) {
        logger.error('❌ Failed to update listing with images:', updateError);
      }
    }
    
    // CRITICAL: Also save to local storage so it appears immediately on ExploreScreen
    try {
      const { addListing } = await import('../utils/listings');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userEmail = user.email;
        if (userEmail) {
          const apiListingId = apiResult.id || apiResult._id || apartmentData.id;
          const listingToSave = {
            ...apartmentData,
            id: String(apiListingId),
            _id: String(apiResult._id || apiResult.id || apartmentData._id || apiListingId),
            createdAt: apiResult.createdAt || new Date().toISOString(),
          };
          await addListing(listingToSave, userEmail);
        }
      }
    } catch (localError) {
      logger.warn('⚠️ Could not save to local storage (non-fatal):', localError.message);
    }
    
    // Clear API cache so new listing appears immediately
    try {
      await AsyncStorage.removeItem('cached_api_apartments');
    } catch (cacheError) {
      logger.warn('⚠️ Could not clear API cache (non-fatal):', cacheError.message);
    }
    
    if (apiResult && !apiResult.createdAt) {
      apiResult.createdAt = new Date().toISOString();
    }
    
    return apiResult;
  },

  updateApartment: async (id, apartmentData) => {
    const idStr = String(id);
    const isLocalId = idStr.startsWith('local_') || idStr.startsWith('listing_');
    
    let apiResult = null;
    
    if (!isLocalId) {
      try {
        apiResult = await apartmentService.updateApartment(id, apartmentData);
      } catch (error) {
        logger.error('Error updating apartment in API:', error);
      }
    }
    
    if (apiResult === null || isLocalId) {
      apiResult = {
        ...apartmentData,
        id: id,
        _id: id,
        updatedAt: new Date().toISOString(),
        _offline: isLocalId || true, 
      };
    }
    
    try {
      await AsyncStorage.removeItem('cached_api_apartments');
    } catch (cacheError) {}
    
    try {
      const { updateListing } = await import('../utils/listings');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userEmail = user.email;
        if (userEmail) {
          await updateListing(id, apiResult, userEmail);
        }
      }
    } catch (localError) {
      logger.warn('⚠️ Could not update local storage:', localError.message);
      if (apiResult === null && !isLocalId) {
        throw new Error('Failed to update listing. Please check your connection.');
      }
    }
    
    return apiResult;
  },

  getMyApartments: async () => {
    try {
      const result = await apartmentService.getMyApartments();
      if (result === null || result === undefined) {
        throw new Error('API returned null');
      }
      return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
      const { getMyListings } = await import('../utils/listings');
      return await getMyListings();
    }
  },

  deleteApartment: async (listingId) => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const userEmail = userData ? JSON.parse(userData).email : null;
      
      const pendingSync = await getPendingSyncListings();
      const isPendingSync = pendingSync.some(p => p.localId === listingId);
      
      if (isPendingSync) {
        try {
          await removeFromSyncQueue(listingId);
        } catch (queueError) {}
      }
      
      const listingIdStr = String(listingId);
      const isLocalId = listingIdStr.startsWith('listing_');
      const isNumericId = !isNaN(Number(listingId)) && Number(listingId) > 0;
      
      if (isNumericId || (!isLocalId && listingIdStr.length < 50)) {
        try {
          const apiId = isNumericId ? Number(listingId) : listingId;
          await apartmentService.deleteApartment(apiId);
        } catch (apiError) {
          if (apiError.response?.status !== 404) {
            logger.warn('⚠️ API delete failed:', apiError.message);
          }
        }
      }
      
      try {
        await deleteListing(listingId, userEmail);
      } catch (localError) {
        if (!isNumericId && (isLocalId || listingIdStr.length >= 50)) {
          throw localError;
        }
      }
      
      try {
        await AsyncStorage.removeItem('cached_api_apartments');
      } catch (cacheError) {}
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Error deleting apartment:', error);
      throw error;
    }
  },

  diagnoseImageStorage: async () => {
    try {
      return await apartmentService.diagnoseImageStorage();
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Unknown error',
        totalListings: 0,
      };
    }
  },
};

// Hybrid Booking Service
export const hybridBookingService = {
  createBooking: async (userEmail, bookingData) => {
    try {
      const result = await bookingService.createBooking(bookingData);
      if (result === null || result === undefined) {
        throw new Error('API returned null');
      }
      await addBooking(userEmail, bookingData);
      return result;
    } catch (error) {
      return await addBooking(userEmail, bookingData);
    }
  },

  getBookings: async (userEmail) => {
    try {
      const result = await bookingService.getMyBookings();
      if (result === null || result === undefined) {
        throw new Error('API returned null');
      }
      return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
      return await getBookings(userEmail);
    }
  },
};

// Hybrid Wallet Service
export const hybridWalletService = {
  getBalance: async (userEmail) => {
    try {
      if (!userEmail) return 0;
      const normalizedEmail = userEmail.toLowerCase().trim();
      let apiBalance = 0;
      try {
        const result = await walletService.getBalance();
        if (result !== null && result !== undefined) {
          let balance = (typeof result === 'number') ? result : 
                        (result && typeof result === 'object') ? (result.balance ?? result.amount ?? result.value ?? null) : null;
          if (balance !== null) {
            const parsed = parseFloat(balance);
            if (!isNaN(parsed) && parsed >= 0) apiBalance = Math.floor(parsed);
          }
        }
      } catch (apiError) {}
      
      if (apiBalance === 0) {
        try {
          const { getTransactions } = await import('../utils/wallet');
          const { calculateBalanceFromTransactions } = await import('../services/transactionSyncService');
          const transactions = await getTransactions(normalizedEmail);
          const calculatedBalance = calculateBalanceFromTransactions(transactions);
          if (calculatedBalance > 0) return calculatedBalance;
        } catch (calcError) {}
      }
      
      if (apiBalance === 0) {
        try {
          const { getWalletBalance } = await import('../utils/wallet');
          const localBalance = await getWalletBalance(normalizedEmail);
          if (localBalance > 0) return localBalance;
        } catch (localError) {}
      }
      
      return apiBalance;
    } catch (error) {
      try {
        const { getWalletBalance } = await import('../utils/wallet');
        return await getWalletBalance(userEmail) || 0;
      } catch (fallbackError) {
        return 0;
      }
    }
  },

  fundWallet: async (userEmail, amount, method = 'bank_transfer', senderName = null, senderEmail = null, paymentReference = null) => {
    try {
      const normalizedEmail = userEmail.toLowerCase().trim();
      const integerAmount = Math.floor(parseFloat(amount));
      const result = await walletService.fundWallet(integerAmount, method, paymentReference || null);
      if (result === null || result === undefined) throw new Error('Payment service unavailable');
      const balance = result.balance || result.amount || 0;
      return { balance: balance, amount: balance };
    } catch (error) {
      if (error.message && (error.message.includes('network') || error.message.includes('connection'))) {
        throw new Error('Network connection failed');
      }
      throw error;
    }
  },

  getTransactions: async (userEmail) => {
    try {
      if (!userEmail) return [];
      const normalizedEmail = userEmail.toLowerCase().trim();
      let apiTransactions = [];
      try {
        const result = await walletService.getTransactions();
        if (result !== null && result !== undefined) {
          apiTransactions = Array.isArray(result) ? result : (result.data || []);
        }
      } catch (apiError) {}
      
      const userApiTransactions = apiTransactions.map(txn => ({ ...txn, userEmail: normalizedEmail }));
      let localTransactions = [];
      try {
        const { getTransactions: getLocalTransactions } = await import('../utils/wallet');
        localTransactions = await getLocalTransactions(normalizedEmail);
      } catch (localError) {}
      
      const { mergeTransactions } = await import('../services/transactionSyncService');
      return mergeTransactions(userApiTransactions, localTransactions);
    } catch (error) {
      try {
        const { getTransactions: getLocalTransactions } = await import('../utils/wallet');
        return await getLocalTransactions(userEmail);
      } catch (fallbackError) {
        return [];
      }
    }
  },

  makePayment: async (userEmail, amount, description, bookingId = null) => {
    try {
      const result = await walletService.makePayment(amount, description, bookingId);
      if (result === null || result === undefined) throw new Error('Payment failed');
      return result;
    } catch (error) {
      throw error;
    }
  },

  withdrawFunds: async (userEmail, amount, method = 'Bank Transfer', accountDetails = '') => {
    try {
      let accountBank = null, accountNumber = accountDetails, beneficiaryName = null;
      if (accountDetails && accountDetails.includes(':')) {
        const parts = accountDetails.split(':');
        accountBank = parts[0]; accountNumber = parts[1];
        if (parts.length > 2) beneficiaryName = parts[2];
      }
      const result = await walletService.withdrawFunds?.(amount, method, accountDetails, accountBank, accountNumber, beneficiaryName);
      if (result === null || result === undefined) throw new Error('Withdrawal failed');
      const balance = result.balance || result.amount || 0;
      return { balance: balance, amount: amount };
    } catch (error) {
      throw error;
    }
  },

  sendMoneyToUser: async (fromUserEmail, toUserEmail, amount, description = '') => {
    try {
      const { sendMoneyToUser: localSendMoney } = await import('../utils/wallet');
      const result = await localSendMoney(fromUserEmail, toUserEmail, amount, description);
      try {
        await walletService.sendMoneyToUser?.(fromUserEmail, toUserEmail, amount, description);
      } catch (apiError) {}
      return result;
    } catch (error) {
      throw error;
    }
  },

  syncAllTransactions: async (userEmail) => {
    try {
      const { syncAllTransactionsFromBackend } = await import('../services/transactionSyncService');
      return await syncAllTransactionsFromBackend(userEmail);
    } catch (error) {
      throw error;
    }
  },
};

// Hybrid Favorite Service
export const hybridFavoriteService = {
  addFavorite: async (apartmentId, userEmail = null) => {
    const normalizedId = String(apartmentId);
    let normalizedEmail = userEmail?.toLowerCase().trim();
    if (!normalizedEmail) {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) normalizedEmail = JSON.parse(userData).email?.toLowerCase().trim();
      } catch (error) {}
    }
    
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('User must be logged in');
    
    try {
      await favoriteService.addFavorite(apartmentId);
    } catch (error) {}
    
    const { getUserFavorites, saveUserFavorites } = await import('../utils/userStorage');
    const favorites = await getUserFavorites(normalizedEmail);
    const normalizedFavorites = favorites.map(id => String(id));
    if (!normalizedFavorites.includes(normalizedId)) {
      normalizedFavorites.push(normalizedId);
      await saveUserFavorites(normalizedEmail, normalizedFavorites);
    }
  },

  removeFavorite: async (apartmentId, userEmail = null) => {
    const normalizedId = String(apartmentId);
    let normalizedEmail = userEmail?.toLowerCase().trim();
    if (!normalizedEmail) {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) normalizedEmail = JSON.parse(userData).email?.toLowerCase().trim();
      } catch (error) {}
    }
    
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('User must be logged in');
    
    try {
      await favoriteService.removeFavorite(apartmentId);
    } catch (error) {}
    
    const { getUserFavorites, saveUserFavorites } = await import('../utils/userStorage');
    const favorites = await getUserFavorites(normalizedEmail);
    const updated = favorites.map(id => String(id)).filter(id => id !== normalizedId);
    await saveUserFavorites(normalizedEmail, updated);
  },

  getFavorites: async (userEmail = null) => {
    let normalizedEmail = userEmail?.toLowerCase().trim();
    if (!normalizedEmail) {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) normalizedEmail = JSON.parse(userData).email?.toLowerCase().trim();
      } catch (error) {}
    }
    
    if (!normalizedEmail || !normalizedEmail.includes('@')) return [];
    
    try {
      const { getUserFavorites } = await import('../utils/userStorage');
      return await getUserFavorites(normalizedEmail);
    } catch (error) {
      return [];
    }
  }
};
