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
  navy: Colors.light.tint,
  teal: '#13B4AA',
  white: Colors.light.background,
  surface: '#F5F6F8',
  border: '#D4D6D8',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#a0aac7',
  amber: '#F59E0B',
  paidBg: '#D1FAE5',
  paidText: '#065F46',
  unpaidBg: '#FEF3C7',
  unpaidText: '#B45309',
  blue: '#3B82F6',
  orange: '#F97316',
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
      <View style={[iconStyles.wrap, { backgroundColor: '#EFF6FF' }]}>
        <View style={iconStyles.carRoof} />
        <View style={iconStyles.carBody} />
        <View style={iconStyles.carWheels}>
          <View style={[iconStyles.carWheel, { borderColor: C.blue }]} />
          <View style={[iconStyles.carWheel, { borderColor: C.blue }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={[iconStyles.wrap, { backgroundColor: '#FFF7ED' }]}>
      <View style={iconStyles.motoBody} />
      <View style={iconStyles.motoWheels}>
        <View style={[iconStyles.motoWheel, { borderColor: C.orange }]} />
        <View style={[iconStyles.motoWheel, { borderColor: C.orange }]} />
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  carRoof: {
    width: 14, height: 7,
    backgroundColor: C.blue,
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
  },
  carBody: {
    width: 22, height: 8,
    backgroundColor: C.blue, borderRadius: 2,
  },
  carWheels: { flexDirection: 'row', gap: 8, marginTop: 1 },
  carWheel: {
    width: 7, height: 7, borderRadius: 4,
    borderWidth: 2, backgroundColor: C.white,
  },
  motoBody: {
    width: 20, height: 8,
    backgroundColor: C.orange, borderRadius: 3,
    marginBottom: 2,
  },
  motoWheels: { flexDirection: 'row', gap: 6 },
  motoWheel: {
    width: 7, height: 7, borderRadius: 4,
    borderWidth: 2, backgroundColor: C.white,
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
            plate: item.plate || 'N/A',
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

  const TxCard = ({ tx }: { tx: Transaction }) => (
    <View style={styles.txCard}>
      <VehicleIcon type={tx.vehicleType} />
      <View style={styles.txInfo}>
        <Text style={styles.txPlate}>{tx.plate}</Text>
        <Text style={styles.txDetail}>
          {tx.wheels} · {tx.entry} · {tx.exit}
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

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.navLogoMark}>
            <Text style={styles.navLogoText}>P</Text>
          </View>
          <Text style={styles.navTitle}>Transaction History</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search plate number"
              placeholderTextColor={C.textMuted}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterIcon}>⇅</Text>
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
                {tab}
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
                <Text style={styles.sectionLabel}>TODAY</Text>
                {todayTxs.map(tx => <TxCard key={tx.id} tx={tx} />)}
              </>
            )}

            {yesterdayTxs.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>PREVIOUS</Text>
                {yesterdayTxs.map(tx => <TxCard key={tx.id} tx={tx} />)}
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

  navbar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navLogoMark: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: C.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  navLogoText: { color: C.white, fontWeight: '800', fontSize: 14 },
  navTitle: { color: C.white, fontWeight: '700', fontSize: 18 },

  scroll: { flex: 1, backgroundColor: C.white },
  scrollContent: { padding: 16 },

  // Search
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: {
    flex: 1, paddingVertical: 10,
    fontSize: 13, color: C.textPrimary,
  },
  filterBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterIcon: { fontSize: 16, color: C.textSecondary },
  loadingWrap: { paddingVertical: 20, alignItems: 'center' },

  // Filter Tabs
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTabText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  filterTabTextActive: { color: C.white },

  // Section Label
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    color: C.textMuted, letterSpacing: 0.8,
    marginBottom: 8, marginTop: 4,
  },

  // Transaction Card
  txCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  txInfo: { flex: 1 },
  txPlate: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 3 },
  txDetail: { fontSize: 11, color: C.textMuted, lineHeight: 16 },
  txRight: { alignItems: 'flex-end', gap: 4 },
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
