import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import TopBar from '@/components/ui/top-bar';
import { apiRequest } from '@/lib/api';

const COLORS = {
  navy: '#1D3D8A',
  navyDark: '#0e1620',
  secondaryBlue: '#2A4EA3',
  teal: '#13B4AA',
  tealLight: '#E8F8EE',
  tealMid: '#3CC9B8',
  white: '#FFFFFF',
  surface: '#F5F6F8',
  cardBg: '#FFFFFF',
  textPrimary: '#2C2C33',
  textSecondary: '#6A707F',
  textMuted: '#6A707F',
  border: '#D4D6D8',
  unpaidBg: '#FFF4E5',
  unpaidText: '#F39C12',
  paidBg: '#E8F8EE',
  paidText: '#4CAF50',
  green: '#4CAF50',
  amber: '#F39C12',
  red: '#A92525',
};

type Payment = {
  id: string;
  name: string;
  brand: string;
  model: string;
  color: string;
  entry: string;
  exit: string;
  fee: string;
  status: 'Unpaid' | 'Paid';
};

// Payments will be loaded from backend transactions endpoint

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) => (
  <View style={[styles.statCard, accent && styles.statCardAccent]}>
    <Text style={[styles.statValue, accent && styles.statValueAccent]}>
      {value}
    </Text>
    <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>
      {label}
    </Text>
  </View>
);

const PaymentCard = ({
  payment,
  onMarkPaid,
  onSkip,
}: {
  payment: Payment;
  onMarkPaid: (id: string) => void;
  onSkip: (id: string) => void;
}) => {
  const isPaid = payment.status === 'Paid';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardId}>ID: {payment.id}</Text>
        <View
          style={[
            styles.statusBadge,
            isPaid ? styles.statusPaid : styles.statusUnpaid,
          ]}>
          <Text
            style={[
              styles.statusText,
              isPaid ? styles.statusTextPaid : styles.statusTextUnpaid,
            ]}>
            {payment.status}
          </Text>
        </View>
      </View>

      <Text style={styles.cardName}>{payment.name}</Text>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Brand</Text>
          <Text style={styles.detailValue}>{payment.brand}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Model</Text>
          <Text style={styles.detailValue}>{payment.model}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Color</Text>
          <Text style={styles.detailValue}>{payment.color}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Entry</Text>
          <Text style={styles.detailValue}>{payment.entry}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Exit</Text>
          <Text style={styles.detailValue}>{payment.exit}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Fee</Text>
          <Text style={styles.feeValue}>{payment.fee}</Text>
        </View>
      </View>

      {!isPaid ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.markPaidBtn}
            onPress={() => onMarkPaid(payment.id)}
            activeOpacity={0.8}>
            <Text style={styles.markPaidText}>Mark Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => onSkip(payment.id)}
            activeOpacity={0.8}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.confirmedRow}>
          <Text style={styles.confirmedText}>Confirmed ✓</Text>
        </View>
      )}
    </View>
  );
};

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const txs = await apiRequest<any[]>('/api/transactions/recent');
        if (!mounted || !Array.isArray(txs)) return;

        const mapped: Payment[] = txs.map(t => ({
          id: String(t.id ?? t.transaction_uuid ?? ''),
          name: t.owner_name || 'Unknown',
          brand: t.vehicle_plate || '',
          model: t.method || '',
          color: '',
          entry: t.created_at ? new Date(t.created_at).toLocaleString() : '--',
          exit: '--',
          fee: (typeof t.amount === 'number' ? `${t.currency || ''} ${t.amount}` : String(t.amount ?? '')),
          status: (t.status === 'completed' || t.status === 'paid') ? 'Paid' : 'Unpaid',
        }));

        setPayments(mapped);
      } catch (err) {
        console.warn('Failed to load transactions', err);
      }
    };

    load();

    return () => { mounted = false; };
  }, []);

  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const unpaidCount = payments.filter(p => p.status === 'Unpaid').length;

  const handleMarkPaid = (id: string) => {
    setPayments(prev =>
      prev.map(p => (p.id === id ? { ...p, status: 'Paid' } : p)),
    );
  };

  const handleSkip = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <TopBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.pageTitle}>
            Payment Management
          </ThemedText>
          <ThemedText style={styles.pageSubtitle}>
            Confirm and track parking fee payments
          </ThemedText>
          <ThemedText style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleTimeString()}
          </ThemedText>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.exportBtn} activeOpacity={0.8}>
            <ThemedText style={styles.exportText}>⬇ Export CSV</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Paid today" value={paidCount} />
          <StatCard label="Unpaid" value={unpaidCount} accent />
          <StatCard label="Fixed fee / session" value="₱10" />
        </View>

        <View style={styles.sectionRow}>
          <ThemedText style={styles.sectionLabel}>Payment Confirmation</ThemedText>
          <ThemedText style={styles.sectionLabelRight}>Pending Payments</ThemedText>
        </View>

        {payments.map(payment => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onMarkPaid={handleMarkPaid}
            onSkip={handleSkip}
          />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  pageTitle: {
    marginBottom: 6,
    color: '#2C2C33',
  },
  pageSubtitle: {
    color: '#6A707F',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#a0aac7',
  },

  logoutBtn: {
    padding: 6,
    borderRadius: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  exportBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  exportText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statCardAccent: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  statValue: {
    color: '#2C2C33',
    fontSize: 22,
    fontWeight: '700',
  },
  statValueAccent: {
    color: '#2C2C33',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  statLabelAccent: {
    color: '#9fb1ff',
  },
  sectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionLabelRight: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardId: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: '#E8F8EE',
  },
  statusUnpaid: {
    backgroundColor: '#FFF4E5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPaid: {
    color: COLORS.paidText,
  },
  statusTextUnpaid: {
    color: COLORS.unpaidText,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: 110,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#2C2C33',
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  markPaidBtn: {
    flex: 2,
    backgroundColor: COLORS.teal,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  markPaidText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmedRow: {
    backgroundColor: COLORS.paidBg,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmedText: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13,
  },
});