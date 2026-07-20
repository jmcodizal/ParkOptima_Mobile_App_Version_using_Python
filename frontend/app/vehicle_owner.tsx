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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../lib/api';
import ForgotPasswordModal from '../components/forgot-password-modal';
import { clearRememberedCredentials, loadRememberedCredentials, saveRememberedCredentials } from '../lib/remember-me';
import { useAuth } from '@/lib/auth';
import LoginFormContainer from './login_form_container';

const COLORS = {
  navy: '#1E3A8A',
  navyDark: '#152a63',
  teal: '#14B8A6',
  subtitle: '#B91C1C',
  bg: '#FFFFFF',
  inputBg: '#F9FAFB',
  inputBorder: '#E5E7EB',
  textPrimary: '#1F2937',
  textMuted: '#6B7280',
  placeholder: '#9CA3AF',
};

export default function VehicleOwnerLogin() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const [plate, setPlate] = useState('');
  const [pin, setPin] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  React.useEffect(() => {
    const hydrate = async () => {
      const saved = await loadRememberedCredentials<{ plate: string; pin: string; remember: boolean }>('vehicle-owner-login');
      if (saved?.remember) {
        setPlate(saved.plate || '');
        setPin(saved.pin || '');
        setRemember(true);
      }
    };
    hydrate();
  }, []);

  const handleSignIn = async () => {
    const normalizedPlate = plate.trim().toUpperCase();
    if (!normalizedPlate || pin.length !== 4) {
      Alert.alert('Validation Error', 'Plate and 4-digit PIN are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ access_token: string; user_id: number; vehicle_id: number }>('/api/auth/vehicle-login', {
        method: 'POST',
        body: JSON.stringify({ plate: normalizedPlate, pin }),
      });

      if (remember) {
        await saveRememberedCredentials('vehicle-owner-login', { plate: normalizedPlate, pin, remember: true });
      } else {
        await clearRememberedCredentials('vehicle-owner-login');
      }
      await signIn(response.user_id, 'vehicle_owner');
      router.replace('/');
    } catch (error) {
      Alert.alert('Login Error', error instanceof Error ? error.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (identifier: string, currentPassword: string, newPassword: string) => {
    await apiRequest('/api/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ identifier, current_password: currentPassword, new_password: newPassword }),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconBtn} onPress={() => router.push('/modal_login')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={16} color={COLORS.navy} />
          </View>
          <Text style={styles.headerTitle}>ParkOptima</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Vehicle owner</Text>
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
          <LoginFormContainer>
            <View style={styles.formContent}>
              <View style={styles.avatarCircle}>
                <Ionicons name="car-outline" size={30} color="#fff" />
              </View>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in with your plate number & PIN</Text>

              <Text style={styles.fieldLabel}>PLATE NUMBER</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="id-card" size={13} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  value={plate}
                  onChangeText={setPlate}
                  placeholder="ABC 1234"
                  placeholderTextColor={COLORS.placeholder}
                  autoCapitalize="characters"
                />
              </View>

              <Text style={styles.fieldLabel}>PIN</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="lock-closed" size={13} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={t => setPin(t.slice(0, 4))}
                  placeholder="...."
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!pinVisible}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity
                  onPress={() => setPinVisible(v => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons name={pinVisible ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRemember(v => !v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                    {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowForgotPassword(true)}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85} onPress={handleSignIn} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="log-in-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Log In'}</Text>
              </TouchableOpacity>

              <Text style={styles.registerText}>
                {"Don't have an account?\n"}
                <Text style={styles.registerLink} onPress={() => router.push('/register_vehicle')}>
                  Register Plate Number
                </Text>
              </Text>
            </View>
          </LoginFormContainer>
        </ScrollView>
      </KeyboardAvoidingView>
      <ForgotPasswordModal
        visible={showForgotPassword}
        role="vehicle_owner"
        onClose={() => setShowForgotPassword(false)}
        onSubmit={handleForgotPassword}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backIconBtn: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 2,
    padding: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 22,
  },
  logoBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: COLORS.teal,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: COLORS.teal,
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  formContent: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.teal,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  title: {
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.subtitle,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 26,
    width: '100%',
    maxWidth: 320,
  },

  fieldLabel: {
    alignSelf: 'flex-start',
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
  },
  inputIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  eyeBtn: { padding: 4 },
  optionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  rememberText: { fontSize: 12, color: COLORS.textMuted },
  forgotText: {
    color: COLORS.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  loginBtn: {
    width: '100%',
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  registerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  registerLink: {
    color: COLORS.teal,
    fontWeight: '700',
  },
});