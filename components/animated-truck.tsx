import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedTruckProps {
  x?: number;
  y?: number;
  heading?: number;
}

export function AnimatedTruck({ x = 0, y = 0, heading = 0 }: AnimatedTruckProps) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);
  const rotation = useSharedValue(heading);

  useEffect(() => {
    // Animate truck bobbing effect (vertical movement)
    translateY.value = withRepeat(
      withTiming(y + 10, {
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [y, translateY]);

  useEffect(() => {
    // Simulate truck movement along a path (horizontal movement)
    translateX.value = withRepeat(
      withTiming(x + 50, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [x, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute' }]}>
      <View className="w-12 h-12 items-center justify-center">
        <Text className="text-4xl">🚚</Text>
      </View>
    </Animated.View>
  );
}
