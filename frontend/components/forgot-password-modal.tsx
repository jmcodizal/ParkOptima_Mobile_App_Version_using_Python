import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ForgotPasswordModalProps = {
  visible: boolean;
  role: 'parking_attendant' | 'parking_owner' | 'vehicle_owner';
  onClose: () => void;
  onSubmit: (identifier: string, currentPassword: string, newPassword: string) => Promise<void>;
};

const COLORS = {
  navy: '#1E3A8A',
  teal: '#14B8A6',
  bg: '#FFFFFF',
  inputBg: '#F3F4F6',
  inputBorder: '#E5E7EB',
  textPrimary: '#1F2937',
  textMuted: '#6B7280',
  placeholder: '#9CA3AF',
};

export default function ForgotPasswordModal({ visible, role, onClose, onSubmit }: ForgotPasswordModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIdentifier('');
      setCurrentPassword('');
      setNewPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!identifier.trim() || !currentPassword || !newPassword) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(identifier.trim(), currentPassword, newPassword);
      Alert.alert('Success', 'Your password was updated successfully.');
      onClose();
    } catch (error) {
      Alert.alert('Password reset failed', error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (role) {
      case 'parking_owner':
        return 'Reset parking owner password';
      case 'vehicle_owner':
        return 'Reset vehicle owner PIN';
      default:
        return 'Reset attendant password';
    }
  };

  const getPlaceholder = () => {
    if (role === 'vehicle_owner') {
      return 'Email, phone, or plate';
    }
    return 'Email or phone number';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={20} color={COLORS.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>Enter the account details and verify your current password before changing it.</Text>
            </View>
          </View>

          <Text style={styles.label}>IDENTIFIER</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={16} color={COLORS.teal} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder()}
              placeholderTextColor={COLORS.placeholder}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.teal} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor={COLORS.placeholder}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity style={styles.toggleButton} onPress={() => setShowCurrent((v) => !v)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>NEW PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="refresh-outline" size={16} color={COLORS.teal} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={COLORS.placeholder}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity style={styles.toggleButton} onPress={() => setShowNew((v) => !v)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Update</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFEF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  label: {
    color: COLORS.teal,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
