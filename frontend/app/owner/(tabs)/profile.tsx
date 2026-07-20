import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type ProfileData = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  system_option: string;
  motor_fee: number;
  four_wheeler_fee: number;
};

const C = {
  navy: '#1E3A8A',
  navyDark: '#08131F',
  white: Colors.light.background,
  surface: '#F4F6F9',
  border: '#E4E7EC',
  fieldBg: '#F3F5F8',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  teal: '#0EA5A0',
  tealLight: '#DBF5F2',
  amber: '#F59E0B',
  amberBg: '#FEF3E2',
  amberBorder: '#FCE3B6',
  indigo: '#4F5FE0',
  indigoLight: '#E7E9FB',
  successBg: '#E8F8EE',
  errorBg: '#FEE2E2',
  errorText: '#B91C1C',
  successText: '#4CAF50',
};

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [fullName, setFullName] = useState('Parking Owner');
  const [email, setEmail] = useState('owner@parkoptima.com');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [motorFee, setMotorFee] = useState('5.00');
  const [fourWheelerFee, setFourWheelerFee] = useState('20.00');
  const [activeSettings, setActiveSettings] = useState({ systemOption: 'Parking Owner', motorFee: 3.0, fourWheelerFee: 30.0 });
  const scrollViewRef = useRef<ScrollView | null>(null);
  const inputPositions = useRef<Record<string, number>>({});

  const scrollInputIntoView = (field: string) => {
    const container = scrollViewRef.current;
    if (!container) {
      return;
    }

    const offsetY = Math.max(0, (inputPositions.current[field] || 0) - 90);
    container.scrollTo({ y: offsetY, animated: true });
  };

  const handleInputLayout = (field: string, event: any) => {
    inputPositions.current[field] = event.nativeEvent.layout.y;
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollInputIntoView('password'), 120);
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await apiRequest<ProfileData>('/api/owner/profile');
        if (isMounted) {
          setFullName(response.full_name || 'Parking Owner');
          setEmail(response.email || '');
          setPhone(response.phone || '');
          setMotorFee(String(response.motor_fee ?? 5));
          setFourWheelerFee(String(response.four_wheeler_fee ?? 20));
          setActiveSettings({
            systemOption: response.system_option || 'Parking Owner',
            motorFee: response.motor_fee ?? 5,
            fourWheelerFee: response.four_wheeler_fee ?? 20,
          });
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    console.log('Logout button pressed');
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => console.log('Logout cancelled'), style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          console.log('Confirming logout, clearing auth state...');
          signOut()
            .catch((error) => console.error('Sign out failed', error))
            .finally(() => {
              setTimeout(() => {
                console.log('Navigating to modal_login after sign out');
                router.replace('/modal_login');
              }, 50);
            });
        },
        style: 'destructive',
      },
    ]);
  };

  const handleSaveChanges = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match');
      return;
    }

    try {
      await apiRequest('/api/owner/profile', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          motor_fee: Number(motorFee),
          four_wheeler_fee: Number(fourWheelerFee),
          new_password: newPassword,
        }),
      });
      Alert.alert('Profile updated', 'Your profile and settings were saved.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navbar — same pattern as Overview */}
      <View style={styles.navbar}>
                    <View style={styles.navLeft}>
                      <View style={styles.navLogoMark}>
                       <Ionicons name="car-sport" size={16} color={C.navy} />
                      </View>
                      <Text style={styles.navBrand}>ParkOptima</Text>
                    </View>
                    <TouchableOpacity style={styles.bellWrap}>
                      <Text style={styles.bellIcon}>🔔</Text>
                      <View style={styles.bellDot} />
                    </TouchableOpacity>
           </View>

      {/* Header — same style as Overview */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account settings</Text>
        <Text style={styles.headerSubtitle}>Manage your profile and security preferences</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Profile card */}
          <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={26} color={C.indigo} />
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{activeSettings.systemOption}</Text>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="person-circle-outline" size={16} color={C.indigo} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Account information</Text>
          </View>
          <Text style={styles.cardSubtitle}>Your personal details</Text>

          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onFocus={() => scrollInputIntoView('fullName')}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={C.textMuted}
          />

          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onFocus={() => scrollInputIntoView('email')}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={C.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            value={phone}
            onFocus={() => scrollInputIntoView('phone')}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={C.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {/* Change Password */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="lock-closed" size={15} color={C.amber} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>Change password</Text>
          </View>
          <Text style={styles.cardSubtitle}>Use at least 8 characters</Text>

          <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onFocus={() => scrollInputIntoView('currentPassword')}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onFocus={() => scrollInputIntoView('newPassword')}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            value={confirmPassword}
            onFocus={() => scrollInputIntoView('confirmPassword')}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
          />
        </View>

        {/* System Configuration */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="settings" size={15} color={C.indigo} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>System configuration</Text>
          </View>
          <Text style={styles.cardSubtitle}>Configure parking fees and system preferences</Text>

          <View style={styles.feeRow}>
            <View style={styles.feeCol}>
              <Text style={styles.fieldLabel}>MOTOR FEE (PER SESSION)</Text>
              <View style={styles.feeInputWrap}>
                <Text style={styles.feeCurrency}>₱</Text>
                <TextInput
                  style={styles.feeInput}
                  value={motorFee}
                  onChangeText={setMotorFee}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </View>
            <View style={styles.feeCol}>
              <Text style={styles.fieldLabel}>4-WHEELER FEE (PER SESSION)</Text>
              <View style={styles.feeInputWrap}>
                <Text style={styles.feeCurrency}>₱</Text>
                <TextInput
                  style={styles.feeInput}
                  value={fourWheelerFee}
                  onChangeText={setFourWheelerFee}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </View>
          </View>

          <Text style={styles.feeNote}>
            These fees will be automatically applied across your entire parking facility.
          </Text>

          {/* Current active settings notice */}
          <View style={styles.activeSettingsBox}>
            <View style={styles.activeSettingsTitleRow}>
              <Ionicons name="alert-circle" size={14} color={C.amber} style={{ marginRight: 6 }} />
              <Text style={styles.activeSettingsTitle}>Current active settings</Text>
            </View>
            <View style={styles.activeSettingsRow}>
              <Text style={styles.activeSettingsLabel}>System option</Text>
              <Text style={styles.activeSettingsValue}>{activeSettings.systemOption}</Text>
            </View>
            <View style={styles.activeSettingsRow}>
              <Text style={styles.activeSettingsLabel}>Motor fee</Text>
              <Text style={styles.activeSettingsValue}>
                ₱{activeSettings.motorFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.activeSettingsRow}>
              <Text style={styles.activeSettingsLabel}>4-wheeler fee</Text>
              <Text style={styles.activeSettingsValue}>
                ₱{activeSettings.fourWheelerFee.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.activeSettingsFooter}>
              Changes take effect globally upon saving.
            </Text>
          </View>
        </View>

          {/* Save changes button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} activeOpacity={0.85}>
            <Ionicons name="save" size={16} color={C.white} style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>Save changes</Text>
          </TouchableOpacity>

          {/* Logout button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={C.errorText} />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>

          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.navy },
  keyboardContainer: { flex: 1 },

  // Navbar — matches Overview
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.navy,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  navLogoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoText: { color: C.navy, fontWeight: '800', fontSize: 13 },
  navRoleLabel: { color: C.teal, fontSize: 10, fontWeight: '700', marginBottom: 1 },
  navBrand: { color: C.white, fontWeight: '700', fontSize: 15 },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellWrap: { position: 'relative', padding: 4 },
  bellIcon: { fontSize: 18 },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.amber,
    borderWidth: 1.5, borderColor: C.navy,
  },

  // Header — matches Overview
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 21, fontWeight: '800', color: C.white },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  body: { flex: 1, backgroundColor: C.surface },
  bodyContent: { padding: 16, paddingTop: 18, paddingBottom: 24 },

  profileCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: 14,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.indigoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileName: { fontSize: 15, fontWeight: '800', color: C.textPrimary },
  profileEmail: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  rolePill: {
    marginTop: 10,
    backgroundColor: C.tealLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolePillText: { fontSize: 11, fontWeight: '700', color: C.teal },

  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  cardSubtitle: { fontSize: 11, color: C.textMuted, marginBottom: 16 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.fieldBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: C.textPrimary,
    marginBottom: 14,
  },

  feeRow: { flexDirection: 'row', gap: 12 },
  feeCol: { flex: 1 },
  feeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.fieldBg,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  feeCurrency: { fontSize: 13, color: C.textSecondary, marginRight: 4, fontWeight: '600' },
  feeInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13,
    color: C.textPrimary,
  },
  feeNote: { fontSize: 11, color: C.textMuted, marginTop: 10, marginBottom: 14, lineHeight: 16 },

  activeSettingsBox: {
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: C.amberBorder,
    borderRadius: 12,
    padding: 14,
  },
  activeSettingsTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  activeSettingsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textPrimary,
  },
  activeSettingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activeSettingsLabel: { fontSize: 12, color: C.textSecondary },
  activeSettingsValue: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  activeSettingsFooter: {
    fontSize: 10,
    color: '#8a7642',
    marginTop: 6,
    fontStyle: 'italic',
  },

  saveButton: {
    backgroundColor: C.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 10,
  },
  saveButtonText: { color: C.white, fontSize: 14, fontWeight: '700' },

  logoutButton: {
    backgroundColor: C.white,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.errorText,
  },
  logoutButtonText: { color: C.errorText, fontSize: 14, fontWeight: '700' },
});