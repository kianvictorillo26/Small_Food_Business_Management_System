import { apiClient } from './api';
import { localOrderStore } from './localOrderStore';

export interface OrderItem {
  id: number;
  order_id: number;
  menu_id: number;
  quantity: number;
  price: number;
  menu?: {
    id: number;
    name: string;
    price: number;
    category: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer_name: string;
  status: 'New' | 'In Progress' | 'Ready' | 'Completed';
  total_amount: number;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SalesReport {
  total_sales: number;
  total_orders: number;
  avg_per_order: number;
  breakdown: Array<{
    date: string;
    amount: number;
    order_count: number;
  }>;
}

export interface TopItem {
  id: number;
  name: string;
  sold: number;
  price: number;
}

const filterByPeriod = (orders: Order[], period: 'today' | 'week' | 'month'): Order[] => {
  const now = new Date();
  return orders.filter((o) => {
    const d = new Date(o.created_at);
    if (period === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      return d >= weekAgo;
    }
    // month
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 29);
    monthAgo.setHours(0, 0, 0, 0);
    return d >= monthAgo;
  });
};

const computeSalesReport = (orders: Order[], period: 'today' | 'week' | 'month'): SalesReport => {
  const filtered = filterByPeriod(orders, period);
  const total_sales = filtered.reduce((s, o) => s + parseFloat(String(o.total_amount || 0)), 0);
  const total_orders = filtered.length;
  const avg_per_order = total_orders > 0 ? total_sales / total_orders : 0;

  const byDate: Record<string, { amount: number; order_count: number }> = {};
  filtered.forEach((o) => {
    const key = new Date(o.created_at).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric',
    });
    if (!byDate[key]) byDate[key] = { amount: 0, order_count: 0 };
    byDate[key].amount += parseFloat(String(o.total_amount || 0));
    byDate[key].order_count += 1;
  });

  const breakdown = Object.entries(byDate).map(([date, v]) => ({ date, ...v }));
  return { total_sales, total_orders, avg_per_order, breakdown };
};

const computeTopItems = (orders: Order[], period: 'today' | 'week' | 'month'): TopItem[] => {
  const filtered = filterByPeriod(orders, period);
  const tally: Record<number, TopItem> = {};

  filtered.forEach((o) => {
    (o.items || []).forEach((item) => {
      const id = item.menu_id;
      if (!tally[id]) {
        tally[id] = {
          id,
          name: item.menu?.name || 'Item',
          sold: 0,
          price: parseFloat(String(item.price || 0)),
        };
      }
      tally[id].sold += item.quantity;
    });
  });

  return Object.values(tally).sort((a, b) => b.sold - a.sold);
};

export const orderService = {
  // Get all orders
  async getAll() {
    try {
      return await apiClient('/api/orders', 'GET');
    } catch {
      return await localOrderStore.getAll();
    }
  },

  // Get orders by status
  async getByStatus(status: string) {
    try {
      const endpoint = status === 'All'
        ? '/api/orders'
        : `/api/orders?status=${encodeURIComponent(status)}`;
      return await apiClient(endpoint, 'GET');
    } catch {
      return await localOrderStore.getByStatus(status);
    }
  },

  // Create a new order
  async create(order: {
    customer_name: string;
    total_amount?: number;
    items: Array<{
      menu_id: number;
      quantity: number;
      price: number;
      name?: string;
    }>;
    notes?: string;
  }) {
    try {
      const result = await apiClient('/api/orders', 'POST', order);
      return result;
    } catch {
      const total = order.total_amount ??
        order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const localItems = order.items.map((i) => ({
        id: i.menu_id,
        order_id: 0,
        menu_id: i.menu_id,
        quantity: i.quantity,
        price: i.price,
        menu: i.name ? { id: i.menu_id, name: i.name, price: i.price, category: '' } : undefined,
        created_at: '',
        updated_at: '',
      }));
      return await localOrderStore.save({
        customer_name: order.customer_name,
        total_amount: total,
        notes: order.notes,
        items: localItems,
      });
    }
  },

  // Get a single order
  async getById(id: number) {
    try {
      return await apiClient(`/api/orders/${id}`, 'GET');
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Update order status
  async updateStatus(id: number, status: 'New' | 'In Progress' | 'Ready' | 'Completed') {
    try {
      return await apiClient(`/api/orders/${id}`, 'PUT', { status });
    } catch {
      await localOrderStore.updateStatus(id, status);
    }
  },

  // Update order
  async update(id: number, order: Partial<Order>) {
    try {
      return await apiClient(`/api/orders/${id}`, 'PUT', order);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Delete an order
  async delete(id: number) {
    try {
      return await apiClient(`/api/orders/${id}`, 'DELETE');
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Get today's summary
  async getTodaysSummary() {
    try {
      return await apiClient('/api/orders/summary/today', 'GET');
    } catch (error) {
      console.error('Error fetching today summary:', error);
      throw error;
    }
  },

  // Get sales report
  async getSalesReport(period: 'today' | 'week' | 'month' = 'today'): Promise<SalesReport> {
    try {
      return await apiClient(`/api/orders/report/sales?period=${period}`, 'GET');
    } catch {
      return computeSalesReport(await localOrderStore.getAll(), period);
    }
  },

  // Get top items
  async getTopItems(period: 'today' | 'week' | 'month' = 'today'): Promise<TopItem[]> {
    try {
      return await apiClient(`/api/orders/report/top-items?period=${period}`, 'GET');
    } catch {
      return computeTopItems(await localOrderStore.getAll(), period);
    }
  },
};

export default orderService;
