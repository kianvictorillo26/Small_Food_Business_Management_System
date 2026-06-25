import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InventoryItem {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  quantity: number;
  unit: string;
  threshold: number;
  status?: 'normal' | 'low';
  created_at?: string;
  updated_at?: string;
}

const INVENTORY_KEY = 'local_inventory';

let nextId = Date.now() + 10000;

const generateId = () => {
  nextId += 1;
  return nextId;
};

export const localInventoryStore = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const raw = await AsyncStorage.getItem(INVENTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async create(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const items = await this.getAll();
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items.unshift(newItem);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
    return newItem;
  },

  async update(id: number, patch: Partial<InventoryItem>): Promise<InventoryItem> {
    const items = await this.getAll();
    let updated: InventoryItem | undefined;
    const newItems = items.map((i) => {
      if (i.id === id) {
        updated = { ...i, ...patch, updated_at: new Date().toISOString() };
        return updated;
      }
      return i;
    });
    if (!updated) throw new Error(`Item ${id} not found`);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(newItems));
    return updated;
  },

  async remove(id: number): Promise<void> {
    const items = await this.getAll();
    const filtered = items.filter((i) => i.id !== id);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(filtered));
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const items = await this.getAll();
    return items.filter((i) => i.quantity < i.threshold);
  },
};
