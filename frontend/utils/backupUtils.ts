import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Budget } from './storage';

const STORAGE_KEYS = {
  TRANSACTIONS: '@finance_transactions',
  CATEGORIES: '@finance_categories',
  BUDGETS: '@finance_budgets',
  SETTINGS: '@finance_settings',
  THEME: '@finance_theme_mode',
};

export interface BackupData {
  version: string;
  exportDate: string;
  data: {
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    settings: any;
    theme?: string;
  };
}

// Restore from backup file
export const restoreFromBackup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Pick a JSON file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      return { success: false, message: 'Restore dibatalkan' };
    }

    // Read the file
    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    
    // Parse JSON
    const backup: BackupData = JSON.parse(fileContent);
    
    // Validate backup
    if (!backup.version || !backup.data) {
      return { success: false, message: 'Format backup tidak valid' };
    }
    
    // Restore data
    if (backup.data.transactions) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(backup.data.transactions)
      );
    }
    
    if (backup.data.categories) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(backup.data.categories)
      );
    }
    
    if (backup.data.budgets) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.BUDGETS,
        JSON.stringify(backup.data.budgets)
      );
    }
    
    if (backup.data.settings) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(backup.data.settings)
      );
    }
    
    if (backup.data.theme) {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, backup.data.theme);
    }
    
    return { 
      success: true, 
      message: `Backup berhasil dipulihkan!\n${backup.data.transactions?.length || 0} transaksi\n${backup.data.categories?.length || 0} kategori` 
    };
    
  } catch (error: any) {
    console.error('Restore error:', error);
    return { 
      success: false, 
      message: error.message || 'Gagal memulihkan backup' 
    };
  }
};

// Get all data for backup
export const getAllDataForBackup = async () => {
  try {
    const transactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const categories = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const budgets = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    
    return {
      transactions: transactions ? JSON.parse(transactions) : [],
      categories: categories ? JSON.parse(categories) : [],
      budgets: budgets ? JSON.parse(budgets) : [],
      settings: settings ? JSON.parse(settings) : {},
      theme: theme || 'light',
    };
  } catch (error) {
    console.error('Get backup data error:', error);
    throw error;
  }
};

// Clear all data (for testing)
export const clearAllData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.BUDGETS,
      // Keep categories and theme
    ]);
    
    return { success: true, message: 'Data berhasil dihapus' };
  } catch (error) {
    console.error('Clear data error:', error);
    return { success: false, message: 'Gagal menghapus data' };
  }
};
