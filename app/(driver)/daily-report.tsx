import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Share, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default constants (user can override gas price)
const DEFAULT_GAS_PRICE = 3.50;
const VEHICLE_MPG = 15; // Average ice cream truck MPG
const AVERAGE_SPEED_MPH = 25; // Average speed in neighborhoods

interface DailyReport {
  date: string;
  totalOrders: number;
  totalSales: number;
  milesDriven: number;
  hoursDriven: number;
  gasPricePerGallon: number;
  gasSavings: {
    milesWithoutApp: number;
    milesWithApp: number;
    milesSaved: number;
    gallonsSaved: number;
    moneySaved: number;
    gasUsedToday: number;
    gasCostToday: number;
  };
  timeSavings: {
    hoursWithoutApp: number;
    hoursWithApp: number;
    hoursSaved: number;
  };
  hourlyRate: {
    withApp: number;
    withoutApp: number;
    improvement: number;
    improvementPercent: number;
  };
}

export default function DailyReportScreen() {
  const colors = useColors();
  const [salesInput, setSalesInput] = useState('');
  const [ordersInput, setOrdersInput] = useState('');
  const [milesInput, setMilesInput] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [gasPriceInput, setGasPriceInput] = useState('');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const calculateReport = async () => {
    const totalSales = parseFloat(salesInput) || 0;
    const totalOrders = parseInt(ordersInput) || 0;
    const milesDriven = parseFloat(milesInput) || 0;
    const hoursDriven = parseFloat(hoursInput) || 0;
    const gasPricePerGallon = parseFloat(gasPriceInput) || DEFAULT_GAS_PRICE;

    if (totalSales === 0 && totalOrders === 0) {
      Alert.alert('Enter Your Data', 'Please enter at least your sales and orders for today.');
      return;
    }

    if (hoursDriven === 0) {
      Alert.alert('Hours Required', 'Please enter how many hours you drove today so we can calculate your hourly rate.');
      return;
    }

    if (milesDriven < 0 || hoursDriven < 0 || gasPricePerGallon < 0) {
      Alert.alert('Invalid Input', 'Please enter positive numbers only. Miles, hours, and gas price cannot be negative.');
      return;
    }

    // Without app: estimate driver would drive 3x more to find customers randomly
    const milesWithoutApp = milesDriven * 3;
    const milesSaved = milesWithoutApp - milesDriven;
    const gallonsSaved = milesSaved / VEHICLE_MPG;
    const moneySaved = gallonsSaved * gasPricePerGallon;

    // Gas used today
    const gasUsedToday = milesDriven / VEHICLE_MPG;
    const gasCostToday = gasUsedToday * gasPricePerGallon;

    // Time savings: without app you'd drive 3x the miles at avg speed
    const hoursWithoutApp = milesWithoutApp / AVERAGE_SPEED_MPH;
    const hoursWithApp = hoursDriven;
    const hoursSaved = hoursWithoutApp - hoursWithApp;

    // Hourly rate comparison - the key metric
    const hourlyRateWithApp = hoursDriven > 0 ? totalSales / hoursDriven : 0;
    // Without app: same sales would take 3x longer (more driving, less selling)
    const hoursWithoutAppForSameSales = hoursDriven * 3;
    const hourlyRateWithoutApp = hoursWithoutAppForSameSales > 0 ? totalSales / hoursWithoutAppForSameSales : 0;
    const improvement = hourlyRateWithApp - hourlyRateWithoutApp;
    const improvementPercent = hourlyRateWithoutApp > 0 ? ((improvement / hourlyRateWithoutApp) * 100) : 0;

    const newReport: DailyReport = {
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalOrders,
      totalSales,
      milesDriven,
      hoursDriven,
      gasPricePerGallon,
      gasSavings: {
        milesWithoutApp: Math.round(milesWithoutApp * 10) / 10,
        milesWithApp: milesDriven,
        milesSaved: Math.round(milesSaved * 10) / 10,
        gallonsSaved: Math.round(gallonsSaved * 10) / 10,
        moneySaved: Math.round(moneySaved * 100) / 100,
        gasUsedToday: Math.round(gasUsedToday * 10) / 10,
        gasCostToday: Math.round(gasCostToday * 100) / 100,
      },
      timeSavings: {
        hoursWithoutApp: Math.round(hoursWithoutApp * 10) / 10,
        hoursWithApp: Math.round(hoursWithApp * 10) / 10,
        hoursSaved: Math.round(hoursSaved * 10) / 10,
      },
      hourlyRate: {
        withApp: Math.round(hourlyRateWithApp * 100) / 100,
        withoutApp: Math.round(hourlyRateWithoutApp * 100) / 100,
        improvement: Math.round(improvement * 100) / 100,
        improvementPercent: Math.round(improvementPercent),
      },
    };

    setReport(newReport);
    setSubmitted(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Save to AsyncStorage for earnings screen to read
    try {
      const stored = await AsyncStorage.getItem('dailyReports');
      const existing = stored ? JSON.parse(stored) : [];
      existing.push({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        totalSales: newReport.totalSales,
        iceCreamsSold: newReport.totalOrders,
        milesDriven: newReport.milesDriven,
        gasCostPerGallon: newReport.gasPricePerGallon,
        hoursDriven: newReport.hoursDriven,
        hourlyRateWithApp: newReport.hourlyRate.withApp,
        hourlyRateWithoutApp: newReport.hourlyRate.withoutApp,
        timeSavedPercent: newReport.hourlyRate.improvementPercent,
      });
      await AsyncStorage.setItem('dailyReports', JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save report:', e);
    }
  };

  const handleShareReport = async () => {
    if (!report) return;
    const message = `🍦 Ice Cream Man Daily Report\n📅 ${report.date}\n\n💰 Sales: $${report.totalSales.toFixed(2)} (${report.totalOrders} orders)\n⏱️ Hours: ${report.hoursDriven}h\n💵 Hourly Rate: $${report.hourlyRate.withApp}/hr\n\n📈 With the app I'm making $${report.hourlyRate.improvement.toFixed(2)}/hr MORE than without it!\n⛽ Gas Saved: $${report.gasSavings.moneySaved.toFixed(2)}\n🕐 Time Saved: ${report.timeSavings.hoursSaved} hours\n\n#IceCreamMan #SideHustle`;
    try {
      await Share.share({ message });
    } catch (e) {
      // Ignore share errors
    }
  };

  if (submitted && report) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 16 }}>
            {/* Header */}
            <View style={{ alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Text style={{ fontSize: 36 }}>📊</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
                Daily Summary
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{report.date}</Text>
            </View>

            {/* HOURLY RATE COMPARISON - The Star Feature */}
            <View style={{ backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#FFD700' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFD700', textAlign: 'center', marginBottom: 12 }}>
                💵 YOUR HOURLY RATE
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#aaa' }}>Without App</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#FF6B6B' }}>
                    ${report.hourlyRate.withoutApp.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#888' }}>/hour</Text>
                </View>
                <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 20, color: '#FFD700' }}>→</Text>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#aaa' }}>With App</Text>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#00FF88' }}>
                    ${report.hourlyRate.withApp.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#888' }}>/hour</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#2a2a4e', borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#FFD700', fontWeight: '600' }}>
                  You're making {report.hourlyRate.improvementPercent}% MORE per hour!
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#00FF88', marginTop: 4 }}>
                  +${report.hourlyRate.improvement.toFixed(2)}/hr
                </Text>
                <Text style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  because customers come to YOU instead of you searching for them
                </Text>
              </View>
            </View>

            {/* Sales Summary */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 12 }}>💰 Sales Summary</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Total Sales</Text>
                <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 18 }}>
                  ${report.totalSales.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Orders Completed</Text>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>{report.totalOrders}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Avg Per Order</Text>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>
                  ${report.totalOrders > 0 ? (report.totalSales / report.totalOrders).toFixed(2) : '0.00'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Hours Worked</Text>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>{report.hoursDriven}h</Text>
              </View>
            </View>

            {/* Gas Savings */}
            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32', marginBottom: 12 }}>
                ⛽ Gas Savings (at ${report.gasPricePerGallon.toFixed(2)}/gal)
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#4CAF50', fontSize: 13 }}>Miles driven today</Text>
                <Text style={{ fontWeight: '700', color: '#2E7D32' }}>{report.milesDriven} mi</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#4CAF50', fontSize: 13 }}>Gas used today</Text>
                <Text style={{ fontWeight: '700', color: '#2E7D32' }}>{report.gasSavings.gasUsedToday} gal (${report.gasSavings.gasCostToday.toFixed(2)})</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#4CAF50', fontSize: 13 }}>Miles without app (est.)</Text>
                <Text style={{ fontWeight: '700', color: '#2E7D32' }}>{report.gasSavings.milesWithoutApp} mi</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#4CAF50', fontSize: 13 }}>Miles saved</Text>
                <Text style={{ fontWeight: '700', color: '#2E7D32' }}>{report.gasSavings.milesSaved} mi</Text>
              </View>
              <View style={{ backgroundColor: '#C8E6C9', borderRadius: 12, padding: 14, marginTop: 8, alignItems: 'center' }}>
                <Text style={{ color: '#1B5E20', fontSize: 13 }}>Gas Money Saved Today</Text>
                <Text style={{ color: '#1B5E20', fontSize: 28, fontWeight: '900' }}>
                  ${report.gasSavings.moneySaved.toFixed(2)}
                </Text>
                <Text style={{ color: '#2E7D32', fontSize: 11 }}>
                  ({report.gasSavings.gallonsSaved} gallons you didn't burn!)
                </Text>
              </View>
            </View>

            {/* Time Savings */}
            <View style={{ backgroundColor: '#E3F2FD', borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1565C0', marginBottom: 12 }}>
                ⏰ Time Savings
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#42A5F5', fontSize: 13 }}>Time driving today</Text>
                <Text style={{ fontWeight: '700', color: '#1565C0' }}>{report.timeSavings.hoursWithApp} hrs</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#42A5F5', fontSize: 13 }}>Time without app (est.)</Text>
                <Text style={{ fontWeight: '700', color: '#1565C0' }}>{report.timeSavings.hoursWithoutApp} hrs</Text>
              </View>
              <View style={{ backgroundColor: '#BBDEFB', borderRadius: 12, padding: 14, marginTop: 8, alignItems: 'center' }}>
                <Text style={{ color: '#0D47A1', fontSize: 13 }}>Time Saved Today</Text>
                <Text style={{ color: '#0D47A1', fontSize: 28, fontWeight: '900' }}>
                  {report.timeSavings.hoursSaved} hrs
                </Text>
                <Text style={{ color: '#1565C0', fontSize: 11 }}>
                  of aimless driving you avoided!
                </Text>
              </View>
            </View>

            {/* Bottom Line Summary */}
            <View style={{ backgroundColor: '#FFF3E0', borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#E65100', marginBottom: 8 }}>
                📋 Bottom Line
              </Text>
              <Text style={{ color: '#F57C00', fontSize: 13, lineHeight: 20 }}>
                Today you made ${report.totalSales.toFixed(2)} in {report.hoursDriven} hours = ${report.hourlyRate.withApp.toFixed(2)}/hr.
                Without the app, that same income would have taken ~{(report.hoursDriven * 3).toFixed(1)} hours of driving around,
                meaning only ${report.hourlyRate.withoutApp.toFixed(2)}/hr. The Ice Cream Man app saved you{' '}
                ${report.gasSavings.moneySaved.toFixed(2)} in gas and {report.timeSavings.hoursSaved} hours of your day.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleShareReport}
                style={({ pressed }) => [{
                  backgroundColor: '#25D366',
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1,
                }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>📤 Share My Report</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setSubmitted(false);
                  setReport(null);
                  setSalesInput('');
                  setOrdersInput('');
                  setMilesInput('');
                  setHoursInput('');
                  setGasPriceInput('');
                }}
                style={({ pressed }) => [{
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1,
                }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Generate New Report</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // INPUT FORM
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, gap: 20 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 44 }}>📊</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
              End of Day Report
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
              Enter your daily numbers to see how much more you're making per hour with the app
            </Text>
          </View>

          {/* Input Form */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 16 }}>
            {/* Sales */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                💰 Total Ice Cream Sales ($)
              </Text>
              <TextInput
                value={salesInput}
                onChangeText={setSalesInput}
                placeholder="e.g. 350.00"
                keyboardType="decimal-pad"
                returnKeyType="done"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Orders */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                🍦 Number of Orders Completed
              </Text>
              <TextInput
                value={ordersInput}
                onChangeText={setOrdersInput}
                placeholder="e.g. 45"
                keyboardType="number-pad"
                returnKeyType="done"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Miles Driven */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                🚚 Miles Driven Today
              </Text>
              <TextInput
                value={milesInput}
                onChangeText={setMilesInput}
                placeholder="e.g. 25"
                keyboardType="decimal-pad"
                returnKeyType="done"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Hours Driven */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                ⏱️ Hours Driven Today
              </Text>
              <TextInput
                value={hoursInput}
                onChangeText={setHoursInput}
                placeholder="e.g. 6"
                keyboardType="decimal-pad"
                returnKeyType="done"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                Used to calculate your $/hour rate with vs without the app
              </Text>
            </View>

            {/* Gas Price */}
            <View>
              <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 6, fontSize: 14 }}>
                ⛽ Gas Price Per Gallon ($)
              </Text>
              <TextInput
                value={gasPriceInput}
                onChangeText={setGasPriceInput}
                placeholder={`e.g. ${DEFAULT_GAS_PRICE.toFixed(2)} (today's price)`}
                keyboardType="decimal-pad"
                returnKeyType="done"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.foreground,
                }}
                placeholderTextColor={colors.muted}
              />
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                Enter today's gas price for accurate savings calculation (defaults to ${DEFAULT_GAS_PRICE.toFixed(2)})
              </Text>
            </View>
          </View>

          {/* Calculate Button */}
          <Pressable
            onPress={calculateReport}
            style={({ pressed }) => [{
              backgroundColor: '#FF1493',
              paddingVertical: 20,
              borderRadius: 16,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: '#FF1493',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }]}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>📊 Generate My Report</Text>
            <Text style={{ color: '#fff', fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              See your $/hour with app vs without
            </Text>
          </Pressable>

          {/* Info text */}
          <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
            The report compares your actual hourly earnings to what they would be without the app
            (driving 3x more miles to find customers randomly). Gas savings are calculated using
            your inputted gas price.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
