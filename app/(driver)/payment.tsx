import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { FactTicker } from "@/components/fact-ticker";
import { trpc } from "@/lib/trpc";
import {
  endBillingConnection,
  finishVerifiedRegistrationPurchase,
  getExistingRegistrationPurchase,
  initializeBilling,
  purchaseRegistration,
  VENDOR_REGISTRATION_PRODUCT_ID,
} from "@/lib/billing";

export default function VendorPaymentScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [billingReady, setBillingReady] = useState(false);
  const [paid, setPaid] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const paymentStatus = trpc.payment.getPaymentStatus.useQuery(undefined, { retry: 1 });
  const verifyRegistration = trpc.payment.verifyRegistration.useMutation();
  const checkingPurchase = paymentStatus.isLoading;

  useEffect(() => {
    void initializeBilling().then(setBillingReady);
    return () => {
      void endBillingConnection();
    };
  }, []);

  useEffect(() => {
    if (!paymentStatus.isLoading) {
      setPaid(paymentStatus.data?.registrationPaid === true);
    }
  }, [paymentStatus.data?.registrationPaid, paymentStatus.isLoading]);

  const verifyPurchaseToken = async (purchaseToken: string) => {
    await verifyRegistration.mutateAsync({
      productId: VENDOR_REGISTRATION_PRODUCT_ID,
      purchaseToken,
    });
    await finishVerifiedRegistrationPurchase(purchaseToken);
    await paymentStatus.refetch();
    setPaid(true);
  };

  const handlePayment = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const result = await purchaseRegistration();
      if (result.success && result.purchaseToken) {
        await verifyPurchaseToken(result.purchaseToken);
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(
          "Payment verified",
          "Google Play confirmed your registration. You can now register your truck details.",
          [{ text: "Register my truck", onPress: () => router.push("/(driver)/register") }],
        );
      } else if (result.error !== "Cancelled") {
        Alert.alert("Payment failed", result.error || "Something went wrong. Please try again.");
      }
    } catch (error: any) {
      console.error('[Payment] Error:', error);
      Alert.alert('Payment Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchase = async () => {
    setLoading(true);
    try {
      const purchase = await getExistingRegistrationPurchase();
      if (!purchase.success || !purchase.purchaseToken) {
        Alert.alert("No purchase found", purchase.error || "We could not find a previous purchase on this Google account.");
        return;
      }
      await verifyPurchaseToken(purchase.purchaseToken);
      Alert.alert("Purchase restored", "Google Play confirmed your registration.");
    } catch (error) {
      console.error("[Payment] Restore verification failed", error);
      Alert.alert("Restore failed", "We could not verify this purchase. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingPurchase) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Checking payment status...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (paid) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Text style={{ fontSize: 80 }}>🎉</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
              You're All Set!
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
              Your vendor registration is paid and active. Start receiving ice cream requests!
            </Text>

            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', gap: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>What's Included:</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ Unlimited customer request alerts</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ Real-time GPS navigation to customers</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ Daily earnings & savings reports</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ Gas savings calculator</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ Customer ratings & reviews</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ Hourly rate comparison (with vs without app)</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>✅ No monthly fees, EVER</Text>
            </View>

            <Pressable
              onPress={() => router.push('/(driver)/register')}
              style={({ pressed }) => [{
                backgroundColor: colors.primary,
                paddingVertical: 18,
                paddingHorizontal: 32,
                borderRadius: 14,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }]}
            >
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>🚚 Register My Truck</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // PAYMENT SCREEN - Show before registration
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, gap: 20 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 56 }}>🍦🚚</Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.foreground, textAlign: 'center' }}>
              Become an Ice Cream Man
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
              One-time registration fee to start earning
            </Text>
          </View>

          {/* Price Card */}
          <LinearGradient
            colors={['#FF1493', '#FF69B4', '#C71585']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 28,
              alignItems: 'center',
              shadowColor: '#FF1493',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ color: '#FFF8E7', fontSize: 14, fontWeight: '600' }}>ONE-TIME FEE</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 52, fontWeight: '900', marginVertical: 8 }}>$25</Text>
            <Text style={{ color: '#FFF8E7', fontSize: 14 }}>Lifetime access • No monthly fees • No hidden charges</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                💳 Processed securely via Google Play
              </Text>
            </View>
          </LinearGradient>

          {/* How Payment Works */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
              💰 How Payment Works
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
              Your $25 registration fee is processed through Google Play Billing - the same secure system used for all Google Play purchases. This is a one-time payment with no recurring charges.
            </Text>
            <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 12, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                ✅ Charged once, never again{'\n'}
                ✅ Processed by Google Play (secure){'\n'}
                ✅ Refund available within 48 hours via Google Play{'\n'}
                ✅ No subscription, no hidden fees
              </Text>
            </View>
          </View>

          {/* Benefits */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
              🎁 What You Get For $25
            </Text>

            {[
              { icon: '⛽', title: 'Save on Gas', desc: 'Customers come to YOU. No more driving aimlessly burning fuel.' },
              { icon: '⏰', title: 'Save Time', desc: 'Average vendors save 2+ hours daily. More selling, less searching.' },
              { icon: '📊', title: 'Daily Reports', desc: 'See your $/hour with app vs without. Track gas & time saved.' },
              { icon: '📍', title: 'Smart Matching', desc: 'Get matched to customers in YOUR zip code automatically.' },
              { icon: '💰', title: 'Earn More', desc: 'Vendors report 200% improvement in hourly earnings.' },
              { icon: '⭐', title: 'Build Reputation', desc: 'Customer ratings help you stand out and get more requests.' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>{item.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Terms Acceptance — REQUIRED before payment (Google Play compliance) */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12, borderWidth: termsAccepted ? 1 : 2, borderColor: termsAccepted ? colors.border : colors.warning }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => {
                  setTermsAccepted(!termsAccepted);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={({ pressed }) => [{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: termsAccepted ? '#00C853' : colors.primary,
                  backgroundColor: termsAccepted ? '#00C853' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                {termsAccepted && <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>✓</Text>}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                  I accept the Terms of Service
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                  I have read and agree to the Terms of Service, Privacy Policy, and Vendor Agreement.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/(driver)/terms')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>
                Read full Terms of Service →
              </Text>
            </Pressable>
            {!termsAccepted && (
              <Text style={{ color: colors.warning, fontSize: 11, fontStyle: 'italic' }}>
                You must accept the Terms of Service before proceeding with payment.
              </Text>
            )}
          </View>

          {/* Payment Button */}
          <Pressable
            onPress={handlePayment}
            disabled={loading || !termsAccepted}
            style={({ pressed }) => [{
              backgroundColor: loading ? colors.muted : '#00C853',
              paddingVertical: 20,
              borderRadius: 16,
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
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ActivityIndicator color="white" />
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Processing...</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>💳 Pay $25 & Start Earning</Text>
                <Text style={{ color: '#fff', fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                  Secure payment via Google Play Billing
                </Text>
              </View>
            )}
          </Pressable>

          {/* Restore Purchase */}
          <Pressable
            onPress={handleRestorePurchase}
            disabled={loading}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              Already paid? Restore Purchase
            </Text>
          </Pressable>

          {/* Fun Facts while you decide */}
          <FactTicker variant="card" />

          {/* Legal */}
          <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 20 }}>
            By proceeding, you agree to our Terms of Service and Privacy Policy.
            Payment is processed securely through Google Play Billing.
            This is a one-time, non-recurring fee of $25.00 USD.
            Refunds are handled through Google Play within 48 hours of purchase.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
