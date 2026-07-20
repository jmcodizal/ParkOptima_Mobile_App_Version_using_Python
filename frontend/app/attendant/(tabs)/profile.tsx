import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import TopBar from '@/components/ui/top-bar';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  navy: '#1D3D8A',
  navyDark: '#0e1620',
  navyMid: '#FFFFFF',
  teal: '#13B4AA',
  amber: '#F59E0B',
  green: '#4CAF50',
  greenDark: '#1f6b25',
  successBg: '#E8F8EE',
  successText: '#4CAF50',
  errorBg: '#FFE7E5',
  errorText: '#A92525',
  white: '#FFFFFF',
  surface: '#F5F6F8',
  inputBg: '#F5F6F8',
  inputBorder: '#E4E6E8',
  labelText: '#1D3D8A',
  bodyText: '#2C2C33',
  placeholder: '#a0aac7',
};


function AvatarSection({ successMsg }: { successMsg: string }) {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>AT</Text>
        <View style={styles.avatarCheck}>
          <Ionicons name="checkmark" size={10} color={C.white} />
        </View>
      </View>
      <Text style={styles.roleTitle}>Attendant ParkOptima</Text>
      <View style={styles.roleBadge}>
        <Ionicons name="person" size={11} color={C.amber} />
        <Text style={styles.roleBadgeText}>Parking Attendant</Text>
      </View>

      {successMsg ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={15} color={C.green} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  icon,
  valueColor,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  icon?: keyof typeof Ionicons.glyphMap;
  valueColor?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {icon && (
          <View style={styles.inputIconCircle}>
            <Ionicons name={icon} size={13} color={C.white} />
          </View>
        )}
        <TextInput
          style={[styles.input, valueColor ? { color: valueColor } : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={C.placeholder}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  errorMsg,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  errorMsg?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, errorMsg ? styles.inputRowError : null]}>
        <View style={styles.inputIconCircle}>
          <Ionicons name="lock-closed" size={13} color={C.white} />
        </View>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={C.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)} style={styles.eyeBtn}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={17} color={C.labelText} />
        </TouchableOpacity>
      </View>
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={14} color={C.errorText} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyProfileScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      try {
        const profile = await apiRequest<any>(`/api/users/${userId}`);
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
      } catch (error) {
        console.warn('Failed to load profile', error);
      }
    };

    loadProfile();
  }, [userId]);

  const validateNewPw = (val: string) => {
    setNewPw(val);
    if (val.length > 0 && (val.length < 8 || !/[a-zA-Z]/.test(val) || !/[0-9]/.test(val))) {
      setPwError("Password must be at least 8 characters with letters and numbers.");
    } else {
      setPwError("");
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        }),
      });
      setSuccessMsg("Profile updated successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      Alert.alert('Save error', error instanceof Error ? error.message : 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (pwError || !currentPw || !newPw || !userId) return;
    setLoading(true);
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPw,
          new_password: newPw,
        }),
      });
      setSuccessMsg("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      Alert.alert('Password error', error instanceof Error ? error.message : 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <TopBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Profile</Text>
          <Text style={styles.pageSubtitle}>Update your details</Text>
        </View>

        <AvatarSection successMsg={successMsg} />

        {/* ── General Information ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={16} color={C.teal} />
            <Text style={styles.cardTitle}>Personal information</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FormField
                label="FIRST NAME"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="LAST NAME"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
              />
            </View>
          </View>

          <FormField
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            icon="mail"
            valueColor={C.teal}
          />

          <FormField
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            placeholder="09xx xxxx xxxx"
            keyboardType="phone-pad"
            icon="call"
            valueColor={C.teal}
          />

          <TouchableOpacity style={styles.btnTeal} onPress={handleSaveProfile} activeOpacity={0.85}>
            <Ionicons name="save-outline" size={16} color={C.white} />
            <Text style={styles.btnText}>Save changes</Text>
          </TouchableOpacity>
        </View>

        {/* ── Password Information ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={16} color={C.teal} />
            <Text style={styles.cardTitle}>Change password</Text>
          </View>

          <PasswordField
            label="CURRENT PASSWORD"
            value={currentPw}
            onChangeText={setCurrentPw}
            placeholder="Enter current password"
          />

          <PasswordField
            label="NEW PASSWORD"
            value={newPw}
            onChangeText={validateNewPw}
            placeholder="Enter new password"
            errorMsg={pwError}
          />

          <TouchableOpacity
            style={[styles.btnNavy, (!currentPw || !newPw || !!pwError) && styles.btnDisabled]}
            onPress={handleSavePassword}
            activeOpacity={0.85}
            disabled={!currentPw || !newPw || !!pwError}
          >
            <Ionicons name="save-outline" size={16} color={C.white} />
            <Text style={styles.btnText}>Save password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => setScanModalVisible(true)}>
        <IconSymbol size={32} name="camera" color="#ffffff" />
      </TouchableOpacity>
      <Modal
        visible={scanModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setScanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose scan type</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setScanModalVisible(false);
                  router.push('/attendant/scan');
                }}
              >
                <IconSymbol name="qrcode" size={28} color={Colors.light.tint} />
                <Text style={styles.modalButtonText}>Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setScanModalVisible(false);
                  router.push('/attendant/scan-out');
                }}
              >
                <IconSymbol name="qrcode" size={28} color={Colors.light.tint} />
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setScanModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  modalButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 110,
  },
  modalButtonText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    marginTop: 6,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: Colors.light.tabIconDefault,
    fontWeight: '600',
  },
  safe: { flex: 1, backgroundColor: C.surface },
  nav: { backgroundColor: C.navyDark, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  navLogo: { flexDirection: "row", alignItems: "center", gap: 6 },
  navLogoText: { color: C.white, fontWeight: "700", fontSize: 15 },
  navBadge: { backgroundColor: C.teal, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  navBadgeText: { color: C.white, fontSize: 12, fontWeight: "600" },

  // Scroll
  scroll: { flex: 1, backgroundColor: C.surface },
  scrollContent: { padding: 20, paddingBottom: 32 },

  // Page header
  pageHeader: { paddingHorizontal: 0, paddingVertical: 8 },
  pageTitle: { color: C.bodyText, fontSize: 22, fontWeight: "800", marginBottom: 4 },
  pageSubtitle: { color: C.teal, fontSize: 13, fontWeight: '600', marginBottom: 6 },

  // Avatar section
  avatarSection: { backgroundColor: C.white, alignItems: "center", paddingVertical: 20, paddingHorizontal: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: C.inputBorder },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { color: C.white, fontSize: 22, fontWeight: "700" },
  avatarCheck: { position: "absolute", bottom: 2, right: 2, backgroundColor: C.teal, borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.white },
  roleTitle: { color: C.navy, fontSize: 16, fontWeight: "800" },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: C.amber, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  roleBadgeText: { color: C.amber, fontSize: 10, fontWeight: '700' },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.successBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "stretch", marginTop: 10 },
  successText: { color: C.successText, fontSize: 13, fontWeight: "500" },

  // Card
  card: { backgroundColor: C.white, marginVertical: 6, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.inputBorder },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { color: C.navy, fontSize: 14, fontWeight: "800" },

  // Form fields
  row: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: C.navy, fontSize: 10, fontWeight: "700", letterSpacing: 0.6, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12, paddingHorizontal: 10, height: 46 },
  inputRowError: { borderColor: C.errorText },
  inputIconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, color: C.bodyText, fontSize: 14, paddingVertical: 0, paddingLeft: 0 },
  eyeBtn: { padding: 4 },

  // Error
  errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: C.errorBg, borderRadius: 6, padding: 8, marginTop: 6 },
  errorText: { color: C.errorText, fontSize: 12, flex: 1, lineHeight: 17 },

  // Buttons
  btnTeal: { backgroundColor: C.teal, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  btnNavy: { backgroundColor: C.navy, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 },
  btnDisabled: { backgroundColor: "#9CA9C7" },
  btnText: { color: C.white, fontSize: 14, fontWeight: "700" },
});