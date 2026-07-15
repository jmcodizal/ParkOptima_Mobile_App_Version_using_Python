import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
 

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import TopBar from '@/components/ui/top-bar';

const COLORS = {
  navy: '#1D3D8A',
  navyDark: '#0D1B2A',
  teal: '#13B4AA',
  tealLight: '#3CC9B8',
  white: '#FFFFFF',
  surface: '#F5F6F8',
  border: '#D4D6D8',
  inputBorder: '#D4D6D8',
  textPrimary: '#2C2C33',
  textSecondary: '#6A707F',
  textMuted: '#6A707F',
  cardBg: '#FFFFFF',
  scanFrame: '#13B4AA',
  motorBg: '#F5F6F8',
  motorIcon: '#F39C12',
  wheelsBg: '#F5F6F8',
  wheelsIcon: '#1F4DA0',
};

type TabMode = 'Camera Scan' | 'Manual Entry';
type VehicleType = 'Motor' | '4 Wheels';

export default function ScanEntryScreen() {
  const [activeTab, setActiveTab] = useState<TabMode>('Camera Scan');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('Motor');
  const [alignToggle, setAlignToggle] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  return (
    <ThemedView style={styles.container}>
      <TopBar />

      <View style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.pageHeader}>
            <View style={styles.headerTextWrap}>
              <ThemedText type="subtitle" style={styles.pageTitle}>
                Scan Entry
              </ThemedText>
              <ThemedText style={styles.pageSubtitle}>
                Scan or enter a license plate to log vehicle entry
              </ThemedText>
            </View>
          </View>

          <View style={styles.tabRow}>
            {(['Camera Scan', 'Manual Entry'] as TabMode[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.vehicleRow}>
            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === 'Motor' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('Motor')}
              activeOpacity={0.85}
            >
              <View style={[styles.vehicleIconWrap, { backgroundColor: COLORS.motorBg }]}> 
                <View style={styles.motorIcon}>
                  <View style={styles.motorBody} />
                  <View style={styles.motorWheel} />
                  <View style={[styles.motorWheel, { marginLeft: 6 }]} />
                </View>
              </View>
              <Text style={styles.vehicleLabel}>Motor</Text>
              <Text style={styles.vehiclePrice}>₱6.00 FLAT RATE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === '4 Wheels' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('4 Wheels')}
              activeOpacity={0.85}
            >
              <View style={[styles.vehicleIconWrap, { backgroundColor: COLORS.wheelsBg }]}> 
                <View style={styles.carIcon}>
                  <View style={styles.carRoof} />
                  <View style={styles.carBody} />
                  <View style={styles.carWheelsRow}>
                    <View style={styles.carWheel} />
                    <View style={styles.carWheel} />
                  </View>
                </View>
              </View>
              <Text style={styles.vehicleLabel}>4 Wheels</Text>
              <Text style={styles.vehiclePrice}>₱10.00 FLAT RATE</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'Camera Scan' ? (
            <>
              <View style={styles.viewfinder}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Text style={styles.cameraReadyText}>CAMERA READY</Text>
              </View>

              <View style={styles.alignRow}>
                <Switch
                  value={alignToggle}
                  onValueChange={setAlignToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.teal }}
                  thumbColor={COLORS.white}
                  style={styles.switch}
                />
                <Text style={styles.alignLabel}>Align license plate within the frame</Text>
              </View>

              <TouchableOpacity style={styles.activateBtn} activeOpacity={0.85}>
                <Text style={styles.activateBtnIcon}>📷</Text>
                <Text style={styles.activateBtnText}>Activate Camera</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.manualCard}>
              <Text style={styles.fieldLabel}>VEHICLE DETAILS</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <View style={styles.idIcon}>
                    <View style={styles.idStripe} />
                    <View style={styles.idDot} />
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={brandModel}
                  onChangeText={setBrandModel}
                  placeholder="Enter brand model"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputIconWrap}>
                  <View style={styles.idIcon}>
                    <View style={styles.idStripe} />
                    <View style={styles.idDot} />
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  placeholder="Enter vehicle color"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  pageHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: COLORS.navy,
  },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  vehicleCard: {
    flex: 1,
    flexBasis: '48%',
    minWidth: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  vehicleCardActive: {
    borderColor: COLORS.teal,
    shadowColor: '#E8EAF0',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  vehicleIconWrap: {
    width: 56,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  motorIcon: {
    alignItems: 'center',
  },
  motorBody: {
    width: 28,
    height: 10,
    backgroundColor: COLORS.motorIcon,
    borderRadius: 4,
    marginBottom: 3,
  },
  motorWheel: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.navy,
    position: 'absolute',
    bottom: 0,
  },
  carIcon: {
    alignItems: 'center',
  },
  carRoof: {
    width: 18,
    height: 7,
    backgroundColor: COLORS.wheelsIcon,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  carBody: {
    width: 28,
    height: 8,
    backgroundColor: COLORS.wheelsIcon,
    borderRadius: 2,
  },
  carWheelsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 1,
  },
  carWheel: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.navy,
  },
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vehiclePrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  viewfinder: {
    height: 170,
    backgroundColor: COLORS.navyDark,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.scanFrame,
    borderRadius: 2,
  },
  cameraReadyText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  alignRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  alignLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cameraCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cameraCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cameraCardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  activateBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  activateBtnIcon: {
    fontSize: 16,
  },
  activateBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyIconWrap: {
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyCarRoof: {
    width: 30,
    height: 12,
    backgroundColor: COLORS.border,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  emptyCarBody: {
    width: 46,
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  emptyCarWheels: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  emptyCarWheel: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textMuted,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIconWrap: { marginRight: 8 },
  idIcon: {
    width: 18,
    height: 13,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 3,
    gap: 2,
  },
  idStripe: { width: 10, height: 2, backgroundColor: COLORS.white, borderRadius: 1 },
  idDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.white },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  manualCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
    marginBottom: 24,
  },
  manualEntryWrap: {
    paddingBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
