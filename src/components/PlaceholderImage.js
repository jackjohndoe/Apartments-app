/**
 * Placeholder Image Component
 * 
 * Renders a View-based placeholder when no image is available.
 * This is App Store review-safe and works on all platforms.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const PlaceholderImage = ({ style, iconSize = 48, iconColor = '#CCC' }) => {
  return (
    <View style={[styles.placeholder, style]}>
      <MaterialIcons name="home" size={iconSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});



