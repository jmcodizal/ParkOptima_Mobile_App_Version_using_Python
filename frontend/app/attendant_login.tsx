import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import LoginFormContainer from './login_form_container';

const C = {
  navy: '#1E3A8A',
  navyDark: '#152a63',
  teal: '#14B8A6',
  red: '#DC2626',
  amber: '#F59E0B',
  bg: '#FFFFFF',
  inputBg: '#F3F4F6',
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

  const handleSignIn = async () => {
    await signIn(1, 'attendant');
    router.replace('/attendant/monitor');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={16} color={C.navy} />
          </View>
          <Text style={styles.headerTitle}>ParkOptima</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>PARKING ATTENDANT</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LoginFormContainer>
            <View style={styles.formContent}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>Welcome back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to your attendant account
              </Text>

              <Text style={styles.label}>EMAIL OR PHONE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color={C.teal} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="attendant@parkoptima.com"
                  placeholderTextColor={C.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={C.teal} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={C.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.toggleButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotWrapper} activeOpacity={0.8}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn} activeOpacity={0.85}>
                <Ionicons name="log-in-outline" size={16} color="#fff" />
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>

              <View style={styles.signupRow}>
                <Text style={styles.signupMuted}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/attendant_signup')}>
                  <Text style={styles.signupLink}>Sign up here</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.backWrapper} onPress={() => router.push('/get_started')}>
                <Ionicons name="arrow-back" size={12} color={C.textMuted} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
          </LoginFormContainer>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(20,184,166,0.15)',
    borderWidth: 1,
    borderColor: C.teal,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    color: C.teal,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  welcomeTitle: {
    color: C.navy,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 26,
    width: '100%',
    maxWidth: 320,
  },
  label: {
    alignSelf: 'flex-start',
    color: C.teal,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  inputIcon: {
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
  forgotWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 20,
  },
  forgotText: {
    color: C.teal,
    fontSize: 11,
    fontWeight: '600',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
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
  backWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  backText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
