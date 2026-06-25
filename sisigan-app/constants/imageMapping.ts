// Mapping of menu item names to their image files in assets/images/
export const menuItemImages: { [key: string]: any } = {
  // Sisig
  'Pork Sisig': require('@/assets/images/pork-sisig.png.png'),
  'Chicken Sisig': require('@/assets/images/chicken-sisig.png.png'),
  'Beef Sisig': require('@/assets/images/beef-sisig.png'),
  'Tuna Sisig': require('@/assets/images/tuna-sisig.png.png'),
  'Bangus Sisig': require('@/assets/images/bangus-sisig.png'),
  'Tofu Sisig': require('@/assets/images/tufo-sisig.png.png'),
  'Spicy Pork Sisig': require('@/assets/images/spicy-pork-sisig.png.png'),
  'Sisig Overload': require('@/assets/images/sisig-overload.png.png'),

  // Rice Meals
  'Pork Sisig Rice Meal': require('@/assets/images/pork-sisig-rice.png.png'),
  'Chicken Sisig Rice Meal': require('@/assets/images/chicken-sisig-rice.png.png'),
  'Tuna Sisig Rice Meal': require('@/assets/images/tuna-sisig-rice.png.png'),
  'Beef Sisig Rice Meal': require('@/assets/images/beef-sisig-rice.png'),

  // Sides
  'Fries': require('@/assets/images/fries.png'),
  'Cheese Fries': require('@/assets/images/cheese-fries.png.png'),
  'Lumpiang Shanghai': require('@/assets/images/lumpiang-shanghai.png.png'),
  'Calamares': require('@/assets/images/calamares.png.png'),
  'Onion Rings': require('@/assets/images/onion-rings.png.png'),

  // Drinks
  'Soft Drinks': require('@/assets/images/softdrinks.png.png'),
  'Iced Tea': require('@/assets/images/iced-tea.jpg'),
  'Calamansi Juice': require('@/assets/images/calamansi-juice.jpg'),
  'Mango Juice': require('@/assets/images/mango-juice.jpg'),
  'Water': require('@/assets/images/water.png'),

  // Desserts
  'Halo-Halo': require('@/assets/images/halo-halo.png'),
  'Leche Flan': require('@/assets/images/leche-flan.png'),

  // Add-Ons
  'Extra Rice': require('@/assets/images/rice.png'),
  'Garlic Rice': require('@/assets/images/garlic-rice.png'),
};

export const getMenuItemImage = (itemName: string): any => {
  return menuItemImages[itemName] || null;
};
