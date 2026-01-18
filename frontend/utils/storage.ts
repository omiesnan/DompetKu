import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  icon: string;
  color: string;
  isCustom: boolean;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly';
}

const STORAGE_KEYS = {
  TRANSACTIONS: '@finance_transactions',
  CATEGORIES: '@finance_categories',
  BUDGETS: '@finance_budgets',
  SETTINGS: '@finance_settings',
};

// Default categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Makanan', type: 'expense', icon: 'fast-food', color: '#FF6B6B', isCustom: false },
  { id: '2', name: 'Transport', type: 'expense', icon: 'car', color: '#4ECDC4', isCustom: false },
  { id: '3', name: 'Belanja', type: 'expense', icon: 'cart', color: '#45B7D1', isCustom: false },
  { id: '4', name: 'Tagihan', type: 'expense', icon: 'receipt', color: '#96CEB4', isCustom: false },
  { id: '5', name: 'Hiburan', type: 'expense', icon: 'game-controller', color: '#FFEAA7', isCustom: false },
  { id: '6', name: 'Kesehatan', type: 'expense', icon: 'medical', color: '#DFE6E9', isCustom: false },
  { id: '7', name: 'Pendidikan', type: 'expense', icon: 'school', color: '#A29BFE', isCustom: false },
  { id: '8', name: 'Lainnya', type: 'expense', icon: 'ellipsis-horizontal', color: '#B2BEC3', isCustom: false },
  { id: '9', name: 'Gaji', type: 'income', icon: 'cash', color: '#00B894', isCustom: false },
  { id: '10', name: 'Bonus', type: 'income', icon: 'gift', color: '#FD79A8', isCustom: false },
  { id: '11', name: 'Investasi', type: 'income', icon: 'trending-up', color: '#6C5CE7', isCustom: false },
  { id: '12', name: 'Pendapatan Lain', type: 'income', icon: 'add-circle', color: '#FDCB6E', isCustom: false },
];

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const transactions = await getTransactions();
    transactions.push(transaction);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const transactions = await getTransactions();
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      transactions[index] = transaction;
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const transactions = await getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategory = async (category: Category): Promise<void> => {
  try {
    const categories = await getCategories();
    categories.push(category);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving category:', error);
    throw error;
  }
};

// Budgets
export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting budgets:', error);
    return [];
  }
};

export const saveBudget = async (budget: Budget): Promise<void> => {
  try {
    const budgets = await getBudgets();
    const index = budgets.findIndex(b => b.category === budget.category);
    if (index !== -1) {
      budgets[index] = budget;
    } else {
      budgets.push(budget);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (error) {
    console.error('Error saving budget:', error);
    throw error;
  }
};

export const deleteBudget = async (id: string): Promise<void> => {
  try {
    const budgets = await getBudgets();
    const filtered = budgets.filter(b => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};