import React, { useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  InventoryItem,
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  updateItemQuantity,
  deleteInventoryItem,
} from '@/services/inventory';

const ICON_OPTIONS = [
  'food-drumstick', 'food-variant', 'food-apple', 'food-steak',
  'bottle-wine', 'cup', 'rice', 'egg', 'fish', 'leaf',
  'package-variant', 'cart', 'silverware-fork-knife', 'fire',
];

const COLOR_OPTIONS = [
  '#780115', '#E8A19F', '#A64D4D', '#D4A574',
  '#C81C1C', '#D4AF37', '#3E2723', '#4CAF50',
  '#2196F3', '#FF9800', '#9C27B0', '#607D8B',
];

const UNIT_OPTIONS = ['kg', 'g', 'L', 'mL', 'pcs', 'box', 'pack', 'bottle'];

const EMPTY_FORM = {
  name: '',
  icon: 'food-variant',
  color: '#780115',
  quantity: '',
  unit: 'kg',
  threshold: '',
};

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'normal' | 'low'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    try {
      const data = await getInventoryItems();
      setItems(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      icon: item.icon || 'food-variant',
      color: item.color || '#780115',
      quantity: String(item.quantity),
      unit: item.unit,
      threshold: String(item.threshold),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Please enter item name.'); return; }
    if (!form.quantity.trim() || isNaN(Number(form.quantity))) { Alert.alert('Required', 'Please enter a valid quantity.'); return; }
    if (!form.threshold.trim() || isNaN(Number(form.threshold))) { Alert.alert('Required', 'Please enter a valid threshold.'); return; }

    setSaving(true);
    const qty = parseFloat(form.quantity);
    const thresh = parseFloat(form.threshold);
    const payload = {
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      quantity: qty,
      unit: form.unit,
      threshold: thresh,
      status: (qty < thresh ? 'low' : 'normal') as 'low' | 'normal',
    };

    try {
      if (editingItem) {
        const updated = await updateInventoryItem(editingItem.id, payload);
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      } else {
        const created = await createInventoryItem(payload);
        setItems((prev) => [created, ...prev]);
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryItem(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not delete item.');
            }
          },
        },
      ]
    );
  };

  const handleQuantityChange = async (item: InventoryItem, delta: number) => {
    const increment = item.unit === 'g' || item.unit === 'mL' ? 100 : item.unit === 'pcs' || item.unit === 'box' || item.unit === 'pack' || item.unit === 'bottle' ? 1 : 0.5;
    const newQty = Math.max(0, item.quantity + delta * increment);
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, quantity: newQty, status: newQty < i.threshold ? 'low' : 'normal' }
          : i
      )
    );
    try {
      await updateItemQuantity(item.id, newQty, item.threshold);
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? item : i))
      );
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalItems = items.length;
  const lowCount = items.filter((i) => i.status === 'low').length;
  const normalCount = items.filter((i) => i.status === 'normal').length;

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const isLow = item.status === 'low';
    const pct = Math.min(1, item.quantity / Math.max(item.threshold, 1));

    return (
      <View style={[styles.itemCard, isLow && styles.itemCardLow]}>
        {/* Left: icon */}
        <View style={[styles.iconBox, { backgroundColor: item.color || '#780115' }]}>
          {/* @ts-ignore */}
          <MaterialCommunityIcons name={item.icon || 'package-variant'} size={28} color="#fff" />
        </View>

        {/* Middle: info */}
        <View style={styles.itemInfo}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            {isLow && (
              <View style={styles.lowBadge}>
                <MaterialCommunityIcons name="alert" size={10} color="#fff" />
                <Text style={styles.lowBadgeText}>LOW</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemQty}>
            {item.quantity} {item.unit}
            <Text style={styles.itemThreshold}>  (min: {item.threshold} {item.unit})</Text>
          </Text>
          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${pct * 100}%`, backgroundColor: isLow ? '#F44336' : '#4CAF50' },
              ]}
            />
          </View>
        </View>

        {/* Right: controls */}
        <View style={styles.controls}>
          <View style={styles.qtyButtons}>
            <TouchableOpacity
              style={styles.qtyBtnMinus}
              onPress={() => handleQuantityChange(item, -1)}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qtyBtnPlus}
              onPress={() => handleQuantityChange(item, 1)}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
              <MaterialCommunityIcons name="pencil" size={14} color="#780115" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <MaterialCommunityIcons name="trash-can-outline" size={14} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#780115" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAddModal}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="package-variant" size={20} color="#780115" />
          <Text style={styles.statNum}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMid]}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={[styles.statNum, { color: '#4CAF50' }]}>{normalCount}</Text>
          <Text style={styles.statLabel}>Normal</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
          <Text style={[styles.statNum, { color: '#F44336' }]}>{lowCount}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>

      {/* Low stock banner */}
      {lowCount > 0 && (
        <View style={styles.warnBanner}>
          <MaterialCommunityIcons name="alert" size={18} color="#780115" />
          <Text style={styles.warnText}>
            {lowCount} item{lowCount > 1 ? 's are' : ' is'} running low — restock soon!
          </Text>
        </View>
      )}

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        {(['All', 'normal', 'low'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
              {s === 'normal' ? 'Normal' : s === 'low' ? 'Low' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#780115" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#780115']} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color="#ddd" />
              <Text style={styles.emptyText}>
                {search ? 'No items match your search' : 'No inventory items yet'}
              </Text>
              {!search && (
                <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
                  <Text style={styles.emptyAddBtnText}>+ Add First Item</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>

              {/* Name */}
              <Text style={styles.formLabel}>Item Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Pork Meat"
                placeholderTextColor="#bbb"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              {/* Quantity + Unit */}
              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#bbb"
                    keyboardType="decimal-pad"
                    value={form.quantity}
                    onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Unit *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {UNIT_OPTIONS.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, form.unit === u && styles.unitChipActive]}
                        onPress={() => setForm((f) => ({ ...f, unit: u }))}
                      >
                        <Text style={[styles.unitChipText, form.unit === u && styles.unitChipTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Threshold */}
              <Text style={styles.formLabel}>Low Stock Threshold *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Alert when below this amount"
                placeholderTextColor="#bbb"
                keyboardType="decimal-pad"
                value={form.threshold}
                onChangeText={(v) => setForm((f) => ({ ...f, threshold: v }))}
              />

              {/* Icon Picker */}
              <Text style={styles.formLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconOption, form.icon === ic && styles.iconOptionActive]}
                    onPress={() => setForm((f) => ({ ...f, icon: ic }))}
                  >
                    {/* @ts-ignore */}
                    <MaterialCommunityIcons name={ic} size={24} color={form.icon === ic ? '#fff' : '#780115'} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Color Picker */}
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      form.color === c && styles.colorOptionActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, color: c }))}
                  >
                    {form.color === c && (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              <Text style={styles.formLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={[styles.iconBox, { backgroundColor: form.color }]}>
                  {/* @ts-ignore */}
                  <MaterialCommunityIcons name={form.icon} size={28} color="#fff" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.itemName}>{form.name || 'Item Name'}</Text>
                  <Text style={styles.itemQty}>
                    {form.quantity || '0'} {form.unit}
                    <Text style={styles.itemThreshold}>  (min: {form.threshold || '0'} {form.unit})</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>{editingItem ? 'Save Changes' : 'Add Item'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },

  header: {
    backgroundColor: '#780115',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  addHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statCardMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f0f0f0',
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#780115' },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '500' },

  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: 8,
  },
  warnText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#780115' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#333', paddingVertical: 0 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: { backgroundColor: '#780115', borderColor: '#780115' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#fff' },

  listContent: { padding: 16, gap: 12, paddingBottom: 32 },

  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemCardLow: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    backgroundColor: '#FFFAFB',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1, gap: 4 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#222' },
  lowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  lowBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  itemQty: { fontSize: 13, color: '#555', fontWeight: '500' },
  itemThreshold: { fontSize: 11, color: '#bbb', fontWeight: '400' },
  progressBg: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },

  controls: { alignItems: 'center', gap: 6, marginLeft: 8 },
  qtyButtons: { flexDirection: 'row', gap: 6 },
  qtyBtnMinus: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnPlus: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: { flexDirection: 'row', gap: 6 },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },

  emptyText: { fontSize: 15, color: '#bbb', marginTop: 12, textAlign: 'center' },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: '#780115',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#780115',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, gap: 4, paddingBottom: 8 },

  formLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
  },
  formRow: { flexDirection: 'row', gap: 12 },
  formHalf: { flex: 1 },
  unitScroll: { marginTop: 0 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 6,
  },
  unitChipActive: { backgroundColor: '#780115', borderColor: '#780115' },
  unitChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  unitChipTextActive: { color: '#fff' },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  iconOptionActive: { backgroundColor: '#780115', borderColor: '#780115' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionActive: { borderWidth: 3, borderColor: '#222' },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 4,
  },

  saveBtn: {
    backgroundColor: '#780115',
    margin: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
