import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { getApiBaseUrl } from '@/lib/api';

const C = {
  navy: '#1E3A8A',
  navyDark: '#08131F',
  white: Colors.light.background,
  surface: '#F4F6F9',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  red: '#EF4444',
  redLight: '#FEE2E2',
  amber: '#F59E0B',
  amberLight: '#FEF3E2',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  green: '#10B981',
  greenLight: '#DCFCE9',
};

interface OccupancyData {
  current: number;
  capacity: number;
  percentage: number;
  available: number;
}

interface ParkingAlertProps {
  ownerId: number;
  onOccupancyChange?: (occupancy: OccupancyData) => void;
}

export const ParkingAlert: React.FC<ParkingAlertProps> = ({ ownerId, onOccupancyChange }) => {
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unusualEvents, setUnusualEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchOccupancy();
    fetchUnusualEvents();
    const interval = setInterval(() => {
      fetchOccupancy();
      fetchUnusualEvents();
    }, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [ownerId]);

  const fetchOccupancy = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/notifications/occupancy/${ownerId}`);
      const data = await response.json();
      setOccupancy(data.occupancy);
      setIsFull(data.is_full);
      onOccupancyChange?.(data.occupancy);
    } catch (error) {
      console.error('Error fetching occupancy:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnusualEvents = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/notifications/unusual-events/${ownerId}`);
      const data = await response.json();
      setUnusualEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching unusual events:', error);
    }
  };

  if (loading || !occupancy) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  const getOccupancyColor = () => {
    if (occupancy.percentage >= 90) return { bg: C.redLight, text: C.red, icon: C.red };
    if (occupancy.percentage >= 75) return { bg: C.amberLight, text: C.amber, icon: C.amber };
    return { bg: C.greenLight, text: C.green, icon: C.green };
  };

  const getStatusText = () => {
    if (isFull) return 'PARKING LOT FULL';
    if (occupancy.percentage >= 75) return 'HIGH OCCUPANCY';
    return 'AVAILABLE';
  };

  const colors = getOccupancyColor();
  const criticalEvents = unusualEvents.filter((e) => e.severity === 'critical');

  return (
    <View style={styles.container}>
      {/* Occupancy Status Card */}
      <LinearGradient
        colors={[colors.bg, colors.bg]}
        style={styles.statusCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={isFull ? 'close-circle' : 'checkmark-circle'}
              size={32}
              color={colors.icon}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>{getStatusText()}</Text>
            {isFull && (
              <Text style={styles.fullMessage}>
                No parking spaces available. Please try again later.
              </Text>
            )}
          </View>
        </View>

        {/* Occupancy Gauge */}
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeBackground}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(occupancy.percentage, 100)}%`,
                  backgroundColor: colors.icon,
                },
              ]}
            />
          </View>
          <View style={styles.gaugeInfo}>
            <Text style={styles.gaugeText}>
              {occupancy.current} / {occupancy.capacity} spots
            </Text>
            <Text style={[styles.gaugePercentage, { color: colors.text }]}>
              {occupancy.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Available Spots */}
        <View style={styles.availableContainer}>
          <Ionicons name="location-outline" size={16} color={colors.icon} />
          <Text style={styles.availableText}>
            {occupancy.available} spot{occupancy.available !== 1 ? 's' : ''} available
          </Text>
        </View>
      </LinearGradient>

      {/* Unusual Events Alert */}
      {criticalEvents.length > 0 && (
        <View style={styles.eventsCard}>
          <View style={styles.eventsHeader}>
            <Ionicons name="alert-circle" size={24} color={C.red} />
            <Text style={styles.eventsTitle}>⚠️ Alerts</Text>
          </View>
          {criticalEvents.slice(0, 3).map((event, index) => (
            <TouchableOpacity
              key={index}
              style={styles.eventItem}
              onPress={() => {
                Alert.alert('Alert Details', event.description);
              }}
            >
              <Text style={styles.eventDescription}>{event.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fullMessage: {
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
  },
  gaugeContainer: {
    marginBottom: 16,
  },
  gaugeBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surface,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  gaugePercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  availableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availableText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  eventsCard: {
    backgroundColor: C.redLight,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.red,
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  eventsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.red,
  },
  eventItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginVertical: 4,
    backgroundColor: C.white,
    borderRadius: 6,
  },
  eventDescription: {
    fontSize: 12,
    color: C.textPrimary,
  },
});
