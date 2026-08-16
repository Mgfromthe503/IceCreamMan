import { View, Text, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_PREFS_KEY = 'customer_notification_prefs';

interface NotifPrefs {
  orderConfirmed: boolean;
  driverOnWay: boolean;
  driverNearby: boolean;
  driverArrived: boolean;

}

const DEFAULT_PREFS: NotifPrefs = {
  orderConfirmed: true,
  driverOnWay: true,
  driverNearby: true,
  driverArrived: true,

};

export default function NotificationsScreen() {
  const colors = useColors();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      if (saved) setPrefs(JSON.parse(saved));
    } catch (e) {
      // use defaults
    }
  };

  const togglePref = async (key: keyof NotifPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
  };

  const NotifToggle = ({ label, description, value, onToggle, emoji }: {
    label: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    emoji: string;
  }) => (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: value ? '#4CAF50' : colors.border,
      }}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>{label}</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{description}</Text>
        </View>
        <View style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor: value ? '#4CAF50' : '#ccc',
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <View style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#fff',
            alignSelf: value ? 'flex-end' : 'flex-start',
          }} />
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, gap: 20 }}>
          {/* Header */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
              🔔 Notifications
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Choose which updates you receive during delivery
            </Text>
          </View>

          {/* Driver Status Checkpoints */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
              Driver Status Updates
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              Get notified at each step of your delivery
            </Text>

            <NotifToggle
              emoji="✅"
              label="Order Confirmed"
              description="When a driver accepts your ice cream request"
              value={prefs.orderConfirmed}
              onToggle={() => togglePref('orderConfirmed')}
            />
            <NotifToggle
              emoji="🚚"
              label="Driver On the Way"
              description="When the driver starts heading to your neighborhood"
              value={prefs.driverOnWay}
              onToggle={() => togglePref('driverOnWay')}
            />
            <NotifToggle
              emoji="📍"
              label="Driver Nearby (2 min away)"
              description="When the driver is almost at your location"
              value={prefs.driverNearby}
              onToggle={() => togglePref('driverNearby')}
            />
            <NotifToggle
              emoji="🎉"
              label="Driver Arrived"
              description="When the ice cream truck is at your spot"
              value={prefs.driverArrived}
              onToggle={() => togglePref('driverArrived')}
            />
          </View>

          {/* How Checkpoints Work */}
          <View style={{ backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1565C0' }}>
              How Driver Checkpoints Work
            </Text>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>1</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#1565C0', flex: 1 }}>You tap to summon ice cream</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF9800', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>2</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#1565C0', flex: 1 }}>Driver accepts → you get "On the Way" alert</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#2196F3', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>3</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#1565C0', flex: 1 }}>Driver gets close → you get "Almost There" alert</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>4</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#1565C0', flex: 1 }}>Driver arrives → jingle plays + "HERE!" alert</Text>
              </View>
            </View>
          </View>

          {/* Other Notifications */}


          {/* Note */}
          <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 11, color: '#F57F17', textAlign: 'center' }}>
              Push notifications require device permission. If notifications aren't working, check your device Settings → Apps → The Ice Cream Man → Notifications.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
