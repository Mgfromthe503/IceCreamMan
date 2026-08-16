import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FactTicker } from '@/components/fact-ticker';
import { Image as ExpoImage } from 'expo-image';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setUserRole } = useAuth();

  const handleRoleSelect = async (role: 'customer' | 'driver') => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await setUserRole(role);
      if (role === 'customer') {
        router.replace('/(customer)');
      } else {
        router.replace('/(driver)');
      }
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#FFF8DC', '#FFE4E1', '#FFB6D9', '#FF69B4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScreenContainer containerClassName="bg-transparent" className="p-5">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
            <View style={{ flex: 1, gap: 20, justifyContent: 'center' }}>
              {/* App Icon Logo - same as Play Store icon */}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <ExpoImage
                  source={require('@/assets/images/icon.png')}
                  style={{ width: 140, height: 140, borderRadius: 28 }}
                  contentFit="cover"
                />
                <Text style={{ fontSize: 14, color: '#A0826D', textAlign: 'center', marginTop: 6 }}>
                  Choose your role to get started
                </Text>
              </View>

              {/* Customer Card */}
              <Pressable
                onPress={() => handleRoleSelect('customer')}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }]}
              >
                <LinearGradient
                  colors={['#FF69B4', '#FF1493', '#C71585']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 24,
                    shadowColor: '#FF1493',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <ExpoImage
                      source={require('@/assets/images/customer-character.png')}
                      style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' }}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>
                        Customer
                      </Text>
                      <Text style={{ fontSize: 13, color: '#FFE4E1', lineHeight: 18 }}>
                        Order ice cream to your neighborhood with one tap. Track the truck in real-time.
                      </Text>
                      <View style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        alignSelf: 'flex-start',
                        marginTop: 4,
                      }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                          Tap to Order Ice Cream →
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Driver Card */}
              <Pressable
                onPress={() => handleRoleSelect('driver')}
                style={({ pressed }) => [{
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                }]}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 24,
                    padding: 24,
                    shadowColor: '#FF8C00',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <ExpoImage
                      source={require('@/assets/images/driver-character.png')}
                      style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' }}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>
                        Ice Cream Vendor
                      </Text>
                      <Text style={{ fontSize: 13, color: '#FFF8E7', lineHeight: 18 }}>
                        Receive customer requests and earn money. Get alerts for neighborhoods requesting service.
                      </Text>
                      <View style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        alignSelf: 'flex-start',
                        marginTop: 4,
                      }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                          Start Earning Money →
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Fun Facts Ticker */}
              <FactTicker variant="banner" />

              {/* Footer tagline */}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, color: '#A0826D', textAlign: 'center' }}>
                  Sweetly yours, ❤️ -Mindy Gaines
                </Text>
                <Pressable
                  onPress={() => router.push('/login')}
                  style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
                >
                  <Text style={{ fontSize: 11, color: '#C4A882' }}>
                    v1.0.0
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </ScreenContainer>
      </LinearGradient>
    </View>
  );
}
