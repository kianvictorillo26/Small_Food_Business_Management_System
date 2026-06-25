import { MenuItem } from '@/services/menu';

export const STATIC_MENU_ITEMS: MenuItem[] = [
  // Sisig
  { id: 1, name: 'Pork Sisig', category: 'Sisig', price: 129, available: true, created_at: '', updated_at: '' },
  { id: 2, name: 'Chicken Sisig', category: 'Sisig', price: 119, available: true, created_at: '', updated_at: '' },
  { id: 3, name: 'Beef Sisig', category: 'Sisig', price: 149, available: true, created_at: '', updated_at: '' },
  { id: 4, name: 'Tuna Sisig', category: 'Sisig', price: 109, available: true, created_at: '', updated_at: '' },
  { id: 5, name: 'Bangus Sisig', category: 'Sisig', price: 119, available: true, created_at: '', updated_at: '' },
  { id: 6, name: 'Tofu Sisig', category: 'Sisig', price: 99, available: true, created_at: '', updated_at: '' },
  { id: 7, name: 'Spicy Pork Sisig', category: 'Sisig', price: 139, available: true, created_at: '', updated_at: '' },
  { id: 8, name: 'Sisig Overload', category: 'Sisig', price: 159, available: true, created_at: '', updated_at: '' },

  // Rice Meals
  { id: 9, name: 'Pork Sisig Rice Meal', category: 'Rice Meals', price: 149, available: true, created_at: '', updated_at: '' },
  { id: 10, name: 'Chicken Sisig Rice Meal', category: 'Rice Meals', price: 139, available: true, created_at: '', updated_at: '' },
  { id: 11, name: 'Tuna Sisig Rice Meal', category: 'Rice Meals', price: 129, available: true, created_at: '', updated_at: '' },
  { id: 12, name: 'Beef Sisig Rice Meal', category: 'Rice Meals', price: 169, available: true, created_at: '', updated_at: '' },

  // Sides
  { id: 13, name: 'Fries', category: 'Sides', price: 59, available: true, created_at: '', updated_at: '' },
  { id: 14, name: 'Cheese Fries', category: 'Sides', price: 79, available: true, created_at: '', updated_at: '' },
  { id: 15, name: 'Lumpiang Shanghai', category: 'Sides', price: 69, available: true, created_at: '', updated_at: '' },
  { id: 16, name: 'Calamares', category: 'Sides', price: 89, available: true, created_at: '', updated_at: '' },
  { id: 17, name: 'Onion Rings', category: 'Sides', price: 69, available: true, created_at: '', updated_at: '' },

  // Drinks
  { id: 18, name: 'Soft Drinks', category: 'Drinks', price: 39, available: true, created_at: '', updated_at: '' },
  { id: 19, name: 'Iced Tea', category: 'Drinks', price: 45, available: true, created_at: '', updated_at: '' },
  { id: 20, name: 'Calamansi Juice', category: 'Drinks', price: 49, available: true, created_at: '', updated_at: '' },
  { id: 21, name: 'Mango Juice', category: 'Drinks', price: 49, available: true, created_at: '', updated_at: '' },
  { id: 22, name: 'Water', category: 'Drinks', price: 25, available: true, created_at: '', updated_at: '' },

  // Desserts
  { id: 23, name: 'Halo-Halo', category: 'Desserts', price: 89, available: true, created_at: '', updated_at: '' },
  { id: 24, name: 'Leche Flan', category: 'Desserts', price: 69, available: true, created_at: '', updated_at: '' },

  // Add-Ons
  { id: 25, name: 'Extra Rice', category: 'Add-Ons', price: 25, available: true, created_at: '', updated_at: '' },
  { id: 26, name: 'Garlic Rice', category: 'Add-Ons', price: 35, available: true, created_at: '', updated_at: '' },
];

export const STATIC_CATEGORIES = ['All', 'Sisig', 'Rice Meals', 'Sides', 'Drinks', 'Desserts', 'Add-Ons'];
