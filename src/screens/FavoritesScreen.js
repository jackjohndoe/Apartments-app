import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { notifyFavoriteRemoved } from '../utils/notifications';
import { hybridFavoriteService } from '../services/hybridService';
import { hybridApartmentService } from '../services/hybridService';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';
import { getApartmentPlaceholder, isPlaceholderImage } from '../utils/imagePlaceholder';
import { PlaceholderImage } from '../components/PlaceholderImage';

const { width } = Dimensions.get('window');
const DEFAULT_PLACEHOLDER = getApartmentPlaceholder();

const allApartments = [
  {
    id: '1',
    title: 'Modern 3-Bedroom Apartment in Victoria Island',
    price: 83333, // Daily rate (under 100K)
    location: 'Lagos',
    beds: 3,
    baths: 2,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '2',
    title: 'Luxury 2-Bedroom Penthouse in Lekki',
    price: 95000, // Daily rate (under 100K)
    location: 'Lagos',
    beds: 2,
    baths: 2,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '3',
    title: 'Cozy 1-Bedroom Studio in Garki',
    price: 26667, // Daily rate (under 100K)
    location: 'Abuja',
    beds: 1,
    baths: 1,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '4',
    title: 'Spacious 4-Bedroom Family Home in Port Harcourt',
    price: 60000, // Daily rate (under 100K)
    location: 'Port Harcourt',
    beds: 4,
    baths: 3,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '5',
    title: 'Elegant 2-Bedroom Apartment in Ibadan',
    price: 20000, // Daily rate (under 100K)
    location: 'Ibadan',
    beds: 2,
    baths: 2,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '6',
    title: 'Contemporary 3-Bedroom Duplex in Kano',
    price: 40000, // Daily rate (under 100K)
    location: 'Kano',
    beds: 3,
    baths: 3,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '7',
    title: 'Stylish 2-Bedroom Apartment in Ikeja',
    price: 50000, // Daily rate (under 100K)
    location: 'Lagos',
    beds: 2,
    baths: 2,
    image: DEFAULT_PLACEHOLDER,
  },
  {
    id: '8',
    title: 'Luxury 5-Bedroom Mansion in Asokoro',
    price: 98000, // Daily rate (under 100K)
    location: 'Abuja',
    beds: 5,
    baths: 4,
    image: DEFAULT_PLACEHOLDER,
  },
];

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const intervalRef = useRef(null);

  // Check if user is logged in
  React.useEffect(() => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to view your favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('SignIn')
          }
        ]
      );
      // Navigate back to Explore
      navigation.navigate('Explore');
    }
  }, [user, navigation]);

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  const loadFavorites = useCallback(async () => {
    try {
      // CRITICAL: Validate user email before loading favorites
      if (!user || !user.email) {
        logger.warn('⚠️ Favorites access attempted without user email - preventing data leakage');
        setFavorites([]);
        return;
      }
      
      // CRITICAL: Validate email format to prevent cross-user access
      const normalizedEmail = user.email.toLowerCase().trim();
      if (!normalizedEmail || normalizedEmail.length === 0 || !normalizedEmail.includes('@')) {
        logger.error('❌ Invalid user email format - preventing favorites access');
        setFavorites([]);
        return;
      }
      
      logger.log('🔄 Loading favorites for user:', normalizedEmail);
      
      // Get user-specific favorites (persists across logout/login)
      // CRITICAL: Pass user email to ensure account-specific favorites
      const favoriteIds = await hybridFavoriteService.getFavorites(normalizedEmail);
      logger.log('📋 Favorite IDs loaded:', favoriteIds, 'for user:', normalizedEmail);
      
      if (!favoriteIds || favoriteIds.length === 0) {
        logger.log('ℹ️ No favorites found');
        setFavorites([]);
        return;
      }
      
      // Get all apartments (from global listings + defaults)
      logger.log('🏠 Loading all apartments...');
      const allApartments = await hybridApartmentService.getAllApartmentsForExplore();
      logger.log('🏠 All apartments loaded:', allApartments.length);
      
      // Normalize all favorite IDs to strings for consistent comparison
      const normalizedFavoriteIds = favoriteIds.map(id => String(id));
      logger.log('📋 Normalized favorite IDs:', normalizedFavoriteIds);
      
      // Filter to only show favorite apartments
      const favoriteApartments = allApartments.filter((apt) => {
        const aptId = String(apt.id || apt._id || '');
        const isFavorite = normalizedFavoriteIds.includes(aptId);
        if (isFavorite) {
          logger.log('✅ Found favorite apartment:', aptId, apt.title);
        }
        return isFavorite;
      });
      
      logger.log('❤️ Favorite apartments found:', favoriteApartments.length);
      setFavorites(favoriteApartments);
    } catch (error) {
      logger.error('❌ Error loading favorites:', error);
      logger.error('❌ Error stack:', error.stack);
      setFavorites([]);
    }
  }, []);

  // Reload favorites when screen comes into focus (real-time updates)
  useFocusEffect(
    useCallback(() => {
      // Reload immediately when screen comes into focus
      loadFavorites();
      
      // Also reload after small delays to catch any async saves from navigation
      const timer1 = setTimeout(() => {
        loadFavorites();
      }, 100);
      const timer2 = setTimeout(() => {
        loadFavorites();
      }, 300);
      const timer3 = setTimeout(() => {
        loadFavorites();
      }, 600);
      
      // Set up interval to check for favorites updates every 300ms while screen is focused
      // This provides fast real-time updates when favorites are added from other screens
      intervalRef.current = setInterval(() => {
        loadFavorites();
      }, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [loadFavorites])
  );


  const removeFavorite = async (id) => {
    try {
      const apartment = favorites.find((apt) => apt.id === id || apt._id === id);
      
      // Optimistically update UI immediately (real-time removal)
      const updatedFavorites = favorites.filter((apt) => (apt.id !== id && apt._id !== id));
      setFavorites(updatedFavorites);
      
      // Remove from user-specific favorites (persists across logout/login)
      // CRITICAL: Pass user email to ensure account-specific favorites
      const userEmail = user?.email?.toLowerCase()?.trim();
      if (!userEmail || !userEmail.includes('@')) {
        logger.error('❌ Cannot remove favorite - invalid user email');
        loadFavorites(); // Reload to restore state
        return;
      }
      
      // This happens in the background after UI update for instant feedback
      hybridFavoriteService.removeFavorite(id, userEmail).catch((error) => {
        logger.error('Error removing favorite from storage:', error);
        // If removal fails, reload favorites to restore state
        loadFavorites();
      });
      
      // Add notification
      if (apartment) {
        await notifyFavoriteRemoved(apartment.title || apartment.name);
      }
    } catch (error) {
      logger.error('Error removing favorite:', error);
      // Reload favorites on error to ensure consistency
      loadFavorites();
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '₦0';
    
    // Format price with m for millions and k for thousands
    if (price >= 1000000) {
      // Millions: divide by 1,000,000 and show with "m" (e.g., ₦5m)
      const millions = price / 1000000;
      // Show up to 1 decimal place if needed, otherwise whole number
      const formatted = millions % 1 === 0 
        ? millions.toFixed(0) 
        : millions.toFixed(1);
      return `₦${formatted}m`;
    } else if (price >= 1000) {
      // Thousands: divide by 1,000 and show with "k" (e.g., ₦50k)
      const thousands = price / 1000;
      // Show up to 1 decimal place if needed, otherwise whole number
      const formatted = thousands % 1 === 0 
        ? thousands.toFixed(0) 
        : thousands.toFixed(1);
      return `₦${formatted}k`;
    } else {
      // Less than 1000: show full number
      return `₦${price.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`;
    }
  };

  const renderFavoriteCard = ({ item }) => {
    const hasValidImage = item.image && typeof item.image === 'string' && item.image.trim() !== '' && !isPlaceholderImage(item.image);
    const shouldShowPlaceholder = !hasValidImage || isPlaceholderImage(item.image);
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ApartmentDetails', { apartment: item })}
        activeOpacity={0.8}
      >
        {shouldShowPlaceholder ? (
          <PlaceholderImage style={styles.image} iconSize={64} iconColor="#FFF" />
        ) : (
          <Image source={{ uri: item.image }} style={styles.image} />
        )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.price}>{formatPrice(item.price)}/day</Text>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.details}>
              {item.beds} bed · {item.baths} bath
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFavorite(item.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="favorite" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
          <Text style={styles.headerSubtitle}>Your saved apartments</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="favorite-border" size={64} color="#999" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>
            Start exploring and add apartments to your favorites
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerSubtitle}>{favorites.length} saved apartments</Text>
      </View>
      <FlatList
        data={favorites}
        renderItem={renderFavoriteCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#999',
  },
  removeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

