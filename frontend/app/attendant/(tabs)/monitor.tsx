import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import TopBar from '@/components/ui/top-bar';
import { apiRequest } from '@/lib/api';

const COLORS = {
  navy: '#1D3D8A',
  surface: '#F5F6F8',
  white: '#FFFFFF',
  textPrimary: '#2C2C33',
  textSecondary: '#6A707F',
  textMuted: '#a0aac7',
  border: '#D4D6D8',
  successBg: '#E8F8EE',
  warningBg: '#FFF4E5',
  warning: '#F39C12',
  teal: '#13B4AA',
  secondaryBlue: '#2A4EA3',
  placeholder: '#BDBDBD',
  shadow: '#E8EAF0',
  paidText: '#4CAF50',
  unpaidText: '#F39C12',
};

export default function MonitorScreen() {
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
        const s = await apiRequest<any[]>('/api/sessions/active');
        const t = await apiRequest<any[]>('/api/transactions/recent');
        const sl = await apiRequest<any[]>('/api/monitor/slots?slots=100');
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

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <TopBar />
      
      {/* Hero Section with Dark Background */}
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
            <View style={styles.statIconContainer}>
              <MaterialIcons name="directions-car" size={24} color={COLORS.teal} />
            </View>
            <ThemedText style={styles.statSmallLabel}>Currently Occupied</ThemedText>
            <ThemedText style={styles.statValue}>{summary.active_count}</ThemedText>
            <ThemedText style={styles.statMeta}>out of {summary.total_capacity}</ThemedText>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="local-parking" size={24} color={COLORS.teal} />
            </View>
            <ThemedText style={styles.statSmallLabel}>Parking Occupancy</ThemedText>
            <ThemedText style={styles.statValue}>{summary.occupancy_percent}%</ThemedText>
            <ThemedText style={styles.statMeta}>{summary.total_capacity} available</ThemedText>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="traffic" size={24} color={getTrafficColor(summary.traffic_level)} />
            </View>
            <ThemedText style={styles.statSmallLabel}>Traffic Load</ThemedText>
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
          <TextInput
            style={styles.searchInput}
            placeholder="Plate, owner, or ID..."
            placeholderTextColor={COLORS.placeholder}
          />
          <Pressable style={styles.filterButton}>
            <ThemedText style={styles.filterText}>Filter</ThemedText>
          </Pressable>
          <Pressable style={styles.csvButton}>
            <MaterialIcons name="download" size={18} color={COLORS.white} style={{marginRight: 4}} />
            <ThemedText style={styles.csvText}>CSV</ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="directions-car" size={20} color={COLORS.textPrimary} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Currently Parked Vehicles
            </ThemedText>
          </View>

            <View style={styles.slotsCard}>
              <ThemedText style={styles.slotsTitle}>Active Parking Slots</ThemedText>
              <View style={styles.slotsGrid}>
                {slots.map(slot => (
                  <View key={slot.id} style={[styles.slotItem, slot.occupied ? styles.slotOccupied : styles.slotAvailable]}>
                    <ThemedText style={[styles.slotText, slot.occupied && styles.slotTextOccupied]}>{slot.id}</ThemedText>
                  </View>
                ))}
              </View>
              <ThemedText style={styles.slotsMeta}>{slots.filter(s => s.occupied).length} occupied - {Math.max(0, slots.length - slots.filter(s => s.occupied).length)} available of {slots.length} total</ThemedText>
            </View>

            {sessions.map(s => (
            <View key={s.session_uuid ?? s.id} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <View>
                  <ThemedText style={styles.vehicleId}>{s.vehicle_id ?? s.id}</ThemedText>
                  <ThemedText style={styles.vehicleType}>{(s.make || '') + ' ' + (s.model || '')}</ThemedText>
                </View>
                <View style={styles.statusPillActive}>
                  <ThemedText style={styles.statusPillText}>{(s.status || '').toUpperCase()}</ThemedText>
                </View>
              </View>
              <View style={styles.vehicleBody}>
                <View style={styles.vehicleBodyItem}>
                  <ThemedText style={styles.vehicleLabel}>Owner</ThemedText>
                  <ThemedText style={styles.vehicleOwner}>{s.owner_name || 'Unknown'}</ThemedText>
                </View>
                <View style={styles.vehicleBodyItem}>
                  <ThemedText style={styles.vehicleLabel}>Entry Time</ThemedText>
                  <ThemedText style={styles.vehicleDetail}>{s.start_time ? new Date(s.start_time).toLocaleString() : '--'}</ThemedText>
                </View>
                <View style={styles.vehicleBodyItem}>
                  <ThemedText style={styles.vehicleLabel}>Duration</ThemedText>
                  <ThemedText style={styles.vehicleDetail}>{s.duration_seconds ? new Date(s.duration_seconds * 1000).toISOString().substr(11, 8) : '--'}</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Transactions
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
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroSection: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 8,
  },
  header: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    marginBottom: 2,
    fontSize: 28,
  },
  subtitle: {
    color: COLORS.border,
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    color: COLORS.border,
    fontSize: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statSmallLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  trafficValue: {
    color: COLORS.warning,
  },
  statMeta: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  csvButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  csvText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: '700',
  },
  vehicleCard: {
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleId: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  vehicleType: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  statusPillActive: {
    borderRadius: 20,
    backgroundColor: COLORS.successBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusPillInactive: {
    borderRadius: 20,
    backgroundColor: COLORS.warningBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusPillText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleBodyItem: {
    flex: 1,
    minWidth: 120,
  },
  vehicleLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  vehicleOwner: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  vehicleDetail: {
    color: COLORS.secondaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  slotsCard: {
    borderRadius: 12,
    backgroundColor: COLORS.white,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    color: COLORS.textPrimary,
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
  slotsMeta: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
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
    shadowOpacity: 0.35,
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
