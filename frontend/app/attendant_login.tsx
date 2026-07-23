import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '../lib/api';
import { notifyError } from '@/lib/feedback';
import ForgotPasswordModal from '../components/forgot-password-modal';
import { clearRememberedCredentials, loadRememberedCredentials, saveRememberedCredentials } from '../lib/remember-me';
import LoginFormContainer from './login_form_container';
import { ValidationRules, isValidEmail, isValidPhone } from '../lib/validation';

const C = {
  navy: '#1E3A8A',
  navyDark: '#152a63',
  teal: '#14B8A6',
  tealSoft: '#E6FBF6',
  red: '#DC2626',
  subtitle: '#B91C1C',
  amber: '#F59E0B',
  bg: '#FFFFFF',
  inputBg: '#F9FAFB',
  inputBorder: '#E5E7EB',
  textPrimary: '#1F2937',
  textMuted: '#6B7280',
  placeholder: '#9CA3AF',
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const inputPositions = useRef<Record<string, number>>({});

  const scrollInputIntoView = (field: 'email' | 'password', activeKeyboardHeight = 0) => {
    const container = scrollViewRef.current;
    if (!container) {
      return;
    }

    const fieldY = inputPositions.current[field] || 0;
    const extraOffset = Math.max(100, activeKeyboardHeight > 0 ? activeKeyboardHeight - 120 : 110);
    const offsetY = Math.max(0, fieldY - extraOffset);
    container.scrollTo({ y: offsetY, animated: true });
  };

  const handleInputLayout = (field: 'email' | 'password', event: any) => {
    inputPositions.current[field] = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
      setTimeout(() => {
        scrollInputIntoView('password', event.endCoordinates?.height || 0);
      }, 120);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const saved = await loadRememberedCredentials<{ email: string; password: string; remember: boolean }>('attendant-login');
      if (saved?.remember) {
        setEmail(saved.email || '');
        setPassword(saved.password || '');
        setRemember(true);
      }
    };
    hydrate();
  }, []);

  const handleSignIn = async () => {
    const identifier = email.trim();
    if (!identifier || !password) {
      notifyError('Email or phone number and password are required.', 'Validation Error');
      return;
    }

    const validEmail = isValidEmail(identifier);
    const validPhone = isValidPhone(identifier);
    if (!validEmail && !validPhone) {
      notifyError('Enter a valid email address or phone number starting with 09.', 'Invalid Login Identifier');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<{ user_id: number; role: string }>('/api/attendant/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (remember) {
        await saveRememberedCredentials('attendant-login', { email: email.trim().toLowerCase(), password, remember: true });
      } else {
        await clearRememberedCredentials('attendant-login');
      }
      await signIn(response.user_id, response.role);
      router.replace('/attendant/monitor');
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Unable to log in.', 'Login Error');
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
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconBtn} onPress={() => router.push('/get_started')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={16} color={C.navy} />
          </View>
          <Text style={styles.headerTitle}>ParkOptima</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Parking Attendant</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          contentInsetAdjustmentBehavior="automatic"
        >
          <LoginFormContainer>
            <View style={styles.formContent}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>Welcome back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to your attendant account
              </Text>

              <Text style={styles.label}>EMAIL OR PHONE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="mail" size={13} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="attendant@parkoptima.com"
                  placeholderTextColor={C.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => scrollInputIntoView('email', keyboardHeight)}
                />
              </View>

              <Text style={styles.label}>PASSWORD</Text>
              <View
                style={styles.inputWrapper}
                onLayout={(event) => handleInputLayout('password', event)}
              >
                <View style={styles.inputIconCircle}>
                  <Ionicons name="lock-closed" size={13} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={C.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => scrollInputIntoView('password', keyboardHeight)}
                />
                <TouchableOpacity style={styles.toggleButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember((value) => !value)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                    {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowForgotPassword(true)}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn} activeOpacity={0.85} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="log-in-outline" size={17} color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </TouchableOpacity>

              <View style={styles.signupRow}>
                <Text style={styles.signupMuted}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/attendant_signup')}>
                  <Text style={styles.signupLink}>Sign up here</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LoginFormContainer>
        </ScrollView>
      </KeyboardAvoidingView>
      <ForgotPasswordModal
        visible={showForgotPassword}
        role="parking_attendant"
        onClose={() => setShowForgotPassword(false)}
        onSubmit={handleForgotPassword}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    backgroundColor: C.navy,
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
    borderColor: C.teal,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: C.teal,
    fontSize: 10,
    fontWeight: '700',
  },
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
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: C.teal,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  welcomeTitle: {
    color: C.navy,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: C.subtitle,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 26,
    width: '100%',
    maxWidth: 320,
  },
  label: {
    alignSelf: 'flex-start',
    color: C.navy,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
  },
  inputIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toggleButton: {
    marginLeft: 10,
    padding: 4,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 13,
    padding: 0,
  },
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
    borderColor: C.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  rememberText: {
    color: C.textMuted,
    fontSize: 12,
  },
  forgotText: {
    color: C.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: C.navy,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  signInText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signupMuted: {
    color: C.textMuted,
    fontSize: 12,
  },
  signupLink: {
    color: C.teal,
    fontSize: 12,
    fontWeight: '700',
  },
});