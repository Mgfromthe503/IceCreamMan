import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to import optional modules
let StoreReview: any = null;

try {
  StoreReview = require('expo-store-review');
} catch (e) {
  // Module not available
}

interface RatingsPromptProps {
  visible: boolean;
  driverName?: string;
  onClose: () => void;
  onRatingSubmitted?: (rating: number) => void;
}

/**
 * Post-delivery rating prompt.
 * Shows AFTER a delivery is completed so the customer can rate the ICE CREAM MAN (not themselves).
 * This is triggered from the delivery completion flow, not from the profile screen.
 */
export function RatingsPrompt({ visible, driverName = 'your Ice Cream Man', onClose, onRatingSubmitted }: RatingsPromptProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const handleRating = async (rating: number) => {
    setSelectedRating(rating);

    try {
      // Save rating locally
      const ratings = await AsyncStorage.getItem('driverRatings');
      const ratingsArray = ratings ? JSON.parse(ratings) : [];
      ratingsArray.push({ rating, timestamp: Date.now(), driverName });
      await AsyncStorage.setItem('driverRatings', JSON.stringify(ratingsArray));

      // Increment delivery count for app store review trigger
      const deliveries = await AsyncStorage.getItem('totalDeliveries');
      const count = parseInt(deliveries || '0', 10) + 1;
      await AsyncStorage.setItem('totalDeliveries', count.toString());

      if (onRatingSubmitted) {
        onRatingSubmitted(rating);
      }

      // After a few good ratings, ask for app store review
      if (rating >= 4 && count >= 3 && StoreReview) {
        try {
          if (await StoreReview.isAvailableAsync()) {
            await StoreReview.requestReview();
          }
        } catch (error) {
          // Silently fail
        }
      }

      // Show thank you
      Alert.alert(
        'Thanks for rating! 🍦',
        `You gave ${driverName} ${rating} star${rating > 1 ? 's' : ''}!`,
        [{ text: 'Done', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error saving rating:', error);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl p-8 shadow-2xl">
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-5xl mb-3">🍦🚚</Text>
            <Text className="text-2xl font-bold text-foreground text-center">
              How was {driverName}?
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              Rate your ice cream delivery experience
            </Text>
          </View>

          {/* Star Rating - Large tappable stars */}
          <View className="flex-row justify-center gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => handleRating(star)}
                style={({ pressed }) => [
                  {
                    transform: [{ scale: pressed ? 1.3 : 1 }],
                    opacity: selectedRating > 0 && star > selectedRating ? 0.3 : 1,
                  },
                ]}
              >
                <Text className="text-5xl">
                  {star <= selectedRating ? '⭐' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Rating Labels */}
          <View className="flex-row justify-between mb-6 px-4">
            <Text className="text-xs text-muted">Not great</Text>
            <Text className="text-xs text-muted">Amazing!</Text>
          </View>

          {/* Quick Rating Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={() => handleRating(5)}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-primary rounded-xl p-4">
                <Text className="text-center font-bold text-white text-base">
                  Loved it! 🎉
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="rounded-xl p-3">
                <Text className="text-center text-muted text-sm">Skip</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
