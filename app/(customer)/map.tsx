import { View, Text, ScrollView, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useLocation } from '@/lib/location-context';
import { CandyMap } from '@/components/candy-map';

export default function CustomerMapScreen() {
  const { userLocation, driverLocation, isLoadingLocation, locationError, retryLocation } = useLocation();

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Live Map</Text>
            <Text className="text-sm text-muted">Track your ice cream truck in real-time</Text>
          </View>

          {/* Location Status Banner */}
          {locationError && (
            <Pressable onPress={retryLocation} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <View className="bg-error rounded-xl p-3 flex-row items-center gap-2">
                <Text className="text-white text-sm flex-1">{locationError}</Text>
                <Text className="text-white font-bold text-sm">Retry →</Text>
              </View>
            </Pressable>
          )}

          {isLoadingLocation && (
            <View className="bg-warning rounded-xl p-3 flex-row items-center gap-2">
              <Text className="text-lg">⏳</Text>
              <Text className="text-foreground text-sm">Finding your location...</Text>
            </View>
          )}

          {/* Candy Land Map */}
          <CandyMap showDriver={true} showCustomer={true} />

          {/* Real Location Info Card */}
          <View className="bg-surface rounded-xl p-4 gap-3 border border-border">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">📍</Text>
              <View className="flex-1">
                <Text className="text-xs text-muted">Your Location</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {userLocation?.address || 'Detecting location...'}
                </Text>
                {userLocation && (
                  <Text className="text-xs text-muted mt-1">
                    {userLocation.latitude.toFixed(4)}°N, {Math.abs(userLocation.longitude).toFixed(4)}°W
                    {userLocation.accuracy ? ` (±${Math.round(userLocation.accuracy)}m)` : ''}
                  </Text>
                )}
              </View>
              {userLocation && <Text className="text-lg">✅</Text>}
            </View>

            <View className="h-px bg-border" />

            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">🚚</Text>
              <View className="flex-1">
                <Text className="text-xs text-muted">Ice Cream Truck</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {driverLocation ? 'On the way to you!' : 'No active driver nearby'}
                </Text>
                {driverLocation && (
                  <Text className="text-xs text-success mt-1">
                    Last updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* GPS Info */}
          {userLocation && (
            <View className="bg-surface rounded-xl p-3 border border-border">
              <Text className="text-xs text-muted text-center">
                🛰️ GPS Signal: {userLocation.accuracy && userLocation.accuracy < 50 ? 'Strong' : userLocation.accuracy && userLocation.accuracy < 100 ? 'Good' : 'Weak'}
                {' | '}Updates every 5 seconds
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
