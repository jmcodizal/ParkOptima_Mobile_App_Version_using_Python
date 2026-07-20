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
  subtitle: '#B91C1C',
  amber: '#F59E0B',
  bg: '#FFFFFF',
  inputBg: '#F9FAFB',
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
      const response = await apiRequest('/api/attendant/signup', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          password,
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.pageContent}>
            <LoginFormContainer>
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
                <View style={styles.inputIconCircle}>
                  <Ionicons name="mail" size={13} color="#fff" />
                </View>
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
                <View style={styles.inputIconCircle}>
                  <Ionicons name="call" size={13} color="#fff" />
                </View>
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
                    <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.signUpText}>Sign Up</Text>
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
  pageContent: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: C.amber,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  roleBadgeText: {
    color: C.teal,
    fontSize: 10,
    fontWeight: '700',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 8,
    shadowColor: C.navy,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: {
    color: C.navy,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: C.subtitle,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
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
    color: C.navy,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
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
    paddingVertical: 7,
    marginBottom: 10,
    gap: 8,
  },
  inputIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
    shadowColor: C.navy,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
    marginTop: 2,
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