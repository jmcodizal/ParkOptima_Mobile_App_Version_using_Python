import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navyDark: '#0D1B2E',
  navy: '#1A2E4A',
  teal: '#1D9E75',
  tealLight: '#E8F7F2',
  amber: '#C8860D',
  amberLight: '#FCF1E0',
  white: '#FFFFFF',
  surface: '#F4F7FA',
  border: '#E2E8F0',
  textPrimary: '#1A2E4A',
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B4',
  sheetHandle: '#D1D5DB',
};

export default function ContinueAs() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />

      <ImageBackground source={require('@/assets/images/ParkOptimaBg.jpg')} style={styles.container} imageStyle={styles.backgroundImage}>
        <View style={styles.backdrop}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>P</Text>
              <View style={styles.logoDot} />
            </View>
          </View>
          <Text style={styles.brandName}>ParkOptima</Text>
        </View>

        <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.personIconWrap}>
          <View style={styles.personHead} />
          <View style={styles.personBody} />
        </View>

        <Text style={styles.sheetTitle}>Continue as</Text>
        <Text style={styles.sheetSubtitle}>
          Select your role to access{ '\n' }
          your ParkOptima dashboard.
        </Text>

        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardAmber]}
            activeOpacity={0.85}
            onPress={() => router.push('/login?role=parking_owner')}
          >
            <View style={styles.ownerIconWrap}>
              <View style={styles.ownerRoofLeft} />
              <View style={styles.ownerRoofRight} />
              <View style={styles.ownerBuilding} />
              <View style={styles.ownerDoor} />
            </View>
            <Text style={styles.roleLabelAmber}>Parking{ '\n' }Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardTeal]}
            activeOpacity={0.85}
            onPress={() => router.push('/login?role=attendant')}
          >
            <View style={styles.attendantIconWrap}>
              <View style={styles.attendantHead} />
              <View style={styles.attendantBody} />
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
            <Text style={styles.roleLabelTeal}>Parking{ '\n' }Attendant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardNavy]}
            activeOpacity={0.85}
            onPress={() => router.push('/vehicle_owner')}
          >
            <View style={styles.carIconWrap}>
              <View style={styles.carRoof} />
              <View style={styles.carBody} />
              <View style={styles.carWheelRow}>
                <View style={styles.carWheel} />
                <View style={styles.carWheel} />
              </View>
            </View>
            <Text style={styles.roleLabelWhite}>Vehicle{ '\n' }Owner</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.navyDark },
  container: { flex: 1, width: '100%', height: '100%' },
  backgroundImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoOuter: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 42,
  },
  logoDot: {
    position: 'absolute',
    top: 4,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },

  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.sheetHandle,
    marginBottom: 22,
  },

  personIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.tealLight,
    justifyContent: 'center',
  },
  personHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.teal,
    marginBottom: 2,
  },
  personBody: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: COLORS.teal,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    gap: 8,
  },
  roleCardAmber: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.amber,
  },
  roleCardTeal: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.teal,
  },
  roleCardNavy: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },

  ownerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ownerRoofLeft: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
  },
  ownerRoofRight: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
  },
  ownerBuilding: {
    width: 22,
    height: 14,
    backgroundColor: COLORS.white,
    marginTop: 10,
    borderRadius: 2,
  },
  ownerDoor: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 8,
    backgroundColor: COLORS.amber,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  roleLabelAmber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amber,
    textAlign: 'center',
    lineHeight: 16,
  },

  attendantIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  attendantHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    marginBottom: 2,
  },
  attendantBody: {
    width: 17,
    height: 9,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: COLORS.white,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: '800',
  },
  roleLabelTeal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.teal,
    textAlign: 'center',
    lineHeight: 16,
  },

  carIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carRoof: {
    width: 17,
    height: 8,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  carBody: {
    width: 27,
    height: 9,
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  carWheelRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  carWheel: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.navy,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  roleLabelWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 16,
  },

  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});