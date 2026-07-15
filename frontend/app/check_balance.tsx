import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '@/lib/api';

const COLORS = {
  darkBg: '#FFFFFF',
  cardBg: '#F5F6F8',
  formBg: '#FFFFFF',
  teal: '#13B4AA',
  blue: '#1D3D8A',
  white: '#FFFFFF',
  textLight: '#6A707F',
  textMuted: '#A0AAC7',
  textDim: '#D4D6D8',
  border: '#e0e6f5',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',
};

export default function CheckBalance({ data, onBack }: { data?: any; onBack?: () => void }) {
  const [balanceData, setBalanceData] = useState<any>(data);

  useEffect(() => {
    const loadBalance = async () => {
      if (!data?.plate) return;
      try {
        const response = await apiRequest<any>(`/api/vehicles/balance?plate=${encodeURIComponent(data.plate)}`);
        setBalanceData(response);
      } catch (error) {
        console.warn('Failed to load balance', error);
      }
    };

    loadBalance();
  }, [data?.plate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBg} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Check Balance</Text>
        <Text style={styles.pageSubtitle}>View your parking account balance and details.</Text>

        <View style={styles.balanceCard}>
          <View style={styles.walletIconWrap}>
            <View style={styles.walletBody}>
              <View style={styles.walletFlap} />
              <View style={styles.walletCoin} />
            </View>
          </View>

          <Text style={styles.availableLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceAmount}>{balanceData?.balance != null ? `₱${Number(balanceData.balance).toFixed(2)}` : '₱0.00'}</Text>

          <View style={styles.prepaidBadge}>
            <View style={styles.cardIconWrap}>
              <View style={styles.cardIconBody}>
                <View style={styles.cardIconStripe} />
              </View>
            </View>
            <Text style={styles.prepaidText}>Prepaid Account</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          {[
            { label: 'Plate Number', value: balanceData?.plate ?? data?.plate ?? 'ABC 1234' },
            { label: 'Owner Name', value: balanceData?.owner_name ?? data?.owner ?? 'Harry Potter' },
            { label: 'Vehicle Type', value: balanceData?.vehicle_type ?? data?.type ?? 'Motor' },
            { label: 'Registered', value: balanceData?.registered_at ? new Date(balanceData.registered_at).toLocaleDateString() : data?.registered ?? '5/23/2025' },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.detailRow, i < arr.length - 1 && styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85} onPress={() => onBack && onBack()}>
          <Text style={styles.outlineBtnText}>Check Another Account</Text>
        </TouchableOpacity>

        <View style={styles.topUpBanner}>
          <Text style={styles.topUpText}><Text style={styles.topUpBold}>Need to top up?</Text> Visit any attendant with cash to add credits to your account.</Text>
        </View>

        <TouchableOpacity style={styles.backLink} activeOpacity={0.7} onPress={() => onBack && onBack()}>
          <Text style={styles.backLinkText}>← Back to Login</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.darkBg },
  scroll: { flex: 1, backgroundColor: COLORS.darkBg },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textLight, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 20 },
  balanceCard: { backgroundColor: COLORS.teal, borderRadius: 16, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', marginBottom: 18 },
  walletIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  walletBody: { width: 28, height: 22, backgroundColor: COLORS.white, borderRadius: 4, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 4, position: 'relative' },
  walletFlap: { position: 'absolute', top: -6, left: 2, width: 16, height: 8, backgroundColor: COLORS.white, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  walletCoin: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.teal, borderWidth: 2, borderColor: '#0F8B72' },
  availableLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.2, marginBottom: 8 },
  balanceAmount: { fontSize: 42, fontWeight: '800', color: COLORS.white, marginBottom: 16 },
  prepaidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, gap: 8 },
  cardIconWrap: { width: 18, height: 13, justifyContent: 'center' },
  cardIconBody: { width: 18, height: 13, backgroundColor: COLORS.white, borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-start' },
  cardIconStripe: { width: '100%', height: 3, backgroundColor: 'rgba(29,158,117,0.5)', marginTop: 3 },
  prepaidText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  detailsCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, paddingHorizontal: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 14, color: COLORS.textLight, fontWeight: '700' },
  outlineBtn: { borderWidth: 1.5, borderColor: COLORS.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16, backgroundColor: 'transparent' },
  outlineBtnText: { color: COLORS.blue, fontWeight: '700', fontSize: 15 },
  topUpBanner: { backgroundColor: COLORS.amberLight, borderWidth: 1, borderColor: COLORS.amberBorder, borderRadius: 12, padding: 14, marginBottom: 18 },
  topUpText: { fontSize: 13, color: '#6B7A8D', lineHeight: 20 },
  topUpBold: { fontWeight: '700', color: '#1D3D8A' },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: COLORS.teal, fontWeight: '600' },
});