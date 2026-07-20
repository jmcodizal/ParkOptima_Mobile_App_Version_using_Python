import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { apiRequest } from '../../../lib/api';

const C = {
  navy: '#1E3A8A',
  navyDark: '#152a63',
  white: Colors.light.background,
  surface: '#F4F6F9',
  border: '#E4E7EC',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  amber: '#F59E0B',
  amberLight: '#FEF3E2',
  amberBorder: '#FCE3B6',
  amberIconBg: '#FDECD1',
  green: '#10B981',
  greenLight: '#DCFCE9',
  orange: '#F97316',
  chartTeal: '#2F6FED',
  teal: '#0EA5A0',
  blue: '#2F6FED',
  blueLight: '#E7EFFE',
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Simple sparkline chart using Views
function SparkLine({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const H = 60;
  const W = width - 64;
  const segW = W / (points.length - 1);

  return (
    <View style={{ height: H, width: W, position: 'relative' }}>
      {points.map((p, i) => {
        if (i === points.length - 1) return null;
        const x1 = i * segW;
        const y1 = H - ((p - min) / (max - min || 1)) * H;
        const x2 = (i + 1) * segW;
        const y2 = H - ((points[i + 1] - min) / (max - min || 1)) * H;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 3,
              backgroundColor: C.chartTeal,
              borderRadius: 2,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 0',
            }}
          />
        );
      })}
    </View>
  );
}

// Donut ring using border trick
function DonutChart({ percent }: { percent: number }) {
  return (
    <View style={donut.wrap}>
      <View style={donut.ring}>
        <View style={donut.inner}>
          <Text style={donut.pct}>{percent}%</Text>
          <Text style={donut.label}>FULL</Text>
        </View>
      </View>
    </View>
  );
}

const donut = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 9,
    borderColor: C.orange,
    borderTopColor: C.orange,
    borderRightColor: C.orange,
    borderBottomColor: C.border,
    borderLeftColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  inner: {
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  pct: { fontSize: 18, fontWeight: '800', color: C.textPrimary },
  label: { fontSize: 9, color: C.textMuted, fontWeight: '700', letterSpacing: 0.5 },
});

