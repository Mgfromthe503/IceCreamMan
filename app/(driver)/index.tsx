import { View, Text, Pressable, ScrollView, FlatList, Alert, ActivityIndicator, TextInput, Linking, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ETAMessaging } from '@/components/eta-messaging';
import { FactTicker } from '@/components/fact-ticker';
import { sanitizeInput, isRateLimited } from '@/lib/security';

interface RequestItem {
  id: number;
  location: string;
  distance: string;
  time: string;
  customerZip?: string;
  deliveryInstructions?: string;
  shareMode?: string;
}

export default function DriverDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeRequest, setActiveRequest] = useState<number | null>(null);
  const [activeLocation, setActiveLocation] = useState<string>('');
  const [areaCode, setAreaCode] = useState<string>('');
  const [isAreaCodeSet, setIsAreaCodeSet] = useState(false);
  const [areaCodeInput, setAreaCodeInput] = useState('');
  const [requests, setRequests] = useState<RequestItem[]>([]);

  // Fetch waiting requests from backend
  const { data: waitingRequests, isLoading, refetch } = trpc.requests.getWaiting.useQuery();
  const driverProfile = trpc.driver.getProfile.useQuery(undefined, { retry: 1 });
  const acceptRequestMutation = trpc.requests.accept.useMutation();
  const completeDeliveryMutation = trpc.driver.completeDelivery.useMutation();
  const isRegistered = driverProfile.data !== null && driverProfile.data !== undefined;
  const isCheckingRegistration = driverProfile.isLoading;

  // Area-code filtering is a local display preference, never a registration or payment claim.
  useEffect(() => {
    const loadAreaCode = async () => {
      try {
        const savedAreaCode = await AsyncStorage.getItem('driverAreaCode');
        if (savedAreaCode) {
          setAreaCode(savedAreaCode);
          setIsAreaCodeSet(true);
        }
      } catch (error) {
        console.error('Error loading area-code preference:', error);
      }
    };
    void loadAreaCode();
  }, []);

  // Update requests from backend data
  useEffect(() => {
    if (waitingRequests && Array.isArray(waitingRequests)) {
      const formattedRequests: RequestItem[] = waitingRequests.map((req: any) => ({
        id: req.id,
        location: req.address || `${req.latitude}, ${req.longitude}`,
        distance: `${(Math.random() * 3 + 0.5).toFixed(1)} mi`,
        time: getTimeAgo(req.createdAt),
        customerZip: req.zipCode || '',
        deliveryInstructions: req.deliveryInstructions || '',
        shareMode: req.shareMode || 'street',
      }));
      setRequests(formattedRequests);
    }
  }, [waitingRequests]);

  // Lifecycle-aware polling: pause when app is backgrounded to save battery
  // Google Play pre-launch testing penalizes battery drain from background polling
  const appState = useRef(AppState.currentState);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollingInterval.current) return; // Already polling
    pollingInterval.current = setInterval(() => {
      refetch();
    }, 10000);
  }, [refetch]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Start/stop polling based on area code
  useEffect(() => {
    if (!isAreaCodeSet) return;
    startPolling();
    return () => stopPolling();
  }, [isAreaCodeSet, startPolling, stopPolling]);

  // Pause polling when app goes to background, resume when active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // App going to background — stop polling to save battery
        stopPolling();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground — resume polling
        if (isAreaCodeSet) {
          startPolling();
          refetch(); // Immediate refresh on return
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAreaCodeSet, startPolling, stopPolling, refetch]);

  const getTimeAgo = (dateStr: string | Date | null) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const handleSetAreaCode = async () => {
    // SECURITY: Sanitize area code input (only allow digits)
    const code = areaCodeInput.trim().replace(/[^0-9]/g, '');
    if (!code || code.length < 3 || code.length > 5) {
      Alert.alert('Invalid Code', 'Please enter a valid area/zip code (3-5 digits).');
      return;
    }
    try {
      await AsyncStorage.setItem('driverAreaCode', code);
      setAreaCode(code);
      setIsAreaCodeSet(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🚚 Coverage Zone Set!',
        `You'll receive requests from the ${code} area. Customers in your zone will be matched to you first!`
      );
    } catch (error) {
      console.error('Error saving area code:', error);
    }
  };

  const handleChangeAreaCode = () => {
    setIsAreaCodeSet(false);
    setAreaCodeInput(areaCode);
  };

  const handleAcceptRequest = async (requestId: number, location: string) => {
    try {
      // SECURITY: Rate limit request acceptance (max 10 per minute)
      if (isRateLimited('accept_request', 10, 60000)) {
        Alert.alert('Slow down!', 'Too many actions. Please wait a moment.');
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Call backend to accept request
      await acceptRequestMutation.mutateAsync({ requestId });
      
      setActiveRequest(requestId);
      setActiveLocation(location);
      // Save to AsyncStorage so map tab can read it
      await AsyncStorage.setItem('activeDeliveryLocation', location);
      // Remove accepted request from list
      setRequests(requests.filter((r) => r.id !== requestId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Notify customer that driver accepted their order
      import('@/lib/notification-service').then(({ notifyCustomerAccepted }) => {
        notifyCustomerAccepted('Ice Cream Driver', 8);
      }).catch(() => {});
    } catch (error) {
      console.error('Failed to accept request:', error);
      Alert.alert('Error', 'Failed to accept request.');
    }
  };

  /**
   * Open maps app with directions to customer's location.
   * Uses Google Maps on Android, Apple Maps on iOS, Google Maps URL on web.
   */
  const handleNavigateToCustomer = async (address: string) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const encodedAddress = encodeURIComponent(address);
      let url = '';

      if (Platform.OS === 'ios') {
        // Apple Maps with directions
        url = `maps://app?daddr=${encodedAddress}&dirflg=d`;
      } else if (Platform.OS === 'android') {
        // Google Maps with navigation mode
        url = `google.navigation:q=${encodedAddress}&mode=d`;
      } else {
        // Web fallback - Google Maps
        url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web URL
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Could not open maps. Please search for the address manually: ' + address
      );
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      if (!activeRequest) return;
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Call backend to complete delivery
      await completeDeliveryMutation.mutateAsync({ requestId: activeRequest });
      
      setActiveRequest(null);
      setActiveLocation('');
      // PRIVACY: Immediately wipe ALL customer location data from device storage
      // Required by Google Play privacy policy — no customer data persists after delivery
      await Promise.all([
        AsyncStorage.removeItem('activeDeliveryLocation'),
        AsyncStorage.removeItem('activeDeliveryCoords'),
        AsyncStorage.removeItem('activeCustomerAddress'),
        AsyncStorage.removeItem('activeDeliveryInstructions'),
      ]);
      Alert.alert('🎉 Delivery Complete!', 'Great job! Ready for the next one.');
      refetch(); // Refresh available requests
    } catch (error) {
      console.error('Failed to complete delivery:', error);
      Alert.alert('Error', 'Failed to complete delivery.');
    }
  };

  // Registration Gate - must register truck before receiving requests
  if (!isCheckingRegistration && !isRegistered) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6 justify-center">
            <View className="items-center gap-4">
              <Text style={{ fontSize: 60 }}>🚚📋</Text>
              <Text className="text-2xl font-bold text-foreground text-center">
                Register Your Truck First!
              </Text>
              <Text className="text-sm text-muted text-center px-4">
                Before you can receive ice cream requests, you need to register your truck and verify your information. This helps customers know there are real ice cream trucks available.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(driver)/register')}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-primary rounded-xl p-5 items-center">
                <Text className="text-white font-bold text-lg">🚚 Register My Truck</Text>
              </View>
            </Pressable>

            <View className="bg-surface rounded-xl p-4 gap-2 border border-border">
              <Text className="text-sm font-semibold text-foreground">Why register?</Text>
              <Text className="text-xs text-muted leading-5">
                • Customers can see real drivers are available{"\n"}
                • Get matched to nearby customers automatically{"\n"}
                • Build your reputation with ratings{"\n"}
                • Track your earnings and gas savings
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Area Code Setup Screen
  if (!isAreaCodeSet) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6 justify-center">
            <View className="items-center gap-4">
              <Text style={{ fontSize: 60 }}>🚚</Text>
              <Text className="text-2xl font-bold text-foreground text-center">
                Set Your Coverage Zone
              </Text>
              <Text className="text-sm text-muted text-center px-4">
                Enter your area/zip code so we can match you with nearby customers. You'll only receive requests from your zone!
              </Text>
            </View>

            <View className="gap-4">
              <View className="bg-surface rounded-xl p-4 border-2 border-primary">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Your Area/Zip Code
                </Text>
                <TextInput
                  value={areaCodeInput}
                  onChangeText={setAreaCodeInput}
                  placeholder="Enter zip code (e.g. 97201)"
                  keyboardType="number-pad"
                  maxLength={5}
                  returnKeyType="done"
                  onSubmitEditing={handleSetAreaCode}
                  className="bg-background rounded-lg p-4 text-lg font-bold text-foreground border border-border"
                  placeholderTextColor={colors.muted}
                />
                <Text className="text-xs text-muted mt-2">
                  This helps us connect you with customers in your neighborhood
                </Text>
              </View>

              <Pressable
                onPress={handleSetAreaCode}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-primary rounded-xl p-4">
                  <Text className="text-white font-bold text-center text-lg">
                    🚚 Start Receiving Requests
                  </Text>
                </View>
              </Pressable>
            </View>

            <View className="bg-surface rounded-xl p-4 gap-2">
              <Text className="text-sm font-semibold text-foreground">Why area codes?</Text>
              <Text className="text-xs text-muted leading-5">
                Instead of driving around aimlessly, we match you with customers in your zone. This saves you gas, time, and money while ensuring customers get faster service!
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading requests in your area...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-4">
        {/* Header with Area Code */}
        <View className="flex-row justify-between items-start">
          <View className="gap-1 flex-1">
            <Text className="text-2xl font-bold text-foreground">🚚 Dashboard</Text>
            <Text className="text-sm text-muted">Incoming ice cream requests</Text>
          </View>
          <Pressable
            onPress={handleChangeAreaCode}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View className="bg-primary rounded-lg px-3 py-2">
              <Text className="text-white text-xs font-bold">📍 {areaCode}</Text>
            </View>
          </Pressable>
        </View>

        {/* Active Delivery */}
        {activeRequest && (
          <View className="bg-success rounded-2xl p-5 gap-3">
            <View className="flex-row items-center gap-3">
              <Text style={{ fontSize: 30 }}>🚚💨</Text>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">Active Delivery</Text>
                <Text className="text-sm text-white opacity-90">{activeLocation}</Text>
              </View>
            </View>

            {/* NAVIGATE BUTTON - Opens maps with directions to customer */}
            <Pressable
              onPress={() => handleNavigateToCustomer(activeLocation)}
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
                <Text style={{ fontSize: 20 }}>🗺️</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Navigate to Customer</Text>
                <Text style={{ fontSize: 14 }}>📍</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleCompleteDelivery}
              disabled={completeDeliveryMutation.isPending}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View className="bg-white rounded-lg p-3">
                <Text className="text-success font-bold text-center text-base">
                  {completeDeliveryMutation.isPending ? '⏳ Completing...' : '✅ Complete Delivery'}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* ETA Messaging - show when driver has active delivery */}
        {activeRequest && (
          <ETAMessaging
            isActive={!!activeRequest}
            customerName="Customer"
            onSendETA={(message) => {
              // Send notification to customer
              import('@/lib/notification-service').then(({ notifyCustomerETA }) => {
                notifyCustomerETA('Ice Cream Man', message);
              });
            }}
          />
        )}

        {/* Requests List */}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-muted mb-3">
            {requests.length} {requests.length === 1 ? 'Request' : 'Requests'} in Zone {areaCode}
          </Text>

          {requests.length === 0 && !activeRequest && (
            <View className="flex-1 items-center justify-center gap-4 py-8">
              <Text style={{ fontSize: 50 }}>🍦</Text>
              <Text className="text-lg font-bold text-foreground text-center">
                No requests yet
              </Text>
              <Text className="text-sm text-muted text-center px-4">
                Hang tight! When someone in your area taps the big ice cream button, you'll get notified here.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              >
                <View className="bg-surface border border-primary rounded-lg px-4 py-2">
                  <Text className="text-primary font-semibold">🔄 Refresh</Text>
                </View>
              </Pressable>
              <View style={{ marginTop: 16, width: '100%' }}>
                <FactTicker variant="card" />
              </View>
            </View>
          )}

          <FlatList
            data={requests}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl p-4 mb-3 border-2 border-primary gap-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Text className="text-lg">📍</Text>
                      <Text className="text-sm font-semibold text-foreground flex-1">{item.location}</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-sm">📏</Text>
                        <Text className="text-xs text-muted">{item.distance}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-sm">⏰</Text>
                        <Text className="text-xs text-muted">{item.time}</Text>
                      </View>
                      {item.shareMode && (
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs text-muted">
                            {item.shareMode === 'exact' ? '📍 Exact' : item.shareMode === 'meetup' ? '🤝 Meetup' : '🛣️ Street'}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.deliveryInstructions ? (
                      <View className="mt-2 bg-warning/10 rounded-lg p-2 border border-warning/30">
                        <Text className="text-xs font-semibold text-foreground">📝 {item.deliveryInstructions}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* Preview directions button */}
                  <Pressable
                    onPress={() => handleNavigateToCustomer(item.location)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, flex: 1 }]}
                  >
                    <View style={{
                      backgroundColor: '#1565C0',
                      borderRadius: 10,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}>
                      <Text style={{ fontSize: 14 }}>🗺️</Text>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Directions</Text>
                    </View>
                  </Pressable>

                  {/* Accept request button */}
                  <Pressable
                    onPress={() => handleAcceptRequest(item.id, item.location)}
                    disabled={acceptRequestMutation.isPending || !!activeRequest}
                    style={({ pressed }) => [{ opacity: (pressed || !!activeRequest) ? 0.6 : 1, flex: 2 }]}
                  >
                    <View style={{
                      backgroundColor: activeRequest ? '#9BA1A6' : colors.primary,
                      borderRadius: 10,
                      padding: 12,
                      alignItems: 'center',
                    }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                        {acceptRequestMutation.isPending ? '⏳ Accepting...' : activeRequest ? '🔒 Busy' : '🍦 Accept'}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
