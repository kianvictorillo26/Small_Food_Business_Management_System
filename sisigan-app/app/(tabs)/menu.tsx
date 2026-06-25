import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import menuService, { MenuItem } from '@/services/menu';
import { getMenuItemImage } from '@/constants/imageMapping';
import { useCart } from '@/contexts/CartContext';

const Menu = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMenuItems(selectedCategory);
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const cats = await menuService.getCategories();
      // Ensure 'All' is always first
      const categoriesWithAll = ['All', ...(((cats as string[]) || []).filter((cat: string) => cat !== 'All'))];
      setCategories(categoriesWithAll);
    } catch (err) {
      console.error(err);
      // Set default categories if API fails
      setCategories(['All', 'Sisig', 'Rice Meals', 'Sides', 'Drinks', 'Desserts', 'Add-Ons']);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async (category: string) => {
    try {
      setLoading(true);
      let items;
      
      if (category === 'All') {
        // Fetch all items and group by category
        const allItems = await menuService.getAll();
        items = allItems || [];
      } else {
        // Fetch items for specific category
        items = await menuService.getByCategory(category);
      }
      
      // Ensure all prices are numbers
      const normalizedItems = (items || []).map((item: MenuItem) => ({
        ...item,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      }));
      
      setMenuItems(normalizedItems);
      setError(null);
    } catch (err: any) {
      console.error('Menu loading error:', err);
      const errorMsg = err?.message || 'Failed to load menu items. Make sure Laravel API is running on port 8000.';
      setError(errorMsg);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId: number, currentAvailability: boolean) => {
    try {
      await menuService.toggleAvailability(itemId, !currentAvailability);
      // Update the local state
      setMenuItems(menuItems.map(item =>
        item.id === itemId ? { ...item, available: !currentAvailability } : item
      ));
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) {
      Alert.alert('Unavailable', `${item.name} is currently unavailable`);
      return;
    }
    addToCart(item, 1);
    Alert.alert('Added', `${item.name} has been added to cart`);
  };

  const formatPrice = (price: number | string | undefined): string => {
    try {
      if (!price) return '0.00';
      const num = typeof price === 'string' ? parseFloat(price) : price;
      return isNaN(num) ? '0.00' : num.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Sisig': 'fire',
      'Rice Meals': 'rice',
      'Sides': 'silverware-fork-knife',
      'Drinks': 'glass-mug-variant',
      'Desserts': 'cake-variant',
      'Add-Ons': 'plus-circle',
      'All': 'food',
    };
    return icons[category] || 'food';
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const localImage = getMenuItemImage(item.name);

    return (
      <TouchableOpacity style={styles.menuCard} activeOpacity={0.7}>
        <View style={styles.menuImagePlaceholder}>
          {localImage ? (
            <Image 
              source={localImage} 
              style={styles.menuImage}
            />
          ) : item.image_url && item.image_url.startsWith('http') ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.menuImage}
            />
          ) : (
            <View style={styles.menuImageIcon}>
              <MaterialCommunityIcons 
                name={getCategoryIcon(item.category) as any} 
                size={48} 
                color="#800000" 
              />
            </View>
          )}
        </View>
        <View style={styles.menuInfo}>
          <Text style={styles.menuName}>{item.name}</Text>
          {selectedCategory === 'All' && (
            <Text style={styles.menuCategory}>{item.category}</Text>
          )}
          <Text style={styles.menuPrice}>₱{formatPrice(item.price)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.available ? '#4CAF50' : '#ccc',
            },
          ]}
          onPress={() => handleAddToCart(item)}
          disabled={!item.available}
        >
          <MaterialCommunityIcons
            name="cart-plus"
            size={16}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {item.available ? 'Add to Order' : 'Unavailable'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const getGroupedItems = () => {
    if (selectedCategory !== 'All') {
      return menuItems;
    }

    // Group items by category for 'All' view
    const grouped: { [key: string]: MenuItem[] } = {};
    menuItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return Object.entries(grouped).flatMap(([category, items], index) => [
      { id: `category-${category}`, isHeader: true, category, name: '', price: 0, available: true } as any,
      ...items,
    ]);
  };

  const renderItemWithHeader = (item: any) => {
    if (item.isHeader) {
      return (
        <View style={styles.categoryHeader}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(item.category) as any} 
            size={24} 
            color="#800000" 
            style={{ marginRight: 12 }}
          />
          <Text style={styles.categoryHeaderText}>{item.category}</Text>
        </View>
      );
    }
    return renderMenuItem({ item });
  };

  if (loading && menuItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#800000" />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#780115" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#800000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => router.push('/new-order')}
        >
          <MaterialCommunityIcons name="cart" size={28} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
            style={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === category && styles.categoryTabTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuListContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#780115" />
          ) : menuItems.length === 0 ? (
            <Text style={styles.emptyText}>No items found</Text>
          ) : (
            <FlatList
              data={(selectedCategory === 'All' ? getGroupedItems() : menuItems) as any}
              renderItem={selectedCategory === 'All' ? ({ item }) => renderItemWithHeader(item) : renderMenuItem}
              keyExtractor={(item: any, index) => 
                item.isHeader ? `category-${item.category}` : item.id.toString()
              }
              scrollEnabled={false}
              contentContainerStyle={styles.menuList}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#800000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacing: {
    width: 40,
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoriesContent: {
    gap: 12,
    paddingRight: 20,
  },
  categoryTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryTabActive: {
    backgroundColor: '#800000',
    borderColor: '#800000',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  menuListContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuList: {
    gap: 16,
    paddingBottom: 20,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  menuImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  menuImageIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  menuCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#800000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
  },
  categoryHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#800000',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
});

export default Menu;