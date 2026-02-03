import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { getTransactions, getCategories } from '../../utils/storage';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { useThemeStore } from '../../utils/themeStore';

const { width } = Dimensions.get('window');

export default function Reports() {
  const theme = useThemeStore((state) => state.theme);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<any[]>([]);
  const [savingsRate, setSavingsRate] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [])
  );

  const loadReportData = async () => {
    const transactions = await getTransactions();
    const categories = await getCategories();
    
    // Calculate last 6 months data
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now,
    });

    const monthlyStats = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTxns = transactions.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });

      const income = monthTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        label: format(month, 'MMM'),
        income: Math.round(income / 1000000), // In millions
        expense: Math.round(expense / 1000000),
        savings: Math.round((income - expense) / 1000000),
      };
    });

    setMonthlyData(monthlyStats);

    // Calculate category trends (top 5)
    const categoryTotals: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => {
        const category = categories.find(c => c.name === name);
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        return {
          value: Math.round(value / 1000000),
          label: name.substring(0, 8),
          frontColor: category?.color || colors[index],
        };
      });

    setCategoryTrends(topCategories);

    // Calculate savings rate
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const rate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    setSavingsRate(Math.round(rate));
  };

  const lineData = monthlyData.map(m => ({
    value: m.expense,
    dataPointText: `${m.expense}M`,
  }));

  const lineData2 = monthlyData.map(m => ({
    value: m.income,
    dataPointText: `${m.income}M`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>Laporan & Analisis</Text>
        <Text style={styles.headerSubtitle}>Visualisasi data keuangan</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Savings Rate */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Tingkat Tabungan</Text>
          </View>
          <View style={styles.savingsContainer}>
            <Text style={[styles.savingsRate, { color: savingsRate >= 20 ? theme.success : theme.warning }]}>
              {savingsRate}%
            </Text>
            <Text style={[styles.savingsText, { color: theme.textSecondary }]}>
              {savingsRate >= 30 && 'Excellent! Anda sangat disiplin'}
              {savingsRate >= 20 && savingsRate < 30 && 'Bagus! Pertahankan'}
              {savingsRate >= 10 && savingsRate < 20 && 'Cukup baik, tingkatkan lagi'}
              {savingsRate < 10 && 'Perlu lebih banyak menabung'}
            </Text>
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Tren 6 Bulan Terakhir</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
            Dalam jutaan Rupiah (M)
          </Text>
          {monthlyData.length > 0 && (
            <View style={styles.chartContainer}>
              <LineChart
                data={lineData}
                data2={lineData2}
                height={200}
                width={width - 80}
                spacing={50}
                initialSpacing={10}
                color1={theme.error}
                color2={theme.success}
                thickness={3}
                startFillColor1={theme.error}
                startFillColor2={theme.success}
                startOpacity={0.2}
                endOpacity={0.1}
                dataPointsColor1={theme.error}
                dataPointsColor2={theme.success}
                dataPointsRadius={4}
                textColor1={theme.textSecondary}
                textColor2={theme.textSecondary}
                textShiftY={-8}
                textShiftX={-10}
                textFontSize={10}
                hideRules
                xAxisColor={theme.border}
                yAxisColor={theme.border}
                xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
                yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
              />
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>Pengeluaran</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>Pemasukan</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Top Categories */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Top 5 Kategori Pengeluaran</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: theme.textSecondary }]}>
            Total pengeluaran (dalam juta)
          </Text>
          {categoryTrends.length > 0 && (
            <View style={styles.chartContainer}>
              <BarChart
                data={categoryTrends}
                height={180}
                width={width - 80}
                barWidth={40}
                spacing={20}
                initialSpacing={10}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={1}
                xAxisColor={theme.border}
                yAxisThickness={0}
                yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...categoryTrends.map(c => c.value)) + 1}
                showGradient
                gradientColor={theme.primary}
              />
            </View>
          )}
        </View>

        {/* Monthly Comparison */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color={theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Perbandingan Bulanan</Text>
          </View>
          <View style={styles.comparisonContainer}>
            {monthlyData.slice(-3).reverse().map((month, index) => (
              <View key={index} style={[styles.monthCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.monthLabel, { color: theme.text }]}>{month.label}</Text>
                <View style={styles.monthStats}>
                  <View style={styles.monthStat}>
                    <Ionicons name="arrow-down-circle" size={16} color={theme.success} />
                    <Text style={[styles.monthValue, { color: theme.textSecondary }]}>
                      {month.income}M
                    </Text>
                  </View>
                  <View style={styles.monthStat}>
                    <Ionicons name="arrow-up-circle" size={16} color={theme.error} />
                    <Text style={[styles.monthValue, { color: theme.textSecondary }]}>
                      {month.expense}M
                    </Text>
                  </View>
                  <View style={styles.monthStat}>
                    <Ionicons name="wallet" size={16} color={month.savings >= 0 ? theme.info : theme.warning} />
                    <Text style={[styles.monthValue, { color: theme.textSecondary }]}>
                      {month.savings}M
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  savingsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  savingsRate: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  savingsText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonContainer: {
    gap: 12,
  },
  monthCard: {
    borderRadius: 12,
    padding: 16,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