export default function OwnerDashboard() {
  const [chartTab, setChartTab] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const data = await apiRequest<any>('/api/owner/dashboard');
        if (isMounted) {
          setDashboard(data);
        }
      } catch (error) {
        console.error('Dashboard load failed', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const chartPoints = useMemo(() => {
    const hourlyFlow = dashboard?.hourly_flow || [];
    return hourlyFlow.slice(0, 12).length > 0 ? hourlyFlow.slice(0, 12) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }, [dashboard]);

  const occupancyPercent = dashboard?.active_count && dashboard?.vehicle_count
    ? Math.min(100, Math.round((dashboard.active_count / Math.max(1, dashboard.vehicle_count)) * 100))
    : 0;

  const availableSlots = Math.max(0, (dashboard?.vehicle_count || 0) - (dashboard?.active_count || 0));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Navbar */}
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.parkingName}>OWNER CONSOLE</Text>
        <Text style={styles.greeting}>{loading ? 'Loading dashboard…' : `Good afternoon, ${dashboard?.owner_name || 'Owner'}`}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Capacity Warning Banner */}
        <TouchableOpacity style={styles.warningBanner} activeOpacity={0.8}>
          <View style={styles.warningIconWrap}>
            <Text style={styles.warningIcon}>⚠️</Text>
          </View>
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>Lot activity overview</Text>
            <Text style={styles.warningSubtitle}>{dashboard?.active_count ?? 0} active sessions · {dashboard?.collection_rate ?? 0}% collection rate</Text>
          </View>
          <Text style={styles.warningChevron}>›</Text>
        </TouchableOpacity>

        {/* Real-time Occupancy Card */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <View style={styles.occupancyTitleRow}>
              <Text style={styles.sectionIcon}>📊</Text>
              <Text style={styles.sectionTitle}>Real-time occupancy</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.occupancyBody}>
            {loading ? (
              <ActivityIndicator size="small" color={C.blue} />
            ) : (
              <>
                <DonutChart percent={occupancyPercent} />
                <View style={styles.occupancyStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Occupied</Text>
                    <Text style={styles.statValue}>{dashboard?.active_count ?? 0} / {dashboard?.vehicle_count ?? 0}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Available</Text>
                    <Text style={[styles.statValue, { color: C.teal }]}>{availableSlots} slots</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Transactions</Text>
                    <Text style={styles.statValue}>{dashboard?.total_transactions ?? 0}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Stat Cards Row */}
        <View style={styles.statCardsRow}>
          {/* Revenue */}
          <View style={styles.statCard}>
            <View style={[styles.statCardIconWrap, { backgroundColor: C.amberIconBg }]}>
              <Text style={styles.statCardIcon}>🏷️</Text>
            </View>
            <Text style={styles.statCardLabel}>Today's revenue</Text>
            <Text style={styles.statCardValue}>{loading ? '—' : `₱${Number(dashboard?.revenue_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
            <View style={styles.statCardBadge}>
              <Text style={styles.statCardBadgeText}>↑ 12% vs yesterday</Text>
            </View>
          </View>

          {/* Active Vehicles */}
          <View style={styles.statCard}>
            <View style={[styles.statCardIconWrap, { backgroundColor: C.blueLight }]}>
              <Text style={styles.statCardIcon}>🚗</Text>
            </View>
            <Text style={styles.statCardLabel}>Active vehicles</Text>
            <Text style={styles.statCardValue}>{dashboard?.active_count ?? 0}</Text>
            <Text style={styles.statCardSub}>{dashboard?.vehicle_count ?? 0} registered vehicles</Text>
          </View>
        </View>

        {/* Analytics Card */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <View style={styles.analyticsTitleRow}>
              <Text style={styles.sectionIcon}>📈</Text>
              <Text style={styles.sectionTitle}>Analytics</Text>
            </View>
            <View style={styles.chartTabs}>
              {(['Day', 'Week', 'Month'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.chartTab, chartTab === tab && styles.chartTabActive]}
                  onPress={() => setChartTab(tab)}
                  activeOpacity={0.7}>
                  <Text style={[styles.chartTabText, chartTab === tab && styles.chartTabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.chartArea}>
            <SparkLine points={chartPoints} />
          </View>

          <View style={styles.chartXLabels}>
            {['6am', '10pm', '6pm', '12am'].map(l => (
              <Text key={l} style={styles.chartXLabel}>{l}</Text>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <View style={styles.analyticsTitleRow}>
              <Text style={styles.sectionIcon}>🧾</Text>
              <Text style={styles.sectionTitle}>Recent transactions</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {(dashboard?.recent_transactions || []).map((tx: any, i: number) => (
            <View
              key={tx.id}
              style={[styles.txRow, i > 0 && styles.txRowBorder]}>
              <View>
                <Text style={styles.txPlate}>{tx.plate}</Text>
                <Text style={styles.txTime}>{new Date(tx.created_at).toLocaleString()}</Text>
              </View>
              <Text style={styles.txAmount}>{`₱${Number(tx.amount || 0).toFixed(2)}`}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.navy },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoMark: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  navBrand: { color: C.white, fontWeight: '700', fontSize: 16 },
  bellWrap: { position: 'relative', padding: 4 },
  bellIcon: { fontSize: 18 },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.amber,
    borderWidth: 1.5, borderColor: C.navy,
  },

  // Header
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingBottom: 18,
  },
  parkingName: { fontSize: 11, color: C.teal, fontWeight: '700', marginBottom: 4, letterSpacing: 0.8 },
  greeting: { fontSize: 21, fontWeight: '800', color: C.white },

  scroll: { flex: 1, backgroundColor: C.surface },
  scrollContent: { padding: 16, paddingTop: 18 },

  // Warning Banner
  warningBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.amberLight,
    borderWidth: 1, borderColor: C.amberBorder,
    borderRadius: 14, padding: 12, marginBottom: 14, gap: 10,
  },
  warningIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.amberIconBg,
    alignItems: 'center', justifyContent: 'center',
  },
  warningIcon: { fontSize: 14 },
  warningText: { flex: 1 },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  warningSubtitle: { fontSize: 11, color: '#B45309', marginTop: 2 },
  warningChevron: { fontSize: 20, color: '#B45309', fontWeight: '300' },

  // Occupancy Card
  occupancyCard: {
    backgroundColor: C.white,
    borderRadius: 16, padding: 16,
    marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  occupancyHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  occupancyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.greenLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveText: { fontSize: 11, fontWeight: '700', color: C.green },
  occupancyBody: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  occupancyStats: { flex: 1, gap: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: C.textSecondary },
  statValue: { fontSize: 13, fontWeight: '700', color: C.textPrimary },

  sectionIcon: { fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary },

  // Stat Cards
  statCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: C.white,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  statCardIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statCardIcon: { fontSize: 15 },
  statCardLabel: { fontSize: 11, color: C.textSecondary, marginBottom: 4 },
  statCardValue: { fontSize: 21, fontWeight: '800', color: C.textPrimary, marginBottom: 6 },
  statCardBadge: {
    backgroundColor: C.greenLight, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  statCardBadgeText: { fontSize: 10, color: C.green, fontWeight: '700' },
  statCardSub: { fontSize: 10, color: C.textMuted, lineHeight: 14 },

  // Analytics Card
  analyticsCard: {
    backgroundColor: C.white,
    borderRadius: 16, padding: 16,
    marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  analyticsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  analyticsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartTabs: {
    flexDirection: 'row', gap: 2,
    backgroundColor: C.surface, borderRadius: 8, padding: 2,
  },
  chartTab: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6,
  },
  chartTabActive: { backgroundColor: C.blue },
  chartTabText: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  chartTabTextActive: { color: C.white },
  chartArea: { marginBottom: 8 },
  chartXLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  chartXLabel: { fontSize: 9, color: C.textMuted },

  // Transactions
  transactionsCard: {
    backgroundColor: C.white,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  transactionsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  viewAllText: { fontSize: 12, color: C.blue, fontWeight: '700' },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  txRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  txPlate: { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  txTime: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800', color: C.textPrimary },
});