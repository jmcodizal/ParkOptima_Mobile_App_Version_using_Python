import React, { useRef, useState } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

const COLORS = {
  navy: '#1A2E4A',
  teal: '#1D9E75',
  white: '#FFFFFF',
  surface: '#F0F3F8',
  border: '#E2E8F0',
  inputBorder: '#D1D9E6',
  textPrimary: '#1A2E4A',
  textSecondary: '#6B7A8D',
  textMuted: '#B0BAC9',
  divider: '#E2E8F0',
};

const VEHICLE_TYPES = ['Motor', 'Car', 'Van'];
const BRANDS_BY_TYPE: Record<string, string[]> = {
  Motor: ['Suzuki', 'Yamaha', 'Honda', 'Kawasaki', 'Others'],
  Car: ['Toyota', 'Mitsubishi', 'Ford', 'Isuzu', 'Nissan', 'Honda', 'Hyundai', 'Others'],
  Van: ['Toyota', 'Mitsubishi', 'Nissan', 'Isuzu', 'Hyundai', 'Others'],
};

function Dropdown({
  placeholder,
  options,
  value,
  onSelect,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={ddStyles.wrap}>
      <TouchableOpacity
        style={ddStyles.trigger}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <Text style={value ? ddStyles.triggerValue : ddStyles.triggerPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={ddStyles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={ddStyles.menu}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={ddStyles.menuItem}
              onPress={() => { onSelect(opt); setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text style={[ddStyles.menuItemText, value === opt && ddStyles.menuItemActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const ddStyles = StyleSheet.create({
  wrap: { flex: 1, position: 'relative', zIndex: 10000, overflow: 'visible' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
  },
  triggerPlaceholder: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  triggerValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  chevron: { fontSize: 10, color: COLORS.textSecondary },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    zIndex: 100000,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 30,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuItemText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  menuItemActive: { color: COLORS.navy, fontWeight: '700' },
});

export default function RegisterVehicle() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [plate, setPlate] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinVisible, setPinVisible] = useState(false);
  const [confirmPinVisible, setConfirmPinVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const inputPositions = useRef<Record<string, number>>({});
  const router = useRouter();

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

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollInputIntoView('pin'), 120);
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const brandOptions = BRANDS_BY_TYPE[vehicleType] ?? [];
  const displayBrand = brand === 'Others' ? customBrand : brand;

  const handleCreateAccount = async () => {
    setError('');
    setSuccess('');

    if (!vehicleType) {
      setError('Please select a vehicle type.');
      return;
    }

    if (!brand) {
      setError('Please select a brand.');
      return;
    }

    if (brand === 'Others' && customBrand.trim() === '') {
      setError('Please enter a custom brand name.');
      return;
    }

    if (!plate.trim()) {
      setError('Please enter a plate number.');
      return;
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      const body = {
        owner_name: ownerName.trim(),
        phone: contact.trim(),
        vehicle_type: vehicleType,
        brand: displayBrand.trim(),
        plate: plate.trim().toUpperCase(),
        pin,
      };

      await apiRequest('/api/vehicle/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setSuccess('Vehicle registration successful. Please login with your plate and PIN.');
      setTimeout(() => router.push('/vehicle_owner'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.navLogoMark}>
            <Text style={styles.navLogoText}>P</Text>
          </View>
          <Text style={styles.navBrand}>ParkOptima</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <View style={styles.heroRow}>
            <View style={styles.heroLogo}>
              <Text style={styles.heroLogoText}>P</Text>
            </View>
          </View>
          <Text style={styles.pageTitle}>Register Vehicle</Text>
          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>
            Owner Full Name <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <View style={styles.inputWrap}>
            <View style={styles.iconWrap}>
              <View style={styles.personHead} />
              <View style={styles.personBody} />
            </View>
            <TextInput
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="e.g. Harry Potter"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={styles.fieldLabel}>
            Contact Number <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <View style={styles.inputWrap}>
            <View style={styles.iconWrap}>
              <View style={styles.phoneBody}>
                <View style={styles.phoneDot} />
              </View>
            </View>
            <TextInput
              style={styles.input}
              value={contact}
              onFocus={() => scrollInputIntoView('contact')}
              onChangeText={setContact}
              placeholder="e.g. 09123456789"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.rowTwo, isCompact && styles.rowTwoCompact]}>
            <View style={[styles.dropdownCell, isCompact && styles.dropdownCellCompact]}>
              <Text style={styles.fieldLabel}>Vehicle Type</Text>
              <Dropdown
                placeholder="Select Type"
                options={VEHICLE_TYPES}
                value={vehicleType}
                onSelect={selection => {
                  setVehicleType(selection);
                  setBrand('');
                  setCustomBrand('');
                }}
              />
            </View>
            <View style={[styles.dropdownCell, isCompact && styles.dropdownCellCompact]}>
              <Text style={styles.fieldLabel}>Brand</Text>
              <Dropdown
                placeholder="Select Brand"
                options={brandOptions}
                value={brand}
                onSelect={selection => {
                  setBrand(selection);
                  if (selection !== 'Others') {
                    setCustomBrand('');
                  }
                }}
              />
            </View>
          </View>
          {brand === 'Others' && (
            <>
              <Text style={styles.fieldLabel}>Other Brand</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={customBrand}
                  onFocus={() => scrollInputIntoView('customBrand')}
                  onChangeText={setCustomBrand}
                  placeholder="Enter brand name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
          <View style={{ height: 10 }} />

          <Text style={styles.fieldLabel}>PIN</Text>
          <View style={styles.inputWrap}>
            <View style={styles.iconWrap}>
              <View style={styles.lockShackle} />
              <View style={styles.lockBody} />
            </View>
            <TextInput
              style={styles.input}
              value={pin}
              onFocus={() => scrollInputIntoView('pin')}
              onChangeText={t => setPin(t.slice(0, 4))}
              placeholder="···"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!pinVisible}
              keyboardType="number-pad"
              maxLength={4}
            />
            <TouchableOpacity onPress={() => setPinVisible(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{pinVisible ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Confirm PIN</Text>
          <View style={styles.inputWrap}>
            <View style={styles.iconWrap}>
              <View style={styles.lockShackle} />
              <View style={styles.lockBody} />
            </View>
            <TextInput
              style={styles.input}
              value={confirmPin}
              onFocus={() => scrollInputIntoView('confirmPin')}
              onChangeText={t => setConfirmPin(t.slice(0, 4))}
              placeholder="···"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!confirmPinVisible}
              keyboardType="number-pad"
              maxLength={4}
            />
            <TouchableOpacity onPress={() => setConfirmPinVisible(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{confirmPinVisible ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={handleCreateAccount} disabled={loading}>
            <Text style={styles.createBtnText}>{loading ? 'Submitting...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.navy },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  navLogoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  navBrand: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

  scroll: { flex: 1, backgroundColor: COLORS.surface, overflow: 'visible' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 42, overflow: 'visible', zIndex: 1 },

  heroRow: { alignItems: 'center', marginBottom: 12 },
  heroLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: { color: COLORS.white, fontWeight: '800', fontSize: 26 },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 20,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  optional: {
    fontWeight: '400',
    color: COLORS.textSecondary,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 14,
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  personHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textMuted,
  },
  personBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: COLORS.textMuted,
  },

  phoneBody: {
    width: 12,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  phoneDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },

  truckBody: {
    width: 18,
    height: 10,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  truckCabin: {
    width: 6,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  truckWheelRow: { flexDirection: 'row', marginTop: 6 },
  truckWheel: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },

  lockShackle: {
    width: 10,
    height: 6,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lockBody: {
    width: 14,
    height: 9,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
  },

  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 16 },

  rowTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    overflow: 'visible',
    zIndex: 1,
  },
  dropdownCell: {
    flexBasis: '48%',
    maxWidth: '48%',
    minWidth: 140,
    marginBottom: 14,
    position: 'relative',
    overflow: 'visible',
    zIndex: 10,
  },
  rowTwoCompact: {
    flexDirection: 'column',
  },
  dropdownCellCompact: {
    flexBasis: '100%',
    maxWidth: '100%',
  },

  createBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    marginBottom: 10,
  },
});
