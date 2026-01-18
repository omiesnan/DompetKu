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
import {
  getTransactions,
  getCategories,
  getBudgets,
  saveBudget,
  deleteBudget,
  Budget,
  Category,
} from '../../utils/storage';
import { startOfMonth, endOfMonth } from 'date-fns';
import * as Notifications from 'expo-notifications';

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spending, setSpending] = useState<{ [key: string]: number }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const budgetData = await getBudgets();
    const cats = await getCategories();
    setBudgets(budgetData);
    setCategories(cats);

    // Calculate spending per category for this month
    const txns = await getTransactions();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTxns = txns.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= monthStart && txnDate <= monthEnd && t.type === 'expense';
    });

    const spendingByCategory: { [key: string]: number } = {};
    monthTxns.forEach(t => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
    });

    setSpending(spendingByCategory);

    // Check for budget alerts
    budgetData.forEach(budget => {
      const spent = spendingByCategory[budget.category] || 0;
      const percentage = (spent / budget.amount) * 100;
      
      if (percentage >= 90 && percentage < 100) {
        scheduleNotification(
          'Peringatan Anggaran! ⚠️',
          `Anda telah menggunakan ${percentage.toFixed(0)}% dari anggaran ${budget.category}`
        );
      } else if (percentage >= 100) {
        scheduleNotification(
          'Anggaran Terlampaui! 🚨',
          `Pengeluaran ${budget.category} telah melebihi anggaran sebesar ${formatCurrency(spent - budget.amount)}`
        );
      }
    });
  };

  const scheduleNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  };

  const handleAddBudget = () => {
    setSelectedCategory('');
    setBudgetAmount('');
    setShowModal(true);
  };

  const handleSaveBudget = async () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert('Error', 'Harap pilih kategori dan masukkan jumlah anggaran');
      return;
    }

    const budget: Budget = {
      id: Date.now().toString(),
      category: selectedCategory,
      amount: parseFloat(budgetAmount),
      period: 'monthly',
    };

    try {
      await saveBudget(budget);
      setShowModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan anggaran');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert(
      'Hapus Anggaran',
      'Yakin ingin menghapus anggaran ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteBudget(id);
            await loadData();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    return '#4CAF50';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anggaran Bulanan</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer}>
        {budgets.map((budget) => {
          const spent = spending[budget.category] || 0;
          const percentage = (spent / budget.amount) * 100;
          const remaining = budget.amount - spent;
          const category = categories.find(c => c.name === budget.category);

          return (
            <View key={budget.id} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' || '#E0E0E0' }]}>
                    <Ionicons
                      name={category?.icon as any || 'wallet'}
                      size={28}
                      color={category?.color || '#757575'}
                    />
                  </View>
                  <View style={styles.budgetDetails}>
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                    <Text style={styles.budgetPeriod}>Anggaran Bulanan</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteBudget(budget.id)}>
                  <Ionicons name="trash-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>

              <View style={styles.amountContainer}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Terpakai</Text>
                  <Text style={[styles.amountValue, { color: getProgressColor(percentage) }]}>
                    {formatCurrency(spent)}
                  </Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total Anggaran</Text>
                  <Text style={styles.amountValue}>{formatCurrency(budget.amount)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Sisa</Text>
                  <Text style={[styles.amountValue, { color: remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                    {formatCurrency(remaining)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: getProgressColor(percentage),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.percentageText, { color: getProgressColor(percentage) }]}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          );
        })}

        {budgets.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>Belum ada anggaran</Text>
            <Text style={styles.emptySubtext}>Tap tombol + untuk menambah anggaran</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Budget Modal */}
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
              <Text style={styles.modalTitle}>Tambah Anggaran</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#212121" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Kategori</Text>
              <View style={styles.categoryGrid}>
                {categories.filter(c => c.type === 'expense').map((cat) => (
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

              <Text style={styles.label}>Jumlah Anggaran (Rp)</Text>
              <TextInput
                style={styles.input}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#BDBDBD"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}>
                <Text style={styles.saveButtonText}>Simpan Anggaran</Text>
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
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  budgetDetails: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  budgetPeriod: {
    fontSize: 14,
    color: '#757575',
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#757575',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
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
    maxHeight: '80%',
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
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
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
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
