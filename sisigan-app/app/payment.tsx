import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext';
import orderService from '@/services/orders';

const Payment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { clearCart } = useCart();

  // Safely parse all params
  const rawTotal = Array.isArray(params.totalAmount) ? params.totalAmount[0] : params.totalAmount;
  const totalAmount = parseFloat(rawTotal as string) || 0;

  const rawName = Array.isArray(params.customerName) ? params.customerName[0] : params.customerName;
  const customerName = (rawName as string) || '';

  const rawNotes = Array.isArray(params.notes) ? params.notes[0] : params.notes;
  const notes = (rawNotes as string) || '';

  const rawCartItems = Array.isArray(params.cartItems) ? params.cartItems[0] : params.cartItems;
  let cartItems: any[] = [];
  try {
    cartItems = JSON.parse((rawCartItems as string) || '[]');
  } catch {
    cartItems = [];
  }

  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashAmount - totalAmount);
  const isPaymentValid = totalAmount > 0 && cashAmount >= totalAmount;

  const handlePayment = async () => {
    // Validate cash input
    if (!cashReceived.trim() || cashAmount === 0) {
      Alert.alert('Missing Amount', 'Please enter the cash received from the customer.');
      return;
    }

    // Validate sufficient payment
    if (cashAmount < totalAmount) {
      Alert.alert(
        'Insufficient Payment',
        `Cash received (₱${cashAmount.toFixed(2)}) is less than the total (₱${totalAmount.toFixed(2)}).\nShort by ₱${(totalAmount - cashAmount).toFixed(2)}.`
      );
      return;
    }

    setLoading(true);

    const orderData = {
      customer_name: customerName,
      total_amount: totalAmount,
      items: cartItems.map((item: any) => ({
        menu_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      })),
      notes: notes || undefined,
    };

    // Save order to backend — always continue even if API fails
    let orderId: number | string = `TMP-${Date.now()}`;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Order API timed out — proceeding offline');
        resolve();
      }, 8000);

      orderService
        .create(orderData)
        .then((order) => {
          if (order && order.id) {
            orderId = order.id;
          }
          console.log('Order saved:', orderId);
        })
        .catch((err) => {
          console.warn('Order API failed — proceeding offline:', err);
        })
        .finally(() => {
          clearTimeout(timeout);
          resolve();
        });
    });

    // Clear cart and navigate to dashboard — dashboard will refresh via useFocusEffect
    clearCart();
    setLoading(false);
    router.replace('/(tabs)/dashboard');
  };

  const handleCancel = () => {
    if (loading) return;
    Alert.alert('Cancel Payment', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#780115" />

      {/* Full-screen loading overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#780115" />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerSpacing} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{customerName || '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{cartItems.length}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={[styles.summaryValue, styles.totalHighlight]}>₱{totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            {/* Total Amount Due */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Total Amount Due</Text>
              <Text style={styles.amountValue}>₱{totalAmount.toFixed(2)}</Text>
            </View>

            {/* Cash Received */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cash Received</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencyPrefix}>₱</Text>
                <TextInput
                  style={[
                    styles.input,
                    cashReceived.length > 0 && !isPaymentValid && styles.inputError,
                    cashReceived.length > 0 && isPaymentValid && styles.inputValid,
                  ]}
                  placeholder="0.00"
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad"
                  value={cashReceived}
                  onChangeText={setCashReceived}
                  autoFocus={false}
                />
              </View>
            </View>

            {/* Change */}
            <View style={[styles.changeCard, !isPaymentValid && cashReceived.length > 0 && styles.changeCardInvalid]}>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Change</Text>
                <Text style={[styles.changeValue, !isPaymentValid && cashReceived.length > 0 && styles.changeValueError]}>
                  ₱{isPaymentValid ? change.toFixed(2) : '—'}
                </Text>
              </View>
              {cashReceived.length > 0 && !isPaymentValid && (
                <Text style={styles.shortageText}>
                  Short by ₱{(totalAmount - cashAmount).toFixed(2)}
                </Text>
              )}
              {isPaymentValid && (
                <View style={styles.validRow}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.validText}>Payment sufficient</Text>
                </View>
              )}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.payButton]}
              onPress={handlePayment}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="cash-check" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Complete Payment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  loadingText: { fontSize: 16, fontWeight: '600', color: '#780115' },

  header: {
    backgroundColor: '#780115',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacing: { width: 40 },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12 },

  summaryBox: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#222', fontWeight: '600' },
  totalHighlight: { fontSize: 16, color: '#780115', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 10 },

  amountCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  amountLabel: { fontSize: 13, color: '#E65100', fontWeight: '500', marginBottom: 6 },
  amountValue: { fontSize: 32, fontWeight: '700', color: '#FF6F00' },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: '#780115',
    paddingRight: 10,
    paddingLeft: 4,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 22,
    color: '#222',
    fontWeight: '600',
  },
  inputError: { borderColor: '#F44336', backgroundColor: '#FFEBEE' },
  inputValid: { borderColor: '#4CAF50', backgroundColor: '#F1FFF3' },

  changeCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  changeCardInvalid: { backgroundColor: '#FFEBEE', borderLeftColor: '#F44336' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeLabel: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  changeValue: { fontSize: 28, fontWeight: '700', color: '#1B5E20' },
  changeValueError: { color: '#C62828' },
  shortageText: { fontSize: 13, color: '#C62828', fontWeight: '600', marginTop: 6 },
  validRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  validText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },

  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  payButton: { backgroundColor: '#4CAF50' },
  payButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default Payment;
