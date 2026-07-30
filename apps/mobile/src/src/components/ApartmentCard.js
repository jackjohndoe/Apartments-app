import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { logger } from '../utils/logger';
import { getApartmentPlaceholder, isPlaceholderImage } from '../utils/imagePlaceholder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const ApartmentCard = ({ item, onPress, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Calculate card width dynamically for proper fit
  // Formula: (screen width - left padding - right padding - gap between cards) / 2
  // For iPhone 12 (390px): (390 - 16 - 16 - 12) / 2 = 173px per card
  const cardWidth = (SCREEN_WIDTH - 44) / 2;
  
  // Get all possible image URIs in priority order
  const getAllImageUris = () => {
    const uris = [];
    
    // First check main image field (from formatted listing)
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '' && !isPlaceholderImage(item.image)) {
      uris.push(item.image);
    }
    
    // Then check images array (for other users' listings or fallback)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      item.images.forEach(img => {
        if (img && typeof img === 'string' && img.trim() !== '' && !isPlaceholderImage(img) && !uris.includes(img)) {
          uris.push(img);
        }
      });
    }
    
    // Fallback to placeholder if no valid images
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
          onError={(error) => {
            logger.warn('Image failed to load for listing:', item.id || item._id || 'unknown', item.title || 'Untitled');
            logger.warn('  Image URI:', imageUri.substring(0, 100));
            logger.warn('  Error:', error.nativeEvent?.error || 'Unknown');
            logger.warn('  Current image index:', currentImageIndex, 'of', allImageUris.length);
            
            // Try next image from the array if available
            if (currentImageIndex < allImageUris.length - 1) {
              const nextIndex = currentImageIndex + 1;
              logger.log('  Trying next image from array (index', nextIndex, '):', allImageUris[nextIndex].substring(0, 100));
              setCurrentImageIndex(nextIndex);
              setImageError(false); // Reset error to try next image
              setImageLoading(true); // Show loading indicator
            } else {
              // No more images to try - show placeholder
              logger.warn('  No more images to try - showing placeholder');
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
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageHidden: {
    opacity: 0,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
    lineHeight: 18,
  },
  location: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

const arePropsEqual = (prevProps, nextProps) => {
  const { item: prevItem } = prevProps;
  const { item: nextItem } = nextProps;

  // Check if critical props have changed
  // We avoid deep comparison of the entire object to maintain performance
  return (
    prevItem.id === nextItem.id &&
    prevItem.title === nextItem.title &&
    prevItem.price === nextItem.price &&
    prevItem.location === nextItem.location &&
    prevItem.rating === nextItem.rating &&
    prevItem.isFavorite === nextItem.isFavorite &&
    prevItem.image === nextItem.image &&
    // Check if images array length is the same (basic check)
    (prevItem.images?.length || 0) === (nextItem.images?.length || 0) &&
    // Check function props stability
    prevProps.onPress === nextProps.onPress &&
    prevProps.onToggleFavorite === nextProps.onToggleFavorite
  );
};

export default React.memo(ApartmentCard, arePropsEqual);
