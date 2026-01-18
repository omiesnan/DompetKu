import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, getCategories } from '../../utils/storage';
import { startOfMonth, endOfMonth } from 'date-fns';
import Constants from 'expo-constants';

export default function Insights() {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTip, setDailyTip] = useState('');

  const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  useFocusEffect(
    useCallback(() => {
      loadDailyTip();
    }, [])
  );

  const loadDailyTip = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-tip`);
      const data = await response.json();
      if (data.success) {
        setDailyTip(data.tip);
      }
    } catch (error) {
      console.error('Error loading daily tip:', error);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const transactions = await getTransactions();
      const categories = await getCategories();

      // Get this month's transactions
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const thisMonthTxns = transactions.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= monthStart && txnDate <= monthEnd;
      });

      const totalIncome = thisMonthTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = thisMonthTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Category breakdown
      const categoryTotals: { [key: string]: number } = {};
      thisMonthTxns
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

      // Call backend for AI analysis
      const response = await fetch(`${BACKEND_URL}/api/analyze-spending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: thisMonthTxns,
          totalIncome,
          totalExpense,
          categories: categoryTotals,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis('Gagal mendapatkan analisis. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      setAnalysis('Terjadi kesalahan saat menganalisis data keuangan Anda.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailyTip();
    if (analysis) {
      await generateAnalysis();
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insight Keuangan</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
        {/* Daily Tip */}
        {dailyTip && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={28} color="#FFC107" />
              <Text style={styles.tipTitle}>Tips Hari Ini</Text>
            </View>
            <Text style={styles.tipText}>{dailyTip}</Text>
          </View>
        )}

        {/* AI Analysis Card */}
        <View style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Ionicons name="analytics" size={28} color="#4CAF50" />
            <Text style={styles.analysisTitle}>Analisis AI</Text>
          </View>
          <Text style={styles.analysisSubtitle}>
            Dapatkan saran keuangan personal berdasarkan pola pengeluaran Anda
          </Text>

          {!analysis && !loading && (
            <TouchableOpacity style={styles.analyzeButton} onPress={generateAnalysis}>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>Analisis Sekarang</Text>
            </TouchableOpacity>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Menganalisis data keuangan Anda...</Text>
            </View>
          )}

          {analysis && !loading && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{analysis}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={generateAnalysis}>
                <Ionicons name="refresh" size={20} color="#4CAF50" />
                <Text style={styles.refreshButtonText}>Analisis Ulang</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="notifications" size={24} color="#2196F3" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Notifikasi Otomatis</Text>
            <Text style={styles.infoText}>
              Anda akan menerima notifikasi ketika pengeluaran mendekati atau melebihi anggaran
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Data Aman</Text>
            <Text style={styles.infoText}>
              Semua data keuangan Anda disimpan secara lokal di perangkat Anda
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="trending-up" size={24} color="#FF9800" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Saran Personal</Text>
            <Text style={styles.infoText}>
              AI menganalisis pola pengeluaran Anda untuk memberikan saran yang sesuai
            </Text>
          </View>
        </View>
      </ScrollView>
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
    padding: 16,
  },
  tipCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#424242',
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  analysisSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 20,
    lineHeight: 20,
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  resultContainer: {
    marginTop: 8,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#212121',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});
