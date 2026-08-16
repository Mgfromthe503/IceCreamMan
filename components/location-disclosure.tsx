/**
 * Prominent In-App Location Disclosure
 * 
 * Required by Google Play Store policy. Must be shown to users BEFORE
 * requesting system location permissions. This satisfies the
 * "Prominent Disclosure" requirement for apps that access location.
 * 
 * Google Play policy reference:
 * https://support.google.com/googleplay/android-developer/answer/9799150
 */

import { View, Text, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISCLOSURE_KEY = 'location_disclosure_accepted';

interface LocationDisclosureProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Shows the Google Play-required prominent disclosure about location usage.
 * Must be displayed BEFORE calling requestForegroundPermissionsAsync().
 */
export function LocationDisclosure({ visible, onAccept, onDecline }: LocationDisclosureProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 }}>
        <View className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-lg">
          {/* Icon */}
          <View className="items-center mb-4">
            <Text style={{ fontSize: 48 }}>📍</Text>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-foreground text-center mb-3">
            Location Access Required
          </Text>

          {/* Disclosure Text - exact wording required by Google Play */}
          <Text className="text-sm text-foreground leading-5 mb-4">
            This app collects location data to enable real-time tracking for ice cream deliveries even when the app is closed or not in use.
          </Text>

          {/* Additional context */}
          <Text className="text-xs text-muted leading-4 mb-5">
            Your location is used to:{'\n'}
            • Show nearby ice cream trucks on the map{'\n'}
            • Allow drivers to navigate to your delivery point{'\n'}
            • Calculate distance for the 1000ft delivery zone{'\n\n'}
            You control what location info is shared with drivers (exact address, street only, or a custom meetup point). Location data is never sold to third parties and is deleted immediately after each delivery is completed.
          </Text>

          {/* Accept Button */}
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View className="bg-primary rounded-xl p-4 mb-3">
              <Text className="text-white font-bold text-center text-base">
                Allow Location Access
              </Text>
            </View>
          </Pressable>

          {/* Decline Button */}
          <Pressable
            onPress={onDecline}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View className="p-3">
              <Text className="text-muted font-medium text-center text-sm">
                Not Now
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Hook to manage the disclosure state.
 * Returns whether disclosure has been previously accepted,
 * and functions to show/accept/decline it.
 */
export function useLocationDisclosure() {
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);

  const checkDisclosure = async (): Promise<boolean> => {
    const accepted = await AsyncStorage.getItem(DISCLOSURE_KEY);
    const result = accepted === 'true';
    setHasAccepted(result);
    return result;
  };

  const acceptDisclosure = async () => {
    await AsyncStorage.setItem(DISCLOSURE_KEY, 'true');
    setHasAccepted(true);
    setShowDisclosure(false);
  };

  const declineDisclosure = () => {
    setShowDisclosure(false);
  };

  const promptDisclosure = () => {
    setShowDisclosure(true);
  };

  return {
    showDisclosure,
    hasAccepted,
    checkDisclosure,
    acceptDisclosure,
    declineDisclosure,
    promptDisclosure,
  };
}
