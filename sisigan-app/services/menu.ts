import { apiClient, API_BASE_URL } from './api';
import { STATIC_MENU_ITEMS, STATIC_CATEGORIES } from '@/constants/staticMenu';

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  category: string;
  available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id?: string;
  name: string;
}

const normalizeMenuItem = (item: any): MenuItem => {
  return {
    ...item,
    price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
  };
};

export const menuService = {
  // Get all menu items
  async getAll() {
    try {
      const items = await apiClient('/api/menu', 'GET');
      return (items || []).map(normalizeMenuItem);
    } catch (error) {
      console.error('Error fetching menu items, using static data:', error);
      return STATIC_MENU_ITEMS;
    }
  },

  // Get menu items by category
  async getByCategory(category: string) {
    try {
      const endpoint = category === 'All'
        ? '/api/menu'
        : `/api/menu?category=${encodeURIComponent(category)}`;
      const items = await apiClient(endpoint, 'GET');
      return (items || []).map(normalizeMenuItem);
    } catch (error) {
      console.error(`Error fetching ${category} menu items, using static data:`, error);
      if (category === 'All') return STATIC_MENU_ITEMS;
      return STATIC_MENU_ITEMS.filter((item) => item.category === category);
    }
  },

  // Get menu categories
  async getCategories() {
    try {
      return await apiClient('/api/menu/categories', 'GET');
    } catch (error) {
      console.error('Error fetching categories, using static data:', error);
      return STATIC_CATEGORIES;
    }
  },

  // Create a new menu item
  async create(item: Partial<MenuItem>) {
    try {
      console.log('[MenuService] Creating item:', item);
      const result = await apiClient('/api/menu', 'POST', item);
      console.log('[MenuService] Item created successfully:', result);
      return normalizeMenuItem(result);
    } catch (error) {
      console.error('[MenuService] Error creating menu item:', error);
      throw error;
    }
  },

  // Get a single menu item
  async getById(id: number) {
    try {
      const item = await apiClient(`/api/menu/${id}`, 'GET');
      return normalizeMenuItem(item);
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }
  },

  // Update a menu item
  async update(id: number, item: Partial<MenuItem>) {
    try {
      const result = await apiClient(`/api/menu/${id}`, 'PUT', item);
      return normalizeMenuItem(result);
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  },

  // Delete a menu item
  async delete(id: number) {
    try {
      return await apiClient(`/api/menu/${id}`, 'DELETE');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  },

  // Toggle availability
  async toggleAvailability(id: number, available: boolean) {
    try {
      const result = await apiClient(`/api/menu/${id}`, 'PUT', { available });
      return normalizeMenuItem(result);
    } catch (error) {
      console.error('Error toggling availability:', error);
      throw error;
    }
  },
};

export default menuService;
