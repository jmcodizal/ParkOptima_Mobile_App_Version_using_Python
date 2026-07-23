import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors } from '@/constants/theme';
import { NotificationCenter } from '@/components/notification-center';
import { ParkingAlert } from '@/components/parking-alert';
import { useAuth } from '@/lib/auth';

const C = {
  navy: '#1E3A8A',
  navyDark: '#08131F',
  white: Colors.light.background,
  surface: '#F4F6F9',
  border: '#E4E7EC',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F97316',
  green: '#10B981',
  greenLight: '#DCFCE9',
  gradientStart: '#1E2B6B',
  gradientEnd: '#3562C9',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { userId } = useAuth();
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const focusedNotificationId = searchParams.focus ? parseInt(searchParams.focus as string, 10) : null;

  useEffect(() => {
    const getOwnerId = async () => {
      try {
        if (userId) {
          setOwnerId(userId);
        } else {
          setOwnerId(1); // Fallback only when auth is unavailable
        }
      } catch (error) {
        console.error('Error getting owner ID:', error);
      } finally {
        setLoading(false);
      }
    };

    getOwnerId();
  }, [userId]);

  if (loading || !ownerId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.gradientStart} />

      {/* Header */}
      <LinearGradient
        colors={[C.gradientStart, C.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.navbar}>
          <View style={styles.navLeft}>
            <View style={styles.navLogoMark}>
              <Ionicons name="car-sport" size={16} color={C.navy} />
            </View>
            <Text style={styles.navBrand}>ParkOptima</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications & Alerts</Text>
          <Text style={styles.headerSubtitle}>Stay informed about your parking lot</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Parking Alert Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Status</Text>
          <ParkingAlert ownerId={ownerId} />
        </View>

        {/* Notifications Center */}
        <View style={styles.notificationSection}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          <NotificationCenter ownerId={ownerId} focusedNotificationId={focusedNotificationId} />
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.gradientStart,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.surface,
  },

  // Gradient header
  headerGradient: {
    paddingBottom: 16,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLogoMark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBrand: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  settingsButton: {
    padding: 8,
  },

  // Header title
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
  },

  // Scroll
  scroll: {
    flex: 1,
    backgroundColor: C.surface,
  },
  scrollContent: {
    padding: 0,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  notificationSection: {
    flex: 1,
    backgroundColor: C.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 12,
  },
});
