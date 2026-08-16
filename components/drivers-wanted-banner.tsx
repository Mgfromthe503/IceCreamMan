import { View, Text, Pressable, Animated, Share, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useColors } from '@/hooks/use-colors';
import { APP_BUNDLE_ID } from '@/config/app-identity.js';

interface DriversWantedBannerProps {
  registeredDrivers: number;
  activeCustomers: number;
  show?: boolean;
}

/**
 * Shows a "Drivers Wanted!" banner when there are more customers
 * than available ice cream truck drivers in the area.
 */
export function DriversWantedBanner({ registeredDrivers, activeCustomers, show }: DriversWantedBannerProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = show !== undefined ? show : (activeCustomers > registeredDrivers * 2 || registeredDrivers === 0);

  useEffect(() => {
    if (!shouldShow) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shouldShow]);

  const handleShare = async () => {
    try {
      const storeUrl = `https://play.google.com/store/apps/details?id=${APP_BUNDLE_ID}`;
      const message =
        Platform.OS === 'web'
          ? `Ice Cream Truck Drivers Wanted! Download The Ice Cream Man app and start earning money delivering ice cream to neighborhoods. No more driving around aimlessly - customers come to YOU! Download: ${storeUrl}`
          : `🍦🚚 Ice Cream Truck Drivers Wanted! Download The Ice Cream Man app and start earning money delivering ice cream to neighborhoods. Customers come to YOU! Download: ${storeUrl}`;

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: 'Ice Cream Truck Drivers Wanted!', text: message });
        } else {
          await navigator.clipboard.writeText(message);
          alert('Link copied to clipboard!');
        }
      } else {
        await Share.share({ message, title: 'Ice Cream Truck Drivers Wanted!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!shouldShow || dismissed) return null;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <View
        style={{
          backgroundColor: '#FF6B35',
          borderRadius: 16,
          padding: 16,
          marginHorizontal: 16,
          marginVertical: 8,
          borderWidth: 2,
          borderColor: '#FFD700',
          shadowColor: '#FF6B35',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={{ fontSize: 22 }}>🚚</Text>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' }}>
              ICE CREAM TRUCK{"\n"}DRIVERS WANTED!
            </Text>
          </View>
          <Pressable
            onPress={() => setDismissed(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, paddingLeft: 8 }]}
          >
            <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✕</Text>
          </Pressable>
        </View>

        <Text style={{ color: '#FFF8E7', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
          {registeredDrivers === 0
            ? "There are no ice cream trucks in your area yet! Know someone with an ice cream truck? Tell them about The Ice Cream Man app!"
            : `There are ${activeCustomers} customers waiting but only ${registeredDrivers} driver${registeredDrivers > 1 ? 's' : ''} available. We need more ice cream trucks!`
          }
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>{activeCustomers}</Text>
            <Text style={{ fontSize: 10, color: '#FFF8E7' }}>Customers Waiting</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>{registeredDrivers}</Text>
            <Text style={{ fontSize: 10, color: '#FFF8E7' }}>Drivers Available</Text>
          </View>
        </View>

        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [{
            backgroundColor: pressed ? '#E6A800' : '#FFD700',
            borderRadius: 12,
            padding: 12,
            marginTop: 12,
            alignItems: 'center',
          }]}
        >
          <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
            📢 Share & Recruit
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
