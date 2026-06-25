import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import orderService from '@/services/orders';

type TimePeriod = 'today' | 'week' | 'month';

interface SaleData {
  date: string;
  amount: number;
  order_count: number;
}

interface TopItem {
  id: number;
  name: string;
  sold: number;
  price: number;
}

const PERIOD_TABS: { key: TimePeriod; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: 'calendar-today' },
  { key: 'week', label: 'This Week', icon: 'calendar-week' },
  { key: 'month', label: 'This Month', icon: 'calendar-month' },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = ['trophy', 'medal', 'medal-outline'];

export default function SalesReportScreen() {
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [salesData, setSalesData] = useState<any>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [period])
  );

  const loadReportData = async () => {
    try {
      setError(null);
      const [sales, items] = await Promise.all([
        orderService.getSalesReport(period),
        orderService.getTopItems(period),
      ]);
      setSalesData(sales);
      setTopItems(items || []);
    } catch (err) {
      setError('Could not load report data. Pull down to retry.');
      setSalesData(null);
      setTopItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const handlePeriodChange = (p: TimePeriod) => {
    setPeriod(p);
    setLoading(true);
  };

  const handleExport = async () => {
    const d = currentData;
    const periodLabel = PERIOD_TABS.find((t) => t.key === period)?.label ?? period;
    const lines = [
      '===================================',
      '    THE SISIG SPOT BY KIAN',
      '         Sales Report',
      `         Period: ${periodLabel}`,
      '===================================',
      '',
      `Total Sales    : ₱${d.total_sales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      `Total Orders   : ${d.total_orders}`,
      `Avg per Order  : ₱${Math.round(d.avg_per_order).toLocaleString()}`,
      '',
      '--- Sales Breakdown ---------------',
      ...(d.breakdown || []).map(
        (b: SaleData) => `${b.date.padEnd(14)} ₱${String(b.amount.toFixed(2)).padStart(10)}  (${b.order_count} orders)`
      ),
      '',
      '--- Top Selling Items -------------',
      ...topItems.map(
        (item, i) => `${i + 1}. ${item.name.padEnd(20)} ${item.sold} sold  ₱${item.price}`
      ),
      '',
      '===================================',
      `Generated: ${new Date().toLocaleString('en-PH')}`,
    ];
    try {
      await Share.share({ message: lines.join('\n'), title: `Sales Report — ${periodLabel}` });
    } catch {
      // user cancelled
    }
  };

  const currentData = salesData ?? {
    total_sales: 0,
    total_orders: 0,
    avg_per_order: 0,
    breakdown: [],
  };

  const breakdown: SaleData[] = currentData.breakdown || [];
  const maxAmount = breakdown.length > 0 ? Math.max(...breakdown.map((b) => b.amount), 1) : 1;
  const topSold = topItems.length > 0 ? Math.max(...topItems.map((i) => i.sold), 1) : 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#780115" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="chart-line" size={22} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Sales Report</Text>
        </View>
        <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExport}>
          <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Period Tabs */}
      <View style={styles.tabsRow}>
        {PERIOD_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, period === tab.key && styles.tabActive]}
            onPress={() => handlePeriodChange(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={15}
              color={period === tab.key ? '#fff' : '#780115'}
            />
            <Text style={[styles.tabText, period === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#780115" />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#780115']} />
          }
        >
          {error ? (
            <View style={styles.errorCard}>
              <MaterialCommunityIcons name="wifi-off" size={32} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Metric Cards */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: '#780115' }]}>
              <View style={styles.metricIconBox}>
                <MaterialCommunityIcons name="currency-php" size={18} color="#780115" />
              </View>
              <Text style={styles.metricLabel}>Total Sales</Text>
              <Text style={styles.metricValue}>
                ₱{parseFloat(String(currentData.total_sales || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#1565C0' }]}>
              <View style={styles.metricIconBox}>
                <MaterialCommunityIcons name="shopping-outline" size={18} color="#1565C0" />
              </View>
              <Text style={styles.metricLabel}>Total Orders</Text>
              <Text style={styles.metricValue}>{currentData.total_orders ?? 0}</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#2E7D32' }]}>
              <View style={styles.metricIconBox}>
                <MaterialCommunityIcons name="trending-up" size={18} color="#2E7D32" />
              </View>
              <Text style={styles.metricLabel}>Avg / Order</Text>
              <Text style={styles.metricValue}>
                ₱{Math.round(parseFloat(String(currentData.avg_per_order || 0))).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Sales Bar Chart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-bar" size={20} color="#780115" />
              <Text style={styles.cardTitle}>Sales Breakdown</Text>
            </View>

            {breakdown.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="chart-bar" size={40} color="#ddd" />
                <Text style={styles.emptyText}>No sales data for this period</Text>
              </View>
            ) : (
              <>
                {/* Bar chart */}
                <View style={styles.chartContainer}>
                  {breakdown.map((item, idx) => {
                    const barPct = item.amount / maxAmount;
                    return (
                      <View key={idx} style={styles.barGroup}>
                        <Text style={styles.barAmount}>
                          ₱{item.amount >= 1000
                            ? `${(item.amount / 1000).toFixed(1)}k`
                            : item.amount.toFixed(0)}
                        </Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { height: `${Math.max(barPct * 100, 4)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel} numberOfLines={1}>
                          {item.date.length > 6 ? item.date.slice(5) : item.date}
                        </Text>
                        <Text style={styles.barOrders}>{item.order_count} ord</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Table */}
                <View style={styles.table}>
                  <View style={styles.tableHead}>
                    <Text style={[styles.tableHeadCell, { flex: 2 }]}>DATE</Text>
                    <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>SALES</Text>
                    <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>ORDERS</Text>
                  </View>
                  {breakdown.map((item, idx) => (
                    <View
                      key={idx}
                      style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
                    >
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.date}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: '#780115' }]}>
                        ₱{parseFloat(String(item.amount)).toFixed(2)}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                        {item.order_count}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Top Selling Items */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="trophy" size={20} color="#780115" />
              <Text style={styles.cardTitle}>Top Selling Items</Text>
            </View>

            {topItems.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="trophy-outline" size={40} color="#ddd" />
                <Text style={styles.emptyText}>No items sold in this period</Text>
              </View>
            ) : (
              topItems.map((item, idx) => {
                const pct = item.sold / topSold;
                const isTop3 = idx < 3;
                return (
                  <View key={item.id} style={styles.topItemRow}>
                    {/* Rank badge */}
                    <View
                      style={[
                        styles.rankBadge,
                        { backgroundColor: isTop3 ? RANK_COLORS[idx] : '#f0f0f0' },
                      ]}
                    >
                      {isTop3 ? (
                        <MaterialCommunityIcons
                          name={RANK_ICONS[idx] as any}
                          size={14}
                          color="#fff"
                        />
                      ) : (
                        <Text style={styles.rankNum}>{idx + 1}</Text>
                      )}
                    </View>

                    {/* Item info */}
                    <View style={styles.topItemInfo}>
                      <View style={styles.topItemNameRow}>
                        <Text style={styles.topItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.topItemSold}>{item.sold} sold</Text>
                      </View>
                      <View style={styles.topItemBarTrack}>
                        <View
                          style={[
                            styles.topItemBarFill,
                            {
                              width: `${pct * 100}%`,
                              backgroundColor: isTop3 ? '#780115' : '#ccc',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Price */}
                    <Text style={styles.topItemPrice}>
                      ₱{parseFloat(String(item.price)).toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Export Button */}
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
            <Text style={styles.exportBtnText}>Share / Export Report</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#780115', fontSize: 14, fontWeight: '500' },

  header: {
    backgroundColor: '#780115',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  exportHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  tabActive: { backgroundColor: '#780115', borderColor: '#780115' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#780115' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { color: '#c62828', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#780115', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  metricIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' },
  metricValue: { fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#222' },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: '#bbb', fontSize: 14 },

  // Bar chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barAmount: { fontSize: 9, color: '#780115', fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  barTrack: {
    width: '70%',
    height: 70,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: '#780115', borderRadius: 6 },
  barLabel: { fontSize: 9, color: '#666', marginTop: 4, textAlign: 'center' },
  barOrders: { fontSize: 9, color: '#bbb', textAlign: 'center' },

  // Table
  table: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#780115',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableHeadCell: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 13, color: '#333' },

  // Top items
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: { fontSize: 12, fontWeight: '700', color: '#999' },
  topItemInfo: { flex: 1, gap: 5 },
  topItemNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topItemName: { fontSize: 14, fontWeight: '600', color: '#222', flex: 1 },
  topItemSold: { fontSize: 12, color: '#780115', fontWeight: '700', marginLeft: 8 },
  topItemBarTrack: {
    height: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  topItemBarFill: { height: 5, borderRadius: 3 },
  topItemPrice: { fontSize: 14, fontWeight: '700', color: '#222' },

  // Export
  exportBtn: {
    backgroundColor: '#780115',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#780115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exportBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
