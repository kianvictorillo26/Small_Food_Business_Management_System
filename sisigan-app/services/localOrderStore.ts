import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from './orders';

const ORDERS_KEY = 'local_orders';

let nextId = Date.now();

const generateId = () => {
  nextId += 1;
  return nextId;
};

export const localOrderStore = {
  async getAll(): Promise<Order[]> {
    try {
      const raw = await AsyncStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async save(order: {
    customer_name: string;
    total_amount: number;
    notes?: string;
    items?: any[];
  }): Promise<Order> {
    const orders = await this.getAll();
    const newOrder: Order = {
      id: generateId(),
      customer_name: order.customer_name,
      status: 'New',
      total_amount: order.total_amount,
      notes: order.notes,
      items: order.items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  async updateStatus(id: number, status: Order['status']): Promise<void> {
    const orders = await this.getAll();
    const updated = orders.map((o) =>
      o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o
    );
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  },

  async getByStatus(status: string): Promise<Order[]> {
    const orders = await this.getAll();
    if (status === 'All') return orders;
    return orders.filter((o) => o.status === status);
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ORDERS_KEY);
  },
};
