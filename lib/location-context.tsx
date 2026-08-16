import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISCLOSURE_KEY = 'location_disclosure_accepted';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

// Export as Location for backward compatibility
export type { LocationData as Location };

export interface DriverLocation extends LocationData {
  driverId: string;
  timestamp: number;
}

interface LocationContextType {
  userLocation: LocationData | null;
  driverLocation: DriverLocation | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  setUserLocation: (location: LocationData) => void;
  setDriverLocation: (location: DriverLocation) => void;
  requestLocationPermission: () => Promise<boolean>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  retryLocation: () => void;
  showDisclosure: boolean;
  acceptDisclosure: () => Promise<void>;
  declineDisclosure: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Reverse geocode using free Nominatim API
async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TheIceCreamManApp/1.0',
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.address) {
        const parts: string[] = [];
        // Prioritize suburb/neighbourhood for accurate local area
        if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
        else if (data.address.suburb) parts.push(data.address.suburb);
        else if (data.address.road) parts.push(data.address.road);
        // Use the most specific city-level name (suburb > city > town > village)
        const city = data.address.city || data.address.town || data.address.village;
        const suburb = data.address.suburb;
        // If city is different from suburb, show suburb as the primary location
        if (suburb && city && suburb !== city) {
          if (!parts.includes(suburb)) parts.push(suburb);
          parts.push(city);
        } else if (city) {
          if (!parts.includes(city)) parts.push(city);
        }
        if (data.address.state) parts.push(data.address.state);
        if (parts.length > 0) return parts.join(', ');
      }
      if (data.display_name) {
        const parts = data.display_name.split(',').slice(0, 3);
        return parts.join(',').trim();
      }
    }
  } catch (error) {
    console.log('Reverse geocoding failed:', error);
  }
  return `${latitude.toFixed(4)}°N, ${Math.abs(longitude).toFixed(4)}°W`;
}

/**
 * IP-based geolocation fallback - works without ANY browser permissions.
 * Uses free IP geolocation APIs to get coordinates, then reverse geocodes
 * for neighborhood-level address accuracy.
 */
async function getLocationFromIP(): Promise<LocationData | null> {
  // Try multiple free IP geolocation services as fallbacks
  const services = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data: any) => ({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 5000,
      }),
    },
    {
      url: 'https://ip-api.com/json/?fields=lat,lon,city,regionName,country',
      parse: (data: any) => ({
        latitude: data.lat,
        longitude: data.lon,
        accuracy: 5000,
      }),
    },
    {
      url: 'https://ipwho.is/',
      parse: (data: any) => ({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 5000,
      }),
    },
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, { 
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        const result = service.parse(data);
        if (result.latitude && result.longitude) {
          // Always reverse geocode for neighborhood-level accuracy
          // IP services only give city-level (e.g. "Portland") but reverse geocoding
          // the coordinates gives suburb/neighborhood (e.g. "Beaverton")
          const address = await reverseGeocode(result.latitude, result.longitude);
          return {
            latitude: result.latitude,
            longitude: result.longitude,
            accuracy: result.accuracy,
            address,
          } as LocationData;
        }
      }
    } catch (error) {
      console.log(`IP geolocation service failed, trying next...`);
      continue;
    }
  }
  return null;
}

/**
 * Try browser GPS first, but if it fails for ANY reason (permissions, timeout, etc.),
 * automatically fall back to IP-based geolocation. No user action needed.
 */
