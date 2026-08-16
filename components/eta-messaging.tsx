import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const ETA_OPTIONS = [
  { label: "🏃 2 min away!", value: "2 minutes away", emoji: "🏃" },
  { label: "🚚 5 min away!", value: "5 minutes away", emoji: "🚚" },
  { label: "🗺️ 10 min away", value: "10 minutes away", emoji: "🗺️" },
  { label: "👋 On my way!", value: "On my way!", emoji: "👋" },
  { label: "🍦 Almost there!", value: "Almost there!", emoji: "🍦" },
  { label: "📍 At your location!", value: "At your location!", emoji: "📍" },
];

interface ETAMessagingProps {
  onSendETA: (message: string) => void;
  customerName?: string;
  isActive: boolean;
}

export function ETAMessaging({ onSendETA, customerName = "Customer", isActive }: ETAMessagingProps) {
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isActive) return null;

  const handleSendETA = (message: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSendETA(message);
    setSentMessage(message);
    setShowConfirmation(true);
    
    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowConfirmation(false);
      setSentMessage(null);
    }, 3000);
  };

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-3">
        <Text style={{ fontSize: 20 }}>💬</Text>
        <Text className="text-base font-bold text-foreground">
          Send ETA to {customerName}
        </Text>
      </View>

      {/* Confirmation Message */}
      {showConfirmation && (
        <View className="bg-success/20 rounded-xl p-3 mb-3 items-center">
          <Text className="text-success font-bold text-sm">
            ✅ Sent: "{sentMessage}"
          </Text>
          <Text className="text-muted text-xs mt-1">
            {customerName} has been notified!
          </Text>
        </View>
      )}

      {/* ETA Quick Reply Buttons */}
      <View className="flex-row flex-wrap gap-2">
        {ETA_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleSendETA(option.value)}
            className="bg-primary/10 rounded-full px-4 py-2 border border-primary/30"
            style={{ minWidth: '45%' }}
            activeOpacity={0.7}
          >
            <Text className="text-primary font-semibold text-center text-sm">
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tip */}
      <Text className="text-xs text-muted text-center mt-3">
        Tap a button to let the customer know when you'll arrive
      </Text>
    </View>
  );
}

// Component for the customer side to display received ETA messages
interface ETADisplayProps {
  message: string | null;
  driverName?: string;
}

export function ETADisplay({ message, driverName = "Ice Cream Man" }: ETADisplayProps) {
  if (!message) return null;

  return (
    <View className="bg-primary/10 rounded-2xl p-4 border-2 border-primary items-center">
      <Text style={{ fontSize: 24 }}>🚚💨</Text>
      <Text className="text-lg font-bold text-primary mt-2">
        {driverName} says:
      </Text>
      <Text className="text-xl font-bold text-foreground mt-1">
        "{message}"
      </Text>
      <View className="flex-row items-center gap-1 mt-2">
        <Text className="text-xs text-muted">Your ice cream is coming!</Text>
        <Text style={{ fontSize: 14 }}>🍦</Text>
      </View>
    </View>
  );
}
