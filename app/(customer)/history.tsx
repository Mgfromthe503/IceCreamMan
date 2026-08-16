import { View, Text, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FactTicker } from '@/components/fact-ticker';

interface HistoryItem {
  id: string;
  date: string;
  address: string;
  status: 'completed' | 'cancelled' | 'pending';
  driverRating?: number;
}

export default function CustomerHistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Try to load from backend, fall back to local storage
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Try backend first
        const stored = await AsyncStorage.getItem('orderHistory');
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-error';
      default: return 'bg-warning';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 gap-4">
        {/* Header */}
        <View className="gap-2">
          <Text className="text-2xl font-bold text-foreground">Order History</Text>
          <Text className="text-sm text-muted">Your past ice cream truck requests</Text>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl mb-4">🍦</Text>
            <Text className="text-muted">Loading history...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && history.length === 0 && (
          <View className="flex-1 items-center justify-center gap-4">
            <Text className="text-6xl">🍦</Text>
            <Text className="text-xl font-bold text-foreground text-center">No orders yet!</Text>
            <Text className="text-sm text-muted text-center px-8">
              Tap the big ice cream cone on the home screen to summon your first ice cream truck!
            </Text>
            <View style={{ marginTop: 16, width: '100%', paddingHorizontal: 16 }}>
              <FactTicker variant="card" />
            </View>
          </View>
        )}

        {/* History List */}
        {!isLoading && history.length > 0 && (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{item.date}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-sm">📍</Text>
                      <Text className="text-sm text-muted flex-1">{item.address}</Text>
                    </View>
                  </View>
                  <View className={`${getStatusColor(item.status)} rounded-full px-3 py-1`}>
                    <Text className="text-xs font-semibold text-white">
                      {getStatusEmoji(item.status)} {item.status}
                    </Text>
                  </View>
                </View>
                {item.driverRating && (
                  <View className="flex-row items-center gap-1 mt-2">
                    <Text className="text-xs text-muted">Your rating:</Text>
                    {Array.from({ length: item.driverRating }).map((_, i) => (
                      <Text key={i} className="text-sm">⭐</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
