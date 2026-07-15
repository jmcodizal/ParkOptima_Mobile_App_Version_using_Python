import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TopBar from '@/components/ui/top-bar';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  navy: '#1D3D8A',
  navyDark: '#0e1620',
  navyMid: '#FFFFFF',
  teal: '#13B4AA',
  green: '#4CAF50',
  greenDark: '#1f6b25',
  successBg: '#E8F8EE',
  successText: '#4CAF50',
  errorBg: '#FFE7E5',
  errorText: '#A92525',
  white: '#FFFFFF',
  surface: '#F5F6F8',
  inputBg: '#F5F6F8',
  inputBorder: '#D4D6D8',
  labelText: '#6A707F',
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
      <Text style={styles.roleTitle}>Parking Attendant</Text>
      <Text style={styles.roleSubtitle}>Parking Attendant</Text>

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
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {icon && (
          <Ionicons name={icon} size={15} color={C.labelText} style={styles.inputIcon} />
        )}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null]}
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
        <Ionicons name="lock-closed-outline" size={15} color={C.labelText} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, styles.inputWithIcon, { flex: 1 }]}
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const handleSaveProfile = () => {
    setSuccessMsg("Profile updated successfully");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSavePassword = () => {
    if (pwError || !currentPw || !newPw) return;
    setSuccessMsg("Password updated successfully");
    setCurrentPw("");
    setNewPw("");
    setTimeout(() => setSuccessMsg(""), 3000);
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
            <Text style={styles.cardTitle}>General Information</Text>
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
            icon="mail-outline"
          />

          <FormField
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            placeholder="09xx xxxx xxxx"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <TouchableOpacity style={styles.btnGreen} onPress={handleSaveProfile} activeOpacity={0.85}>
            <Ionicons name="save-outline" size={16} color={C.white} />
            <Text style={styles.btnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* ── Password Information ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="lock-closed" size={16} color={C.teal} />
            <Text style={styles.cardTitle}>Password Information</Text>
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
            style={[styles.btnGreen, (!currentPw || !newPw || !!pwError) && styles.btnDisabled]}
            onPress={handleSavePassword}
            activeOpacity={0.85}
            disabled={!currentPw || !newPw || !!pwError}
          >
            <Ionicons name="save-outline" size={16} color={C.white} />
            <Text style={styles.btnText}>Save Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },

  // Nav
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
  pageTitle: { color: C.bodyText, fontSize: 24, fontWeight: "700", marginBottom: 6 },
  pageSubtitle: { color: C.labelText, fontSize: 14, marginBottom: 6 },

  // Avatar section
  avatarSection: { backgroundColor: C.navyMid, alignItems: "center", paddingBottom: 18, paddingHorizontal: 16, marginBottom: 12, borderRadius: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.navyDark, borderWidth: 3, borderColor: C.teal, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { color: C.white, fontSize: 24, fontWeight: "700" },
  avatarCheck: { position: "absolute", bottom: 2, right: 2, backgroundColor: C.green, borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  roleTitle: { color: C.white, fontSize: 16, fontWeight: "700" },
  roleSubtitle: { color: C.labelText, fontSize: 12, marginTop: 2, marginBottom: 8 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.successBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "stretch", marginTop: 8 },
  successText: { color: C.successText, fontSize: 13, fontWeight: "500" },

  // Card
  card: { backgroundColor: C.navyMid, marginVertical: 6, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.inputBorder },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.inputBorder },
  cardTitle: { color: C.white, fontSize: 14, fontWeight: "700" },

  // Form fields
  row: { flexDirection: "row" },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: C.labelText, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, paddingHorizontal: 12, height: 46 },
  inputRowError: { borderColor: C.errorText },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: C.bodyText, fontSize: 14, paddingVertical: 0 },
  inputWithIcon: { paddingLeft: 0 },
  eyeBtn: { padding: 4 },

  // Error
  errorBanner: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: C.errorBg, borderRadius: 6, padding: 8, marginTop: 6 },
  errorText: { color: C.errorText, fontSize: 12, flex: 1, lineHeight: 17 },

  // Buttons
  btnGreen: { backgroundColor: C.teal, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  btnDisabled: { backgroundColor: "#4b6b93" },
  btnText: { color: C.white, fontSize: 14, fontWeight: "700" },
});