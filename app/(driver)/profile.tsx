import { View, Text, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FactTicker } from '@/components/fact-ticker';
import { APP_BUNDLE_ID } from '@/config/app-identity.js';

interface DriverInfo {
  fullName: string;
  truckName: string;
  truckDescription: string;
  phoneNumber: string;
  areaCode: string;
  truckNumber: string;
}

export default function DriverProfileScreen() {
  const colors = useColors();
  const { logout } = useAuth();
  const router = useRouter();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);

  useEffect(() => {
    loadDriverInfo();
  }, []);

  const loadDriverInfo = async () => {
    try {
      const stored = await AsyncStorage.getItem('driverRegistration');
      if (stored) {
        setDriverInfo(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load driver info:', e);
    }
  };

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
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, gap: 18 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>
              👤 Profile
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>Your vendor account</Text>
          </View>

          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
            borderWidth: 2,
            borderColor: colors.primary,
            alignItems: 'center',
            gap: 12,
          }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 36 }}>🚚</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.foreground }}>
                {driverInfo?.fullName || 'Ice Cream Vendor'}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                {driverInfo?.truckName || 'My Ice Cream Truck'}
              </Text>
              {driverInfo?.truckNumber && (
                <View style={{
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginTop: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                    Truck #{driverInfo.truckNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            gap: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
              Truck Details
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Truck Name</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                {driverInfo?.truckName || 'Not set'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Coverage Area</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                {driverInfo?.areaCode || 'Not set'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Phone</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                {driverInfo?.phoneNumber || 'Not set'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Status</Text>
              <View style={{ backgroundColor: colors.success, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Online</Text>
              </View>
            </View>
            {driverInfo?.truckDescription ? (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View>
                  <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>Description</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
                    {driverInfo.truckDescription}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => router.push('/(driver)/daily-report')}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>📊</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>Daily Reports</Text>
                </View>
                <Text style={{ color: colors.muted }}>→</Text>
              </View>
            </Pressable>

            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>🔔</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>Notifications</Text>
                </View>
                <Text style={{ color: colors.muted }}>→</Text>
              </View>
            </Pressable>
          </View>

          <FactTicker variant="banner" />

          <Pressable
            onPress={openPlayStore}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={{ backgroundColor: '#FFD700', borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>⭐</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#333', marginTop: 4 }}>Rate Us on Google Play</Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Help us grow - leave a review!</Text>
            </View>
          </Pressable>

          <View style={{ marginTop: 'auto' }}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [{
                backgroundColor: colors.error,
                borderRadius: 12,
                padding: 16,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }]}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                Logout
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
