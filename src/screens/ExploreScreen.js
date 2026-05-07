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

const formatPrice = (price) => {
  if (!price || price === 0) return '₦0';
  
  // Format price with m for millions and k for thousands
  if (price >= 1000000) {
    const millions = price / 1000000;
    const formatted = millions % 1 === 0 
      ? millions.toFixed(0) 
      : millions.toFixed(1);
    return `₦${formatted}m`;
  } else if (price >= 1000) {
    const thousands = price / 1000;
    const formatted = thousands % 1 === 0 
      ? thousands.toFixed(0) 
      : thousands.toFixed(1);
    return `₦${formatted}k`;
  } else {
    return `₦${price.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  }
};

// Separate component for apartment card to use hooks properly
const ApartmentCard = React.memo(({ item, onPress, onToggleFavorite, width }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const cardWidth = width || (SCREEN_WIDTH - 44) / 2;
  
  const getAllImageUris = () => {
    const uris = [];
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '' && !isPlaceholderImage(item.image)) {
      uris.push(item.image);
    }
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      item.images.forEach(img => {
        if (img && typeof img === 'string' && img.trim() !== '' && !isPlaceholderImage(img) && !uris.includes(img)) {
          uris.push(img);
        }
      });
    }
    if (uris.length === 0) {
      uris.push(getApartmentPlaceholder(400, 300));
    }
    return uris;
  };
  
  const allImageUris = getAllImageUris();
  const imageUri = allImageUris[currentImageIndex] || getApartmentPlaceholder(400, 300);
  const isPlaceholder = isPlaceholderImage(imageUri);
  
  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {imageLoading && !isPlaceholder && (
          <View style={styles.imagePlaceholder}>
            <ActivityIndicator size="small" color="#FFD700" />
          </View>
        )}
        <Image 
          key={`${item.id || item._id}-${currentImageIndex}`}
          source={{ uri: imageUri }} 
          style={[styles.image, imageLoading && !isPlaceholder && styles.imageHidden]}
          resizeMode="cover"
          onError={() => {
            if (currentImageIndex < allImageUris.length - 1) {
              setCurrentImageIndex(prev => prev + 1);
              setImageError(false);
              setImageLoading(true);
            } else {
              setImageError(true);
              setImageLoading(false);
            }
          }}
          onLoad={() => {
            setImageLoading(false);
            setImageError(false);
          }}
          onLoadStart={() => {
            setImageLoading(true);
          }}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite(item.id)}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={item.isFavorite ? 'favorite' : 'favorite-border'} 
            size={18} 
            color={item.isFavorite ? '#FF0000' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.location}>{item.location}</Text>
            <View style={styles.priceRatingRow}>
              <Text style={styles.price}>{formatPrice(item.price)}/day</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={12} color="#FFD700" />
                <Text style={styles.rating}>{item.rating || 4.9}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  const itemChanged = 
    prevProps.item.id !== nextProps.item.id ||
    prevProps.item.title !== nextProps.item.title ||
    prevProps.item.price !== nextProps.item.price ||
    prevProps.item.isFavorite !== nextProps.item.isFavorite ||
    prevProps.item.image !== nextProps.item.image;
  const widthChanged = prevProps.width !== nextProps.width;
  return !itemChanged && !widthChanged;
});

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
  const [lastTopListingId, setLastTopListingId] = useState(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useEffect(() => {
    loadApartments();
    if (user && user.email) {
      checkAndShowWelcomeDeal();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      if (apartmentList.length === 0) {
        loadApartments(false);
      }
      if (user && user.email) {
        checkAndShowWelcomeDeal();
      }
      return () => {
        setIsScreenFocused(false);
      };
    }, [user, apartmentList.length])
  );

  // Real-time polling logic preserved from HEAD
  useEffect(() => {
    if (!isScreenFocused) return;

    const pollInterval = setInterval(async () => {
      try {
        const { hybridApartmentService } = await import('../services/hybridService');
        const currentListings = await hybridApartmentService.getAllApartmentsForExplore(true);
        const currentCount = currentListings?.length || 0;
        const topListingId = currentListings && currentListings.length > 0 
          ? String(currentListings[0].id || currentListings[0]._id || '') 
          : null;
        
        let shouldUpdate = false;
        if (currentCount !== lastListingCount) {
          shouldUpdate = true;
        } else if (currentCount > 0 && topListingId !== lastTopListingId) {
          shouldUpdate = true;
        }
        
        if (shouldUpdate) {
          setLastListingCount(currentCount);
          setLastTopListingId(topListingId);
          await loadApartments(true); 
        }
      } catch (error) {
        logger.warn('⚠️ Real-time polling error (non-fatal):', error.message);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isScreenFocused, lastListingCount, lastTopListingId]);

  const checkAndShowWelcomeDeal = async () => {
    if (!user || !user.email || checkingWelcomeDeal) return;
    try {
      setCheckingWelcomeDeal(true);
      const hasSeenDeal = await hasSeenWelcomeDeal(user.email);
      if (!hasSeenDeal) {
        setShowWelcomeDeal(true);
      }
    } catch (error) {
      logger.error('Error checking welcome deal:', error);
    } finally {
      setCheckingWelcomeDeal(false);
    }
  };

  const handleClaimDeal = async () => {
    if (!user || !user.email) return;
    try {
      await markWelcomeDealSeen(user.email, true);
      setShowWelcomeDeal(false);
      Alert.alert('Welcome!', 'Thanks for joining!');
    } catch (error) {
      logger.error('Error claiming welcome deal:', error);
    }
  };

  const handleCloseDeal = async () => {
    if (!user || !user.email) return;
    await markWelcomeDealSeen(user.email, false);
    setShowWelcomeDeal(false);
  };

  const loadApartments = async (forceRefresh = false, isBackground = false) => {
    try {
      if (!refreshing && !isBackground) {
        setLoading(true);
      }
      
      const { getListings } = await import('../utils/listings');
      const userListings = await getListings();
      const allApartments = await hybridApartmentService.getAllApartmentsForExplore(forceRefresh);
      
      let finalApartments = [];
      if (allApartments && allApartments.length > 0) {
        finalApartments = allApartments;
        if (userListings.length > 0) {
          const finalIds = new Set(finalApartments.map(a => String(a.id || a._id || '')));
          const missingListings = userListings.filter(listing => {
            const listingId = String(listing.id || listing._id || '');
            return listingId && !finalIds.has(listingId);
          });
          
          if (missingListings.length > 0) {
            const formattedMissing = missingListings.map(listing => ({
              id: String(listing.id || listing._id || ''),
              title: listing.title || 'Apartment',
              price: listing.price || 0,
              location: listing.location || 'Nigeria',
              beds: listing.bedrooms || listing.beds || 1,
              baths: listing.bathrooms || listing.baths || 1,
              image: listing.image || DEFAULT_PLACEHOLDER,
              images: listing.images || (listing.image ? [listing.image] : []),
              isFavorite: false,
              rating: listing.rating || 4.5,
              createdAt: listing.createdAt || new Date().toISOString(),
            }));
            finalApartments = [...formattedMissing, ...finalApartments];
          }
        }
      } else {
        const formattedUserListings = userListings.map(listing => ({
          id: listing.id,
          title: listing.title || 'Apartment',
          price: listing.price || 0,
          location: listing.location || 'Nigeria',
          beds: listing.bedrooms || listing.beds || 1,
          baths: listing.bathrooms || listing.baths || 1,
          image: listing.image || DEFAULT_PLACEHOLDER,
          images: listing.images || (listing.image ? [listing.image] : []),
          isFavorite: false,
          rating: listing.rating || 4.5,
          createdAt: listing.createdAt || new Date().toISOString(),
        }));
        formattedUserListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        finalApartments = formattedUserListings;
      }
      
      try {
        const userEmail = user?.email?.toLowerCase()?.trim();
        const favoriteIds = userEmail && userEmail.includes('@') 
          ? await hybridFavoriteService.getFavorites(userEmail)
          : [];
        finalApartments = finalApartments.map((apt) => {
          const aptId = String(apt.id || apt._id || '');
          return {
            ...apt,
            isFavorite: favoriteIds.includes(aptId),
          };
        });
      } catch (favoritesError) {}
      
      finalApartments.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
      });
      
      setApartmentList(finalApartments);
      setLastListingCount(finalApartments.length);
      const finalTopId = finalApartments.length > 0 ? String(finalApartments[0].id || finalApartments[0]._id || '') : null;
      setLastTopListingId(finalTopId);
    } catch (error) {
      logger.error('Error loading apartments:', error);
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadApartments(true);
  }, []);

  const toggleFavorite = React.useCallback(async (id) => {
    let apartment = null;
    let wasFavorite = false;
    
    setApartmentList(prevList => {
      apartment = prevList.find((apt) => apt.id === id);
      wasFavorite = apartment?.isFavorite || false;
      return prevList.map((apt) => apt.id === id ? { ...apt, isFavorite: !wasFavorite } : apt);
    });

    if (!wasFavorite) {
      const normalizedId = String(id);
      try {
        const userEmail = user?.email?.toLowerCase()?.trim();
        if (!userEmail || !userEmail.includes('@')) throw new Error('Login required');
        await hybridFavoriteService.addFavorite(normalizedId, userEmail);
        if (apartment) await notifyFavoriteAdded(apartment.title);
      } catch (error) {
        setApartmentList(prevList => prevList.map((apt) => apt.id === id ? { ...apt, isFavorite: false } : apt));
      }
    } else {
      const normalizedId = String(id);
      try {
        const userEmail = user?.email?.toLowerCase()?.trim();
        if (!userEmail || !userEmail.includes('@')) throw new Error('Login required');
        await hybridFavoriteService.removeFavorite(normalizedId, userEmail);
        if (apartment) await notifyFavoriteRemoved(apartment.title);
      } catch (error) {
        setApartmentList(prevList => prevList.map((apt) => apt.id === id ? { ...apt, isFavorite: true } : apt));
      }
    }
  }, [user]);

  const filteredApartments = useMemo(() => {
    let filtered = apartmentList;
    if (selectedFilter && selectedFilter !== 'Entire place') {
      filtered = filtered.filter((apt) => {
        if (selectedFilter === 'Pool') return apt.amenities?.some(a => a.toLowerCase().includes('pool'));
        if (selectedFilter === '2 Bedroom') return (apt.beds || apt.bedrooms) === 2;
        if (selectedFilter === '3 Bedroom') return (apt.beds || apt.bedrooms) === 3;
        if (selectedFilter === '4 Bedroom') return (apt.beds || apt.bedrooms) === 4;
        if (selectedFilter === 'Top-rated') return apt.rating >= 4.8;
        return true;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((apt) => 
        apt.title?.toLowerCase().includes(query) || 
        apt.location?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [apartmentList, searchQuery, selectedFilter]);

  const filters = ['Entire place', '2 Bedroom', '3 Bedroom', '4 Bedroom', 'Pool', 'Pet-friendly', 'Top-rated'];

  const handleApartmentPress = React.useCallback((item) => {
    navigation.navigate('ApartmentDetails', { apartment: item });
  }, [navigation]);

  const renderItem = React.useCallback(({ item }) => (
    <ApartmentCard 
      item={item} 
      onPress={handleApartmentPress}
      onToggleFavorite={toggleFavorite}
      width={(SCREEN_WIDTH - 44) / 2}
    />
  ), [handleApartmentPress, toggleFavorite]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
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

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.activeFilterChip]}
              onPress={() => setSelectedFilter(filter === selectedFilter ? null : filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredApartments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {!loading ? (
              <>
                <MaterialIcons name="home-work" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No apartments found</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 6,
  },
  cardContent: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
});
