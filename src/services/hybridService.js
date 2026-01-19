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
  // These are the default apartments from ExploreScreen
  // They should always be available as fallback
  return [
    {
      id: '1',
      title: 'Modern 3-Bedroom Apartment in Victoria Island',
      price: 83333, // Daily rate (under 100K)
      location: 'Lagos',
      beds: 3,
      baths: 2,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.92,
      createdAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: '2',
      title: 'Luxury 2-Bedroom Penthouse in Lekki',
      price: 95000, // Daily rate (under 100K)
      location: 'Lagos',
      beds: 2,
      baths: 2,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.85,
      createdAt: new Date('2024-01-02').toISOString(),
    },
    {
      id: '3',
      title: 'Cozy 1-Bedroom Studio in Garki',
      price: 26667, // Daily rate (under 100K)
      location: 'Abuja',
      beds: 1,
      baths: 1,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.98,
      createdAt: new Date('2024-01-03').toISOString(),
    },
    {
      id: '4',
      title: 'Spacious 4-Bedroom Family Home in Port Harcourt',
      price: 60000, // Daily rate (under 100K)
      location: 'Port Harcourt',
      beds: 4,
      baths: 3,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.91,
      createdAt: new Date('2024-01-04').toISOString(),
    },
    {
      id: '5',
      title: 'Elegant 2-Bedroom Apartment in Ibadan',
      price: 20000, // Daily rate (under 100K)
      location: 'Ibadan',
      beds: 2,
      baths: 2,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.99,
      createdAt: new Date('2024-01-05').toISOString(),
    },
    {
      id: '6',
      title: 'Contemporary 3-Bedroom Duplex in Kano',
      price: 40000, // Daily rate (under 100K)
      location: 'Kano',
      beds: 3,
      baths: 3,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.88,
      createdAt: new Date('2024-01-06').toISOString(),
    },
    {
      id: '7',
      title: 'Stylish 2-Bedroom Apartment in Ikeja',
      price: 50000, // Daily rate (under 100K)
      location: 'Lagos',
      beds: 2,
      baths: 2,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.93,
      createdAt: new Date('2024-01-07').toISOString(),
    },
    {
      id: '8',
      title: 'Luxury 5-Bedroom Mansion in Asokoro',
      price: 98000, // Daily rate (under 100K)
      location: 'Abuja',
      beds: 5,
      baths: 4,
      image: DEFAULT_PLACEHOLDER,
      isFavorite: false,
      rating: 4.95,
      createdAt: new Date('2024-01-08').toISOString(),
    },
  ];
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
        const aptId = String(apt.id || apt._id || String(apt.id));
        if (!allIds.has(aptId)) {
          allIds.add(aptId);
          // Verify image is present after formatting
          if (!apt.image || apt.image === DEFAULT_PLACEHOLDER) {
            logger.warn('⚠️ API listing missing image after formatting:', aptId, apt.title || 'Untitled');
          } else {
            logger.log('✅ API listing has image:', aptId, apt.title || 'Untitled', 'Image:', apt.image.substring(0, 50));
          }
          combined.push(apt);
        }
      });
      
      // PRIORITY 2: Add local-only listings (avoid duplicates with API apartments)
      // These are listings created on this device that haven't synced yet
      // CRITICAL: Include ALL local listings - they may have just been uploaded
      // ALWAYS prefer local version if it exists (newly uploaded listings)
      formattedLocalListings.forEach(listing => {
        const listingId = String(listing.id || listing._id || String(listing.id));
        if (!listingId || listingId === 'undefined' || listingId === 'null' || listingId === '') {
          logger.warn('⚠️ Skipping listing with invalid ID:', listing);
          return;
        }
        
        // Check if we already have this ID from API
        if (allIds.has(listingId)) {
          // ALWAYS replace API version with local version (local is more recent/accurate)
          // CRITICAL: Especially if local version has images and API version doesn't
          const index = combined.findIndex(apt => {
            const aptId = String(apt.id || apt._id || '');
            return aptId === listingId;
          });
          
          if (index !== -1) {
            const apiListing = combined[index];
            const apiHasImage = apiListing.image && apiListing.image !== DEFAULT_PLACEHOLDER;
            const localHasImage = listing.image && listing.image !== DEFAULT_PLACEHOLDER;
            
            // Replace API version with local version
            // Prefer local version if it has images and API doesn't
            if (localHasImage && !apiHasImage) {
              logger.log('🔄 Replaced API listing (no image) with local version (has image):', listingId, listing.title || 'Untitled');
            } else {
              logger.log('🔄 Replaced API listing with local version:', listingId, listing.title || 'Untitled');
            }
            
            combined[index] = listing;
            
            // Verify image is present
            if (!listing.image || listing.image === DEFAULT_PLACEHOLDER) {
              logger.warn('⚠️ Local listing (replaced) missing image:', listingId, listing.title || 'Untitled');
            } else {
              logger.log('✅ Local listing (replaced) has image:', listingId, listing.title || 'Untitled', 'Image:', listing.image.substring(0, 50));
            }
          } else {
            // ID in set but not in combined - add it
            allIds.add(listingId);
            combined.push(listing);
            logger.log('✅ Added local listing (ID in set but not in combined):', listingId, listing.title || 'Untitled');
            // Verify image is present
            if (!listing.image || listing.image === DEFAULT_PLACEHOLDER) {
              logger.warn('⚠️ Local listing (added) missing image:', listingId, listing.title || 'Untitled');
            } else {
              logger.log('✅ Local listing (added) has image:', listingId, listing.title || 'Untitled', 'Image:', listing.image.substring(0, 50));
            }
          }
        } else {
          // Not in API - add local version
          allIds.add(listingId);
          combined.push(listing);
          logger.log('✅ Added local-only listing (not in API yet):', listingId, listing.title || 'Untitled');
          // Verify image is present
          if (!listing.image || listing.image === DEFAULT_PLACEHOLDER) {
            logger.warn('⚠️ Local-only listing missing image:', listingId, listing.title || 'Untitled');
          } else {
            logger.log('✅ Local-only listing has image:', listingId, listing.title || 'Untitled', 'Image:', listing.image.substring(0, 50));
          }
        }
      });
      
      // PRIORITY 3: Add default apartments (avoid duplicates) - these are always shown
      defaultApartments.forEach(apt => {
        const defaultId = String(apt.id || '');
        if (!allIds.has(defaultId)) {
          allIds.add(defaultId);
          combined.push(apt);
        }
      });
      
      // Sort by most recent first (all listings, regardless of source)
      combined.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA; // Most recent first
      });
      
      logger.log('✅ All apartments combined:', combined.length, 'API:', formattedApiApartments.length, 'Local-only:', formattedLocalListings.length);
      
      // Log image statistics for debugging
      const listingsWithImages = combined.filter(apt => apt.image && apt.image !== DEFAULT_PLACEHOLDER).length;
      const listingsWithoutImages = combined.length - listingsWithImages;
      logger.log('📊 Image statistics - With images:', listingsWithImages, 'Without images:', listingsWithoutImages, 'Total:', combined.length);
      
      if (combined.length > 0) {
        logger.log('🔄 Combined listing IDs (first 5):', combined.slice(0, 5).map(l => String(l.id || l._id || '')));
        logger.log('🔄 Combined listing titles (first 5):', combined.slice(0, 5).map(l => l.title || 'Untitled'));
      } else {
        logger.warn('⚠️ getAllApartmentsForExplore - Combined list is empty!');
        logger.warn('  API apartments:', formattedApiApartments.length);
        logger.warn('  Local listings:', formattedLocalListings.length);
        logger.warn('  Default apartments:', defaultApartments.length);
      }
      
      // ALWAYS return at least default apartments
      return combined.length > 0 ? combined : defaultApartments;
    } catch (error) {
      logger.error('Error getting all apartments:', error);
      // Fallback: try cached API listings first, then local listings, then defaults
      try {
        const cached = await AsyncStorage.getItem('cached_api_apartments');
        if (cached) {
          const apiApartments = JSON.parse(cached);
          const formatted = formatListingsForExplore(apiApartments);
          const defaults = getDefaultApartments();
          return [...formatted, ...defaults];
        }
        const allListings = await getListings();
        const formattedUserListings = allListings && allListings.length > 0
          ? formatListingsForExplore(allListings)
          : [];
        const defaultApartments = getDefaultApartments();
        return [...formattedUserListings, ...defaultApartments];
      } catch (fallbackError) {
        logger.error('Fallback also failed:', fallbackError);
        // Last resort: return default apartments
        return getDefaultApartments();
      }
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
    const apiResult = await apartmentService.createApartment(apartmentData);
    
    if (apiResult === null || apiResult === undefined) {
      throw new Error('Failed to save listing to API. Please check your internet connection and try again.');
    }
    
    logger.log('✅ Listing saved to API - available to all users:', apiResult.id || apiResult._id);
    
    // CRITICAL: Verify if backend stored images by checking API response
    const apiHasImages = (apiResult.image || 
                         (apiResult.images && Array.isArray(apiResult.images) && apiResult.images.length > 0) ||
                         (apiResult.photos && Array.isArray(apiResult.photos) && apiResult.photos.length > 0));
    const weHaveImages = (apartmentData.image || 
                         (apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0));
    
    logger.log('🔍 Image storage verification:', {
      weSentImages: weHaveImages,
      apiReturnedImages: apiHasImages,
      sentImageCount: apartmentData.images?.length || (apartmentData.image ? 1 : 0),
      apiImageCount: apiResult.images?.length || apiResult.photos?.length || (apiResult.image ? 1 : 0),
    });
    
    if (!apiHasImages && weHaveImages) {
      logger.error('❌ CRITICAL: Backend did not store images!');
      logger.error('  We sent images but API response has no images');
      logger.error('  This means other users will NOT see images for this listing');
      logger.error('  BACKEND ISSUE: The API endpoint is not accepting/storing image fields');
      logger.error('  SOLUTION REQUIRED: Backend needs to be configured to accept image fields in the request');
      logger.warn('⚠️ Attempting to update listing with images...');
      try {
        const updatedResult = await apartmentService.updateApartment(apiResult.id || apiResult._id, apartmentData);
        if (updatedResult) {
          // Check if update worked
          const updateHasImages = (updatedResult.image || 
                                  (updatedResult.images && Array.isArray(updatedResult.images) && updatedResult.images.length > 0) ||
                                  (updatedResult.photos && Array.isArray(updatedResult.photos) && updatedResult.photos.length > 0));
          if (updateHasImages) {
            logger.log('✅ Update successful - images now stored in API');
            Object.assign(apiResult, updatedResult);
          } else {
            logger.error('❌ Update failed - backend still not storing images');
            logger.error('  BACKEND CONFIGURATION REQUIRED:');
            logger.error('    1. Backend DTO must accept image fields (image, images, photos, imageUrl, imageUrls)');
            logger.error('    2. Backend must persist these fields to the database');
            logger.error('    3. Backend must return these fields in API responses');
            logger.error('  Current workaround: Images are stored locally, visible only to the current user');
          }
        } else {
          logger.error('❌ Update request returned null - backend may have rejected the update');
        }
      } catch (updateError) {
        logger.error('❌ Failed to update listing with images:', updateError);
        logger.error('  Error details:', updateError.message || updateError);
      }
    } else if (apiHasImages && weHaveImages) {
      logger.log('✅ Backend successfully stored images - other users will see them');
    }
    
    // CRITICAL: Also save to local storage so it appears immediately on ExploreScreen
    // This ensures the listing shows up right away even if API cache hasn't refreshed
    try {
      const { addListing } = await import('../utils/listings');
      // Get current user email for local storage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userEmail = user.email;
        if (userEmail) {
          // Save to local storage with API result data (includes API-generated ID)
          // CRITICAL: Normalize ID to ensure consistent comparison
          const apiListingId = apiResult.id || apiResult._id || apartmentData.id;
          const listingToSave = {
            ...apartmentData,
            id: String(apiListingId), // Normalize to string for consistent comparison
            _id: String(apiResult._id || apiResult.id || apartmentData._id || apiListingId),
            createdAt: apiResult.createdAt || new Date().toISOString(),
          };
          logger.log('💾 Saving listing to local storage:', {
            id: listingToSave.id,
            title: listingToSave.title || 'Untitled',
            userEmail: userEmail,
            hasImage: !!listingToSave.image,
            imagesCount: listingToSave.images?.length || 0,
          });
          await addListing(listingToSave, userEmail);
          logger.log('✅ Listing also saved to local storage - will appear immediately on ExploreScreen');
          
          // Verify it was saved by reading it back
          try {
            const { getListings } = await import('../utils/listings');
            const savedListings = await getListings();
            const savedListing = savedListings.find(l => String(l.id || l._id || '') === String(apiListingId));
            if (savedListing) {
              logger.log('✅ Verified listing in local storage:', savedListing.id, savedListing.title || 'Untitled');
            } else {
              logger.warn('⚠️ Listing not found in local storage after save - may need refresh');
            }
          } catch (verifyError) {
            logger.warn('⚠️ Could not verify listing save:', verifyError.message);
          }
        }
      }
    } catch (localError) {
      logger.warn('⚠️ Could not save to local storage (non-fatal):', localError.message);
      // Non-fatal - API save succeeded, listing will appear when API cache refreshes
    }
    
    // Clear API cache so new listing appears immediately at top of ExploreScreen
    try {
      await AsyncStorage.removeItem('cached_api_apartments');
      logger.log('✅ Cleared API cache - new listing will appear at top of ExploreScreen immediately');
    } catch (cacheError) {
      logger.warn('⚠️ Could not clear API cache (non-fatal):', cacheError.message);
    }
    
    // Ensure the listing has a createdAt timestamp for proper sorting (newest first)
    if (apiResult && !apiResult.createdAt) {
      apiResult.createdAt = new Date().toISOString();
    }
    
    // Add metadata about image storage status (for UI warnings)
    // Check final status after all update attempts
    const finalApiHasImages = (apiResult.image || 
                               (apiResult.images && Array.isArray(apiResult.images) && apiResult.images.length > 0) ||
                               (apiResult.photos && Array.isArray(apiResult.photos) && apiResult.photos.length > 0));
    const finalWeHaveImages = (apartmentData.image || 
                               (apartmentData.images && Array.isArray(apartmentData.images) && apartmentData.images.length > 0));
    
    // Add metadata property (won't interfere with existing code)
    if (apiResult) {
      apiResult._meta = {
        imagesStored: finalApiHasImages,
        imagesSent: finalWeHaveImages,
        backendIssue: finalWeHaveImages && !finalApiHasImages,
      };
    }
    
    return apiResult;
  },

  updateApartment: async (id, apartmentData) => {
    // Update directly to API - makes listing available to all iPhone users immediately
    // No fallback to local storage - API is required for cross-device visibility
    const apiResult = await apartmentService.updateApartment(id, apartmentData);
    
    if (apiResult === null || apiResult === undefined) {
      throw new Error('Failed to update listing to API. Please check your internet connection and try again.');
    }
    
    logger.log('✅ Listing updated to API - available to all iPhone users:', apiResult.id || id);
    
    // Clear API cache so updated listing appears immediately
    try {
      await AsyncStorage.removeItem('cached_api_apartments');
      logger.log('✅ Cleared API cache - updated listing will appear immediately');
    } catch (cacheError) {
      console.warn('⚠️ Could not clear API cache (non-fatal):', cacheError.message);
    }
    
    return apiResult;
  },

  getMyApartments: async () => {
    try {
      const result = await apartmentService.getMyApartments();
      // If API returns null, use fallback
      if (result === null || result === undefined) {
        throw new Error('API returned null');
      }
      return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
      // Silent fallback - get current user's listings from global storage
      const { getMyListings } = await import('../utils/listings');
      return await getMyListings();
    }
  },

  deleteApartment: async (listingId) => {
    try {
      // Get current user email for local deletion
      const getCurrentUserEmail = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            return user.email || null;
          }
        } catch (error) {
          logger.error('Error getting current user email:', error);
        }
        return null;
      };
      
      const userEmail = await getCurrentUserEmail();
      
      // Check if listing is in sync queue (local-only listing)
      const pendingSync = await getPendingSyncListings();
      const isPendingSync = pendingSync.some(p => p.localId === listingId);
      
      // If it's a pending sync listing, remove from queue first
      if (isPendingSync) {
        try {
          await removeFromSyncQueue(listingId);
          logger.log('✅ Removed listing from sync queue:', listingId);
        } catch (queueError) {
          logger.warn('Could not remove from sync queue:', queueError);
        }
      }
      
      // Try to delete from API
      // Check if this listing exists in API by checking if ID is numeric or if it's in cached API listings
      // Local listings have IDs like "listing_1234567890_abc123"
      const listingIdStr = String(listingId);
      const isLocalId = listingIdStr.startsWith('listing_');
      const isNumericId = !isNaN(Number(listingId)) && Number(listingId) > 0;
      
      // Try API delete if it's a numeric ID (likely from API) or if it's not a local ID
      if (isNumericId || (!isLocalId && listingIdStr.length < 50)) {
        try {
          // Convert to number if it's numeric (API expects numeric ID)
          const apiId = isNumericId ? Number(listingId) : listingId;
          await apartmentService.deleteApartment(apiId);
          logger.log('✅ Deleted listing from API:', apiId);
        } catch (apiError) {
          // Check if it's a 404 (listing doesn't exist in API) or other error
          if (apiError.response?.status === 404) {
            logger.log('ℹ️ Listing not found in API (may be local-only), continuing with local deletion');
          } else {
            logger.warn('⚠️ API delete failed:', apiError.message);
            // Continue with local deletion - don't fail completely
          }
        }
      } else {
        logger.log('ℹ️ Listing appears to be local-only (ID format:', listingIdStr.substring(0, 20) + '...), skipping API delete');
      }
      
      // Always delete from local storage
      try {
        await deleteListing(listingId, userEmail);
        logger.log('✅ Deleted listing from local storage:', listingId);
      } catch (localError) {
        // If local deletion fails and it's not an API listing, throw error
        if (!isNumericId && (isLocalId || listingIdStr.length >= 50)) {
          throw localError;
        }
        logger.warn('⚠️ Local deletion failed, but API deletion may have succeeded:', localError);
      }
      
      // Clear API cache so deleted listing disappears from ExploreScreen immediately
      try {
        await AsyncStorage.removeItem('cached_api_apartments');
        logger.log('✅ Cleared API cache - deleted listing will disappear from ExploreScreen');
      } catch (cacheError) {
        logger.warn('⚠️ Could not clear API cache (non-fatal):', cacheError.message);
      }
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Error deleting apartment:', error);
      throw error;
    }
  },

  // Diagnostic function to check if backend is storing images
  // Call this from console: hybridApartmentService.diagnoseImageStorage()
  diagnoseImageStorage: async () => {
    try {
      logger.log('🔍 DIAGNOSTIC: Checking backend image storage via hybrid service...');
      return await apartmentService.diagnoseImageStorage();
    } catch (error) {
      logger.error('❌ DIAGNOSTIC ERROR in hybrid service:', error);
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
      // If API returns null, use local storage
      if (result === null || result === undefined) {
        throw new Error('API returned null');
      }
      // Also save locally for offline access
      await addBooking(userEmail, bookingData);
      return result;
    } catch (error) {
      // Silent fallback - FRONTEND PRESERVED
      return await addBooking(userEmail, bookingData);
    }
  },

  getBookings: async (userEmail) => {
    try {
      const result = await bookingService.getMyBookings();
      // If API returns null, use fallback
      if (result === null || result === undefined) {
        throw new Error('API returned null');
      }
      return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
      // Silent fallback - FRONTEND PRESERVED
      return await getBookings(userEmail);
    }
  },
};

