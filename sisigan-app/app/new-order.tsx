import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext';

const NewOrder = () => {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Please add items to the order');
      return;
    }

    try {
      // Navigate to payment screen, passing all order data
      const cartItemsJson = JSON.stringify(cartItems);
      router.push({
        pathname: '/payment',
        params: {
          totalAmount: cartTotal.toFixed(2),
          customerName: customerName,
          notes: notes,
          cartItems: cartItemsJson,
        },
      });
    } catch (error) {
      console.error('Error navigating to payment:', error);
      Alert.alert('Error', 'Failed to proceed to payment.');
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const itemTotal = price * item.quantity;

    return (
      <View style={styles.cartItemContainer}>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.name}</Text>
          <Text style={styles.cartItemCategory}>{item.category}</Text>
          <Text style={styles.cartItemPrice}>₱{price.toFixed(2)}</Text>
        </View>

        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
          >
            <MaterialCommunityIcons name="minus" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cartItemRight}>
          <Text style={styles.cartItemTotal}>₱{itemTotal.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromCart(item.id)}
          >
            <MaterialCommunityIcons name="trash-can" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#780115" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Order</Text>
          <View style={styles.headerSpacing} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="cart-remove" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No items in cart</Text>
          <TouchableOpacity
            style={styles.backToMenuButton}
            onPress={() => router.push('/menu')}
          >
            <Text style={styles.backToMenuButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#780115" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Order</Text>
        <View style={styles.headerSpacing} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Customer Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            placeholderTextColor="#999"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Order Notes (optional)"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({cartItems.length})</Text>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{cartTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{cartTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="close" size={20} color="#666" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmitOrder}
          >
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Continue to Payment</Text>
            </>
          </TouchableOpacity>
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
    backgroundColor: '#780115',
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
    marginBottom: 12,
  },
  notesInput: {
    marginBottom: 0,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  cartItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  cartItemCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#780115',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#780115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemRight: {
    alignItems: 'flex-end',
  },
  cartItemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  removeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#780115',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#780115',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  backToMenuButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#780115',
    borderRadius: 8,
  },
  backToMenuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NewOrder;
