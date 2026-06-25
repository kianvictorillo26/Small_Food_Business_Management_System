import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  FlatList,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import orderService, { Order } from '@/services/orders';

const STATUS_LIST = ['New', 'In Progress', 'Ready', 'Completed'] as const;
type OrderStatus = typeof STATUS_LIST[number];

const STATUS_COLORS: Record<string, string> = {
  New: '#2196F3',
  'In Progress': '#FF9800',
  Ready: '#4CAF50',
  Completed: '#9E9E9E',
};

const STATUS_BG: Record<string, string> = {
  New: '#E3F2FD',
  'In Progress': '#FFF3E0',
  Ready: '#E8F5E9',
  Completed: '#F5F5F5',
};

const Orders = () => {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const filterTabs = ['All', ...STATUS_LIST];

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [selectedStatus])
  );

  const loadOrders = async () => {
    try {
      setError(null);
      const data = await orderService.getByStatus(selectedStatus);
      setOrders(data || []);
    } catch (err) {
      setError('Could not load orders. Pull down to retry.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleTabChange = (status: string) => {
    setSelectedStatus(status);
    setLoading(true);
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    try {
      await orderService.updateStatus(order.id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      Alert.alert('Error', 'Could not update status. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const buildReceiptText = (order: Order): string => {
    const line = '--------------------------------';
    const header = [
      '      THE SISIG SPOT BY KIAN',
      '          Sisig & More',
      line,
      `Order #${order.id}`,
      `Customer: ${order.customer_name}`,
      `Date: ${formatDate(order.created_at)}`,
      `Time: ${formatTime(order.created_at)}`,
      line,
      'ITEMS',
      line,
    ];
    const items = (order.items || []).map((item) => {
      const name = item.menu?.name || 'Item';
      const qty = item.quantity;
      const price = parseFloat(String(item.price));
      const total = (qty * price).toFixed(2);
      return `${qty}x ${name.padEnd(18)} ₱${total}`;
    });
    const total = parseFloat(String(order.total_amount || 0)).toFixed(2);
    const footer = [
      line,
      `TOTAL:                   ₱${total}`,
      line,
      '       Thank you for dining with us!',
      '          See you next time! 😊',
    ];
    return [...header, ...items, ...footer].join('\n');
  };

  const handlePrintReceipt = async (order: Order) => {
    const receiptText = buildReceiptText(order);
    try {
      await Share.share({
        message: receiptText,
        title: `Receipt - Order #${order.id}`,
      });
    } catch (err) {
      console.warn('Share cancelled');
    }
  };

  const renderStatusTracker = (order: Order) => (
    <View style={styles.statusTracker}>
      {STATUS_LIST.map((status, index) => {
        const currentIndex = STATUS_LIST.indexOf(order.status as OrderStatus);
        const isDone = index <= currentIndex;
        const isActive = order.status === status;
        return (
          <React.Fragment key={status}>
            <TouchableOpacity
              style={[
                styles.statusStep,
                isDone && { backgroundColor: STATUS_COLORS[status] },
                isActive && styles.statusStepActive,
              ]}
              onPress={() => handleStatusChange(order, status)}
            >
              <Text
                style={[
                  styles.statusStepText,
                  isDone && styles.statusStepTextDone,
                ]}
                numberOfLines={1}
              >
                {status}
              </Text>
            </TouchableOpacity>
            {index < STATUS_LIST.length - 1 && (
              <View
                style={[
                  styles.statusConnector,
                  index < currentIndex && { backgroundColor: STATUS_COLORS[STATUS_LIST[index + 1]] },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  const renderOrderCard = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View
          style={[styles.orderIcon, { backgroundColor: STATUS_BG[item.status] }]}
        >
          <MaterialCommunityIcons
            name="receipt"
            size={22}
            color={STATUS_COLORS[item.status]}
          />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.customerName}>{item.customer_name}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: STATUS_BG[item.status] },
            ]}
          >
            <Text style={[styles.statusPillText, { color: STATUS_COLORS[item.status] }]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
        </View>
      </View>

      {/* Status Tracker */}
      <View style={styles.trackerContainer}>
        <Text style={styles.trackerLabel}>Update Status</Text>
        {renderStatusTracker(item)}
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsContainer}>
        {item.items && item.items.length > 0 ? (
          item.items.map((detail, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{detail.quantity}x</Text>
              <Text style={styles.itemName}>{detail.menu?.name || 'Item'}</Text>
              <Text style={styles.itemPrice}>
                ₱{(detail.quantity * parseFloat(String(detail.price))).toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noItemsText}>No item details available</Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            ₱{parseFloat(String(item.total_amount || 0)).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.receiptButton}
          onPress={() => setReceiptOrder(item)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="printer" size={16} color="#780115" />
          <Text style={styles.receiptButtonText}>Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#780115" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/menu')}
        >
          <MaterialCommunityIcons name="plus" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedStatus === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, selectedStatus === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#780115" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#780115']} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}

      {/* Receipt Modal */}
      <Modal
        visible={receiptOrder !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setReceiptOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            {/* Modal Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderTitle}>Receipt</Text>
              <TouchableOpacity onPress={() => setReceiptOrder(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {receiptOrder && (
              <ScrollView
                style={styles.receiptScroll}
                contentContainerStyle={styles.receiptContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Restaurant Name */}
                <Text style={styles.receiptRestaurant}>THE SISIG SPOT BY KIAN</Text>
                <Text style={styles.receiptSubtitle}>Sisig & More</Text>
                <View style={styles.receiptDividerDashed} />

                {/* Order Info */}
                <View style={styles.receiptInfoRow}>
                  <Text style={styles.receiptInfoLabel}>Order #</Text>
                  <Text style={styles.receiptInfoValue}>{receiptOrder.id}</Text>
                </View>
                <View style={styles.receiptInfoRow}>
                  <Text style={styles.receiptInfoLabel}>Customer</Text>
                  <Text style={styles.receiptInfoValue}>{receiptOrder.customer_name}</Text>
                </View>
                <View style={styles.receiptInfoRow}>
                  <Text style={styles.receiptInfoLabel}>Date</Text>
                  <Text style={styles.receiptInfoValue}>{formatDate(receiptOrder.created_at)}</Text>
                </View>
                <View style={styles.receiptInfoRow}>
                  <Text style={styles.receiptInfoLabel}>Time</Text>
                  <Text style={styles.receiptInfoValue}>{formatTime(receiptOrder.created_at)}</Text>
                </View>
                <View style={styles.receiptInfoRow}>
                  <Text style={styles.receiptInfoLabel}>Status</Text>
                  <Text
                    style={[
                      styles.receiptInfoValue,
                      { color: STATUS_COLORS[receiptOrder.status] },
                    ]}
                  >
                    {receiptOrder.status}
                  </Text>
                </View>

                <View style={styles.receiptDividerDashed} />

                {/* Items */}
                <Text style={styles.receiptSectionLabel}>ITEMS</Text>
                {(receiptOrder.items || []).map((item, idx) => {
                  const price = parseFloat(String(item.price));
                  const lineTotal = (item.quantity * price).toFixed(2);
                  return (
                    <View key={idx} style={styles.receiptItemRow}>
                      <Text style={styles.receiptItemQty}>{item.quantity}x</Text>
                      <Text style={styles.receiptItemName}>
                        {item.menu?.name || 'Item'}
                      </Text>
                      <Text style={styles.receiptItemTotal}>₱{lineTotal}</Text>
                    </View>
                  );
                })}

                <View style={styles.receiptDividerSolid} />

                {/* Total */}
                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>TOTAL</Text>
                  <Text style={styles.receiptTotalValue}>
                    ₱{parseFloat(String(receiptOrder.total_amount || 0)).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.receiptDividerDashed} />
                <Text style={styles.receiptThankYou}>Thank you for dining with us!</Text>
                <Text style={styles.receiptSeeYou}>See you next time!</Text>
              </ScrollView>
            )}

            {/* Print / Share Button */}
            {receiptOrder && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handlePrintReceipt(receiptOrder)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>Share / Print Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },

  header: {
    backgroundColor: '#780115',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  tabsWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: { backgroundColor: '#780115', borderColor: '#780115' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },

  listContent: { padding: 16, gap: 14, paddingBottom: 32 },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: { flex: 1 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#222' },
  customerName: { fontSize: 13, color: '#666', marginTop: 2 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: '#999' },

  trackerContainer: { marginBottom: 14 },
  trackerLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginBottom: 8 },
  statusTracker: { flexDirection: 'row', alignItems: 'center' },
  statusStep: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusStepActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  statusStepText: { fontSize: 9, fontWeight: '600', color: '#999', textAlign: 'center' },
  statusStepTextDone: { color: '#fff' },
  statusConnector: { width: 6, height: 3, backgroundColor: '#e0e0e0' },

  divider: { height: 1, backgroundColor: '#f2f2f2', marginVertical: 12 },

  itemsContainer: { gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemQty: { fontSize: 13, fontWeight: '700', color: '#780115', width: 28 },
  itemName: { flex: 1, fontSize: 13, color: '#333' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#555' },
  noItemsText: { fontSize: 13, color: '#bbb', fontStyle: 'italic' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, color: '#999', fontWeight: '500' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#222' },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#780115',
  },
  receiptButtonText: { fontSize: 13, fontWeight: '700', color: '#780115' },

  errorText: { color: '#999', fontSize: 14, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn: { backgroundColor: '#780115', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#bbb', marginTop: 12 },

  // Receipt Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  receiptModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    overflow: 'hidden',
  },
  receiptHeader: {
    backgroundColor: '#780115',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  receiptScroll: { flex: 1 },
  receiptContent: { paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 8 },

  receiptRestaurant: {
    fontSize: 18,
    fontWeight: '700',
    color: '#780115',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  receiptSubtitle: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 2, marginBottom: 16 },

  receiptDividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  receiptDividerSolid: { height: 1, backgroundColor: '#222', marginVertical: 10 },

  receiptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptInfoLabel: { fontSize: 13, color: '#888' },
  receiptInfoValue: { fontSize: 13, fontWeight: '600', color: '#222' },

  receiptSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    letterSpacing: 1,
    marginBottom: 10,
  },
  receiptItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  receiptItemQty: { width: 28, fontSize: 13, fontWeight: '700', color: '#780115' },
  receiptItemName: { flex: 1, fontSize: 13, color: '#333' },
  receiptItemTotal: { fontSize: 13, fontWeight: '600', color: '#222' },

  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: '700', color: '#222' },
  receiptTotalValue: { fontSize: 22, fontWeight: '700', color: '#780115' },

  receiptThankYou: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  receiptSeeYou: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },

  shareButton: {
    backgroundColor: '#780115',
    margin: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default Orders;
