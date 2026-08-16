import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

/**
 * FactTicker - A reusable component that displays rotating ice cream fun facts.
 * 
 * Shows a new random fact every 4 seconds with a smooth fade/slide animation.
 * Can be placed on any screen to keep users entertained while waiting.
 * 
 * Props:
 * - variant: 'compact' | 'card' | 'banner' - visual style
 * - intervalMs: how often to rotate (default 4000ms)
 */

const ICE_CREAM_FACTS = [
  // USER-CURATED FACTS
  "🏠 90% of American households eat ice cream!",
  "🌭 One of the most unusual ice cream flavors is hot dog flavored ice cream, created in Arizona, US!",
  "👅 One cone of ice cream can be finished off in 50 licks!",
  "🥛 It takes 12 gallons of milk to create one gallon of ice cream!",
  "🔢 There are 273 calories in one cup of vanilla ice cream.",
  "🥥 Coconut milk ice cream is traditional in Indonesia!",
  "🍫 Chocolate ice cream was invented before vanilla!",
  "👑 When ice cream was first brought to the Americas, it was only enjoyed by the elite!",
  "🔧 In 1843, Nancy Johnson received the first US patent for the hand-cranked ice cream freezer.",
  "🐾 20% of people will admit to sharing their ice cream with a pet!",
  "🧊 87% of all Americans claim to have ice cream in their freezer at any given time!",
  "🚀 NASA reports that ice cream ranks as one of the top three food items that astronauts miss the most in space!",
  "⚓ In 1945, the US Military built the first floating ice cream parlor for sailors serving in the Pacific during WWII!",
  "🍦 In Tokyo, Japan, you can find ice cream flavored with octopus, shrimp, horseflesh, and cow tongue!",
  "🐋 Ambergris Flavor: In 18th-century Europe, a popular premium ice cream flavor was ambergris — a rare substance from the digestive system of sperm whales!",
  "🌋 In Iceland, there's an ice cream shop built next to a geothermal area that serves 'volcano ice cream' topped with active ash and lava dust minerals!",
  "✨ There is a type of ice cream designed by gastrophysicists that glows in the dark — it uses synthesized jellyfish proteins that light up when your warm tongue licks it!",
  "🔬 Ice cream is one of the only foods that exists as a solid, liquid, and gas simultaneously — ice crystals are solid, the sugary syrup is liquid, and trapped air cells are gas!",
  "🥄 The physical weight of the spoon changes how you perceive ice cream — eating cheap ice cream with a heavy, high-quality spoon makes your brain register it as tasting richer and creamier!",
  "🎵 Playing high-pitched, twinkling piano music while eating vanilla ice cream makes your brain perceive it as roughly 10% sweeter without adding any sugar!",
  "🎺 Listening to low-pitched, heavy brass instruments causes dark chocolate or coffee ice cream to taste much more intense and bitter!",
];

interface FactTickerProps {
  variant?: 'compact' | 'card' | 'banner';
  intervalMs?: number;
}

export function FactTicker({ variant = 'card', intervalMs = 4000 }: FactTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * ICE_CREAM_FACTS.length));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out + slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -15,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change fact - pick a random one instead of sequential
        setCurrentIndex(Math.floor(Math.random() * ICE_CREAM_FACTS.length));
        slideAnim.setValue(20);
        // Fade in + slide down
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  const fact = ICE_CREAM_FACTS[currentIndex];

  if (variant === 'compact') {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={{ fontSize: 12, color: '#8B4513', textAlign: 'center', lineHeight: 18 }}>
          {fact}
        </Text>
      </Animated.View>
    );
  }

  if (variant === 'banner') {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: 'rgba(255, 182, 217, 0.3)',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 12, color: '#8B4513', textAlign: 'center', lineHeight: 18, fontWeight: '500' }}>
          {fact}
        </Text>
      </Animated.View>
    );
  }

  // Default: 'card' variant
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        backgroundColor: '#FFF8DC',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#FFB6D9',
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 14 }}>🍦</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF69B4', letterSpacing: 0.5 }}>
          DID YOU KNOW?
        </Text>
        <Text style={{ fontSize: 14 }}>🍦</Text>
      </View>
      <Text style={{ fontSize: 13, color: '#5D3A1A', textAlign: 'center', lineHeight: 20 }}>
        {fact}
      </Text>
    </Animated.View>
  );
}
