import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { getTransactions, getCategories, Transaction, Category } from '../../utils/storage';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useThemeStore } from '../../utils/themeStore';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const theme = useThemeStore((state) => state.theme);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const txns = await getTransactions();
    const cats = await getCategories();
    setTransactions(txns);
    setCategories(cats);

    // Calculate this month's totals
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthTxns = txns.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= monthStart && txnDate <= monthEnd;
    });

    const income = thisMonthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = thisMonthTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalIncome(income);
    setTotalExpense(expense);

    // Calculate category breakdown for expenses
    const categoryTotals: { [key: string]: number } = {};
    thisMonthTxns
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const pieData = Object.entries(categoryTotals).map(([name, value], index) => {
      const category = cats.find(c => c.name === name);
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#A29BFE', '#B2BEC3'];
      return {
        value,
        color: category?.color || colors[index % colors.length],
        text: name,
      };
    });

    setCategoryData(pieData);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const balance = totalIncome - totalExpense;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Dashboard Keuangan</Text>
        <Text style={styles.headerSubtitle}>{format(new Date(), 'MMMM yyyy')}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="arrow-down-circle" size={32} color="#4CAF50" />
          </View>
          <Text style={styles.summaryLabel}>Pemasukan</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="arrow-up-circle" size={32} color="#F44336" />
          </View>
          <Text style={styles.summaryLabel}>Pengeluaran</Text>
          <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: balance >= 0 ? '#E3F2FD' : '#FFF3E0' }]}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="wallet" size={32} color={balance >= 0 ? '#2196F3' : '#FF9800'} />
          </View>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[styles.summaryAmount, { color: balance >= 0 ? '#2196F3' : '#FF9800' }]}>
            {formatCurrency(balance)}
          </Text>
        </View>
      </View>

      {/* Spending Chart */}
      {categoryData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Pengeluaran per Kategori</Text>
          <View style={styles.chartWrapper}>
            <PieChart
              data={categoryData}
              donut
              radius={width * 0.3}
              innerRadius={width * 0.18}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerLabelText}>Total</Text>
                  <Text style={styles.centerLabelAmount}>
                    {formatCurrency(totalExpense)}
                  </Text>
                </View>
              )}
            />
          </View>
          
          {/* Legend */}
          <View style={styles.legendContainer}>
            {categoryData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.text}</Text>
                <Text style={styles.legendAmount}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Transaksi Terbaru</Text>
        </View>
        {transactions.slice(0, 5).map((txn) => {
          const category = categories.find(c => c.name === txn.category);
          return (
            <View key={txn.id} style={styles.transactionItem}>
              <View style={[styles.transactionIcon, { backgroundColor: category?.color + '20' || '#E0E0E0' }]}>
                <Ionicons 
                  name={category?.icon as any || 'cash'} 
                  size={24} 
                  color={category?.color || '#757575'} 
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionCategory}>{txn.category}</Text>
                <Text style={styles.transactionNote}>{txn.note || 'Tidak ada catatan'}</Text>
                <Text style={styles.transactionDate}>{format(new Date(txn.date), 'dd MMM yyyy')}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: txn.type === 'income' ? '#4CAF50' : '#F44336' }
              ]}>
                {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  summaryContainer: {
    marginTop: -20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIconContainer: {
    marginRight: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelText: {
    fontSize: 12,
    color: '#757575',
  },
  centerLabelAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  recentContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});