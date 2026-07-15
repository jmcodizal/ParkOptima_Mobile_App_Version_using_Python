import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { apiRequest } from '@/lib/api';

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
  navy: Colors.light.tint,
  white: Colors.light.background,
  surface: '#F5F6F8',
  border: '#D4D6D8',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#a0aac7',
  successBg: '#E8F8EE',
  errorBg: '#FFE7E5',
  errorText: '#A92525',
  successText: '#4CAF50',
  amber: '#FDB022',
  amberBg: '#FFFBEB',
};

export default function AccountSettingsScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('Parking Owner');
  const [email, setEmail] = useState('owner@parkoptima.com');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [motorFee, setMotorFee] = useState('5.00');
  const [fourWheelerFee, setFourWheelerFee] = useState('20.00');
  const [activeSettings, setActiveSettings] = useState({ systemOption: 'Parking Owner', motorFee: 3.0, fourWheelerFee: 30.0 });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await apiRequest<ProfileData>('/api/owner/profile');
        if (isMounted) {
          setFullName(response.full_name || 'Parking Owner');
          setEmail(response.email || '');
          setPhone(response.phone || '');
          setMotorFee(String(response.motor_fee ?? 3));
          setFourWheelerFee(String(response.four_wheeler_fee ?? 20));
          setActiveSettings({
            systemOption: response.system_option || 'Parking Owner',
            motorFee: response.motor_fee ?? 3,
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
      { text: 'Cancel', onPress: () => console.log('Logout cancelled') },
      {
        text: 'Logout',
        onPress: () => {
          console.log('Confirming logout, navigating...');
          // Use router.dismissAll to clear the entire stack, then push to modal_login
          router.dismissAll();
          router.push('/modal_login');
        },
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>P</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>ParkOptima</Text>
            <Text style={styles.headerSubtitle}>Parking Owner / Account Settings</Text>
          </View>
        </View>
        <View style={styles.avatarCircleHeader}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Account Settings</Text>
        <Text style={styles.screenSubtitle}>Manage your profile and security preferences</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>👤</Text>
          </View>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        {/* Account Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACCOUNT INFORMATION</Text>

          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={C.textSecondary}
          />

          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={C.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={C.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        {/* Change Password */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleIcon}>🔒</Text>
            <Text style={styles.cardTitle}>CHANGE PASSWORD</Text>
          </View>

          <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={C.textSecondary}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={C.textSecondary}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={C.textSecondary}
            secureTextEntry
          />
        </View>

        {/* System Configuration */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitleIcon}>⚙️</Text>
            <Text style={styles.cardTitle}>SYSTEM CONFIGURATION</Text>
          </View>
          <Text style={styles.cardSubtitle}>Configure parking fees and system preferences</Text>

          <View style={styles.feeRow}>
            <View style={styles.feeCol}>
              <Text style={styles.fieldLabel}>MOTOR FEE (₱ PER SESSION)</Text>
              <TextInput
                style={styles.input}
                value={motorFee}
                onChangeText={setMotorFee}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={C.textSecondary}
              />
            </View>
            <View style={styles.feeCol}>
              <Text style={styles.fieldLabel}>4-WHEELER FEE (₱ PER SESSION)</Text>
              <TextInput
                style={styles.input}
                value={fourWheelerFee}
                onChangeText={setFourWheelerFee}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={C.textSecondary}
              />
            </View>
          </View>

          <Text style={styles.feeNote}>
            These fees will be automatically applied within your entire parking facility.
          </Text>

          {/* Low enforcement / active settings notice */}
          <View style={styles.activeSettingsBox}>
            <Text style={styles.activeSettingsTitle}>⚠  Current active settings</Text>
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
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>💾  Save changes</Text>
        </TouchableOpacity>

        {/* Logout button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <Ionicons name="log-out" size={20} color={C.errorText} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.surface },

  header: {
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoBadgeText: { color: C.white, fontWeight: '700', fontSize: 13 },
  headerTitle: { color: C.white, fontSize: 16, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },
  avatarCircleHeader: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14 },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },

  screenTitle: { fontSize: 20, fontWeight: '700', color: C.navy },
  screenSubtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2, marginBottom: 16 },

  profileCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 14,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eef0fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileAvatarText: { fontSize: 24 },
  profileName: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  profileEmail: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitleIcon: { fontSize: 13, marginRight: 6 },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  cardSubtitle: { fontSize: 12, color: C.textSecondary, marginBottom: 14, marginTop: -6 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.textPrimary,
    marginBottom: 14,
    backgroundColor: C.white,
  },

  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeCol: { width: '48%' },
  feeNote: { fontSize: 11, color: C.textSecondary, marginBottom: 14, marginTop: -4, lineHeight: 16 },

  activeSettingsBox: {
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: C.amber,
    borderRadius: 10,
    padding: 14,
  },
  activeSettingsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.errorText,
    marginBottom: 10,
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
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  saveButtonText: { color: C.white, fontSize: 14, fontWeight: '700' },
  
  logoutButton: {
    backgroundColor: C.errorBg,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: C.errorText,
  },
  logoutButtonText: { color: C.errorText, fontSize: 16, fontWeight: '700', marginLeft: 10 },
});