import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
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
  border: '#E4E6E8',
  unpaidBg: '#FFF4E5',
  unpaidText: '#F39C12',
  paidBg: '#E8F8EE',
  paidText: '#4CAF50',
  green: '#4CAF50',
  amber: '#F39C12',
  red: '#A92525',
};

type Payment = {
  transactionId: number;
  id: string;
  name: string;
  plate: string;
  ownerName: string;
  method: string;
  brand: string;
  model: string;
  color: string;
  entry: string;
  exit: string;
  fee: string;
  amount: string;
  status: 'Unpaid' | 'Paid';
};

// Payments will be loaded from backend transactions endpoint

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const PaymentCard = ({
  payment,
  onMarkPaid,
  onSkip,
}: {
  payment: Payment;
  onMarkPaid: (transactionId: number) => void;
  onSkip: (transactionId: number) => void;
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
            onPress={() => onMarkPaid(payment.transactionId)}
            activeOpacity={0.8}>
            <Text style={styles.markPaidText}>Mark Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => onSkip(payment.transactionId)}
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
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
const txs = await apiRequest<any[]>('/api/payments');
      if (!mounted || !Array.isArray(txs)) return;

      const mapped: Payment[] = txs.map(t => ({
        transactionId: Number(t.id ?? 0),
        id: String(t.transaction_uuid ?? t.id ?? ''),
        name: t.owner_name || 'Unknown',
        plate: t.plate || 'N/A',
        ownerName: t.owner_name || 'Unknown',
        method: t.method || 'cash',
        brand: t.reference || 'N/A',
        model: t.currency || 'N/A',
        color: '-',
        entry: t.created_at ? new Date(t.created_at).toLocaleString() : '--',
        exit: t.status === 'completed' ? 'Paid' : 'Pending',
        fee: (typeof t.amount === 'number' ? `₱${t.amount.toFixed(2)}` : String(t.amount ?? '₱0.00')),
        amount: (typeof t.amount === 'number' ? `₱${t.amount.toFixed(2)}` : String(t.amount ?? '₱0.00')),
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

  const handleMarkPaid = async (transactionId: number) => {
    try {
      await apiRequest(`/api/payments/${transactionId}/pay`, {
        method: 'POST',
      });
      setPayments(prev =>
        prev.map(p =>
          p.transactionId === transactionId ? { ...p, status: 'Paid', exit: 'Paid' } : p,
        ),
      );
    } catch (error) {
      Alert.alert('Payment error', error instanceof Error ? error.message : 'Unable to mark payment paid');
    }
  };

  const handleSkip = (transactionId: number) => {
    setPayments(prev => prev.filter(p => p.transactionId !== transactionId));
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
          <View style={styles.lastUpdatedRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <ThemedText style={styles.lastUpdated}>
              Last updated: {new Date().toLocaleTimeString()}
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={15} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={styles.exportText}>Export CSV</ThemedText>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <StatCard label="Paid today" value={paidCount} />
          <StatCard label="Unpaid" value={unpaidCount} />
          <StatCard label="Fixed fee / session" value="₱10" />
        </View>

        <View style={styles.tabsRow}>
          <View style={styles.tabPillActive}>
            <ThemedText style={styles.tabTextActive}>Payment Confirmation</ThemedText>
          </View>
          <View style={styles.tabPillInactive}>
            <ThemedText style={styles.tabTextInactive}>Pending Payments</ThemedText>
          </View>
        </View>

        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={26} color={COLORS.border} />
            <ThemedText style={styles.emptyText}>No payments to confirm yet</ThemedText>
          </View>
        ) : (
          payments.map(payment => (
            <PaymentCard
              key={payment.transactionId}
              payment={payment}
              onMarkPaid={handleMarkPaid}
              onSkip={handleSkip}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ThemedView>
  );
}

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
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  pageTitle: {
    marginBottom: 4,
    color: '#1F2430',
    fontSize: 20,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  logoutBtn: {
    padding: 6,
    borderRadius: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
  },
  exportText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.teal,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabPillActive: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabPillInactive: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextInactive: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  emptyText: {
    color: COLORS.amber,
    fontSize: 13,
    fontWeight: '600',
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