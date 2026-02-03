import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './theme';

type ThemeMode = 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@finance_theme_mode';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'light',
  theme: lightTheme,
  
  toggleTheme: async () => {
    const currentMode = get().mode;
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 'light';
    const newTheme = newMode === 'light' ? lightTheme : darkTheme;
    
    set({ mode: newMode, theme: newTheme });
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },
  
  setTheme: async (mode: ThemeMode) => {
    const newTheme = mode === 'light' ? lightTheme : darkTheme;
    set({ mode, theme: newTheme });
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },
  
  loadTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === 'light' || savedMode === 'dark') {
        const newTheme = savedMode === 'light' ? lightTheme : darkTheme;
        set({ mode: savedMode, theme: newTheme });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },
}));
