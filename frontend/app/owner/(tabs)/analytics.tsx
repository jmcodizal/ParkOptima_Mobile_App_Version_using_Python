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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { apiRequest } from '../../../lib/api';

const C = {
  navy: '#1E3A8A',
  navyDark: '#08131F',
  white: Colors.light.background,
  surface: '#F4F6F9',
  border: '#E4E7EC',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  amber: '#F59E0B',
  amberLight: '#FEF3E2',
  blue: '#3B82F6',
  indigo: '#4F5FE0',
  red: '#EF4444',
  orange: '#F97316',
  green: '#10B981',
  greenLight: '#DCFCE9',
  teal: '#0EA5A0',
  tealLight: '#DBF5F2',
  navyLight: '#E7E9FB',
  amberChip: '#FDECD1',
  gradientStart: '#1E2B6B',
  gradientEnd: '#3562C9',
  cardTeal: '#14B8A6',
  cardNavy: '#1E2A5A',
  cardOrange: '#F97316',
};

const { width } = Dimensions.get('window');
const CHART_W = width - 64;

// Dual sparkline chart (Revenue + Entries)
function DualSparkLine({ revenue, entries }: { revenue: number[]; entries: number[] }) {
  const H = 80;
  const allVals = [...revenue, ...entries].filter(v => typeof v === 'number');
  
  // Handle edge cases
  if (revenue.length < 2 || allVals.length === 0) {
    return <Text style={styles.emptyState}>Insufficient data for chart</Text>;
  }
  
  const max = Math.max(...allVals);
  const min = Math.min(...allVals);
  const range = max - min === 0 ? 1 : max - min;
  const segW = revenue.length > 1 ? CHART_W / (revenue.length - 1) : CHART_W;

  const renderLine = (points: number[], color: string) =>
    points.map((p, i) => {
      if (i === points.length - 1) return null;
      const x1 = i * segW;
      const y1 = H - ((p - min) / range) * (H - 8) - 4;
      const x2 = (i + 1) * segW;
      const y2 = H - ((points[i + 1] - min) / range) * (H - 8) - 4;
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      return (
        <View
          key={`${color}-${i}`}
          style={{
            position: 'absolute',
            left: x1, top: y1,
            width: len, height: 2.5,
            backgroundColor: color,
            borderRadius: 1.5,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: '0 0',
          }}
        />
      );
    });

  return (
    <View>
      <View style={{ height: H, width: CHART_W, position: 'relative', overflow: 'hidden', backgroundColor: 'transparent' }}>
        {renderLine(revenue, C.teal)}
        {renderLine(entries, C.indigo)}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.teal }]} />
          <Text style={styles.legendLabel}>Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.indigo }]} />
          <Text style={styles.legendLabel}>Entries</Text>
        </View>
      </View>
    </View>
  );
}

