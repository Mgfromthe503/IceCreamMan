import { View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { CandyMap } from '@/components/candy-map';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FactTicker } from '@/components/fact-ticker';
import * as Haptics from 'expo-haptics';

export default function DriverMapScreen() {
  const colors = useColors();
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  useEffect(() => {
    // Load active delivery location from AsyncStorage (set by dashboard when accepting)
    const loadActiveDelivery = async () => {
      try {
        const location = await AsyncStorage.getItem('activeDeliveryLocation');
        setActiveLocation(location);
      } catch (e) {
        console.error('Failed to load active delivery:', e);
      }
    };
    loadActiveDelivery();

    // Poll for updates every 3 seconds
    const interval = setInterval(loadActiveDelivery, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenMaps = async () => {
    if (!activeLocation) return;
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const encodedAddress = encodeURIComponent(activeLocation);
      let url = '';
      if (Platform.OS === 'ios') {
        url = `maps://app?daddr=${encodedAddress}&dirflg=d`;
      } else if (Platform.OS === 'android') {
        url = `google.navigation:q=${encodedAddress}&mode=d`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      }
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`);
      }
    } catch (e) {
      console.error('Failed to open maps:', e);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, gap: 18 }}>
          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>
              🗺️ Navigation
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {activeLocation ? 'Route to customer location' : 'Accept a delivery to see navigation'}
            </Text>
          </View>

          {/* Map Visualization */}
          <CandyMap showDriver={true} showCustomer={!!activeLocation} />

          {activeLocation ? (
            <>
              {/* Active Delivery Info */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                gap: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>Customer Location</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                      {activeLocation}
                    </Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <Pressable
                  onPress={handleOpenMaps}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={{
                    backgroundColor: '#1565C0',
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                    <Text style={{ fontSize: 18 }}>🧭</Text>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                      Open in Maps App
                    </Text>
                  </View>
                </Pressable>
              </View>
            </>
          ) : (
            /* No Active Delivery */
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 50 }}>🚚</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
                No Active Delivery
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 }}>
                Accept a delivery request from the Dashboard tab to see navigation directions here.
              </Text>
            </View>
          )}

          {/* Fun Facts */}
          <FactTicker variant="banner" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
