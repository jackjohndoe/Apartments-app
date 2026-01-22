import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { notifyFavoriteAdded, notifyFavoriteRemoved } from '../utils/notifications';
import { hybridApartmentService, hybridFavoriteService } from '../services/hybridService';
import { useAuth } from '../hooks/useAuth';
import WelcomeDealModal from '../components/WelcomeDealModal';
import ApartmentCard from '../components/ApartmentCard';
import { hasSeenWelcomeDeal, markWelcomeDealSeen } from '../utils/userStorage';
import { logger } from '../utils/logger';
import { getApartmentPlaceholder, isPlaceholderImage } from '../utils/imagePlaceholder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_PLACEHOLDER = getApartmentPlaceholder();

// Helper to check if an image URI is valid
const isValidImageUri = (uri) => {
  return uri && typeof uri === 'string' && uri.trim() !== '';
};

// Enhanced helper to extract image URL from various photo structures
// Matches the logic in hybridService.js
const extractImageFromPhoto = (photo, depth = 0) => {
  if (depth > 2) return null;
  
  if (typeof photo === 'string') {
    const trimmed = photo.trim();
    if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
      return trimmed;
    }
    return null;
  }
  
  if (photo && typeof photo === 'object' && !Array.isArray(photo)) {
    const urlProperties = ['url', 'imageUrl', 'src', 'thumbnail', 'original', 'path', 'file', 'link', 'image', 'photo'];
    
    for (const prop of urlProperties) {
      if (photo[prop]) {
        if (typeof photo[prop] === 'string') {
          const trimmed = photo[prop].trim();
          if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
            return trimmed;
          }
        } else if (typeof photo[prop] === 'object' && depth < 2) {
          const nestedUrl = extractImageFromPhoto(photo[prop], depth + 1);
          if (nestedUrl) return nestedUrl;
        }
      }
    }
    
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

// Helper to extract images from photos array
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