// Bar chart for occupancy by hour/day
function OccupancyBars({ values }: { values: number[] }) {
  const hours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const bars = values.map((value, index) => ({ label: hours[index] || `D${index + 1}`, value, peak: value === Math.max(...values) }));
  const maxVal = Math.max(...values, 1);
  const BAR_H = 70;
  const barW = (CHART_W - bars.length * 10) / bars.length;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H, gap: 10 }}>
        {bars.map((b, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: '100%',
                maxWidth: barW,
                height: Math.max(6, (b.value / maxVal) * BAR_H),
                backgroundColor: b.peak ? C.orange : C.indigo,
                borderRadius: 6,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        {bars.map(b => (
          <Text key={b.label} style={[styles.chartXLabel, { flex: 1, textAlign: 'center' }, b.peak && { color: C.orange, fontWeight: '700' }]}>{b.label}</Text>
        ))}
      </View>
    </View>
  );
}

// Donut chart with centered total count
function PieChart({ fourWheel, twoWheel }: { fourWheel: number; twoWheel: number }) {
  const total = Math.max(1, fourWheel + twoWheel);
  const fourWheelPct = Math.round((fourWheel / total) * 100);
  const twoWheelPct = 100 - fourWheelPct;

  return (
    <View style={styles.pieRow}>
      <View style={styles.pieOuter}>
        <View style={styles.pieInnerWrap}>
          <View style={styles.pieTeal} />
        </View>
        <View style={styles.pieCenter}>
          <Text style={styles.pieCenterValue}>{total}</Text>
          <Text style={styles.pieCenterLabel}>VEHICLES</Text>
        </View>
      </View>
      <View style={styles.pieLegendCol}>
        <View style={styles.pieLegendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.navy }]} />
          <View>
            <Text style={styles.pieLegendLabel}>4-wheels</Text>
            <Text style={styles.pieLegendValue}>{fourWheelPct}% · {fourWheel}</Text>
          </View>
        </View>
        <View style={styles.pieLegendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.teal }]} />
          <View>
            <Text style={styles.pieLegendLabel}>2-wheels</Text>
            <Text style={styles.pieLegendValue}>{twoWheelPct}% · {twoWheel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

type Period = 'Daily' | 'Weekly' | 'Monthly';

const PERIOD_COLORS: Record<Period, string> = {
  Daily: C.navy,
  Weekly: C.teal,
  Monthly: C.orange,
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('Daily');
  const [analytics, setAnalytics] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [analyticsData, reportsData] = await Promise.all([
          apiRequest<any>(`/api/owner/analytics?period=${encodeURIComponent(period)}`),
          apiRequest<any>(`/api/owner/reports?period=${encodeURIComponent(period)}`),
        ]);
        if (isMounted) {
          setAnalytics(analyticsData);
          setReports(reportsData);
        }
      } catch (error) {
        console.error('Analytics load failed', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [period]);

  const revenueSeries = useMemo(() => (analytics?.series || []).map((item: any) => Number(item.revenue || 0)), [analytics]);
  const entrySeries = useMemo(() => (analytics?.series || []).map((item: any) => Number(item.transactions || 0)), [analytics]);
  const totalRevenue = Number(analytics?.total_revenue ?? reports?.todays_revenue ?? reports?.revenue ?? 0);
  const totalEntries = Number(analytics?.total_transactions ?? reports?.total_entries_today ?? reports?.entries ?? 0);
  const peakHourLabel = reports?.peak_entry_time || 'N/A';
  const hasAnalyticsData = (analytics?.series?.length || 0) > 0 || totalRevenue > 0 || totalEntries > 0;
  const fourWheelCount = Math.max(1, Math.round((reports?.paid || 0) * 0.64));
  const twoWheelCount = Math.max(1, Math.round((reports?.paid || 0) * 0.36));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.gradientStart} />

      {/* Navbar + Header — gradient, matches reference screenshot */}
      <LinearGradient
        colors={[C.gradientStart, C.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.navbar}>
                <View style={styles.navLeft}>
                  <View style={styles.navLogoMark}>
                   <Ionicons name="car-sport" size={16} color={C.navy} />
                  </View>
                  <Text style={styles.navBrand}>ParkOptima</Text>
                </View>
                <TouchableOpacity style={styles.bellWrap} onPress={() => router.push('/owner/transaction_log')}>
                  <Text style={styles.bellIcon}>🔔</Text>
                  <View style={styles.bellDot} />
                </TouchableOpacity>
              </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Here's how today is tracking</Text>
        </View>

        {/* Period Tabs — inside the gradient header */}
        <View style={styles.periodTabs}>
          {(['Daily', 'Weekly', 'Monthly'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.periodTabText,
                  { color: PERIOD_COLORS[p] },
                  period === p && styles.periodTabTextActive,
                ]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Summary Cards — solid color cards matching reference */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: C.cardTeal }]}>
            <View style={styles.summaryIconWrap}>
              <Text style={styles.summaryIcon}>💰</Text>
            </View>
            <Text style={styles.summaryLabel}>REVENUE</Text>
            <Text style={styles.summaryValue}>{loading ? '—' : `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
            <Text style={styles.summarySub}>{period === 'Daily' ? 'total collected' : `${period.toLowerCase()} total`}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: C.cardNavy }]}>
            <View style={styles.summaryIconWrap}>
              <Text style={styles.summaryIcon}>🚘</Text>
            </View>
            <Text style={styles.summaryLabel}>ENTRIES</Text>
            <Text style={styles.summaryValue}>{loading ? '—' : totalEntries}</Text>
            <Text style={styles.summarySub}>{period === 'Daily' ? 'vehicles logged' : `${period.toLowerCase()} entries`}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: C.cardOrange }]}>
            <View style={styles.summaryIconWrap}>
              <Text style={styles.summaryIcon}>⏱️</Text>
            </View>
            <Text style={styles.summaryLabel}>PEAK</Text>
            <Text style={styles.summaryValue}>{loading ? '—' : peakHourLabel}</Text>
            <Text style={styles.summarySub}>{period === 'Daily' ? 'busiest hour' : `${period.toLowerCase()} peak`}</Text>
          </View>
        </View>

        {/* Revenue & Entries Trend */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Revenue & entries trend</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendBadgeText}>↑ 12% vs yesterday</Text>
            </View>
          </View>
          {loading ? <ActivityIndicator size="small" color={C.teal} /> : hasAnalyticsData ? <DualSparkLine revenue={revenueSeries} entries={entrySeries} /> : <Text style={styles.emptyState}>No data available for this period yet.</Text>}
        </View>

        {/* Weekly Occupancy */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly occupancy</Text>
          {loading ? <ActivityIndicator size="small" color={C.teal} /> : hasAnalyticsData ? <OccupancyBars values={(analytics?.series || []).map((item: any) => Number(item.transactions || 0))} /> : <Text style={styles.emptyState}>No occupancy data available for this period yet.</Text>}
        </View>

        {/* Vehicle Type Split */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Vehicle type split</Text>
          {loading ? <ActivityIndicator size="small" color={C.teal} /> : <PieChart fourWheel={fourWheelCount} twoWheel={twoWheelCount} />}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.gradientStart },

  // Gradient header wrapper (navbar + title + period tabs)
  headerGradient: {
    paddingBottom: 16,
  },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoMark: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  navLogoText: { color: C.gradientStart, fontWeight: '800', fontSize: 12 },
  navBrand: { color: C.white, fontWeight: '700', fontSize: 15 },
  bellWrap: { position: 'relative', padding: 4 },
  bellIcon: { fontSize: 18, color: C.white },
  bellDot: {
    position: 'absolute', top: 2, right: 2,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.orange,
    borderWidth: 1.5, borderColor: C.gradientStart,
  },

  // Header title block
  header: {
    paddingHorizontal: 16, paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: C.white },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  scroll: { flex: 1, backgroundColor: C.surface },
  scrollContent: { padding: 16, paddingTop: 16 },

  // Period Tabs — sit inside the gradient header
  periodTabs: {
    flexDirection: 'row', gap: 4,
    backgroundColor: C.white, borderRadius: 12, padding: 4,
    marginHorizontal: 16,
  },
  periodTab: {
    flex: 1, paddingVertical: 9, borderRadius: 9,
    alignItems: 'center',
  },
  periodTabActive: { backgroundColor: C.navy },
  periodTabText: { fontSize: 13, fontWeight: '700' },
  periodTabTextActive: { color: C.white },

  // Summary Cards — solid color cards
  summaryRow: {
    flexDirection: 'row', gap: 10, marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14, padding: 12,
    shadowColor: '#0B1B2E', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  summaryIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  summaryIcon: { fontSize: 13 },
  summaryLabel: { fontSize: 9, color: 'rgba(255,255,255,0.85)', marginBottom: 4, fontWeight: '700', letterSpacing: 0.4 },
  summaryValue: { fontSize: 14, fontWeight: '800', color: C.white },
  summarySub: { fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  // Chart Cards
  chartCard: {
    backgroundColor: C.white,
    borderRadius: 16, padding: 16,
    marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#0B1B2E', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  chartHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14, flexWrap: 'wrap', gap: 6,
  },
  chartTitle: {
    fontSize: 14, fontWeight: '700',
    color: C.textPrimary,
  },
  trendBadge: {
    backgroundColor: C.tealLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },
  trendBadgeText: { fontSize: 10, fontWeight: '700', color: C.teal },
  chartXLabel: { fontSize: 9, color: C.textMuted },
  emptyState: { fontSize: 12, color: C.textSecondary, textAlign: 'center', paddingVertical: 12 },

  // Legend
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: C.textSecondary },

  // Pie / Donut
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  pieOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.navy,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  pieInnerWrap: {
    position: 'absolute', right: 0, top: 0,
    width: 50, height: 100,
    overflow: 'hidden',
  },
  pieTeal: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.teal,
  },
  pieCenter: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: C.white,
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  pieCenterValue: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  pieCenterLabel: { fontSize: 7, fontWeight: '700', color: C.textMuted, letterSpacing: 0.4 },
  pieLegendCol: { gap: 14, flex: 1 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pieLegendLabel: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  pieLegendValue: { fontSize: 11, color: C.textSecondary, marginTop: 1 },

});