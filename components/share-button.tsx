import React from 'react';
import { Pressable, Text, View, Share, Platform } from 'react-native';
import { APP_BUNDLE_ID } from '@/config/app-identity.js';

interface ShareButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onShare?: () => void;
}

export function ShareButton({
  variant = 'primary',
  size = 'medium',
  showLabel = true,
  onShare,
}: ShareButtonProps) {

  const handleShare = async () => {
    try {
      const appStoreUrl = `https://play.google.com/store/apps/details?id=${APP_BUNDLE_ID}`;
      const message = '🍦 Download The Ice Cream Man! Order ice cream to your neighborhood with one tap. Get it on Google Play:';

      const result = await Share.share(
        Platform.OS === 'android'
          ? { message: `${message}\n${appStoreUrl}` }
          : { message, url: appStoreUrl }
      );

      if (result.action === Share.sharedAction && onShare) {
        onShare();
      }
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 12 },
    medium: { paddingVertical: 12, paddingHorizontal: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 20 },
  };

  const bgColors = {
    primary: '#FF69B4',
    secondary: '#f5f5f5',
    minimal: 'transparent',
  };

  const textColors = {
    primary: '#fff',
    secondary: '#333',
    minimal: '#333',
  };

  const textSizes = {
    small: 13,
    medium: 15,
    large: 17,
  };

  return (
    <Pressable
      onPress={handleShare}
      style={({ pressed }) => [{
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      }]}
    >
      <View style={[
        sizeStyles[size],
        {
          backgroundColor: bgColors[variant],
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: '#E5E7EB',
        }
      ]}>
        <Text style={{ fontSize: 20 }}>📤</Text>
        {showLabel && (
          <Text style={{
            fontWeight: '600',
            fontSize: textSizes[size],
            color: textColors[variant],
          }}>
            Share with Friends
          </Text>
        )}
      </View>
    </Pressable>
  );
}
