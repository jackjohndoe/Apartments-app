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
import { API_CONFIG } from '../config/api';

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
          // Clear cache if forcing refresh to ensure fresh data from all devices
          if (forceRefresh) {
            try {
              await AsyncStorage.removeItem('cached_api_apartments');
              logger.log('🔄 Cleared API cache - fetching fresh listings from all devices');
            } catch (cacheError) {
              logger.warn('⚠️ Could not clear cache:', cacheError.message);
            }
          }
          
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
      
      // Log raw API response structure for first listing to understand image fields
      if (apiApartments && apiApartments.length > 0) {
        const firstListing = apiApartments[0];
        logger.log('🔍 Raw API listing structure (first listing):', {
          id: firstListing.id || firstListing._id,
          title: firstListing.title,
          allKeys: Object.keys(firstListing),
          imageFields: {
            hasImage: !!firstListing.image,
            hasImages: !!(firstListing.images && Array.isArray(firstListing.images)),
            hasPhoto: !!firstListing.photo,
            hasPhotos: !!(firstListing.photos && Array.isArray(firstListing.photos)),
            hasImageUrl: !!firstListing.imageUrl,
            hasImageUrls: !!(firstListing.imageUrls && Array.isArray(firstListing.imageUrls)),
            photosLength: firstListing.photos?.length || 0,
            imagesLength: firstListing.images?.length || 0,
          },
          // Log actual values of image-related fields (first 100 chars)
          imageValue: firstListing.image ? String(firstListing.image).substring(0, 100) : null,
          photosSample: firstListing.photos && Array.isArray(firstListing.photos) && firstListing.photos.length > 0
            ? firstListing.photos.slice(0, 2).map(p => {
                if (typeof p === 'string') return p.substring(0, 100);
                if (typeof p === 'object' && p !== null) return { keys: Object.keys(p), sample: JSON.stringify(p).substring(0, 200) };
                return String(p).substring(0, 100);
              })
            : null,
        });
      }
      
      // Create a map of RAW local listings by ID for image enhancement (before formatting)
      // This allows us to check original image data before formatting might set placeholders
      const rawLocalListingsMap = new Map();
      localOnlyListings.forEach(listing => {
        const listingId = String(listing.id || listing._id || '');
        if (listingId && listingId !== 'undefined' && listingId !== 'null' && listingId !== '') {
          rawLocalListingsMap.set(listingId, listing);
        }
      });
      logger.log('🔄 Created raw local listings map with', rawLocalListingsMap.size, 'entries for image enhancement');
      
      // Format local-only listings (needed for merging later)
      const formattedLocalListings = localOnlyListings && localOnlyListings.length > 0
        ? formatListingsForExplore(localOnlyListings)
        : [];
      logger.log('🔄 getAllApartmentsForExplore - Formatted local listings:', formattedLocalListings.length);
      
      // Also create a map of formatted local listings for quick lookup
      const formattedLocalListingsMap = new Map();
      formattedLocalListings.forEach(listing => {
        const listingId = String(listing.id || listing._id || '');
        if (listingId && listingId !== 'undefined' && listingId !== 'null' && listingId !== '') {
          formattedLocalListingsMap.set(listingId, listing);
        }
      });
      
      // Format API apartments (these are from ALL devices - cross-platform)
      // CRITICAL: Enhance API listings with images from local listings if they're missing images
      let formattedApiApartments = apiApartments && apiApartments.length > 0
        ? formatListingsForExplore(apiApartments)
        : [];
      
      // Enhance API listings with images from local listings if they're missing images
      let enhancedCount = 0;
      formattedApiApartments = formattedApiApartments.map(apiListing => {
        const apiId = String(apiListing.id || apiListing._id || '');
        const apiHasImage = apiListing.image && apiListing.image !== DEFAULT_PLACEHOLDER;
        
        // If API listing is missing images, try to get them from local listing
        if (!apiHasImage) {
          logger.log('🔍 API listing missing image, checking local storage for ID:', apiId, apiListing.title || 'Untitled');
          logger.log('  Local listings map has', rawLocalListingsMap.size, 'entries');
          if (rawLocalListingsMap.size > 0) {
            const mapKeys = Array.from(rawLocalListingsMap.keys());
            logger.log('  Local listing IDs in map:', mapKeys.slice(0, 5));
          }
          logger.log('  Checking if ID exists in map:', rawLocalListingsMap.has(apiId));
          if (!rawLocalListingsMap.has(apiId)) {
            // Try to find by different ID formats
            const allMapKeys = Array.from(rawLocalListingsMap.keys());
            const matchingKey = allMapKeys.find(key => {
              return String(key) === String(apiId) || 
                     String(key) === String(apiListing._id) ||
                     String(apiId) === String(key);
            });
            if (matchingKey) {
              logger.log('  Found matching ID with different format:', matchingKey, 'vs', apiId);
            } else {
              logger.warn('  No matching local listing found for ID:', apiId);
              // Fallback: try fuzzy title match to pick local images when IDs differ
              const byTitle = findLocalListingByTitle(rawLocalListingsMap, apiListing);
              if (byTitle) {
                logger.log('  ✅ Found local listing by title match:', byTitle.title || 'Untitled', 'for API ID:', apiId);
              }
            }
          }
        }
        
        // Try to find local listing by ID (with fallback for different formats)
        let rawLocalListing = null;
        if (rawLocalListingsMap.has(apiId)) {
          rawLocalListing = rawLocalListingsMap.get(apiId);
        } else {
          // Try alternative ID formats
          const apiIdNum = parseInt(apiId);
          const apiIdStr = String(apiId);
          const allMapKeys = Array.from(rawLocalListingsMap.keys());
          const matchingKey = allMapKeys.find(key => {
            const keyStr = String(key);
            const keyNum = parseInt(key);
            return keyStr === apiIdStr || 
                   keyStr === String(apiListing._id) ||
                   (isNaN(apiIdNum) === false && keyNum === apiIdNum) ||
                   key === apiId ||
                   key === apiListing._id;
          });
          if (matchingKey) {
            rawLocalListing = rawLocalListingsMap.get(matchingKey);
            logger.log('  ✅ Found local listing with alternative ID format:', matchingKey, 'for API ID:', apiId);
          }
          
          // Fallback: try to find local listing by title if still not found
          if (!rawLocalListing) {
            const byTitle = findLocalListingByTitle(rawLocalListingsMap, apiListing);
            if (byTitle) {
              rawLocalListing = byTitle;
              logger.log('  ✅ Using local listing found by title to enhance images for API ID:', apiId);
            }
          }
        }
        
        if (!apiHasImage && rawLocalListing) {
          logger.log('  ✅ Found local listing, checking for images...');
          
          // Extract images from raw local listing (check all possible fields)
          let localImage = null;
          let localImages = [];
          
          // Check main image field
          if (isValidImageUri(rawLocalListing.image)) {
            localImage = resolveImageUri(rawLocalListing.image);
            localImages.push(localImage);
            logger.log('  ✅ Found image in rawLocalListing.image');
          } else {
            logger.log('  ⚠️ rawLocalListing.image is not valid:', rawLocalListing.image ? rawLocalListing.image.substring(0, 50) : 'null/undefined');
          }
          
          // Check images array
          if (rawLocalListing.images && Array.isArray(rawLocalListing.images) && rawLocalListing.images.length > 0) {
            logger.log('  Found images array with', rawLocalListing.images.length, 'items');
            const validImages = rawLocalListing.images.filter(img => isValidImageUri(img)).map(resolveImageUri);
            if (validImages.length > 0) {
              if (!localImage) localImage = validImages[0];
              localImages.push(...validImages);
              logger.log('  ✅ Found', validImages.length, 'valid image(s) in images array');
            } else {
              logger.warn('  ⚠️ images array exists but no valid images found');
            }
          } else {
            logger.log('  ⚠️ No images array or empty:', rawLocalListing.images ? 'exists but empty' : 'does not exist');
          }
          
          // Check photos array
          if (rawLocalListing.photos && Array.isArray(rawLocalListing.photos) && rawLocalListing.photos.length > 0) {
            const extractedImages = extractImagesFromPhotosArray(rawLocalListing.photos).map(resolveImageUri);
            if (extractedImages.length > 0) {
              if (!localImage) localImage = extractedImages[0];
              localImages.push(...extractedImages);
            }
          }
          
          // Check other image fields
          if (!localImage) {
            if (isValidImageUri(rawLocalListing.photo)) {
              localImage = resolveImageUri(rawLocalListing.photo);
              localImages.push(localImage);
            } else if (isValidImageUri(rawLocalListing.imageUrl)) {
              localImage = resolveImageUri(rawLocalListing.imageUrl);
              localImages.push(localImage);
            } else if (rawLocalListing.imageUrls && Array.isArray(rawLocalListing.imageUrls) && rawLocalListing.imageUrls.length > 0) {
              const validImages = rawLocalListing.imageUrls.filter(img => isValidImageUri(img)).map(resolveImageUri);
              if (validImages.length > 0) {
                localImage = validImages[0];
                localImages.push(...validImages);
              }
            }
          }
          
          // If we found images in local listing, use them
          if (localImage) {
            // Remove duplicates from images array
            const uniqueImages = [...new Set(localImages)];
            enhancedCount++;
            logger.log('✅ Enhanced API listing with image from local:', apiId, apiListing.title || 'Untitled', 'Image:', localImage.substring(0, 50));
            logger.log('  Found', uniqueImages.length, 'image(s) in local listing');
            // Use local listing's image and images array
            return {
              ...apiListing,
              image: localImage,
              images: uniqueImages,
            };
          } else {
            logger.warn('⚠️ Local listing found but no valid images:', apiId, rawLocalListing.title || 'Untitled');
            // Log what fields the local listing has
            logger.warn('  Local listing keys:', Object.keys(rawLocalListing));
            logger.warn('  Local listing image fields:', {
              hasImage: !!rawLocalListing.image,
              hasImages: !!(rawLocalListing.images && Array.isArray(rawLocalListing.images)),
              hasPhotos: !!(rawLocalListing.photos && Array.isArray(rawLocalListing.photos)),
              imagesLength: rawLocalListing.images?.length || 0,
              photosLength: rawLocalListing.photos?.length || 0,
            });
          }
        }
        
        return apiListing;
      });
      
      if (enhancedCount > 0) {
        logger.log('✅ Enhanced', enhancedCount, 'API listing(s) with images from local storage');
      }
      
      // Get default apartments (these are the hardcoded ones in ExploreScreen)
      // ALWAYS include these as base listings for new users
      const defaultApartments = getDefaultApartments();
      
      // Combine all: API apartments first (cross-platform), then local-only listings, then defaults
      // Deduplication: prefer API version if both exist
      // CRITICAL: Normalize all IDs to strings for consistent comparison
      const allIds = new Set();
      const combined = [];
      
      // PRIORITY 1: Add API apartments first (these are from ALL devices - cross-platform)
      formattedApiApartments.forEach(apt => {
        const id = String(apt.id || apt._id || '');
        if (!allIds.has(id)) {
          allIds.add(id);
          combined.push(apt);
        }
      });
      
      // PRIORITY 2: Add local-only listings (pending sync)
      // Only if not already added from API
      formattedLocalListings.forEach(apt => {
        const id = String(apt.id || apt._id || '');
        if (!allIds.has(id)) {
          allIds.add(id);
          combined.push(apt);
        }
      });
      
      // PRIORITY 3: Add default apartments (if requested/needed)
      // Note: We're filtering defaults to avoid duplicates if they somehow got into API/local
      defaultApartments.forEach(apt => {
        const id = String(apt.id || apt._id || '');
        if (!allIds.has(id)) {
          allIds.add(id);
          combined.push(apt);
        }
      });
      
      logger.log('✅ Final combined listings:', combined.length);
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
  
  createApartment: async (listingData) => {
    try {
      // Create listing via API first
      if (await isApiAvailable()) {
        const newListing = await apartmentService.createApartment(listingData);
        if (newListing) {
          // Add to cache
          await addToCachedApartments(newListing);
          return formatListingForExplore(newListing);
        }
      }
      
      // Fallback: Create locally
      const newListing = await addListing(listingData);
      return formatListingForExplore(newListing);
    } catch (error) {
      logger.error('Error creating apartment:', error);
      throw error;
    }
  },
  
  deleteApartment: async (listingId) => {
    try {
      // Delete from API first
      if (await isApiAvailable()) {
        await apartmentService.deleteApartment(listingId);
      }
      
      // Delete locally
      await deleteListing(listingId);
      
      // Remove from cache
      await removeFromCachedApartments(listingId);
      
      return true;
    } catch (error) {
      logger.error('Error deleting apartment:', error);
      throw error;
    }
  }
};
