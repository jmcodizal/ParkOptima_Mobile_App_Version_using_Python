import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { apiRequest } from '../../../lib/api';

const C = {
  navy: '#1E3A8A',
  navyDark: '#08131F',
  teal: '#0EA5A0',
  white: Colors.light.background,
  surface: '#F4F6F9',
  border: '#E4E7EC',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  amber: '#F59E0B',
  paidBg: '#D1FAE5',
  paidText: '#065F46',
  unpaidBg: '#FEE2E2',
  unpaidText: '#B91C1C',
  blue: '#3B82F6',
  blueLight: '#E7EFFE',
  orange: '#F97316',
  tealLight: '#DBF5F2',
};

type FilterTab = 'All' | 'Paid' | 'Unpaid' | 'Today';
type VehicleType = '4wheels' | '2wheels';

type Transaction = {
  id: number;
  plate: string;
  vehicleType: VehicleType;
  wheels: string;
  entry: string;
  exit: string;
  amount: string;
  status: 'Paid' | 'Unpaid';
  date: 'today' | 'yesterday';
};

function VehicleIcon({ type }: { type: VehicleType }) {
  if (type === '4wheels') {
    return (
      <View style={[iconStyles.wrap, { backgroundColor: C.blueLight }]}>
        <Ionicons name="car-sport" size={18} color={C.blue} />
      </View>
    );
  }
  return (
    <View style={[iconStyles.wrap, { backgroundColor: C.tealLight }]}>
      <Ionicons name="bicycle" size={18} color={C.teal} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});

export default function TransactionHistory() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadTransactions = async () => {
      try {
        const response = await apiRequest<any[]>('/api/owner/transactions');
        if (!isMounted) {
          return;
        }

        const mapped = response.map((item: any) => {
          const createdAt = new Date(item.created_at);
          const isToday = createdAt.toDateString() === new Date().toDateString();
          return {
            id: Number(item.id),
            plate: item.plate || `#${Number(item.id)}`,
            vehicleType: item.vehicle_type === '2wheels' ? '2wheels' : '4wheels',
            wheels: item.vehicle_type === '2wheels' ? '2 wheels' : '4 wheels',
            entry: `In ${createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
            exit: item.status === 'pending' ? 'still parked' : `Out ${createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
            amount: `₱${Number(item.amount || 0).toFixed(2)}`,
            status: item.status === 'completed' ? 'Paid' : 'Unpaid',
            date: isToday ? 'today' : 'yesterday',
          } as Transaction;
        });
        setTransactions(mapped);
      } catch (error) {
        console.error('Failed to load transactions', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = transactions.filter(tx => {
    const matchSearch = tx.plate.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Paid' ? tx.status === 'Paid' :
      activeFilter === 'Unpaid' ? tx.status === 'Unpaid' :
      tx.date === 'today';
    return matchSearch && matchFilter;
  });

  const todayTxs = filtered.filter(tx => tx.date === 'today');
  const yesterdayTxs = filtered.filter(tx => tx.date === 'yesterday');

  const paidCount = transactions.filter(tx => tx.status === 'Paid').length;
  const unpaidCount = transactions.filter(tx => tx.status === 'Unpaid').length;
  const todayCount = transactions.filter(tx => tx.date === 'today').length;

  const filterCounts: Record<FilterTab, number> = {
    All: transactions.length,
    Paid: paidCount,
    Unpaid: unpaidCount,
    Today: todayCount,
  };

  const TxCard = ({ tx, isLast }: { tx: Transaction; isLast: boolean }) => (
    <View style={[styles.txCard, isLast && { borderBottomWidth: 0 }]}>
      <VehicleIcon type={tx.vehicleType} />
      <View style={styles.txInfo}>
        <Text style={styles.txPlate}>{tx.plate}</Text>
        <Text style={styles.txDetail}>
          Entered {tx.entry.replace('In ', '')} · {tx.wheels}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>{tx.amount}</Text>
        <View style={[styles.statusBadge,
          tx.status === 'Paid' ? styles.statusPaid : styles.statusUnpaid]}>
          <Text style={[styles.statusText,
            tx.status === 'Paid' ? styles.statusTextPaid : styles.statusTextUnpaid]}>
            {tx.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

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
        <Text style={styles.headerTitle}>Transaction history</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={C.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search plate number"
              placeholderTextColor={C.textMuted}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="swap-vertical" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['All', 'Paid', 'Unpaid', 'Today'] as FilterTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.8}>
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab} {filterCounts[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={C.teal} />
          </View>
        ) : (
          <>
            {todayTxs.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>TODAY · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</Text>
                <View style={styles.txGroup}>
                  {todayTxs.map((tx, i) => <TxCard key={tx.id} tx={tx} isLast={i === todayTxs.length - 1} />)}
                </View>
              </>
            )}

            {yesterdayTxs.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>YESTERDAY</Text>
                <View style={styles.txGroup}>
                  {yesterdayTxs.map((tx, i) => <TxCard key={tx.id} tx={tx} isLast={i === yesterdayTxs.length - 1} />)}
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.navy },

  // Navbar — matches Overview
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogoMark: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  navLogoText: { color: C.navy, fontWeight: '800', fontSize: 13 },
  navLotLabel: { color: C.teal, fontSize: 10, fontWeight: '700', marginBottom: 1 },
  navBrand: { color: C.white, fontWeight: '700', fontSize: 15 },
  bellWrap: { position: 'relative', padding: 4 },
  bellIcon: { fontSize: 18 },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.amber,
    borderWidth: 1.5, borderColor: C.navy,
  },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Header — matches Overview
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingBottom: 18,
  },
  headerTitle: { fontSize: 21, fontWeight: '800', color: C.white },

  scroll: { flex: 1, backgroundColor: C.surface },
  scrollContent: { padding: 16, paddingTop: 18 },

  // Search
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'center' },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: {
    flex: 1, paddingVertical: 11,
    fontSize: 13, color: C.textPrimary,
  },
  filterBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingWrap: { paddingVertical: 20, alignItems: 'center' },

  // Filter Tabs
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTabText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  filterTabTextActive: { color: C.white },

  // Section Label
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: C.textMuted, letterSpacing: 0.6,
    marginBottom: 8, marginTop: 4,
  },

  // Transaction Card group + card
  txGroup: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 16,
    paddingHorizontal: 12,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  txCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  txInfo: { flex: 1 },
  txPlate: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 3 },
  txDetail: { fontSize: 11, color: C.textMuted, lineHeight: 16 },
  txRight: { alignItems: 'flex-end', gap: 5 },
  txAmount: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 20,
  },
  statusPaid: { backgroundColor: C.paidBg },
  statusUnpaid: { backgroundColor: C.unpaidBg },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextPaid: { color: C.paidText },
  statusTextUnpaid: { color: C.unpaidText },

});