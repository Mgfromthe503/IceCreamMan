import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { AnimatedTruck } from './animated-truck';
import { useLocation } from '@/lib/location-context';

interface MapMarker {
  id: string;
  x: number;
  y: number;
  type: 'customer' | 'driver' | 'landmark';
  label: string;
  emoji: string;
}

interface CandyMapProps {
  showDriver?: boolean;
  showCustomer?: boolean;
  markers?: MapMarker[];
}

// Street names for the candy-land map
const HORIZONTAL_STREETS = ['Waffle Cone Way', 'Sprinkle Lane', 'Sundae Blvd', 'Cherry Top Ave'];
const VERTICAL_STREETS = ['Vanilla Dr', 'Chocolate St', 'Strawberry Rd'];

export function CandyMap({ showDriver = true, showCustomer = true, markers = [] }: CandyMapProps) {
  const { userLocation, driverLocation } = useLocation();
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>(markers);
  const screenWidth = Dimensions.get('window').width;
  const mapWidth = screenWidth - 48;
  const mapHeight = 380;

  useEffect(() => {
    if (markers.length === 0) {
      const newMarkers: MapMarker[] = [];

      // Add neighborhood landmarks at intersections
      const landmarks = [
        { emoji: '🏠', label: 'Home', x: 0.25, y: 0.7 },
        { emoji: '🏫', label: 'School', x: 0.7, y: 0.25 },
        { emoji: '🌳', label: 'Park', x: 0.15, y: 0.3 },
        { emoji: '⛪', label: 'Church', x: 0.8, y: 0.6 },
        { emoji: '🏪', label: 'Store', x: 0.5, y: 0.45 },
      ];

      landmarks.forEach((lm, i) => {
        newMarkers.push({
          id: `landmark_${i}`,
          x: lm.x * (mapWidth - 40),
          y: lm.y * (mapHeight - 40),
          type: 'landmark',
          label: lm.label,
          emoji: lm.emoji,
        });
      });

      // Customer location - bottom center
      if (showCustomer) {
        newMarkers.push({
          id: 'customer',
          x: mapWidth / 2 - 20,
          y: mapHeight - 70,
          type: 'customer',
          label: 'You',
          emoji: '📍',
        });
      }

      // Driver location - upper area, moving toward customer
      if (showDriver) {
        newMarkers.push({
          id: 'driver',
          x: mapWidth * 0.35,
          y: mapHeight * 0.2,
          type: 'driver',
          label: 'Ice Cream Man',
          emoji: '🚚',
        });
      }

      setMapMarkers(newMarkers);
    }
  }, [markers, showDriver, showCustomer, mapWidth, mapHeight]);

  return (
    <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#FF69B4' }}>
      {/* Map Background - Candy Land GPS Style */}
      <View
        style={{
          width: mapWidth,
          height: mapHeight,
          backgroundColor: '#FFF0F5',
          position: 'relative',
        }}
      >
        {/* Grass/block areas between streets */}
        {[0.05, 0.3, 0.55, 0.8].map((top, i) => (
          [0.05, 0.38, 0.72].map((left, j) => (
            <View
              key={`block-${i}-${j}`}
              style={{
                position: 'absolute',
                top: `${top * 100}%`,
                left: `${left * 100}%`,
                width: '25%',
                height: '18%',
                backgroundColor: i % 2 === j % 2 ? '#E8F5E9' : '#FFF8E1',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#C8E6C9',
              }}
            />
          ))
        ).flat())}

        {/* Horizontal Streets (roads) */}
        {HORIZONTAL_STREETS.map((street, i) => {
          const topPercent = (i + 1) * 22;
          return (
            <View key={`h-street-${i}`}>
              {/* Road */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 20,
                  backgroundColor: '#FFD1DC',
                  top: `${topPercent}%`,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: '#FFB6C1',
                }}
              />
              {/* Dashed center line */}
              <View
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  height: 2,
                  top: `${topPercent + 2.5}%`,
                  borderStyle: 'dashed',
                  borderTopWidth: 2,
                  borderColor: '#FF69B4',
                }}
              />
              {/* Street name */}
              <View
                style={{
                  position: 'absolute',
                  left: 6,
                  top: `${topPercent - 3.5}%`,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 8, fontWeight: '700', color: '#C71585' }}>
                  {street}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Vertical Streets (roads) */}
        {VERTICAL_STREETS.map((street, i) => {
          const leftPercent = (i + 1) * 28;
          return (
            <View key={`v-street-${i}`}>
              {/* Road */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 18,
                  backgroundColor: '#FFD1DC',
                  left: `${leftPercent}%`,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: '#FFB6C1',
                }}
              />
              {/* Street name (rotated via positioning) */}
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  left: `${leftPercent + 5}%`,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 7, fontWeight: '700', color: '#C71585' }}>
                  {street}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Map Markers */}
        {mapMarkers.map((marker) => (
          <View
            key={marker.id}
            style={{
              position: 'absolute',
              left: marker.x,
              top: marker.y,
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: marker.type === 'driver' ? 20 : marker.type === 'customer' ? 15 : 5,
            }}
          >
            {marker.type === 'driver' ? (
              <AnimatedTruck x={0} y={0} heading={135} />
            ) : marker.type === 'customer' ? (
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FF1493',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                  shadowColor: '#FF1493',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <Text style={{ fontSize: 14 }}>📍</Text>
                </View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#FF1493', marginTop: 2 }}>
                  {marker.label}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18 }}>{marker.emoji}</Text>
                <Text style={{ fontSize: 8, fontWeight: '600', color: '#5D3A1A', marginTop: 1 }}>
                  {marker.label}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Compass */}
        <View style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#FFFFFF',
          borderWidth: 2,
          borderColor: '#FF69B4',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#FF1493' }}>N</Text>
          <View style={{ width: 1, height: 8, backgroundColor: '#FF1493', marginTop: 1 }} />
        </View>

        {/* GPS accuracy indicator */}
        <View style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: 'rgba(255,255,255,0.9)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
          <Text style={{ fontSize: 9, fontWeight: '600', color: '#333' }}>GPS Active</Text>
        </View>
      </View>

      {/* Map Legend */}
      <View style={{
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#FFD1DC',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF1493', borderWidth: 2, borderColor: '#FFF' }} />
          <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>You</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12 }}>🚚</Text>
          <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>Truck</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 16, height: 6, backgroundColor: '#FFD1DC', borderRadius: 3, borderWidth: 1, borderColor: '#FFB6C1' }} />
          <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>Streets</Text>
        </View>
      </View>
    </View>
  );
}
