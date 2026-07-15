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
  navy: Colors.light.tint,
  navyDark: '#0e1620',
  white: Colors.light.background,
  surface: '#F5F6F8',
  border: '#D4D6D8',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#a0aac7',
  amber: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F97316',
  teal: '#13B4AA',
};

const { width } = Dimensions.get('window');
const CHART_W = width - 64;

// Dual sparkline chart (Revenue + Entries)
function DualSparkLine({ revenue, entries }: { revenue: number[]; entries: number[] }) {
  const H = 80;
  const allVals = [...revenue, ...entries];
  const max = Math.max(...allVals);
  const min = Math.min(...allVals);
  const segW = CHART_W / (revenue.length - 1);

  const renderLine = (points: number[], color: string) =>
    points.map((p, i) => {
      if (i === points.length - 1) return null;
      const x1 = i * segW;
      const y1 = H - ((p - min) / (max - min)) * (H - 8) - 4;
      const x2 = (i + 1) * segW;
      const y2 = H - ((points[i + 1] - min) / (max - min)) * (H - 8) - 4;
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      return (
        <View
          key={`${color}-${i}`}
          style={{
            position: 'absolute',
            left: x1, top: y1,
            width: len, height: 2,
            backgroundColor: color,
            borderRadius: 1,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: '0 0',
          }}
        />
      );
    });

  return (
    <View>
      <View style={{ height: H, width: CHART_W, position: 'relative' }}>
        {renderLine(revenue, C.teal)}
        {renderLine(entries, C.blue)}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.teal }]} />
          <Text style={styles.legendLabel}>Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.blue }]} />
          <Text style={styles.legendLabel}>Entries</Text>
        </View>
      </View>
    </View>
  );
}

// Bar chart for occupancy by hour
function OccupancyBars({ values }: { values: number[] }) {
  const hours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const bars = values.map((value, index) => ({ label: hours[index] || `D${index + 1}`, value, peak: value === Math.max(...values) }));
  const maxVal = Math.max(...values, 1);
  const BAR_H = 70;
  const barW = (CHART_W - bars.length * 4) / bars.length;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H, gap: 4 }}>
        {bars.map((b, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 2, flexDirection: 'row', alignSelf: 'flex-end' }}>
            <View
              style={{
                width: barW - 1,
                height: (b.value / maxVal) * BAR_H,
                backgroundColor: b.peak ? C.red : C.amber,
                borderRadius: 2,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {bars.map(b => (
          <Text key={b.label} style={styles.chartXLabel}>{b.label}</Text>
        ))}
      </View>
    </View>
  );
}

// Pie chart using border trick (donut approximation)
function PieChart({ fourWheel, twoWheel }: { fourWheel: number; twoWheel: number }) {
  const total = Math.max(1, fourWheel + twoWheel);
  const fourWheelPct = Math.round((fourWheel / total) * 100);
  const twoWheelPct = Math.round((twoWheel / total) * 100);

  return (
    <View style={styles.pieWrap}>
      <View style={styles.pieOuter}>
        <View style={styles.pieInnerWrap}>
          <View style={styles.pieTeal} />
        </View>
        <View style={styles.pieCenter} />
      </View>
      <View style={styles.pieLegendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.navy }]} />
          <Text style={styles.legendLabel}>4-wheels ({fourWheelPct}%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.teal }]} />
          <Text style={styles.legendLabel}>2-wheels ({twoWheelPct}%)</Text>
        </View>
      </View>
    </View>
  );
}

type Period = 'Daily' | 'Weekly' | 'Monthly';

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>('Daily');
  const [analytics, setAnalytics] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [analyticsData, reportsData] = await Promise.all([
          apiRequest<any>('/api/owner/analytics'),
          apiRequest<any>('/api/owner/reports'),
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
  }, []);

  const revenueSeries = useMemo(() => (analytics?.series || []).map((item: any) => Number(item.revenue || 0)), [analytics]);
  const entrySeries = useMemo(() => (analytics?.series || []).map((item: any) => Number(item.transactions || 0)), [analytics]);
  const fourWheelCount = Math.max(1, Math.round((reports?.paid || 0) * 0.64));
  const twoWheelCount = Math.max(1, Math.round((reports?.paid || 0) * 0.36));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.navLogoMark}>
            <Text style={styles.navLogoText}>P</Text>
          </View>
          <Text style={styles.navTitle}>Analytics</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {(['Daily', 'Weekly', 'Monthly'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={styles.periodTab}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}>
              <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                {p}
              </Text>
              {period === p && <View style={styles.periodTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total revenue</Text>
            <Text style={styles.summaryValue}>{loading ? '—' : `₱${Number(analytics?.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total entries</Text>
            <Text style={styles.summaryValue}>{analytics?.total_transactions ?? 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Peak hour</Text>
            <Text style={[styles.summaryValue, { color: C.amber }]}>{reports?.peak_entry_time || 'N/A'}</Text>
          </View>
        </View>

        {/* Revenue & Entries Trend */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue & entries trend</Text>
          {loading ? <ActivityIndicator size="small" color={C.teal} /> : <DualSparkLine revenue={revenueSeries} entries={entrySeries} />}
        </View>

        {/* Occupancy by Hour */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Occupancy by hour</Text>
          {loading ? <ActivityIndicator size="small" color={C.teal} /> : <OccupancyBars values={(analytics?.series || []).map((item: any) => Number(item.transactions || 0))} />}
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

  // Period Tabs
  periodTabs: {
    flexDirection: 'row', gap: 0,
    borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: 16,
  },
  periodTab: { paddingVertical: 8, paddingHorizontal: 16, position: 'relative' },
  periodTabText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  periodTabTextActive: { color: C.navy },
  periodTabUnderline: {
    position: 'absolute', bottom: -1, left: 16, right: 16,
    height: 2, backgroundColor: C.amber, borderRadius: 1,
  },

  // Summary Cards
  summaryRow: {
    flexDirection: 'row', gap: 8, marginBottom: 14,
  },
  summaryCard: {
    flex: 1, backgroundColor: C.white,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  summaryLabel: { fontSize: 10, color: C.textMuted, marginBottom: 4, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: C.textPrimary },

  // Chart Cards
  chartCard: {
    backgroundColor: C.white,
    borderRadius: 12, padding: 14,
    marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  chartTitle: {
    fontSize: 14, fontWeight: '700',
    color: C.textPrimary, marginBottom: 14,
  },
  chartXLabel: { fontSize: 9, color: C.textMuted },

  // Legend
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: C.textSecondary },

  // Pie
  pieWrap: { alignItems: 'center' },
  pieOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: C.navy,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  pieInnerWrap: {
    position: 'absolute', right: 0, top: 0,
    width: 55, height: 110,
    overflow: 'hidden',
  },
  pieTeal: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: C.teal,
  },
  pieCenter: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.white,
    position: 'absolute',
  },
  pieLegendRow: { flexDirection: 'row', gap: 16 },

});
