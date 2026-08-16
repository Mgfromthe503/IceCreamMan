import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FactTicker } from '@/components/fact-ticker';
import { trpc } from '@/lib/trpc';

interface DriverRegistration {
  fullName: string;
  truckName: string;
  truckDescription: string;
  phoneNumber: string;
  areaCode: string;
  truckNumber: string;
}

export default function DriverRegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const paymentStatus = trpc.payment.getPaymentStatus.useQuery(undefined, { retry: 1 });
  const driverProfile = trpc.driver.getProfile.useQuery(undefined, { retry: 1 });
  const createProfile = trpc.driver.createProfile.useMutation();
  const isRegistered = driverProfile.data !== null && driverProfile.data !== undefined;
  const isPaid = paymentStatus.data?.registrationPaid === true;
  const isLoading = paymentStatus.isLoading || driverProfile.isLoading;
  const [form, setForm] = useState<DriverRegistration>({
    fullName: '',
    truckName: '',
    truckDescription: '',
    phoneNumber: '',
    areaCode: '',
    truckNumber: '',
  });

  const handleRegister = async () => {
    // Validate required fields
    if (!form.fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!form.truckName.trim()) {
      Alert.alert('Required', 'Please enter your truck name or business name.');
      return;
    }
    if (!form.phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter your phone number.');
      return;
    }
    if (!form.areaCode.trim() || form.areaCode.length < 3) {
      Alert.alert('Required', 'Please enter a valid area/zip code (3-5 digits).');
      return;
    }

    setIsSaving(true);
    try {
      const profile = await createProfile.mutateAsync({
        vehicleType: form.truckName.trim(),
        licensePlate: form.truckNumber.trim() || undefined,
      });
      await driverProfile.refetch();

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setForm((current) => ({ ...current, truckNumber: current.truckNumber || `ICM-${profile.id}` }));

      Alert.alert(
        "Registration complete",
        "Your vendor profile is now active. Keep your profile details current before accepting customer requests.",
        [{ text: "Start driving", onPress: () => router.replace("/(driver)") }],
      );
    } catch (error) {
      console.error('Error saving registration:', error);
      Alert.alert('Error', 'Failed to save registration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRegistration = () => {
    router.replace("/(driver)/profile");
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // PAYMENT GATE - Must pay $25 before registering
  if (!isPaid) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, gap: 24, justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 60 }}>🔒💳</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
                Payment Required
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 }}>
                Before you can register your truck and start receiving customer requests, you need to complete the one-time $25 registration fee via Google Play.
              </Text>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Why a registration fee?</Text>
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                The $25 one-time fee ensures only serious vendors join the platform. It helps maintain quality service for customers and keeps the app running. You'll never be charged again - no monthly fees, no hidden costs.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(driver)/payment')}
              style={({ pressed }) => [{
                backgroundColor: '#00C853',
                paddingVertical: 18,
                borderRadius: 14,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: '#00C853',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }]}
            >
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>💳 Pay $25 to Register</Text>
              <Text style={{ color: '#fff', fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                One-time fee via Google Play Billing
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Already registered - show profile card with truck number
  if (isRegistered) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, gap: 20 }}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 60 }}>🚚✅</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
                You're Registered!
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                Your truck is active and ready to receive requests
              </Text>
            </View>

            {/* Truck Number Badge */}
            <View
              style={{
                backgroundColor: '#FF1493',
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#FFD700',
                shadowColor: '#FF1493',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 13, color: '#FFF8E7', fontWeight: '600' }}>YOUR TRUCK NUMBER</Text>
              <Text style={{ fontSize: 36, fontWeight: '900', color: '#FFFFFF', marginTop: 4 }}>
                {form.truckNumber}
              </Text>
              <Text style={{ fontSize: 11, color: '#FFF8E7', marginTop: 4 }}>
                Customers see this when you accept their request
              </Text>
            </View>

            {/* Registration Card */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 2, borderColor: colors.success, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 28 }}>👤</Text>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Driver Name</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>{form.fullName}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 28 }}>🚚</Text>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Truck Name</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>{form.truckName}</Text>
                </View>
              </View>

              {form.truckDescription ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Text style={{ fontSize: 28 }}>📝</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.muted }}>Description</Text>
                    <Text style={{ fontSize: 14, color: colors.foreground }}>{form.truckDescription}</Text>
                  </View>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 28 }}>📍</Text>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Coverage Zone</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>{form.areaCode}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 28 }}>📞</Text>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Phone</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground }}>{form.phoneNumber}</Text>
                </View>
              </View>
            </View>

            {/* Payment Status */}
            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#2E7D32' }}>Registration Fee Paid</Text>
                <Text style={{ fontSize: 11, color: '#4CAF50' }}>$25.00 via Google Play • Lifetime access</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={{ backgroundColor: colors.success, borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>🟢 Active & Receiving Requests</Text>
            </View>

            {/* Edit Button */}
            <Pressable
              onPress={handleEditRegistration}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16 }}>
                <Text style={{ color: colors.foreground, fontWeight: '600', textAlign: 'center' }}>✏️ Edit Registration</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Registration Form - after payment is confirmed
  return (
    <ScreenContainer className="p-5">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, gap: 18 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 50 }}>🚚</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
              Register Your Ice Cream Truck
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
              Fill in your details to start receiving customer requests
            </Text>
          </View>

          {/* Payment Confirmed Badge */}
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 18 }}>✅</Text>
            <Text style={{ fontSize: 13, color: '#2E7D32', fontWeight: '600' }}>Payment confirmed - complete your registration below</Text>
          </View>

          {/* Form Fields */}
          <View style={{ gap: 14 }}>
            {/* Full Name */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Your Full Name *</Text>
              <TextInput
                value={form.fullName}
                onChangeText={(text) => setForm({ ...form, fullName: text })}
                placeholder="Enter your full name"
                returnKeyType="next"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Truck Name */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Truck/Business Name *</Text>
              <TextInput
                value={form.truckName}
                onChangeText={(text) => setForm({ ...form, truckName: text })}
                placeholder="e.g. Frosty's Ice Cream, Cool Treats Mobile"
                returnKeyType="next"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Truck Description */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>What Do You Sell?</Text>
              <TextInput
                value={form.truckDescription}
                onChangeText={(text) => setForm({ ...form, truckDescription: text })}
                placeholder="e.g. Ice cream cones, popsicles, sundaes, milkshakes..."
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Phone Number */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Phone Number *</Text>
              <TextInput
                value={form.phoneNumber}
                onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Area/Zip Code */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Your Coverage Area (Zip Code) *</Text>
              <TextInput
                value={form.areaCode}
                onChangeText={(text) => setForm({ ...form, areaCode: text })}
                placeholder="e.g. 97201"
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="done"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.muted}
              />
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                You'll receive requests from customers in this area
              </Text>
            </View>
          </View>

          {/* Fun Facts while you fill in the form */}
          <FactTicker variant="card" />

          {/* Register Button */}
          <Pressable
            onPress={handleRegister}
            disabled={isSaving}
            style={({ pressed }) => [{
              backgroundColor: isSaving ? colors.muted : colors.primary,
              paddingVertical: 18,
              borderRadius: 14,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }]}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
              {isSaving ? '⏳ Registering...' : '🚚 Register & Get My Truck Number'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
