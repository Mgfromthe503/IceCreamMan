import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FactTicker } from '@/components/fact-ticker';

interface DailyReport {
  id: string;
  date: string;
  totalSales: number;
  iceCreamsSold: number;
  milesDriven: number;
  gasCostPerGallon: number;
  hoursDriven: number;
  hourlyRateWithApp: number;
  hourlyRateWithoutApp: number;
  timeSavedPercent: number;
}

export default function DriverEarningsScreen() {
  const colors = useColors();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const stored = await AsyncStorage.getItem('dailyReports');
      if (stored) {
        const parsed = JSON.parse(stored) as DailyReport[];
        // Sort by date, most recent first
        parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setReports(parsed);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate aggregate stats from real reports
  const totalEarnings = reports.reduce((sum, r) => sum + r.totalSales, 0);
  const totalDeliveries = reports.reduce((sum, r) => sum + r.iceCreamsSold, 0);
  const totalMiles = reports.reduce((sum, r) => sum + r.milesDriven, 0);
  const totalHours = reports.reduce((sum, r) => sum + r.hoursDriven, 0);
  const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayReports = reports.filter(r => r.date === today);
  const todayEarnings = todayReports.reduce((sum, r) => sum + r.totalSales, 0);
  const todayDeliveries = todayReports.reduce((sum, r) => sum + r.iceCreamsSold, 0);

  // This week's stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekReports = reports.filter(r => new Date(r.date) >= weekStart);
  const weekEarnings = weekReports.reduce((sum, r) => sum + r.totalSales, 0);
  const weekDeliveries = weekReports.reduce((sum, r) => sum + r.iceCreamsSold, 0);

  if (isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">Loading earnings...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, gap: 18 }}>
          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>
              💰 Earnings
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>
              Your income summary from daily reports
            </Text>
          </View>

          {reports.length === 0 ? (
            /* Empty State */
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 40 }}>
              <Text style={{ fontSize: 60 }}>📊</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
                No earnings data yet
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 }}>
                Complete your first delivery and fill out a Daily Report to see your earnings tracked here!
              </Text>
              <FactTicker variant="card" />
            </View>
          ) : (
            <>
              {/* Total Earnings Card */}
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 24,
                gap: 6,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <Text style={{ fontSize: 13, color: '#fff', opacity: 0.8 }}>Total Earnings</Text>
                <Text style={{ fontSize: 42, fontWeight: '900', color: '#fff' }}>
                  ${totalEarnings.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 13, color: '#fff', opacity: 0.8 }}>
                  {totalDeliveries} ice creams sold • {totalMiles.toFixed(1)} miles driven
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Today</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>
                      ${todayEarnings.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                      {todayDeliveries} sold
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>This Week</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.success }}>
                      ${weekEarnings.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                      {weekDeliveries} sold
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Avg $/Hour</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.warning }}>
                      ${avgHourlyRate.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                      {totalHours.toFixed(1)} hrs total
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>Reports</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.foreground }}>
                      {reports.length}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                      daily summaries
                    </Text>
                  </View>
                </View>
              </View>

              {/* Recent Reports */}
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
                  Recent Reports
                </Text>
                {reports.slice(0, 5).map((report) => (
                  <View
                    key={report.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                          {new Date(report.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                          {report.iceCreamsSold} sold • {report.milesDriven} mi • {report.hoursDriven}h
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.success }}>
                          +${report.totalSales.toFixed(2)}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.primary }}>
                          ${report.hourlyRateWithApp.toFixed(2)}/hr
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Fun fact at bottom */}
              <FactTicker variant="banner" />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
