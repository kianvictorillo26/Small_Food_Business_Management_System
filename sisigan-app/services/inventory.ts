import { apiClient, API_ENDPOINTS } from './api';
import { localInventoryStore, InventoryItem } from './localInventoryStore';

export type { InventoryItem };

export interface InventoryResponse {
  success: boolean;
  data: InventoryItem[];
  message?: string;
}

export interface SingleItemResponse {
  success: boolean;
  data: InventoryItem;
  message?: string;
}

// Get all inventory items
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const response = await apiClient(API_ENDPOINTS.INVENTORY_LIST, 'GET');
    return response.data || [];
  } catch {
    return await localInventoryStore.getAll();
  }
};

// Get low stock items
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const response = await apiClient(API_ENDPOINTS.INVENTORY_LOW_STOCK, 'GET');
    return response.data || [];
  } catch {
    return await localInventoryStore.getLowStock();
  }
};

// Get single item
export const getInventoryItem = async (id: number): Promise<InventoryItem> => {
  try {
    const response = await apiClient(API_ENDPOINTS.INVENTORY_UPDATE(id), 'GET');
    return response.data;
  } catch {
    const items = await localInventoryStore.getAll();
    const found = items.find((i) => i.id === id);
    if (!found) throw new Error(`Item ${id} not found`);
    return found;
  }
};

// Create new item
export const createInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
  try {
    const response = await apiClient(API_ENDPOINTS.INVENTORY_CREATE, 'POST', item);
    return response.data;
  } catch {
    return await localInventoryStore.create(item);
  }
};

// Update item
export const updateInventoryItem = async (id: number, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  try {
    const response = await apiClient(API_ENDPOINTS.INVENTORY_UPDATE(id), 'PUT', item);
    return response.data;
  } catch {
    return await localInventoryStore.update(id, item);
  }
};

// Delete item
export const deleteInventoryItem = async (id: number): Promise<void> => {
  try {
    await apiClient(API_ENDPOINTS.INVENTORY_DELETE(id), 'DELETE');
  } catch {
    await localInventoryStore.remove(id);
  }
};

// Update item quantity
export const updateItemQuantity = async (
  id: number,
  newQuantity: number,
  threshold: number
): Promise<InventoryItem> => {
  const status = newQuantity < threshold ? 'low' : 'normal';
  return updateInventoryItem(id, { quantity: newQuantity, status });
};
