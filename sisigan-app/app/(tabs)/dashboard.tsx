import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import orderService, { Order } from '@/services/orders';
import { getLowStockItems } from '@/services/inventory';

const Dashboard = () => {
  const router = useRouter();

  const [todaySales, setTodaySales] = useState('₱0');
  const [ordersToday, setOrdersToday] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('Dashboard focused - reloading data...');
      loadDashboardData();
      return () => {};
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Run all requests in parallel; each fails independently
      const [lowStockResult, ordersResult] = await Promise.allSettled([
        getLowStockItems(),
        orderService.getAll(),
      ]);

      if (lowStockResult.status === 'fulfilled') {
        setLowStock(lowStockResult.value?.length || 0);
      }

      if (ordersResult.status === 'fulfilled') {
        const orders: Order[] = ordersResult.value || [];

        // Compute today's sales and order count directly from orders list
        const todayStr = new Date().toDateString();
        const todayOrders = orders.filter(
          (o) => new Date(o.created_at).toDateString() === todayStr
        );
        const salesTotal = todayOrders.reduce(
          (sum, o) => sum + parseFloat(String(o.total_amount || 0)),
          0
        );
        setTodaySales(`₱${salesTotal.toFixed(2)}`);
        setOrdersToday(todayOrders.length);

        // Recent orders — newest first
        const sorted = [...orders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentOrders(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('Refreshing dashboard...');
    setRefreshing(true);
    loadDashboardData();
  }, []);

  const quickActions: Array<{
    label: string;
    icon: string;
    bgColor: string;
    onPress: () => void;
  }> = [
    { 
      label: '+ New Order', 
      icon: 'plus-circle', 
      bgColor: '#800000',
      onPress: () => router.push('/menu')
    },
    { 
      label: 'Add Inventory', 
      icon: 'box', 
      bgColor: '#F5F5F5',
      onPress: () => router.push('/inventory')
    },
    { 
      label: 'Manage Menu', 
      icon: 'bell-outline', 
      bgColor: '#F5F5F5',
      onPress: () => router.push('/menu')
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', weekday: 'long' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready':
        return '#4CAF50';
      case 'In Progress':
        return '#FFC107';
      case 'Completed':
        return '#9E9E9E';
      case 'New':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#800000" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800000']} />}
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.greetingRow}>
              <MaterialCommunityIcons name="white-balance-sunny" size={24} color="#fff" />
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <Text style={styles.appTitle}>The Sisig Spot By Kian</Text>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/settings')}>
            <MaterialCommunityIcons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Wave divider */}
        <View style={styles.waveDivider} />

        {/* Main Content */}
        <View style={styles.mainContent}>
          {loading ? (
            <View style={{ marginTop: 40, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#800000" />
            </View>
          ) : (
            <>
              {/* Today's Sales Card */}
              <View style={styles.salesCard}>
                <View style={styles.salesIcon}>
                  <FontAwesome5 name="chart-line" size={32} color="#780115" />
                </View>
                <View style={styles.salesInfo}>
                  <Text style={styles.salesLabel}>Today's Sales</Text>
                  <Text style={styles.salesAmount}>{todaySales}</Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="clipboard-list" size={28} color="#800000" />
                  </View>
                  <Text style={styles.statLabel}>Orders Today</Text>
                  <Text style={styles.statValue}>{ordersToday}</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <MaterialCommunityIcons name="package-variant" size={28} color="#800000" />
                  </View>
                  <Text style={styles.statLabel}>Low Stock</Text>
                  <Text style={styles.statValue}>{lowStock}</Text>
                </View>
              </View>

              {/* Quick Actions Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsContainer}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                        styles.quickActionButton,
                        {
                            backgroundColor: action.bgColor,
                            flex: index === 0 ? 1 : 0.9,
                        },
                        ]}
                        onPress={action.onPress}
                        activeOpacity={0.7}>
                      <MaterialCommunityIcons
                        name={action.icon as any}
                        size={24}
                        color={index === 0 ? '#fff' : '#800000'}
                      />
                      <Text
                        style={[
                          styles.quickActionText,
                          { color: index === 0 ? '#fff' : '#800000' },
                        ]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Recent Orders Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Orders</Text>
                  <TouchableOpacity onPress={() => router.push('/orders')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {recentOrders.length === 0 ? (
                  <Text style={styles.emptyText}>No orders yet</Text>
                ) : (
                  recentOrders.map((order, index) => (
                    <TouchableOpacity
                      key={order.id}
                      style={[
                        styles.orderCard,
                        index !== recentOrders.length - 1 && styles.orderCardBorder,
                      ]}
                      activeOpacity={0.7}>
                      <View style={styles.orderIconContainer}>
                        <MaterialCommunityIcons name={"shopping" as any} size={24} color="#FFCC00" />
                      </View>

                      <View style={styles.orderDetails}>
                        <Text style={styles.orderId}>#{order.id} - {order.customer_name}</Text>
                        <Text style={styles.orderItems}>
                          {order.items && order.items.length > 0
                            ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                            : 'No items'}
                          {order.total_amount ? ` · ₱${parseFloat(String(order.total_amount)).toFixed(2)}` : ''}
                        </Text>
                        <View style={styles.orderTimeRow}>
                          <MaterialCommunityIcons name="clock-outline" size={12} color="#999" />
                          <Text style={styles.orderTime}>{formatTime(order.created_at)}</Text>
                        </View>
                      </View>

                      <View style={styles.orderStatusContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(order.status) + '20' },
                          ]}>
                          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                            {order.status}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#ddd" />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff00',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#800000',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  appTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.9,
  },
  menuButton: {
    padding: 8,
  },
  waveDivider: {
    height: 30,
    backgroundColor: '#ffffff00',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  salesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  salesIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#FFE4B5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  salesInfo: {
    flex: 1,
  },
  salesLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  salesAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#780115',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFE4B5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#780115',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#780115',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#780115',
  },
  viewAllText: {
    fontSize: 14,
    color: '#780115',
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#780115',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f7b638',
    marginBottom: 0,
  },
  orderIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFE4B5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#780115',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 12,
    color: '#780115',
    fontWeight: '400',
    marginBottom: 6,
  },
  orderTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 11,
    color: '#780115',
    marginLeft: 4,
  },
  orderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#780115',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default Dashboard;

