import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, saveCategory, Category } from '../../utils/storage';

const AVAILABLE_ICONS = [
  'fast-food', 'car', 'cart', 'receipt', 'game-controller', 'medical',
  'school', 'home', 'airplane', 'cafe', 'shirt', 'fitness',
  'film', 'gift', 'heart', 'book', 'brush', 'business',
];

const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#A29BFE', '#B2BEC3', '#00B894', '#FD79A8',
  '#6C5CE7', '#FDCB6E', '#E17055', '#74B9FF', '#A29BFE',
];

export default function Settings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('ellipsis-horizontal');
  const [selectedColor, setSelectedColor] = useState('#B2BEC3');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const handleAddCategory = () => {
    setCategoryName('');
    setSelectedIcon('ellipsis-horizontal');
    setSelectedColor('#B2BEC3');
    setCategoryType('expense');
    setShowModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Harap masukkan nama kategori');
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: categoryName.trim(),
      type: categoryType,
      icon: selectedIcon,
      color: selectedColor,
      isCustom: true,
    };

    try {
      await saveCategory(category);
      setShowModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan kategori');
    }
  };

  const customCategories = categories.filter(c => c.isCustom);
  const defaultCategories = categories.filter(c => !c.isCustom);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Informasi Aplikasi</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.appName}>Finance Tracker</Text>
            <Text style={styles.appVersion}>Versi 1.0.0</Text>
            <Text style={styles.appDescription}>
              Aplikasi pencatat keuangan dengan analisis AI untuk membantu Anda mengelola keuangan lebih baik.
            </Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="albums" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Kategori</Text>
            <TouchableOpacity style={styles.addCategoryButton} onPress={handleAddCategory}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addCategoryText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Categories */}
          {customCategories.length > 0 && (
            <View style={styles.categoryGroup}>
              <Text style={styles.categoryGroupTitle}>Kategori Kustom</Text>
              {customCategories.map((cat) => (
                <View key={cat.id} style={styles.categoryItem}>
                  <View style={[styles.categoryIconSmall, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <Text style={styles.categoryItemName}>{cat.name}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: cat.type === 'income' ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.categoryBadgeText, { color: cat.type === 'income' ? '#4CAF50' : '#F44336' }]}>
                      {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Default Categories */}
          <View style={styles.categoryGroup}>
            <Text style={styles.categoryGroupTitle}>Kategori Bawaan</Text>
            {defaultCategories.map((cat) => (
              <View key={cat.id} style={styles.categoryItem}>
                <View style={[styles.categoryIconSmall, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <Text style={styles.categoryItemName}>{cat.name}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: cat.type === 'income' ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.categoryBadgeText, { color: cat.type === 'income' ? '#4CAF50' : '#F44336' }]}>
                    {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Fitur</Text>
          </View>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Pencatatan Transaksi</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Manajemen Anggaran</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Visualisasi Data</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Analisis AI</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Notifikasi Pintar</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Penyimpanan Lokal</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Kategori</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Nama Kategori</Text>
              <TextInput
                style={styles.input}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Contoh: Liburan"
                placeholderTextColor="#BDBDBD"
              />

              <Text style={styles.label}>Tipe</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, categoryType === 'expense' && styles.typeButtonActive]}
                  onPress={() => setCategoryType('expense')}
                >
                  <Text style={[styles.typeText, categoryType === 'expense' && styles.typeTextActive]}>
                    Pengeluaran
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, categoryType === 'income' && styles.typeButtonActive]}
                  onPress={() => setCategoryType('income')}
                >
                  <Text style={[styles.typeText, categoryType === 'income' && styles.typeTextActive]}>
                    Pemasukan
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Pilih Icon</Text>
              <View style={styles.iconGrid}>
                {AVAILABLE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon && styles.iconButtonActive,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons name={icon as any} size={24} color={selectedIcon === icon ? '#FFFFFF' : '#757575'} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Pilih Warna</Text>
              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                <Text style={styles.saveButtonText}>Simpan Kategori</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  categoryGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#424242',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  modalBody: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
