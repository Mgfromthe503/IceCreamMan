import { View, Text, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '@/lib/location-context';

const SAVED_ADDRESS_KEY = 'customer_saved_home_address';
const SAVED_NICKNAME_KEY = 'customer_address_nickname';

export default function LocationSettingsScreen() {
  const colors = useColors();
  const { userLocation } = useLocation();
  const [savedAddress, setSavedAddress] = useState('');
  const [nickname, setNickname] = useState('Home');
  const [isEditing, setIsEditing] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [inputNickname, setInputNickname] = useState('');

  useEffect(() => {
    loadSavedAddress();
  }, []);

  const loadSavedAddress = async () => {
    try {
      const addr = await AsyncStorage.getItem(SAVED_ADDRESS_KEY);
      const nick = await AsyncStorage.getItem(SAVED_NICKNAME_KEY);
      if (addr) setSavedAddress(addr);
      if (nick) setNickname(nick);
    } catch (e) {
      // silently fail
    }
  };

  const handleSaveAddress = async () => {
    if (!inputAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your address or neighborhood.');
      return;
    }
    try {
      await AsyncStorage.setItem(SAVED_ADDRESS_KEY, inputAddress.trim());
      await AsyncStorage.setItem(SAVED_NICKNAME_KEY, inputNickname.trim() || 'Home');
      setSavedAddress(inputAddress.trim());
      setNickname(inputNickname.trim() || 'Home');
      setIsEditing(false);
      Alert.alert('Saved!', 'Your address has been saved. The ice cream man will come to this location when you order.');
    } catch (e) {
      Alert.alert('Error', 'Could not save address. Please try again.');
    }
  };

  const handleUseCurrentLocation = async () => {
    if (userLocation?.address) {
      setInputAddress(userLocation.address);
    } else if (userLocation) {
      setInputAddress(`${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
    } else {
      Alert.alert('Location Unavailable', 'Enable location services to use your current location.');
    }
  };

  const handleDeleteAddress = async () => {
    Alert.alert(
      'Delete Saved Address?',
      'This will remove your saved home address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(SAVED_ADDRESS_KEY);
            await AsyncStorage.removeItem(SAVED_NICKNAME_KEY);
            setSavedAddress('');
            setNickname('Home');
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, gap: 20 }}>
          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
              📍 Location Settings
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Save your address so the ice cream man knows where to find you
            </Text>
          </View>

          {/* Privacy Notice */}
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#A5D6A7' }}>
            <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '600' }}>
              🔒 Privacy Protected
            </Text>
            <Text style={{ fontSize: 12, color: '#388E3C', marginTop: 4 }}>
              Your exact home address is NEVER shared with drivers. Drivers only see your approximate neighborhood to navigate to your area.
            </Text>
          </View>

          {/* Current Live Location */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>Current Live Location</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
              {userLocation?.address || (userLocation ? `${userLocation.latitude.toFixed(4)}°N, ${Math.abs(userLocation.longitude).toFixed(4)}°W` : 'Location not available')}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
              {userLocation ? '✅ GPS Active' : '❌ Enable location in device settings'}
            </Text>
          </View>

          {/* Saved Home Address */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
              Saved Delivery Address
            </Text>

            {savedAddress && !isEditing ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#FF69B4' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>🏠</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: colors.muted }}>{nickname}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>{savedAddress}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Pressable
                    onPress={() => {
                      setInputAddress(savedAddress);
                      setInputNickname(nickname);
                      setIsEditing(true);
                    }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                  >
                    <View style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 10, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Edit</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={handleDeleteAddress}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                  >
                    <View style={{ backgroundColor: colors.error, borderRadius: 8, padding: 10, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Delete</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Label (e.g., Home, Work)</Text>
                  <TextInput
                    value={inputNickname}
                    onChangeText={setInputNickname}
                    placeholder="Home"
                    placeholderTextColor={colors.muted}
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: colors.foreground,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    returnKeyType="next"
                  />
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Street Address or Neighborhood</Text>
                  <TextInput
                    value={inputAddress}
                    onChangeText={setInputAddress}
                    placeholder="123 Main St, Portland OR"
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: colors.foreground,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 60,
                    }}
                    returnKeyType="done"
                  />
                </View>

                <Pressable
                  onPress={handleUseCurrentLocation}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={{ backgroundColor: '#E3F2FD', borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14 }}>📍</Text>
                    <Text style={{ color: '#1565C0', fontWeight: '600', fontSize: 13 }}>Use Current Location</Text>
                  </View>
                </Pressable>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={handleSaveAddress}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                  >
                    <View style={{ backgroundColor: '#4CAF50', borderRadius: 8, padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Address</Text>
                    </View>
                  </Pressable>
                  {isEditing && (
                    <Pressable
                      onPress={() => setIsEditing(false)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                      </View>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* How It Works */}
          <View style={{ backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#E65100' }}>How Location Works</Text>
            <Text style={{ fontSize: 12, color: '#BF360C' }}>
              • When you order, the driver sees only your neighborhood name{'\n'}
              • Your exact street address stays private{'\n'}
              • The driver navigates to your general area{'\n'}
              • You can meet them at a nearby intersection for extra privacy
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
