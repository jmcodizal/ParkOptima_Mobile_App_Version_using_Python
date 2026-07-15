import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoginFormContainer from './login_form_container';
import { useRouter } from 'expo-router';
import { apiRequest } from '../lib/api';

// ParkOptima color palette
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

export default function AttendantSignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          password,
          role: 'parking_attendant',
        }),
      });

      Alert.alert('Success', 'Signup completed successfully! Redirecting to login...', [
        {
          text: 'OK',
          onPress: () => {
            router.push('/attendant_login');
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Signup Error',
        error instanceof Error ? error.message : 'An error occurred during signup. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={16} color={C.navy} />
          </View>
          <Text style={styles.headerTitle}>ParkOptima</Text>
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
          <View style={styles.pageContent}>
            <LoginFormContainer>
              {/* Role badge */}
              <View style={styles.roleBadge}>
                <Ionicons name="person" size={11} color={C.amber} />
                <Text style={styles.roleBadgeText}>PARKING ATTENDANT</Text>
              </View>

              {/* Icon + heading */}
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={26} color="#fff" />
              </View>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>
                Sign up as a parking attendant for ParkOptima
              </Text>

              {/* First / Last name row */}
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>FIRST NAME</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      placeholderTextColor={C.placeholder}
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={!loading}
                    />
                  </View>
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>LAST NAME</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      placeholderTextColor={C.placeholder}
                      value={lastName}
                      onChangeText={setLastName}
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color={C.teal} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={C.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              {/* Phone */}
              <Text style={styles.label}>PHONE</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={16} color={C.teal} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor={C.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Password */}
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color={C.teal} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={C.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Sign up button */}
              <TouchableOpacity style={[styles.signUpBtn, loading && styles.signUpBtnDisabled]} onPress={handleSignup} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={16} color="#fff" />
                    <Text style={styles.signUpText}>Sign up</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginMuted}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/attendant_login')} disabled={loading}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>

            </LoginFormContainer>
          </View>
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
  pageContent: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: C.amber,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
    marginBottom: 16,
  },
  roleBadgeText: {
    color: C.amber,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: C.navy,
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
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
    paddingVertical: 12,
    marginBottom: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  signUpBtn: {
    width: '100%',
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  signUpBtnDisabled: {
    opacity: 0.6,
  },
  signUpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  loginMuted: {
    color: C.textMuted,
    fontSize: 12,
  },
  loginLink: {
    color: C.teal,
    fontSize: 12,
    fontWeight: '700',
  },
});