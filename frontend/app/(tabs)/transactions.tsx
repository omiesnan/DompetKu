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
import { format } from 'date-fns';
import {
  getTransactions,
  getCategories,
  saveTransaction,
  deleteTransaction,
  updateTransaction,
  Transaction,
  Category,
} from '../../utils/storage';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Form state
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const txns = await getTransactions();
    const cats = await getCategories();
    setTransactions(txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setCategories(cats);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setType('expense');
    setAmount('');
    setSelectedCategory('');
    setNote('');
    setDate(new Date());
    setShowModal(true);
  };

  const handleEditTransaction = (txn: Transaction) => {
    setEditingTransaction(txn);
    setType(txn.type as 'income' | 'expense');
    setAmount(txn.amount.toString());
    setSelectedCategory(txn.category);
    setNote(txn.note);
    setDate(new Date(txn.date));
    setShowModal(true);
  };

  const handleSaveTransaction = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Harap isi semua field yang diperlukan');
      return;
    }

    const transaction: Transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category: selectedCategory,
      date: date.toISOString(),
      note,
    };

    try {
      if (editingTransaction) {
        await updateTransaction(transaction);
      } else {
        await saveTransaction(transaction);
      }
      setShowModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan transaksi');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert(
      'Hapus Transaksi',
      'Yakin ingin menghapus transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(id);
            await loadData();
          },
        },
      ]
    );
  };

  const filteredCategories = categories.filter(
    c => c.type === type || c.type === 'both'
  );

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer}>
        {transactions.map((txn) => {
          const category = categories.find(c => c.name === txn.category);
          return (
            <TouchableOpacity
              key={txn.id}
              style={styles.transactionCard}
              onPress={() => handleEditTransaction(txn)}
            >
              <View style={styles.transactionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: category?.color + '20' || '#E0E0E0' }]}>
                  <Ionicons
                    name={category?.icon as any || 'cash'}
                    size={28}
                    color={category?.color || '#757575'}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.categoryName}>{txn.category}</Text>
                  <Text style={styles.transactionNote}>{txn.note || 'Tidak ada catatan'}</Text>
                  <Text style={styles.transactionDate}>{format(new Date(txn.date), 'dd MMM yyyy, HH:mm')}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.amountText,
                    { color: txn.type === 'income' ? '#4CAF50' : '#F44336' }
                  ]}
                >
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTransaction(txn.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
            <Text style={styles.emptySubtext}>Tap tombol + untuk menambah transaksi</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
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
              <Text style={styles.modalTitle}>
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Selection */}
              <Text style={styles.label}>Tipe</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                  onPress={() => setType('expense')}
                >
                  <Ionicons
                    name="arrow-up-circle"
                    size={24}
                    color={type === 'expense' ? '#FFFFFF' : '#F44336'}
                  />
                  <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
                    Pengeluaran
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                  onPress={() => setType('income')}
                >
                  <Ionicons
                    name="arrow-down-circle"
                    size={24}
                    color={type === 'income' ? '#FFFFFF' : '#4CAF50'}
                  />
                  <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
                    Pemasukan
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <Text style={styles.label}>Jumlah (Rp)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#BDBDBD"
              />

              {/* Category */}
              <Text style={styles.label}>Kategori</Text>
              <View style={styles.categoryGrid}>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === cat.name && styles.categoryButtonActive,
                      { borderColor: cat.color }
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={24}
                      color={selectedCategory === cat.name ? '#FFFFFF' : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategory === cat.name && styles.categoryButtonTextActive
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Note */}
              <Text style={styles.label}>Catatan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={note}
                onChangeText={setNote}
                placeholder="Tambahkan catatan..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#BDBDBD"
              />

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveTransaction}>
                <Text style={styles.saveButtonText}>Simpan</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 8,
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
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
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
