import { View, Text, Pressable, ScrollView, Alert, Animated, Easing, Modal, TextInput, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useLocation } from '@/lib/location-context';
import { RatingsPrompt } from '@/components/ratings-prompt';
import { SummoningAnimation } from '@/components/summoning-animation';
import { DriversWantedBanner } from '@/components/drivers-wanted-banner';
import { ETADisplay } from '@/components/eta-messaging';
import { useAudioPlayer } from 'expo-audio';
import { FactTicker } from '@/components/fact-ticker';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isWithinSafetyZone, calculateDistance, formatDistance } from '@/lib/gps-safety';
import { sanitizeInput, sanitizeAddress, isRateLimited, validateCoordinates } from '@/lib/security';

// Short jingle snippet for arrival notification
const arrivalJingleSource = require('../../assets/ice-cream-jingle-short.mp3');

export default function CustomerHomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { userLocation, isLoadingLocation, locationError } = useLocation();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'summoning' | 'searching' | 'accepted' | 'nearby' | 'arrived' | 'completed'>('idle');
  const [driverCheckpoint, setDriverCheckpoint] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);

  // Arrival jingle - plays once when driver arrives
  const arrivalPlayer = useAudioPlayer(arrivalJingleSource);
  const arrivalPlayedRef = useRef(false);
  const [driverName, setDriverName] = useState('your Ice Cream Man');
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceToCustomer, setDistanceToCustomer] = useState<number | null>(null);
  const createRequestMutation = trpc.requests.create.useMutation();

  // Delivery instructions
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [shareMode, setShareMode] = useState<'exact' | 'street' | 'meetup'>('street');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Pulsing glow animation for the big button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (requestStatus !== 'idle') return;
    // Continuous pulse to draw attention
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    glow.start();
    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [requestStatus]);

  const handleBigIceCreamPress = async () => {
    try {
      // Prevent multiple presses while already summoning (prevents jingle stacking)
      if (requestStatus !== 'idle') return;

      if (!userLocation) {
        Alert.alert(
          'Location Needed 📍',
          'We need your location to send an ice cream truck to you! Please enable location services.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Show delivery options modal
      setShowDeliveryOptions(true);
    } catch (error) {
      console.error('Order error:', error);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      const location = userLocation;
      if (!location) {
        Alert.alert('Location needed', 'Please enable location services so we can send an ice cream truck to you.');
        setShowDeliveryOptions(false);
        return;
      }
      // SECURITY: Rate limit order placement (max 3 per minute)
      if (isRateLimited('place_order', 3, 60000)) {
        Alert.alert('Hold on! 🍦', 'You\'re ordering too fast. Please wait a moment and try again.');
        return;
      }

      // SECURITY: Validate coordinates to prevent GPS spoofing
      if (!validateCoordinates(location.latitude, location.longitude)) {
        Alert.alert('Location Error', 'Invalid location detected. Please enable GPS and try again.');
        return;
      }

      setShowDeliveryOptions(false);
      setRequestStatus('summoning');

      // Build address based on share mode
      let sharedAddress = location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      if (shareMode === 'street') {
        // Only share street name, not house number
        const parts = sharedAddress.split(',');
        const streetPart = parts[0]?.replace(/^\d+[-\s]*/, '').trim() || sharedAddress;
        sharedAddress = streetPart + (parts.length > 1 ? ',' + parts.slice(1).join(',') : '');
      } else if (shareMode === 'meetup') {
        // Use the delivery instructions as the address
        sharedAddress = deliveryInstructions || sharedAddress;
      }

      // SECURITY: Sanitize all user inputs before sending to server
      const sanitizedAddress = sanitizeAddress(sharedAddress);
      const sanitizedInstructions = deliveryInstructions ? sanitizeInput(deliveryInstructions) : undefined;

      // Call backend API to create request
      await createRequestMutation.mutateAsync({
        latitude: location.latitude,
        longitude: location.longitude,
        address: sanitizedAddress,
        shareMode,
        deliveryInstructions: sanitizedInstructions,
      });

      // Notify nearby drivers of new request
      import('@/lib/notification-service').then(({ notifyDriverNewRequest }) => {
        notifyDriverNewRequest(
          location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
          'New order nearby'
        );
      }).catch(() => {});

      // Move to searching phase after 3 seconds
      setTimeout(() => {
        setRequestStatus('searching');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 3000);

      // Simulate driver acceptance after 8 seconds
      setTimeout(() => {
        setRequestStatus('accepted');
        setEstimatedTime(8);
        setDriverName('Ice Cream Mike');
        setDriverCheckpoint('🚚 On the way to your neighborhood!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Notify customer that driver accepted
        import('@/lib/notification-service').then(({ notifyCustomerAccepted }) => {
          notifyCustomerAccepted('Ice Cream Mike', 8);
        }).catch(() => {});
      }, 8000);

      // Simulate driver nearby after 15 seconds
      setTimeout(() => {
        setRequestStatus('nearby');
        setEstimatedTime(2);
        setDriverCheckpoint('📍 Almost there! About 2 minutes away');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 15000);

      // Simulate arrival after 20 seconds
      setTimeout(() => {
        setRequestStatus('arrived');
        setEstimatedTime(null);
        setDriverCheckpoint('🎉 Your Ice Cream Man has ARRIVED!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Play arrival jingle once
        if (arrivalPlayer && !arrivalPlayedRef.current) {
          arrivalPlayedRef.current = true;
          try {
            arrivalPlayer.volume = 0.6;
            arrivalPlayer.seekTo(0);
            arrivalPlayer.play();
          } catch (e) {
            console.log('Arrival jingle not available:', e);
          }
        }
      }, 20000);
    } catch (error) {
      console.error('Failed to send request:', error);
      setRequestStatus('idle');
      Alert.alert('Oops! 🍦', 'Failed to summon the ice cream man. Please try again!');
    }
  };

  const handleDeliveryComplete = () => {
    setRequestStatus('completed');
    setShowRating(true);
  };

  const handleCancelRequest = () => {
    setRequestStatus('idle');
    setEstimatedTime(null);
    arrivalPlayedRef.current = false; // Reset for next order
  };

  const handleRatingClose = () => {
    setShowRating(false);
    setRequestStatus('idle');
    arrivalPlayedRef.current = false; // Reset for next order
  };

  const getLocationDisplay = () => {
    if (isLoadingLocation) return 'Finding your location...';
    if (locationError) return 'Location unavailable - tap to retry';
    if (userLocation?.address) return userLocation.address;
    if (userLocation) return `${userLocation.latitude.toFixed(4)}°N, ${Math.abs(userLocation.longitude).toFixed(4)}°W`;
    return 'Enable location to order';
  };

  const isSummoning = requestStatus === 'summoning' || requestStatus === 'searching';

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 gap-4 justify-between">
          {/* Header - App Icon Logo */}
          <View className="gap-1 items-center mb-2">
            <ExpoImage
              source={require('@/assets/images/icon.png')}
              style={{ width: 80, height: 80, borderRadius: 16 }}
              contentFit="cover"
            />
            <Text className="text-xs text-muted font-medium">One tap. Ice cream delivered.</Text>
          </View>

          {/* Drivers Wanted Banner - shows when no drivers available */}
          {requestStatus === 'idle' && (
            <DriversWantedBanner registeredDrivers={0} activeCustomers={5} />
          )}

          {/* Location Status */}
          <View className="bg-surface rounded-lg p-3 flex-row items-center gap-3 border border-border">
            <Text className="text-lg">📍</Text>
            <View className="flex-1">
              <Text className="text-xs text-muted font-medium">Your Location</Text>
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {getLocationDisplay()}
              </Text>
            </View>
            {userLocation && !isLoadingLocation && <Text className="text-lg">✅</Text>}
            {isLoadingLocation && <Text className="text-lg">⏳</Text>}
          </View>

          {/* Summoning Animation - Shows during waiting */}
          {isSummoning && (
            <SummoningAnimation
              isActive={isSummoning}
              phase={requestStatus === 'summoning' ? 'summoning' : 'searching'}
            />
          )}

          {/* Driver Accepted / Arrived Status */}
          {requestStatus === 'accepted' && (
            <View className="bg-surface rounded-xl p-5 border border-border shadow-sm">
              <View className="items-center gap-3">
                <Text style={{ fontSize: 48 }}>🚚</Text>
                <Text className="text-lg font-bold text-foreground text-center">
                  {driverName} is on the way!
                </Text>
                {estimatedTime && (
                  <View className="bg-primary rounded-full px-6 py-2">
                    <Text className="text-white font-bold text-base">
                      {estimatedTime} min
                    </Text>
                  </View>
                )}
                {/* ETA Message from Driver */}
                <ETADisplay message={estimatedTime ? `${estimatedTime} minutes away` : null} driverName={driverName} />
                <Pressable
                  onPress={() => router.push('/(customer)/map')}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <View className="bg-primary rounded-lg px-4 py-2 mt-2">
                    <Text className="text-white font-semibold text-sm">🗺️ Track on Map</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleCancelRequest}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text className="text-error text-xs font-medium mt-2">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Driver Nearby - Almost There */}
          {requestStatus === 'nearby' && (
            <View className="bg-surface rounded-xl p-5 border border-border shadow-sm">
              <View className="items-center gap-3">
                <Text style={{ fontSize: 48 }}>🚚</Text>
                <Text className="text-lg font-bold text-foreground text-center">
                  {driverName} is almost here!
                </Text>
                <View className="bg-warning rounded-full px-6 py-2">
                  <Text className="text-white font-bold text-base">
                    ~2 min
                  </Text>
                </View>
                <Text className="text-sm text-muted text-center">
                  Head outside and look for the truck!
                </Text>
                <Pressable
                  onPress={handleCancelRequest}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text className="text-error text-xs font-medium mt-2">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Driver Checkpoint Banner */}
          {driverCheckpoint && (requestStatus === 'accepted' || requestStatus === 'nearby') && (
            <View className="bg-success bg-opacity-10 rounded-lg p-3 border border-success border-opacity-30">
              <Text className="text-xs text-success font-semibold">{driverCheckpoint}</Text>
            </View>
          )}

          {requestStatus === 'arrived' && (
            <View className="bg-surface rounded-xl p-5 border border-border shadow-sm">
              <View className="items-center gap-3">
                <Text style={{ fontSize: 56 }}>🎉🍦</Text>
                <Text className="text-xl font-bold text-foreground text-center">
                  Your Ice Cream Man is HERE!
                </Text>
                <Text className="text-sm text-muted text-center">
                  Go grab your ice cream!
                </Text>
                <Pressable
                  onPress={handleDeliveryComplete}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                >
                  <View className="bg-success rounded-lg px-8 py-3 mt-2">
                    <Text className="text-white font-bold text-base text-center">
                      Got My Ice Cream!
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {/* BIG ICE CREAM ORDER BUTTON - Only show when idle */}
          {requestStatus === 'idle' && (
            <View className="flex-1 justify-center items-center py-2">
              {/* Outer glow ring */}
              <Animated.View
                style={{
                  opacity: glowAnim,
                  position: 'absolute',
                  width: 300,
                  height: 300,
                  borderRadius: 150,
                  backgroundColor: '#FF69B4',
                }}
              />
              {/* Main button */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                  onPress={handleBigIceCreamPress}
                  disabled={createRequestMutation.isPending || !userLocation}
                  style={({ pressed }) => [
                    {
                      opacity: !userLocation ? 0.4 : pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 260,
                      height: 260,
                      borderRadius: 130,
                      backgroundColor: '#FF1493',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 8,
                      borderColor: '#FF69B4',
                      shadowColor: '#FF1493',
                      shadowOffset: { width: 0, height: 10 },
                      shadowOpacity: 0.5,
                      shadowRadius: 20,
                      elevation: 15,
                    }}
                  >
                    <Text style={{ fontSize: 90 }}>🍦</Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '900',
                        color: 'white',
                        marginTop: 4,
                        textAlign: 'center',
                      }}
                    >
                      TAP TO ORDER!
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>

              {/* Call to action text */}
              <View className="mt-4 items-center">
                <Text className="text-lg font-bold text-foreground text-center">
                  Summon the Ice Cream Man
                </Text>
                {!userLocation && (
                  <Text className="text-xs text-error text-center mt-2 font-medium">
                    📍 Enable location to order
                  </Text>
                )}
                {userLocation && (
                  <Text className="text-xs text-muted text-center mt-2">
                    One tap brings the truck to your neighborhood
                  </Text>
                )}
              </View>

              {/* Fun Facts Ticker - rotates every 4 seconds */}
              <View style={{ marginTop: 16 }}>
                <FactTicker variant="card" />
              </View>
            </View>
          )}

          {/* Cancel button during summoning */}
          {isSummoning && (
            <Pressable
              onPress={handleCancelRequest}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-error rounded-xl p-4">
                <Text className="text-white font-bold text-center">Cancel Request</Text>
              </View>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Rating prompt - shows AFTER delivery to rate the ICE CREAM MAN */}
      <RatingsPrompt
        visible={showRating}
        driverName={driverName}
        onClose={handleRatingClose}
        onRatingSubmitted={(_rating) => {
        }}
      />

      {/* Delivery Options Modal */}
      <Modal
        visible={showDeliveryOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeliveryOptions(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <Text className="text-xl font-bold text-foreground text-center mb-1">Delivery Details</Text>
            <Text className="text-sm text-muted text-center mb-5">How should the driver find you?</Text>

            {/* Share Mode Options */}
            <View className="gap-3 mb-5">
              <TouchableOpacity
                onPress={() => setShareMode('exact')}
                className={`p-4 rounded-xl border ${shareMode === 'exact' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
              >
                <Text className="text-base font-bold text-foreground">📍 Share My Exact Address</Text>
                <Text className="text-xs text-muted mt-1">Driver gets your full address for door-to-door delivery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShareMode('street')}
                className={`p-4 rounded-xl border ${shareMode === 'street' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
              >
                <Text className="text-base font-bold text-foreground">🛣️ Street Name Only</Text>
                <Text className="text-xs text-muted mt-1">Driver drives down your street — listen for the jingle!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShareMode('meetup')}
                className={`p-4 rounded-xl border ${shareMode === 'meetup' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
              >
                <Text className="text-base font-bold text-foreground">🤝 Meet at a Spot</Text>
                <Text className="text-xs text-muted mt-1">Pick a meetup point (stop sign, school, park, etc.)</Text>
              </TouchableOpacity>
            </View>

            {/* Special Instructions */}
            <Text className="text-sm font-semibold text-foreground mb-2">Special Instructions (optional)</Text>
            <TextInput
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              placeholder={shareMode === 'meetup' ? 'e.g. Meet at the stop sign on Oak St' : 'e.g. Blue house, extra sprinkles please!'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
              returnKeyType="done"
              className="bg-surface border border-border rounded-xl p-4 text-foreground text-sm mb-5"
              style={{ minHeight: 60, textAlignVertical: 'top' }}
            />

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirmOrder}
              className="bg-primary rounded-xl p-4 mb-3"
            >
              <Text className="text-white font-bold text-center text-lg">🍦 Send My Order!</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => setShowDeliveryOptions(false)}
              className="p-3"
            >
              <Text className="text-muted font-medium text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
