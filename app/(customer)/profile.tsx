import { View, Text, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from '@/lib/location-context';
import { useRouter } from 'expo-router';
import { ShareButton } from '@/components/share-button';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_BUNDLE_ID } from '@/config/app-identity.js';

export default function CustomerProfileScreen() {
  const colors = useColors();
  const { logout } = useAuth();
  const { userLocation } = useLocation();
  const router = useRouter();
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const deliveries = await AsyncStorage.getItem('totalDeliveries');
        setTotalOrders(parseInt(deliveries || '0', 10));
      } catch {
        // Silently fail
      }
    };
    loadStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/role-select');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openPlayStore = () => {
    const marketUrl = `market://details?id=${APP_BUNDLE_ID}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${APP_BUNDLE_ID}`;
    Linking.openURL(Platform.OS === 'android' ? marketUrl : webUrl).catch(() => {
      Linking.openURL(webUrl);
    });
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 gap-5">
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">Profile</Text>
            <Text className="text-xs text-muted font-medium">Your account settings</Text>
          </View>

          <View className="bg-surface rounded-lg p-5 border border-border">
            <View className="items-center gap-3">
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-3xl">🍦</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">Ice Cream Lover</Text>
                <Text className="text-xs text-muted">Customer</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-lg p-4 items-center border border-border">
              <Text className="text-2xl font-bold text-primary">{totalOrders}</Text>
              <Text className="text-xs text-muted text-center mt-1">Orders</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-4 items-center border border-border">
              <Text className="text-lg">📍</Text>
              <Text className="text-xs text-muted text-center mt-1">
                {userLocation ? 'Active' : 'Off'}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-base font-semibold text-foreground">Share with Friends</Text>
            <ShareButton variant="primary" size="medium" showLabel={true} />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Enjoying the App?</Text>
            <Pressable
              onPress={openPlayStore}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-warning rounded-lg p-4 items-center border border-border">
                <Text className="text-2xl">⭐</Text>
                <Text className="font-semibold text-sm text-foreground mt-2">Rate Us on Google Play</Text>
                <Text className="text-xs text-muted mt-1">Help us grow</Text>
              </View>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Settings</Text>

            <Pressable
              onPress={() => router.push('/(customer)/notifications')}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-surface rounded-lg p-3 flex-row items-center justify-between border border-border">
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">🔔</Text>
                  <Text className="font-semibold text-sm text-foreground">Notifications</Text>
                </View>
                <Text className="text-muted text-sm">→</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(customer)/location-settings')}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-surface rounded-lg p-3 flex-row items-center justify-between border border-border">
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">📍</Text>
                  <Text className="font-semibold text-sm text-foreground">Location Settings</Text>
                </View>
                <Text className="text-muted text-sm">→</Text>
              </View>
            </Pressable>
          </View>

          <View className="flex-1 justify-end gap-3">
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <View className="bg-error rounded-lg p-3">
                <Text className="text-white font-semibold text-center text-sm">Logout</Text>
              </View>
            </Pressable>
            <Text className="text-xs text-muted text-center">v1.0.1 · The Ice Cream Man</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