// Hybrid Wallet Service - API Only (Flutterwave Integration)
export const hybridWalletService = {
  getBalance: async (userEmail) => {
    try {
      if (!userEmail) {
        console.warn('getBalance: No user email provided');
        return 0;
      }
      
      const normalizedEmail = userEmail.toLowerCase().trim();
      
      // Try API balance first
      let apiBalance = 0;
      try {
        const result = await walletService.getBalance();
        if (result !== null && result !== undefined) {
          // Handle different response formats
          let balance = null;
          
          if (typeof result === 'number') {
            balance = result;
          } else if (result && typeof result === 'object') {
            balance = result.balance !== undefined ? result.balance : 
                      result.amount !== undefined ? result.amount : 
                      result.value !== undefined ? result.value : null;
            
            if (balance !== null && typeof balance === 'object') {
              balance = balance.value !== undefined ? balance.value : 
                       balance.amount !== undefined ? balance.amount : 
                       balance.balance !== undefined ? balance.balance : null;
            }
          } else if (typeof result === 'string') {
            balance = parseFloat(result);
          }
          
          if (balance !== null && balance !== undefined) {
            const parsed = parseFloat(balance);
            if (!isNaN(parsed) && parsed >= 0) {
              apiBalance = Math.floor(parsed);
            }
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Error fetching API balance (non-fatal):', apiError.message);
      }
      
      // If API balance is 0 or null, try calculating from transactions
      // But prefer API balance if it's non-zero (even if transactions aren't returned)
      if (apiBalance === 0 || apiBalance === null) {
        try {
          const { getTransactions } = await import('../utils/wallet');
          const { calculateBalanceFromTransactions } = await import('../services/transactionSyncService');
          const transactions = await getTransactions(normalizedEmail);
          const calculatedBalance = calculateBalanceFromTransactions(transactions);
          
          if (calculatedBalance > 0) {
            console.log(`✅ Calculated balance from transactions: ₦${calculatedBalance.toLocaleString()} (API returned 0)`);
            return calculatedBalance;
          }
        } catch (calcError) {
          console.warn('⚠️ Error calculating balance from transactions:', calcError.message);
        }
      } else {
        // API balance is non-zero - use it even if we don't have transactions
        // This handles cases where transactions exist but aren't being returned
        console.log(`✅ Using API balance: ₦${apiBalance.toLocaleString()} (transactions may not be returned yet)`);
      }
      
      // Fallback to local balance if API balance is still 0
      if (apiBalance === 0) {
        try {
          const { getWalletBalance } = await import('../utils/wallet');
          const localBalance = await getWalletBalance(normalizedEmail);
          if (localBalance > 0) {
            console.log(`✅ Using local balance: ₦${localBalance.toLocaleString()} (API returned 0)`);
            return localBalance;
          }
        } catch (localError) {
          console.warn('⚠️ Error fetching local balance:', localError.message);
        }
      }
      
      console.log(`✅ Wallet balance: ₦${apiBalance.toLocaleString()} for ${userEmail}`);
      return apiBalance;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      // Final fallback to local balance
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
      if (!userEmail) {
        throw new Error('User email is required for wallet funding');
      }
      const normalizedEmail = userEmail.toLowerCase().trim();
      
      const integerAmount = Math.floor(parseFloat(amount));
      console.log(`💰 Funding wallet via Flutterwave: ${normalizedEmail}, Amount: ₦${integerAmount.toLocaleString()}, Method: ${method}, Reference: ${paymentReference || 'N/A'}`);
      
      // Call API with Flutterwave reference - wallet will be updated via webhook
      const result = await walletService.fundWallet(integerAmount, method, paymentReference || null);
      if (result === null || result === undefined) {
        throw new Error('API returned null - wallet funding failed');
      }
      
      const balance = result.balance || result.amount || 0;
      console.log(`✅ Wallet funding initiated: ${normalizedEmail}, New balance: ₦${balance.toLocaleString()}`);
      return { balance: balance, amount: balance };
    } catch (error) {
      console.error(`❌ Error funding wallet for ${userEmail}:`, error);
      throw error;
    }
  },

  getTransactions: async (userEmail) => {
    try {
      if (!userEmail) {
        console.warn('getTransactions: No user email provided - returning empty array');
        return [];
      }
      
      const normalizedEmail = userEmail.toLowerCase().trim();
      if (!normalizedEmail || normalizedEmail.length === 0) {
        console.warn('getTransactions: Invalid user email - returning empty array');
        return [];
      }
      
      // Get transactions from API
      let apiTransactions = [];
      try {
        const result = await walletService.getTransactions();
        if (result !== null && result !== undefined) {
          apiTransactions = Array.isArray(result) ? result : (result.data || []);
        }
      } catch (apiError) {
        console.warn('⚠️ Error fetching transactions from API (non-fatal):', apiError.message);
      }
      
      // Filter API transactions to ensure they belong to this user
      const userApiTransactions = apiTransactions
        .filter(txn => {
          if (txn.userEmail) {
            return txn.userEmail.toLowerCase().trim() === normalizedEmail;
          }
          // If no userEmail, assume it belongs to current user (from API)
          return true;
        })
        .map(txn => ({
          ...txn,
          userEmail: normalizedEmail,
        }));
      
      // Get local transactions as fallback
      let localTransactions = [];
      try {
        const { getTransactions: getLocalTransactions } = await import('../utils/wallet');
        localTransactions = await getLocalTransactions(normalizedEmail);
      } catch (localError) {
        console.warn('⚠️ Error fetching local transactions (non-fatal):', localError.message);
      }
      
      // Merge API and local transactions
      const { mergeTransactions } = await import('../services/transactionSyncService');
      const mergedTransactions = mergeTransactions(userApiTransactions, localTransactions);
      
      // Verify all transactions have proper references
      const transactionsWithoutRef = mergedTransactions.filter(t => !t.reference && !t.paymentReference && !t.id);
      if (transactionsWithoutRef.length > 0) {
        console.warn(`⚠️ Found ${transactionsWithoutRef.length} transactions without proper references for ${normalizedEmail}`);
      }
      
      // Log transaction references for debugging
      if (mergedTransactions.length > 0) {
        const refs = mergedTransactions.slice(0, 5).map(t => t.reference || t.paymentReference || t.id || 'N/A').join(', ');
        console.log(`📋 Sample transaction references: ${refs}${mergedTransactions.length > 5 ? '...' : ''}`);
      }
      
      console.log(`✅ Loaded ${mergedTransactions.length} transactions for ${normalizedEmail} (${userApiTransactions.length} API + ${localTransactions.length} local, ${mergedTransactions.length - userApiTransactions.length - localTransactions.length} duplicates removed)`);
      return mergedTransactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      // Fallback to local transactions only
      try {
        const { getTransactions: getLocalTransactions } = await import('../utils/wallet');
        return await getLocalTransactions(userEmail);
      } catch (fallbackError) {
        console.error('Fallback to local transactions also failed:', fallbackError);
        return [];
      }
    }
  },

  makePayment: async (userEmail, amount, description, bookingId = null) => {
    try {
      if (!userEmail) {
        throw new Error('User email is required for payment');
      }
      
      const result = await walletService.makePayment(amount, description, bookingId);
      if (result === null || result === undefined) {
        throw new Error('API returned null - payment failed');
      }
      
      console.log(`✅ Payment processed via Flutterwave: ${userEmail}, Amount: ₦${amount.toLocaleString()}`);
      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  withdrawFunds: async (userEmail, amount, method = 'Bank Transfer', accountDetails = '') => {
    try {
      if (!userEmail) {
        throw new Error('User email is required for withdrawal');
      }
      
      // Extract bank code and account number from accountDetails
      // Format: "BANK_CODE:ACCOUNT_NUMBER" or just account number
      let accountBank = null;
      let accountNumber = accountDetails;
      let beneficiaryName = null;
      
      if (accountDetails && accountDetails.includes(':')) {
        const parts = accountDetails.split(':');
        accountBank = parts[0];
        accountNumber = parts[1];
        if (parts.length > 2) {
          beneficiaryName = parts[2];
        }
      }
      
      // Call API with Flutterwave transfer details
      const result = await walletService.withdrawFunds?.(amount, method, accountDetails, accountBank, accountNumber, beneficiaryName);
      if (result === null || result === undefined) {
        throw new Error('API returned null - withdrawal failed');
      }
      
      const balance = result.balance || result.amount || 0;
      console.log(`✅ Withdrawal initiated via Flutterwave: ${userEmail}, Amount: ₦${amount.toLocaleString()}, New balance: ₦${balance.toLocaleString()}`);
      return { balance: balance, amount: amount };
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    }
  },

  sendMoneyToUser: async (fromUserEmail, toUserEmail, amount, description = '') => {
    try {
      // This function ensures money is sent from one user to another
      // Each user's wallet is completely isolated - this is the ONLY way money moves between users
      const { sendMoneyToUser: localSendMoney } = await import('../utils/wallet');
      const result = await localSendMoney(fromUserEmail, toUserEmail, amount, description);
      
      // Try API if available (for server-side tracking)
      try {
        await walletService.sendMoneyToUser?.(fromUserEmail, toUserEmail, amount, description);
      } catch (apiError) {
        console.log('API send money not available, using local storage only');
      }
      
      return result;
    } catch (error) {
      console.error('Error sending money to user:', error);
      throw error;
    }
  },

  // Comprehensive sync of all transactions from backend
  syncAllTransactions: async (userEmail) => {
    try {
      if (!userEmail) {
        throw new Error('User email is required for transaction sync');
      }
      
      const { syncAllTransactionsFromBackend } = await import('../services/transactionSyncService');
      const result = await syncAllTransactionsFromBackend(userEmail);
      
      console.log(`✅ Comprehensive sync completed: ${result.transactions.length} transactions, Balance: ₦${result.balance.toLocaleString()}`);
      return result;
    } catch (error) {
      console.error('Error in comprehensive transaction sync:', error);
      throw error;
    }
  },
};

// Hybrid Favorite Service
export const hybridFavoriteService = {
  addFavorite: async (apartmentId, userEmail = null) => {
    // Normalize apartment ID to string for consistent comparison
    const normalizedId = String(apartmentId);
    
    // CRITICAL: Get and validate user email
    let normalizedEmail = null;
    if (userEmail) {
      normalizedEmail = userEmail.toLowerCase().trim();
    } else {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email) {
            normalizedEmail = user.email.toLowerCase().trim();
          }
        }
      } catch (error) {
        console.error('Error getting user email:', error);
      }
    }
    
    // CRITICAL: Validate email format - no fallback to global key
    if (!normalizedEmail || normalizedEmail.length === 0 || !normalizedEmail.includes('@')) {
      console.warn('addFavorite: No valid user email provided - cannot add favorite without user account');
      throw new Error('User must be logged in to add favorites');
    }
    
    try {
      const result = await favoriteService.addFavorite(apartmentId);
      // If API returns null, just continue with local storage
      if (result === null || result === undefined) {
        // Continue to local storage update
      }
    } catch (error) {
      // Silent - continue to local storage
    }
    
    // Always update local storage for immediate UI update - ALWAYS user-specific
    const { getUserFavorites, saveUserFavorites } = await import('../utils/userStorage');
    const favorites = await getUserFavorites(normalizedEmail);
    // Normalize all existing favorites to strings for comparison
    const normalizedFavorites = favorites.map(id => String(id));
    if (!normalizedFavorites.includes(normalizedId)) {
      normalizedFavorites.push(normalizedId);
      await saveUserFavorites(normalizedEmail, normalizedFavorites);
      console.log('✅ Favorite added to local storage:', normalizedId, 'Total favorites:', normalizedFavorites.length, 'User:', normalizedEmail);
    }
  },

  removeFavorite: async (apartmentId, userEmail = null) => {
    // Normalize apartment ID to string for consistent comparison
    const normalizedId = String(apartmentId);
    
    // CRITICAL: Get and validate user email
    let normalizedEmail = null;
    if (userEmail) {
      normalizedEmail = userEmail.toLowerCase().trim();
    } else {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email) {
            normalizedEmail = user.email.toLowerCase().trim();
          }
        }
      } catch (error) {
        console.error('Error getting user email:', error);
      }
    }
    
    // CRITICAL: Validate email format - no fallback to global key
    if (!normalizedEmail || normalizedEmail.length === 0 || !normalizedEmail.includes('@')) {
      console.warn('removeFavorite: No valid user email provided - cannot remove favorite without user account');
      throw new Error('User must be logged in to remove favorites');
    }
    
    try {
      const result = await favoriteService.removeFavorite(apartmentId);
      // If API returns null, just continue with local storage
      if (result === null || result === undefined) {
        // Continue to local storage update
      }
    } catch (error) {
      // Silent - continue to local storage
    }
    
    // Always update local storage - ALWAYS user-specific
    const { getUserFavorites, saveUserFavorites } = await import('../utils/userStorage');
    const favorites = await getUserFavorites(normalizedEmail);
    // Normalize all favorites to strings and filter
    const normalizedFavorites = favorites.map(id => String(id));
    const updated = normalizedFavorites.filter(id => id !== normalizedId);
    await saveUserFavorites(normalizedEmail, updated);
    console.log('✅ Favorite removed from local storage:', normalizedId, 'Remaining favorites:', updated.length, 'User:', normalizedEmail);
  },

  getFavorites: async (userEmail = null) => {
    // CRITICAL: Validate user email to ensure account-specific favorites
    // Always try to get favorites from local storage first (fast, works offline)
    // Then try API to sync, but don't fail if API fails
    
    // Get user email from parameter or from storage
    let normalizedEmail = null;
    if (userEmail) {
      normalizedEmail = userEmail.toLowerCase().trim();
    } else {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email) {
            normalizedEmail = user.email.toLowerCase().trim();
          }
        }
      } catch (error) {
        console.log('Could not get user email from storage');
      }
    }
    
    // CRITICAL: Validate email format - no fallback to global key
    if (!normalizedEmail || normalizedEmail.length === 0 || !normalizedEmail.includes('@')) {
      console.warn('getFavorites: No valid user email provided - returning empty array to prevent data leakage');
      return [];
    }
    
    // Get favorites from local storage (primary source) - ALWAYS user-specific
    let localFavorites = [];
    try {
      const { getUserFavorites } = await import('../utils/userStorage');
      localFavorites = await getUserFavorites(normalizedEmail);
      
      // CRITICAL: Filter to ensure ONLY this user's favorites
      // Validate that all favorites belong to this user
      const validatedFavorites = localFavorites.filter(id => {
        // All favorites in user-specific storage belong to this user
        // But we validate the storage key was correct
        return id !== null && id !== undefined;
      });
      
      if (validatedFavorites.length !== localFavorites.length) {
        console.warn(`⚠️ Filtered ${localFavorites.length - validatedFavorites.length} invalid favorites for ${normalizedEmail}`);
        // Update storage with validated favorites
        const { saveUserFavorites } = await import('../utils/userStorage');
        await saveUserFavorites(normalizedEmail, validatedFavorites);
        localFavorites = validatedFavorites;
      }
    } catch (error) {
      console.error('Error loading favorites from local storage:', error);
      localFavorites = [];
    }
    
    // Normalize local favorites to strings
    const normalizedLocalFavorites = localFavorites.map(id => String(id));
    console.log('✅ Loaded favorites from local storage:', normalizedLocalFavorites.length, 'IDs:', normalizedLocalFavorites.slice(0, 5), 'User:', normalizedEmail);
    
    // Try to sync with API (non-blocking - don't fail if API fails)
    try {
      const result = await favoriteService.getFavorites();
      if (result !== null && result !== undefined) {
        const apiFavorites = Array.isArray(result) ? result : (result.data || []);
        const normalizedApiFavorites = apiFavorites.map(id => String(id));
        console.log('✅ Synced favorites from API:', normalizedApiFavorites.length, 'for user:', normalizedEmail);
        
        // CRITICAL: Merge API and local favorites, but ensure all belong to this user
        // API favorites are already user-specific (from authenticated session)
        // Combine and deduplicate
        const combinedFavorites = [...new Set([...normalizedApiFavorites, ...normalizedLocalFavorites])];
        
        // Save merged favorites back to user-specific storage
        if (combinedFavorites.length > normalizedLocalFavorites.length) {
          const { saveUserFavorites } = await import('../utils/userStorage');
          await saveUserFavorites(normalizedEmail, combinedFavorites);
          console.log('✅ Saved merged favorites to user-specific storage:', combinedFavorites.length);
        }
        
        return combinedFavorites.length > 0 ? combinedFavorites : normalizedLocalFavorites;
      }
    } catch (error) {
      // API failed - that's okay, use local storage
      console.log('⚠️ API sync failed, using local storage:', error.message);
    }
    
    // Return local favorites (always available, works offline, user-specific)
    return normalizedLocalFavorites;
  },
};