const apartments = [];

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [apartmentList, setApartmentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Entire place');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcomeDeal, setShowWelcomeDeal] = useState(false);
  const [checkingWelcomeDeal, setCheckingWelcomeDeal] = useState(false);
  const [lastListingCount, setLastListingCount] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useEffect(() => {
    loadApartments();
    // Check if user is new and show welcome deal modal on first load
    if (user && user.email) {
      checkAndShowWelcomeDeal();
    }
  }, []);

  // Reload apartments when screen comes into focus (to show new listings from all devices)
  // This ensures newly uploaded listings appear at the top immediately when user navigates back
  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      
      // Only refresh if we don't have data yet
      if (apartmentList.length === 0) {
        loadApartments(false);
      }
      
      // Check if user is new and show welcome deal modal
      if (user && user.email) {
        checkAndShowWelcomeDeal();
      }
      
      return () => {
        setIsScreenFocused(false);
      };
    }, [user, apartmentList.length])
  );

  // Real-time polling removed to prevent image glitching/reloading
  // User can pull-to-refresh to get latest updates

  // Check if user should see welcome deal modal
  // Shows for both new users (sign-up) and existing users (sign-in)
  const checkAndShowWelcomeDeal = async () => {
    if (!user || !user.email || checkingWelcomeDeal) return;
    
    try {
      setCheckingWelcomeDeal(true);
      const hasSeenDeal = await hasSeenWelcomeDeal(user.email);
      
      // Show deal if user hasn't seen it yet (works for both sign-up and sign-in)
      if (!hasSeenDeal) {
        // Show welcome deal modal on home page for both new and existing users
        setShowWelcomeDeal(true);
        logger.log('🎉 Welcome deal modal shown on home page for user:', user.email);
      } else {
        logger.log(`✅ User ${user.email} has already seen the welcome deal`);
      }
    } catch (error) {
      logger.error('Error checking welcome deal:', error);
    } finally {
      setCheckingWelcomeDeal(false);
    }
  };

  // Handle claiming the welcome deal
  const handleClaimDeal = async () => {
    if (!user || !user.email) return;
    
    try {
      // Mark deal as claimed (no wallet funding)
      await markWelcomeDealSeen(user.email, true);
      
      setShowWelcomeDeal(false);
      
      Alert.alert(
        'Welcome!',
        'Thanks for joining! Start exploring and booking your dream apartment now.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('Error claiming welcome deal:', error);
      Alert.alert('Error', 'Failed to claim deal. Please try again.');
    }
  };

  // Handle closing the welcome deal modal
  const handleCloseDeal = async () => {
    if (!user || !user.email) return;
    
    // Mark deal as seen (but not claimed)
    await markWelcomeDealSeen(user.email, false);
    
    // Ensure wallet is initialized to 0 for users who don't claim the deal
    try {
      const { updateWalletBalance } = await import('../utils/wallet');
      await updateWalletBalance(user.email, 0);
      logger.log(`✅ Wallet initialized to ₦0 for user: ${user.email}`);
    } catch (walletError) {
      logger.error('Error initializing wallet to zero:', walletError);
    }
    
    setShowWelcomeDeal(false);
  };

  const loadApartments = async (forceRefresh = false) => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      
      // Clear API cache if forcing refresh to ensure fresh data from backend
      if (forceRefresh) {
        try {
          await AsyncStorage.removeItem('cached_api_apartments');
          logger.log('🔄 Cleared API cache for fresh fetch - new listings will appear');
        } catch (cacheError) {
          logger.warn('⚠️ Could not clear API cache:', cacheError.message);
        }
      }
      
      // Always get user listings directly first to ensure they're included
      const { getListings } = await import('../utils/listings');
      const userListings = await getListings();
      logger.log('ExploreScreen - Direct user listings check:', userListings.length);
      if (userListings.length > 0) {
        logger.log('ExploreScreen - User listing IDs:', userListings.slice(0, 3).map(l => String(l.id || l._id || '')));
      }
      
      // Load all apartments including user listings and default apartments
      // This ensures new listings appear with other listing cards
      // Force fresh API fetch to get listings from all devices
      const allApartments = await hybridApartmentService.getAllApartmentsForExplore(forceRefresh);
      
      logger.log('ExploreScreen - All apartments loaded:', allApartments?.length || 0);
      if (allApartments && allApartments.length > 0) {
        logger.log('ExploreScreen - First 5 apartment IDs:', allApartments.slice(0, 5).map(a => String(a.id || a._id || '')));
        logger.log('ExploreScreen - First 5 apartment titles:', allApartments.slice(0, 5).map(a => a.title || 'Untitled'));
      } else {
        logger.warn('⚠️ ExploreScreen - No apartments loaded!');
      }
      
      // CRITICAL: Trust API as source of truth
      // If API returned empty array, that means no listings exist (valid state)
      // Don't manually add local listings - hybridService already handles this properly
      // Only show local listings when API is truly unavailable (offline mode)
      // The hybridService.getAllApartmentsForExplore() already merges API + local listings correctly
      
      // Check if API returned empty results (may indicate backend filtering issue)
      if (allApartments && allApartments.length === 0 && userListings.length === 0) {
        logger.warn('⚠️ No listings found from API or local storage');
        // Only show alert once per session to avoid spam
        if (!global._listingsEmptyAlertShown) {
          global._listingsEmptyAlertShown = true;
          setTimeout(() => { global._listingsEmptyAlertShown = false; }, 30000); // Reset after 30 seconds
          
          // Show user-friendly message (non-blocking)
          setTimeout(() => {
            Alert.alert(
              'No Listings Available',
              'Unable to load listings. This may be because:\n\n' +
              '• Backend is filtering by user (should show all listings)\n' +
              '• No listings exist in the database\n' +
              '• Network connection issue\n\n' +
              'Please check your connection and try again.',
              [{ text: 'OK' }]
            );
          }, 1000);
        }
      }
      
      let finalApartments = [];
      
      if (allApartments && allApartments.length > 0) {
        finalApartments = allApartments;
        
        // CRITICAL: Double-check that user listings are included
        // If we have user listings but they're not in finalApartments, add them
        if (userListings.length > 0) {
          const finalIds = new Set(finalApartments.map(a => String(a.id || a._id || '')));
          const missingListings = userListings.filter(listing => {
            const listingId = String(listing.id || listing._id || '');
            return listingId && !finalIds.has(listingId);
          });
          
          if (missingListings.length > 0) {
            logger.log('🔄 ExploreScreen - Found', missingListings.length, 'user listings not in final list. Adding them...');
            const formattedMissing = missingListings.map(listing => ({
              id: String(listing.id || listing._id || ''),
              title: listing.title || 'Apartment',
              price: listing.price || 0,
              location: listing.location || 'Nigeria',
              beds: listing.bedrooms || listing.beds || 1,
              baths: listing.bathrooms || listing.baths || 1,
              bedrooms: listing.bedrooms || listing.beds || null,
              bathrooms: listing.bathrooms || listing.baths || null,
              area: listing.area || null,
              maxGuests: listing.maxGuests || null,
              description: listing.description || null,
              amenities: listing.amenities || null,
              image: (() => {
                if (listing.image && typeof listing.image === 'string' && listing.image.trim() !== '') {
                  return listing.image;
                }
                if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                  const validImage = listing.images.find(img => img && typeof img === 'string' && img.trim() !== '');
                  if (validImage) return validImage;
                }
                return DEFAULT_PLACEHOLDER;
              })(),
              images: listing.images || (listing.image ? [listing.image] : []),
              isFavorite: false,
              rating: listing.rating || 4.5,
              createdAt: listing.createdAt || new Date().toISOString(),
              hostName: listing.hostName || null,
              isSuperhost: listing.isSuperhost || false,
              hostEmail: listing.hostEmail || null,
              hostProfilePicture: listing.hostProfilePicture || null,
            }));
            // Add missing listings to the beginning (most recent first)
            finalApartments = [...formattedMissing, ...finalApartments];
            logger.log('✅ ExploreScreen - Added', formattedMissing.length, 'missing user listings to final list');
          }
        }
        
        // Update listing count for real-time polling
        setLastListingCount(finalApartments.length);
      } else {
        // If empty, manually merge user listings with defaults
        const formattedUserListings = userListings && userListings.length > 0
          ? userListings.map(listing => ({
              id: listing.id,
              title: listing.title || 'Apartment',
              price: listing.price || 0,
              location: listing.location || 'Nigeria',
              beds: listing.bedrooms || listing.beds || 1,
              baths: listing.bathrooms || listing.baths || 1,
              bedrooms: listing.bedrooms || listing.beds || null,
              bathrooms: listing.bathrooms || listing.baths || null,
              area: listing.area || null,
              maxGuests: listing.maxGuests || null,
              description: listing.description || null,
              amenities: listing.amenities || null,
              image: (() => {
                // Prioritize uploaded images - only use placeholder if truly no image
                if (listing.image && typeof listing.image === 'string' && listing.image.trim() !== '') {
                  return listing.image;
                }
                if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                  const validImage = listing.images.find(img => img && typeof img === 'string' && img.trim() !== '');
                  if (validImage) {
                    return validImage;
                  }
                }
                if (listing.photo && typeof listing.photo === 'string' && listing.photo.trim() !== '') {
                  return listing.photo;
                }
                // Only use placeholder if no valid image exists
                return DEFAULT_PLACEHOLDER;
              })(),
              images: (() => {
                // If listing has images array, use it (filter out invalid images)
                if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                  return listing.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
                }
                // If no images array but we have a valid main image, create array with it
                if (listing.image && typeof listing.image === 'string' && listing.image.trim() !== '') {
                  return [listing.image];
                }
                // If we have photo field, use it
                if (listing.photo && typeof listing.photo === 'string' && listing.photo.trim() !== '') {
                  return [listing.photo];
                }
                // Return empty array (will use default in details screen)
                return [];
              })(),
              isFavorite: false,
              rating: listing.rating || 4.5,
              createdAt: listing.createdAt || new Date().toISOString(),
              hostName: listing.hostName || null,
              isSuperhost: listing.isSuperhost || false,
              hostEmail: listing.hostEmail || null,
              hostProfilePicture: listing.hostProfilePicture || null,
            }))
          : [];
        
        // Sort user listings by most recent
        formattedUserListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Combine: user listings first, then defaults
        finalApartments = [...formattedUserListings, ...apartments];
      }
      
      // Load favorites and merge with apartments
      // CRITICAL: Pass user email to ensure account-specific favorites
      try {
        const userEmail = user?.email?.toLowerCase()?.trim();
        const favoriteIds = userEmail && userEmail.includes('@') 
          ? await hybridFavoriteService.getFavorites(userEmail)
          : [];
        // favoriteIds are already normalized to strings in hybridFavoriteService.getFavorites
        finalApartments = finalApartments.map((apt) => {
          const aptId = String(apt.id || apt._id || '');
          return {
            ...apt,
            isFavorite: favoriteIds.includes(aptId),
          };
        });
        logger.log('✅ ExploreScreen - Merged favorites with apartments. Favorites count:', favoriteIds.length);
      } catch (favoritesError) {
        logger.error('Error loading favorites:', favoritesError);
        // Continue without favorites
      }
      
      // Sort by most recent first to ensure newly uploaded listings appear at top
      finalApartments.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA; // Most recent first (newest at top)
      });
      
      // Set the final list - this ensures listings are stable and sorted correctly
      // Always set the list, even if empty (shouldn't happen)
      setApartmentList(finalApartments);
      // Update listing count for real-time polling
      setLastListingCount(finalApartments.length);
      logger.log('✅ ExploreScreen - Final apartments set:', finalApartments.length, 'Sorted by most recent first. User listings included:', userListings.length);
    } catch (error) {
      logger.error('Error loading apartments:', error);
      // Fallback: try to get user listings and merge with defaults
      try {
        const { getListings } = await import('../utils/listings');
        const userListings = await getListings();
        const formattedUserListings = userListings && userListings.length > 0
          ? userListings.map(listing => ({
              id: listing.id,
              title: listing.title || 'Apartment',
              price: listing.price || 0,
              location: listing.location || 'Nigeria',
              beds: listing.bedrooms || listing.beds || 1,
              baths: listing.bathrooms || listing.baths || 1,
              bedrooms: listing.bedrooms || listing.beds || null,
              bathrooms: listing.bathrooms || listing.baths || null,
              area: listing.area || null,
              maxGuests: listing.maxGuests || null,
              description: listing.description || null,
              amenities: listing.amenities || null,
              image: listing.image || listing.images?.[0] || DEFAULT_PLACEHOLDER,
              images: (() => {
                // If listing has images array, use it
                if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                  return listing.images.filter(img => img && img.trim && img.trim() !== '');
                }
                // If no images array but we have a main image, create array with it
                if (listing.image) {
                  return [listing.image];
                }
                // Return empty array (will use default in details screen)
                return [];
              })(),
              isFavorite: false,
              rating: listing.rating || 4.5,
              createdAt: listing.createdAt || new Date().toISOString(),
              hostName: listing.hostName || null,
              isSuperhost: listing.isSuperhost || false,
              hostEmail: listing.hostEmail || null,
              hostProfilePicture: listing.hostProfilePicture || null,
            }))
          : [];
        formattedUserListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // CRITICAL: Pass user email to ensure account-specific favorites
        const userEmail = user?.email?.toLowerCase()?.trim();
        const favoriteIds = userEmail && userEmail.includes('@') 
          ? await hybridFavoriteService.getFavorites(userEmail)
          : [];
        // favoriteIds are already normalized to strings in hybridFavoriteService.getFavorites
        const combined = [...formattedUserListings].map((apt) => {
          const aptId = String(apt.id || apt._id || '');
          return {
            ...apt,
            isFavorite: favoriteIds.includes(aptId),
          };
        });
        setApartmentList(combined);
      } catch (fallbackError) {
        logger.error('Fallback error:', fallbackError);
        setApartmentList([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      // Update last listing count for real-time polling
      const finalCount = apartmentList.length || 0;
      if (finalCount > 0) {
        setLastListingCount(finalCount);
      }
    }
  };

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Force refresh by clearing cache and reloading
    await loadApartments(true);
  }, []);

  const loadFavorites = async () => {
    try {
      // CRITICAL: Pass user email to ensure account-specific favorites
      const userEmail = user?.email?.toLowerCase()?.trim();
      const favoriteIds = userEmail && userEmail.includes('@') 
        ? await hybridFavoriteService.getFavorites(userEmail)
        : [];
      // favoriteIds are already normalized to strings in hybridFavoriteService.getFavorites
      setApartmentList(prevList => prevList.map((apt) => {
        const aptId = String(apt.id || apt._id || '');
        return {
          ...apt,
          isFavorite: favoriteIds.includes(aptId),
        };
      }));
    } catch (error) {
      logger.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = React.useCallback(async (id) => {
    // Use functional update to ensure we have the latest state
    let apartment = null;
    let wasFavorite = false;
    
    setApartmentList(prevList => {
      apartment = prevList.find((apt) => apt.id === id);
      wasFavorite = apartment?.isFavorite || false;
      
      const updatedList = prevList.map((apt) => {
        if (apt.id === id) {
          return { ...apt, isFavorite: !wasFavorite };
        }
        return apt;
      });
      
      return updatedList;
    });

    // Save to API and local storage
    if (!wasFavorite) {
      // Normalize ID to string for consistent saving
      const normalizedId = String(id);
      try {
        // CRITICAL: Pass user email to ensure account-specific favorites
        const userEmail = user?.email?.toLowerCase()?.trim();
        if (!userEmail || !userEmail.includes('@')) {
          throw new Error('User must be logged in to add favorites');
        }
        await hybridFavoriteService.addFavorite(normalizedId, userEmail);
        logger.log('✅ ExploreScreen - Favorite added:', normalizedId, apartment?.title || 'Unknown');
        if (apartment) {
          await notifyFavoriteAdded(apartment.title);
        }
        // Force a small delay to ensure AsyncStorage is flushed
        await new Promise(resolve => setTimeout(resolve, 100));
        logger.log('✅ ExploreScreen - Favorite save confirmed');
      } catch (error) {
        logger.error('❌ ExploreScreen - Error adding favorite:', error);
        // Revert UI state on error
        setApartmentList(prevList => prevList.map((apt) => {
          if (apt.id === id) {
            return { ...apt, isFavorite: false };
          }
          return apt;
        }));
      }
    } else {
      // Normalize ID to string for consistent removal
      const normalizedId = String(id);
      try {
        // CRITICAL: Pass user email to ensure account-specific favorites
        const userEmail = user?.email?.toLowerCase()?.trim();
        if (!userEmail || !userEmail.includes('@')) {
          throw new Error('User must be logged in to remove favorites');
        }
        await hybridFavoriteService.removeFavorite(normalizedId, userEmail);
        logger.log('✅ ExploreScreen - Favorite removed:', normalizedId, apartment?.title || 'Unknown');
        if (apartment) {
          await notifyFavoriteRemoved(apartment.title);
        }
        // Force a small delay to ensure AsyncStorage is flushed
        await new Promise(resolve => setTimeout(resolve, 100));
        logger.log('✅ ExploreScreen - Favorite removal confirmed');
      } catch (error) {
        logger.error('❌ ExploreScreen - Error removing favorite:', error);
        // Revert UI state on error
        setApartmentList(prevList => prevList.map((apt) => {
          if (apt.id === id) {
            return { ...apt, isFavorite: true };
          }
          return apt;
        }));
      }
    }
  }, [user]);

  // Helper to check if apartment matches search query
  const filterApartment = (apt, query) => {
    try {
      // Search in title
      const titleMatch = apt.title && apt.title.toLowerCase().includes(query);
      
      // Search in location
      const locationMatch = apt.location && apt.location.toLowerCase().includes(query);
      
      // Search in number of beds
      const bedsMatch = apt.beds && apt.beds.toString().includes(query);
      
      // Search in number of baths
      const bathsMatch = apt.baths && apt.baths.toString().includes(query);
      
      // Search in price (convert to string and search)
      const priceMatch = apt.price && apt.price.toString().includes(query);
      
      // Search in price formatted (e.g., "2.5M" for 2500000)
      let formattedPriceMatch = false;
      if (apt.price) {
        try {
          const formattedPrice = `₦${(apt.price / 1000000).toFixed(1)}m`;
          formattedPriceMatch = formattedPrice.includes(query);
        } catch (e) {
          // Ignore formatting errors
        }
      }
      
      // Search for specific keywords (split query into words)
      const keywords = query.split(' ').filter(k => k.length > 0);
      let keywordMatch = false;
      if (keywords.length > 0) {
        keywordMatch = keywords.some(keyword => {
          return (apt.title && apt.title.toLowerCase().includes(keyword)) ||
                 (apt.location && apt.location.toLowerCase().includes(keyword)) ||
                 (apt.beds && apt.beds.toString().includes(keyword)) ||
                 (apt.baths && apt.baths.toString().includes(keyword));
        });
      }

      return titleMatch || locationMatch || bedsMatch || bathsMatch || 
             priceMatch || formattedPriceMatch || keywordMatch;
    } catch (error) {
      logger.error('Error filtering apartment:', error);
      return false;
    }
  };

  // Filter apartments based on search query and selected filter
  const filteredApartments = useMemo(() => {
    let filtered = apartmentList;

    // Apply filter button selection first
    if (selectedFilter) {
      filtered = filtered.filter((apt) => {
        try {
          switch (selectedFilter) {
            case 'Entire place':
              // Show all apartments
              return true;
            case 'Pool':
              // Check if apartment has pool in amenities or title/description
              const hasPool = 
                (apt.amenities && Array.isArray(apt.amenities) && apt.amenities.some(a => 
                  a && (a.toLowerCase().includes('pool') || a.toLowerCase().includes('swimming'))
                )) ||
                (apt.title && apt.title.toLowerCase().includes('pool')) ||
                (apt.description && apt.description.toLowerCase().includes('pool'));
              return hasPool;
            case 'Pet-friendly':
              // Check if apartment is pet-friendly
              const isPetFriendly = 
                (apt.amenities && Array.isArray(apt.amenities) && apt.amenities.some(a => 
                  a && (a.toLowerCase().includes('pet') || a.toLowerCase().includes('dog') || a.toLowerCase().includes('cat'))
                )) ||
                (apt.title && apt.title.toLowerCase().includes('pet')) ||
                (apt.description && apt.description.toLowerCase().includes('pet'));
              return isPetFriendly;
            case '2 Bedroom':
              // Show apartments with exactly 2 bedrooms
              const beds2 = apt.beds || apt.bedrooms;
              return beds2 === 2;
            case '3 Bedroom':
              // Show apartments with exactly 3 bedrooms
              const beds3 = apt.beds || apt.bedrooms;
              return beds3 === 3;
            case '4 Bedroom':
              // Show apartments with exactly 4 bedrooms
              const beds4 = apt.beds || apt.bedrooms;
              return beds4 === 4;
            case 'Top-rated':
              // Show apartments with rating >= 4.8
              return apt.rating && apt.rating >= 4.8;
            default:
              return true;
          }
        } catch (error) {
          logger.error('Error applying filter:', error);
          return true;
        }
      });
    }

    // Then apply search query filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter((apt) => {
        try {
          // Search in title
          const titleMatch = apt.title && apt.title.toLowerCase().includes(query);
          
          // Search in location
          const locationMatch = apt.location && apt.location.toLowerCase().includes(query);
          
          // Search in number of beds
          const bedsMatch = apt.beds && apt.beds.toString().includes(query);
          
          // Search in number of baths
          const bathsMatch = apt.baths && apt.baths.toString().includes(query);
          
          // Search in price (convert to string and search)
          const priceMatch = apt.price && apt.price.toString().includes(query);
          
          // Search in price formatted (e.g., "2.5M" for 2500000)
          let formattedPriceMatch = false;
          if (apt.price) {
            try {
              const formattedPrice = `₦${(apt.price / 1000000).toFixed(1)}m`;
              formattedPriceMatch = formattedPrice.includes(query);
            } catch (e) {
              // Ignore formatting errors
            }
          }
          
          // Search for specific keywords (split query into words)
          const keywords = query.split(' ').filter(k => k.length > 0);
          let keywordMatch = false;
          if (keywords.length > 0) {
            keywordMatch = keywords.some(keyword => {
              return (apt.title && apt.title.toLowerCase().includes(keyword)) ||
                     (apt.location && apt.location.toLowerCase().includes(keyword)) ||
                     (apt.beds && apt.beds.toString().includes(keyword)) ||
                     (apt.baths && apt.baths.toString().includes(keyword));
            });
          }

          return titleMatch || locationMatch || bedsMatch || bathsMatch || 
                 priceMatch || formattedPriceMatch || keywordMatch;
        } catch (error) {
          logger.error('Error filtering apartment:', error);
          return false;
        }
      });
    }

    return filtered;
  }, [apartmentList, searchQuery, selectedFilter]);

  const filters = ['Entire place', '2 Bedroom', '3 Bedroom', '4 Bedroom', 'Pool', 'Pet-friendly', 'Top-rated'];

  const handleCardPress = React.useCallback((apartment) => {
    navigation.navigate('ApartmentDetails', { apartment });
  }, [navigation]);

  const renderItem = React.useCallback(({ item }) => {
    return (
      <ApartmentCard
        item={item}
        onPress={handleCardPress}
        onToggleFavorite={toggleFavorite}
      />
    );
  }, [handleCardPress, toggleFavorite]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search apartments..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Filter Categories */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.activeFilterChip,
              ]}
              onPress={() => setSelectedFilter(filter === selectedFilter ? null : filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Apartment List */}
      <FlatList
        data={filteredApartments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {!loading ? (
              <>
                <MaterialIcons name="home-work" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? `No apartments found for "${searchQuery}"` 
                    : "No apartments available"}
                </Text>
                <TouchableOpacity style={styles.refreshButton} onPress={() => loadApartments(true)}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator size="large" color="#FFD700" />
            )}
          </View>
        }
      />
      
      {/* Welcome Deal Modal */}
      <WelcomeDealModal
        visible={showWelcomeDeal}
        onClose={handleCloseDeal}
        onClaim={handleClaimDeal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginRight: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  activeFilterChip: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#000',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});
