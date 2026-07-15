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

export default function SignupRoleModal() {
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

        <Text style={styles.sheetTitle}>Create your account as</Text>
        <Text style={styles.sheetSubtitle}>
          Select your role to create{ '\n' }
          your ParkOptima account.
        </Text>

        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardAmber]}
            activeOpacity={0.85}
            onPress={() => router.push('/signup?role=parking_owner')}
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
            onPress={() => router.push('/signup?role=attendant')}
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
            onPress={() => router.push('/signup?role=vehicle_owner')}
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
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 150,
  },
  roleCardAmber: {
    backgroundColor: COLORS.amberLight,
  },
  roleCardTeal: {
    backgroundColor: COLORS.tealLight,
  },
  roleCardNavy: {
    backgroundColor: COLORS.navy,
  },

  ownerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  ownerRoofLeft: {
    position: 'absolute',
    top: 8,
    left: 9,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
  },
  ownerRoofRight: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.white,
  },
  ownerBuilding: {
    width: 26,
    height: 16,
    backgroundColor: COLORS.white,
    marginTop: 12,
    borderRadius: 2,
  },
  ownerDoor: {
    position: 'absolute',
    bottom: 8,
    width: 7,
    height: 9,
    backgroundColor: COLORS.amber,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  roleLabelAmber: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 17,
  },

  attendantIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#DFF6F2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  attendantHead: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.teal,
    marginBottom: 5,
  },
  attendantBody: {
    width: 19,
    height: 11,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: COLORS.teal,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  roleLabelTeal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 17,
  },
  roleLabelWhite: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 17,
  },

  carIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  carRoof: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginBottom: 3,
  },
  carBody: {
    width: 28,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  carWheelRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  carWheel: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },

  cancelBtn: {
    marginTop: 6,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});