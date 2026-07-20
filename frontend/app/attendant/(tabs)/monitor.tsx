import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, Pressable, TouchableOpacity, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import TopBar from '@/components/ui/top-bar';
import { apiRequest } from '@/lib/api';

const COLORS = {
  navy: '#1E3A8A',
  navyDark: '#08131F',
  surface: '#F4F6F9',
  white: '#FFFFFF',
  textPrimary: '#1E2430',
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  border: '#E4E7EC',
  successBg: '#DCFCE9',
  successText: '#0F9D58',
  warningBg: '#FEF3E2',
  warning: '#F59E0B',
  overstayBg: '#FEE2E2',
  overstayText: '#B91C1C',
  teal: '#0EA5A0',
  tealLight: '#DBF5F2',
  navyLight: '#E7E9FB',
  amberChip: '#FDECD1',
  blue: '#3B82F6',
  blueLight: '#E7EFFE',
  secondaryBlue: '#2A4EA3',
  placeholder: '#9AA5B8',
  shadow: '#0B1B2E',
  paidText: '#0F9D58',
  unpaidText: '#F59E0B',
};

export default function MonitorScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>({ active_count: 0, occupancy_percent: 0, traffic_level: 'Low', total_capacity: 100 });
  const [sessions, setSessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await apiRequest<any>('/api/monitor/summary');
        setSummary(data);
      } catch (error) {
        console.warn('Failed to load monitor summary', error);
      }
    };

    loadSummary();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDetails = async () => {
      try {
        const [s, t, sl] = await Promise.all([
          apiRequest<any[]>('/api/sessions/active'),
          apiRequest<any[]>('/api/transactions/recent'),
          apiRequest<any[]>('/api/monitor/slots?slots=100'),
        ]);
        if (!mounted) return;
        setSessions(Array.isArray(s) ? s : []);
        setTransactions(Array.isArray(t) ? t : []);
        setSlots(Array.isArray(sl) ? sl : []);
      } catch (err) {
        console.warn('Failed to load sessions/transactions/slots', err);
      }
    };

    loadDetails();

    return () => { mounted = false; };
  }, []);

  const getTrafficColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'medium':
      case 'moderate':
        return COLORS.warning;
      default:
        return COLORS.teal;
    }
  };

  const isOverstay = (status: string) => (status || '').toLowerCase().includes('overstay');
  const occupiedSlots = slots.filter(s => s.occupied).length;
  const availableSlots = Math.max(0, slots.length - occupiedSlots);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TopBar />

      {/* Hero Section — navy header, matches app-wide header palette */}
      <View style={styles.heroSection}>
        <View style={styles.headerWithBadge}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Live Monitor
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Monitor real-time occupancy
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.timestamp}>Last updated: {new Date().toLocaleString()}</ThemedText>

        {/* Stat Cards Inside Hero */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.navyLight }]}>
              <MaterialIcons name="directions-car" size={16} color={COLORS.navy} />
            </View>
            <ThemedText style={styles.statSmallLabel}>Occupied</ThemedText>
            <ThemedText style={styles.statValue}>{summary.active_count}</ThemedText>
            <ThemedText style={styles.statMeta}>out of {summary.total_capacity}</ThemedText>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.tealLight }]}>
              <MaterialIcons name="local-parking" size={16} color={COLORS.teal} />
            </View>
            <ThemedText style={styles.statSmallLabel}>Occupancy</ThemedText>
            <ThemedText style={styles.statValue}>{summary.occupancy_percent}%</ThemedText>
            <ThemedText style={styles.statMeta}>{summary.total_capacity} available</ThemedText>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.amberChip }]}>
              <MaterialIcons name="traffic" size={16} color={getTrafficColor(summary.traffic_level)} />
            </View>
            <ThemedText style={styles.statSmallLabel}>Traffic load</ThemedText>
            <ThemedText style={[styles.statValue, { color: getTrafficColor(summary.traffic_level) }]}>
              {summary.traffic_level === 'Low' ? 'Pass' : summary.traffic_level}
            </ThemedText>
            <ThemedText style={styles.statMeta}>{summary.occupancy_percent}% occupied</ThemedText>
          </View>
        </View>
      </View>

      {/* Main Content Area with Light Background */}
      <View style={styles.contentSection}>
        <View style={styles.searchBarRow}>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Plate, owner, or ID..."
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
          <Pressable style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={15} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
            <ThemedText style={styles.filterText}>Filter</ThemedText>
          </Pressable>
        </View>

        <Pressable style={styles.csvButton}>
          <MaterialIcons name="file-download" size={17} color={COLORS.white} style={{ marginRight: 8 }} />
          <ThemedText style={styles.csvText}>Export CSV</ThemedText>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="directions-car" size={17} color={COLORS.textPrimary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Currently Parked Vehicles
            </ThemedText>
          </View>

          <View style={styles.slotsCard}>
            <ThemedText style={styles.slotsTitle}>ACTIVE PARKING SLOTS</ThemedText>
            <View style={styles.slotsGrid}>
              {slots.map(slot => (
                <View key={slot.id} style={[styles.slotItem, slot.occupied ? styles.slotOccupied : styles.slotAvailable]}>
                  <ThemedText style={[styles.slotText, slot.occupied && styles.slotTextOccupied]}>{slot.id}</ThemedText>
                </View>
              ))}
            </View>
            <View style={styles.slotsLegendRow}>
              <View style={styles.slotsLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.navy }]} />
                <ThemedText style={styles.slotsLegendText}>Occupied</ThemedText>
              </View>
              <View style={styles.slotsLegendItem}>
                <View style={[styles.legendDot, styles.legendDotOutline]} />
                <ThemedText style={styles.slotsLegendText}>Available</ThemedText>
              </View>
              <ThemedText style={styles.slotsMeta}>{occupiedSlots} occupied · {availableSlots} available</ThemedText>
            </View>
          </View>

          <View style={styles.listCard}>
            <View style={styles.listCardHeader}>
              <MaterialIcons name="receipt-long" size={16} color={COLORS.textPrimary} />
              <ThemedText style={styles.listCardTitle}>Transactions</ThemedText>
            </View>
            <ThemedText style={styles.listCardSubtitle}>CURRENTLY PARKED</ThemedText>

            {sessions.map((s, i) => (
              <View key={s.session_uuid ?? s.id} style={[styles.vehicleRow, i === sessions.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.vehicleIconWrap}>
                  <MaterialIcons name="directions-car" size={17} color={COLORS.blue} />
                </View>
                <View style={styles.vehicleInfo}>
                  <ThemedText style={styles.vehicleId}>{s.vehicle_id ?? s.id}</ThemedText>
                  <ThemedText style={styles.vehicleDetail}>
                    {s.owner_name || 'Unknown'} · in {s.start_time ? new Date(s.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--'}
                  </ThemedText>
                </View>
                <View style={styles.vehicleRight}>
                  <ThemedText style={styles.vehicleSlot}>Slot {s.slot_number ?? s.slot ?? '--'}</ThemedText>
                  <View style={[styles.statusPill, isOverstay(s.status) ? styles.statusPillOverstay : styles.statusPillActive]}>
                    <ThemedText style={[styles.statusPillText, isOverstay(s.status) ? styles.statusPillTextOverstay : styles.statusPillTextActive]}>
                      {isOverstay(s.status) ? 'Overstay' : 'Parked'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt-long" size={17} color={COLORS.textPrimary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Transactions
            </ThemedText>
          </View>

          <View style={styles.tableHeader}>
            <ThemedText style={styles.tableHeaderText}>ID</ThemedText>
            <ThemedText style={styles.tableHeaderText}>VEHICLE</ThemedText>
            <ThemedText style={styles.tableHeaderText}>OWNER</ThemedText>
            <ThemedText style={styles.tableHeaderText}>STATUS</ThemedText>
          </View>

          {transactions.map(tx => (
            <View key={tx.id} style={styles.tableRow}>
              <ThemedText style={styles.tableCell}>{tx.transaction_uuid ?? tx.id}</ThemedText>
              <ThemedText style={styles.tableCell}>{(tx.vehicle_plate || '')}</ThemedText>
              <ThemedText style={styles.tableCell}>{tx.owner_name || ''}</ThemedText>
              <ThemedText style={[styles.tableCell, tx.status === 'completed' || tx.status === 'completed' ? styles.paidStatus : styles.unpaidStatus]}>{tx.status}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
  heroSection: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  contentSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  headerWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  header: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    marginBottom: 2,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    padding: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statSmallLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  trafficValue: {
    color: COLORS.warning,
  },
  statMeta: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    paddingVertical: 11,
    fontSize: 13,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  csvButton: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  csvText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  slotsCard: {
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  slotsTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    color: COLORS.warning,
    letterSpacing: 0.5,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  slotItem: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotAvailable: {
    backgroundColor: '#ffffff',
  },
  slotOccupied: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  slotText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },
  slotTextOccupied: {
    color: '#ffffff',
  },
  slotsLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  slotsLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDotOutline: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border },
  slotsLegendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  slotsMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // Currently-parked list card
  listCard: {
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  listCardSubtitle: {
    fontSize: 10, fontWeight: '700', color: COLORS.teal,
    letterSpacing: 0.5, marginBottom: 6,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  vehicleIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleInfo: { flex: 1 },
  vehicleId: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  vehicleDetail: {
    color: COLORS.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  vehicleRight: { alignItems: 'flex-end', gap: 5 },
  vehicleSlot: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  statusPillActive: { backgroundColor: COLORS.successBg },
  statusPillOverstay: { backgroundColor: COLORS.overstayBg },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  statusPillTextActive: { color: COLORS.successText },
  statusPillTextOverstay: { color: COLORS.overstayText },

  tableHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeaderText: {
    flex: 1,
    minWidth: 70,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    minWidth: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tableCell: {
    flex: 1,
    minWidth: 70,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  paidStatus: {
    color: COLORS.paidText,
    fontWeight: '700',
  },
  unpaidStatus: {
    color: COLORS.unpaidText,
    fontWeight: '700',
  },
});