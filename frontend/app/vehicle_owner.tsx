import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#1A2E4A',
  navyDark: '#0D1B2E',
  teal: '#1D9E75',
  tealLight: '#E8F7F2',
  white: '#FFFFFF',
  surface: '#F0F3F8',
  border: '#E2E8F0',
  inputBorder: '#CBD5E1',
  textPrimary: '#1A2E4A',
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B4',
  checkboxBorder: '#CBD5E1',
};

export default function VehicleOwnerLogin() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const [plate, setPlate] = useState('');
  const [pin, setPin] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.navLogoMark}>
            <Text style={styles.navLogoText}>P</Text>
          </View>
          <Text style={styles.navBrand}>ParkOptima</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isCompact && styles.cardCompact]}>
            <View style={styles.roleBadgeRow}>
              <View style={styles.roleDot} />
              <Text style={styles.roleBadgeText}>VEHICLE OWNER</Text>
            </View>

            <View style={styles.iconCircle}>
              <View style={styles.carRoof} />
              <View style={styles.carBody} />
              <View style={styles.carWheelRow}>
                <View style={styles.carWheel} />
                <View style={styles.carWheel} />
              </View>
            </View>

            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in with your plate number & PIN</Text>

            <Text style={styles.fieldLabel}>PLATE NUMBER</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIconBox}>
                <View style={styles.idLine} />
                <View style={styles.idLineSm} />
              </View>
              <TextInput
                style={styles.input}
                value={plate}
                onChangeText={setPlate}
                placeholder="ABC 1234"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <Text style={styles.fieldLabel}>PIN</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIconBox}>
                <View style={styles.lockShackle} />
                <View style={styles.lockBody} />
              </View>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={t => setPin(t.slice(0, 4))}
                placeholder="...."
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!pinVisible}
                keyboardType="number-pad"
                maxLength={4}
              />
              <TouchableOpacity
                onPress={() => setPinVisible(v => !v)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{pinVisible ? '⊘' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember(v => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85}>
              <Text style={styles.loginBtnText}>Log In</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>

              <Text style={styles.registerText}>
              {"Don't have an account?\n"}
              <Text style={styles.registerLink} onPress={() => router.push('/register_vehicle')}>
                Register Plate Number
              </Text>
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.navy },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  navLogoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  navBrand: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

  scroll: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { padding: 20, paddingBottom: 44 },

  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },

  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.navy,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 1.2,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  carRoof: {
    width: 22,
    height: 10,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  carBody: {
    width: 34,
    height: 12,
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  carWheelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  carWheel: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.navy,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },

  fieldLabel: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  inputIconBox: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  idLine: {
    width: 14,
    height: 2.5,
    backgroundColor: COLORS.textMuted,
    borderRadius: 1,
  },
  idLineSm: {
    width: 9,
    height: 2.5,
    backgroundColor: COLORS.textMuted,
    borderRadius: 1,
  },
  lockShackle: {
    width: 10,
    height: 6,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lockBody: {
    width: 14,
    height: 9,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 16 },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.checkboxBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  checkmark: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  rememberText: { fontSize: 13, color: COLORS.textSecondary },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 24,
    paddingRight: 10,
    width: '100%',
    marginBottom: 20,
  },
  cardCompact: {
    padding: 18,
  },
  loginBtnText: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  registerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  registerLink: {
    color: COLORS.teal,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
