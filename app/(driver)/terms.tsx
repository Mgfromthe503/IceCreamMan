/**
 * Terms of Service Screen
 * 
 * Displays the full Terms of Service, Privacy Policy, and Vendor Agreement
 * for the Ice Cream Man driver registration. Required for Google Play compliance.
 */
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';

const EFFECTIVE_DATE = 'June 29, 2026';
const APP_NAME = 'The Ice Cream Man';

export default function TermsOfServiceScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} className="p-0">
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingRight: 16 }]}
        >
          <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Title */}
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.foreground, marginBottom: 4 }}>
          {APP_NAME} — Terms of Service
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
          Effective Date: {EFFECTIVE_DATE}
        </Text>

        {/* Section 1 */}
        <Section title="1. Acceptance of Terms" colors={colors}>
          By accessing or using The Ice Cream Man mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. These Terms constitute a legally binding agreement between you and The Ice Cream Man ("Company", "we", "us", or "our").
        </Section>

        {/* Section 2 */}
        <Section title="2. Description of Service" colors={colors}>
          The Ice Cream Man is a dual-marketplace mobile application that connects independent ice cream vendors ("Drivers") with customers ("Customers") seeking on-demand ice cream delivery. The App facilitates real-time location sharing, order management, and payment processing between Drivers and Customers.
        </Section>

        {/* Section 3 */}
        <Section title="3. Driver Registration & Payment" colors={colors}>
          To register as a Driver on the platform, you must:{'\n\n'}
          • Complete the Driver registration form with accurate personal and vehicle information{'\n'}
          • Pay a one-time, non-refundable registration fee of $25.00 USD via Google Play Billing{'\n'}
          • Agree to these Terms of Service, Privacy Policy, and Vendor Agreement{'\n'}
          • Maintain a valid driver's license and appropriate vehicle insurance{'\n\n'}
          The registration fee grants you lifetime access to the Driver Dashboard and is processed exclusively through Google Play's billing system. No external payment gateways are used. Refunds are handled through Google Play within 48 hours of purchase per Google Play's refund policy.
        </Section>

        {/* Section 4 */}
        <Section title="4. Location Data & Privacy" colors={colors}>
          This App collects location data to enable real-time tracking for ice cream deliveries even when the app is closed or not in use.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>Customer Location Sharing:</Text> Customers may choose to share their location in one of three ways:{'\n'}
          • Exact GPS coordinates (precise location){'\n'}
          • Street-level address only{'\n'}
          • Custom landmark/meetup point description{'\n\n'}
          <Text style={{ fontWeight: '700' }}>Data Retention:</Text> Customer location data is temporarily cached locally on Driver devices via secure local storage solely for active navigation purposes. This data is automatically and permanently destroyed immediately upon delivery completion. No location data is stored on external servers beyond the active delivery session.{'\n\n'}
          <Text style={{ fontWeight: '700' }}>Driver Location:</Text> Driver location is used to calculate distance to customers, enable navigation, and verify delivery completion within the required 1000-foot proximity radius.
        </Section>

        {/* Section 5 */}
        <Section title="5. Payment & Financial Terms" colors={colors}>
          All in-app purchases and registration fees are processed exclusively through Google Play Billing. We do not collect, store, or process credit card numbers, bank account details, or other financial instruments directly.{'\n\n'}
          • Driver registration: One-time $25.00 USD fee{'\n'}
          • Customer orders: Pricing set by individual Drivers{'\n'}
          • Revenue split: 85% to Driver, 15% platform fee{'\n'}
          • Payouts: Processed through Google Play Console to Driver's linked bank account{'\n\n'}
          All financial transactions are protected by industry-standard encryption (TLS 1.3), fraud detection, and Google Play's built-in purchase verification.
        </Section>

        {/* Section 6 */}
        <Section title="6. User Conduct" colors={colors}>
          You agree not to:{'\n\n'}
          • Use the App for any unlawful purpose{'\n'}
          • Impersonate another person or entity{'\n'}
          • Attempt to gain unauthorized access to other accounts{'\n'}
          • Interfere with or disrupt the App's infrastructure{'\n'}
          • Submit false or misleading information{'\n'}
          • Use automated scripts, bots, or scrapers{'\n'}
          • Engage in price manipulation or fraudulent transactions
        </Section>

        {/* Section 7 */}
        <Section title="7. Intellectual Property" colors={colors}>
          All content, features, and functionality of the App — including but not limited to text, graphics, logos, icons, images, and software — are the exclusive property of The Ice Cream Man and are protected by copyright, trademark, and other intellectual property laws.
        </Section>

        {/* Section 8 */}
        <Section title="8. Limitation of Liability" colors={colors}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE APP.{'\n\n'}
          The Company is not responsible for the quality, safety, or legality of products sold by Drivers through the platform.
        </Section>

        {/* Section 9 */}
        <Section title="9. Termination" colors={colors}>
          We reserve the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Upon termination, your right to use the App will immediately cease. The registration fee is non-refundable upon termination for cause.
        </Section>

        {/* Section 10 */}
        <Section title="10. Modifications to Terms" colors={colors}>
          We reserve the right to modify these Terms at any time. We will notify users of material changes via in-app notification or email. Your continued use of the App after such modifications constitutes acceptance of the updated Terms.
        </Section>

        {/* Section 11 */}
        <Section title="11. Governing Law" colors={colors}>
          These Terms shall be governed by and construed in accordance with the laws of the State of Oregon, United States, without regard to its conflict of law provisions.
        </Section>

        {/* Section 12 */}
        <Section title="12. Contact Information" colors={colors}>
          For questions about these Terms of Service, please contact us at:{'\n\n'}
          Email: support@theicecreamman.app{'\n'}
          Address: Portland, OR 97005, United States
        </Section>

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 24,
            opacity: pressed ? 0.9 : 1,
          }]}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>← Back to Registration</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}