async function getWebLocation(): Promise<LocationData | null> {
  // First try: browser GPS (fast if already permitted)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const gpsResult = await new Promise<LocationData | null>((resolve) => {
        const timeoutId = setTimeout(() => {
          // If GPS takes more than 5 seconds, give up and use IP
          resolve(null);
        }, 5000);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            clearTimeout(timeoutId);
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const address = await reverseGeocode(lat, lon);
            resolve({
              latitude: lat,
              longitude: lon,
              accuracy: position.coords.accuracy ?? undefined,
              heading: position.coords.heading ?? undefined,
              speed: position.coords.speed ?? undefined,
              address,
            });
          },
          () => {
            // GPS failed (permission denied, unavailable, etc.) - that's fine
            clearTimeout(timeoutId);
            resolve(null);
          },
          {
            enableHighAccuracy: true, // Use high accuracy for precise neighborhood detection
            timeout: 10000,
            maximumAge: 30000, // Accept cached position up to 30 seconds old
          }
        );
      });

      if (gpsResult) return gpsResult;
    } catch (error) {
      // GPS completely failed, fall through to IP
    }
  }

  // Fallback: IP-based geolocation (always works, no permissions needed)
  console.log('Using IP-based geolocation (no browser permissions needed)');
  const ipLocation = await getLocationFromIP();
  if (ipLocation) {
    return ipLocation;
  }

  return null;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [disclosureAccepted, setDisclosureAccepted] = useState<boolean | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const trackingIntervalRef = useRef<any>(null);
  const locationSubRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Check if disclosure has been accepted (runs on mount)
  const checkDisclosureStatus = async (): Promise<boolean> => {
    try {
      const accepted = await AsyncStorage.getItem(DISCLOSURE_KEY);
      const result = accepted === 'true';
      setDisclosureAccepted(result);
      return result;
    } catch {
      return false;
    }
  };

  // Accept the disclosure and persist it
  const acceptDisclosure = async () => {
    await AsyncStorage.setItem(DISCLOSURE_KEY, 'true');
    setDisclosureAccepted(true);
    setShowDisclosure(false);
    // Now that disclosure is accepted, start full tracking with GPS
    startLocationTracking();
  };

  // Decline the disclosure — use IP fallback only
  const declineDisclosure = () => {
    setShowDisclosure(false);
    // Still start tracking but IP-only (no native permission prompt)
    startIPOnlyTracking();
  };

  // Prompt the disclosure modal
  const promptDisclosure = () => {
    setShowDisclosure(true);
  };

  // Start IP-only tracking (no native permission request)
  const startIPOnlyTracking = async () => {
    setIsLoadingLocation(true);
    const ipLoc = await getLocationFromIP();
    if (ipLoc && isMountedRef.current) {
      setUserLocation(ipLoc);
    }
    if (isMountedRef.current) setIsLoadingLocation(false);
  };

  // Request location permission (always returns true since we have IP fallback)
  const requestLocationPermission = async (): Promise<boolean> => {
    // Check disclosure first on native
    if (Platform.OS !== 'web') {
      const accepted = await checkDisclosureStatus();
      if (!accepted) {
        // Show disclosure modal instead of requesting permission directly
        setShowDisclosure(true);
        return true; // IP fallback will work in the meantime
      }
      try {
        const ExpoLocation = require('expo-location');
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        return status === 'granted';
      } catch (error) {
        return true; // IP fallback will work
      }
    }
    return true; // Web always has IP fallback
  };

  // Get current location - tries GPS first, falls back to IP automatically
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      if (Platform.OS === 'web') {
        return await getWebLocation();
      }

      // Native: try expo-location first
      try {
        const ExpoLocation = require('expo-location');
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.High,
          });

          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const address = await reverseGeocode(lat, lon);

          return {
            latitude: lat,
            longitude: lon,
            accuracy: location.coords.accuracy ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ?? undefined,
            address,
          };
        }
      } catch (nativeError) {
        console.log('Native GPS failed, using IP fallback');
      }

      // Native fallback: IP geolocation
      return await getLocationFromIP();
    } catch (error) {
      console.error('getCurrentLocation error:', error);
      // Last resort: IP geolocation
      return await getLocationFromIP();
    }
  };

  // Start continuous location tracking
  const startLocationTracking = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      // Get initial location (GPS or IP - always works)
      const initialLocation = await getCurrentLocation();
      if (initialLocation && isMountedRef.current) {
        setUserLocation(initialLocation);
        setLocationError(null);
      } else if (isMountedRef.current) {
        setLocationError('Could not determine location. Please check your internet connection.');
      }
      
      if (isMountedRef.current) {
        setIsLoadingLocation(false);
      }

      // Set up continuous tracking
      if (Platform.OS === 'web') {
        // For web: try watchPosition, but also poll IP location every 30s as backup
        let hasGpsWatch = false;

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          try {
            const watchId = navigator.geolocation.watchPosition(
              async (position) => {
                if (!isMountedRef.current) return;
                hasGpsWatch = true;
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const address = await reverseGeocode(lat, lon);
                
                setUserLocation({
                  latitude: lat,
                  longitude: lon,
                  accuracy: position.coords.accuracy ?? undefined,
                  heading: position.coords.heading ?? undefined,
                  speed: position.coords.speed ?? undefined,
                  address,
                });
                setLocationError(null);
              },
              () => {
                // Watch failed silently - IP polling will handle it
                hasGpsWatch = false;
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
              }
            );
            trackingIntervalRef.current = watchId;
          } catch (e) {
            // watchPosition not available
          }
        }

        // IP-based polling every 60 seconds as backup (only if GPS watch isn't working)
        const pollInterval = setInterval(async () => {
          if (!isMountedRef.current || hasGpsWatch) return;
          const loc = await getLocationFromIP();
          if (loc && isMountedRef.current) {
            setUserLocation(loc);
            setLocationError(null);
          }
        }, 60000);
        locationSubRef.current = pollInterval;

      } else {
        // For native: use expo-location subscription
        try {
          const ExpoLocation = require('expo-location');
          const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
          
          if (status === 'granted') {
            const subscription = await ExpoLocation.watchPositionAsync(
              {
                accuracy: ExpoLocation.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 5, // Update every 5 meters for 1000ft precision
              },
              async (location: any) => {
                if (!isMountedRef.current) return;
                const lat = location.coords.latitude;
                const lon = location.coords.longitude;
                const address = await reverseGeocode(lat, lon);
                
                setUserLocation({
                  latitude: lat,
                  longitude: lon,
                  accuracy: location.coords.accuracy ?? undefined,
                  heading: location.coords.heading ?? undefined,
                  speed: location.coords.speed ?? undefined,
                  address,
                });
                setLocationError(null);
              }
            );
            locationSubRef.current = subscription;
          } else {
            // Permission denied on native - use IP polling
            const pollInterval = setInterval(async () => {
              if (!isMountedRef.current) return;
              const loc = await getLocationFromIP();
              if (loc && isMountedRef.current) {
                setUserLocation(loc);
              }
            }, 60000);
            locationSubRef.current = { remove: () => clearInterval(pollInterval) };
          }
        } catch (error) {
          console.log('Native location tracking failed, using IP polling');
          const pollInterval = setInterval(async () => {
            if (!isMountedRef.current) return;
            const loc = await getLocationFromIP();
            if (loc && isMountedRef.current) {
              setUserLocation(loc);
            }
          }, 60000);
          locationSubRef.current = { remove: () => clearInterval(pollInterval) };
        }
      }
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      if (isMountedRef.current) {
        // Even on total failure, try IP one more time
        const ipLoc = await getLocationFromIP();
        if (ipLoc) {
          setUserLocation(ipLoc);
          setLocationError(null);
        } else {
          setLocationError('Unable to determine location. Check internet connection.');
        }
        setIsLoadingLocation(false);
      }
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (Platform.OS === 'web') {
      if (trackingIntervalRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      if (locationSubRef.current !== null) {
        clearInterval(locationSubRef.current);
        locationSubRef.current = null;
      }
    } else {
      if (locationSubRef.current) {
        if (typeof locationSubRef.current.remove === 'function') {
          locationSubRef.current.remove();
        }
        locationSubRef.current = null;
      }
    }
  };

  // Retry location
  const retryLocation = () => {
    stopLocationTracking();
    startLocationTracking();
  };

  // Start tracking on mount — check disclosure status first on native
  useEffect(() => {
    isMountedRef.current = true;
    
    const init = async () => {
      if (Platform.OS === 'web') {
        // Web doesn't need disclosure modal — browser handles its own prompt
        startLocationTracking();
      } else {
        // Native: check if disclosure was previously accepted
        const accepted = await checkDisclosureStatus();
        if (accepted) {
          // Already accepted — proceed with full GPS tracking
          startLocationTracking();
        } else {
          // Not yet accepted — start with IP-only, show disclosure when user interacts
          await startIPOnlyTracking();
          // Show disclosure modal after a short delay so the screen loads first
          setTimeout(() => {
            if (isMountedRef.current) setShowDisclosure(true);
          }, 1500);
        }
      }
    };
    init();

    return () => {
      isMountedRef.current = false;
      stopLocationTracking();
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        driverLocation,
        isLoadingLocation,
        locationError,
        setUserLocation,
        setDriverLocation,
        requestLocationPermission,
        startLocationTracking,
        stopLocationTracking,
        retryLocation,
        showDisclosure,
        acceptDisclosure,
        declineDisclosure,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
