import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, Category, Budget } from './storage';
import { format } from 'date-fns';

// Export transactions to CSV
export const exportToCSV = async (transactions: Transaction[], fileName?: string) => {
  try {
    // Create CSV header
    const header = 'Tanggal,Tipe,Kategori,Jumlah,Catatan\n';
    
    // Create CSV rows
    const rows = transactions.map(t => {
      const date = format(new Date(t.date), 'yyyy-MM-dd HH:mm:ss');
      const type = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const amount = t.amount.toString();
      const note = t.note.replace(/,/g, ';'); // Replace commas to avoid CSV issues
      return `${date},${type},${t.category},${amount},"${note}"`;
    }).join('\n');
    
    const csv = header + rows;
    
    // Save to file
    const filename = fileName || `transaksi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const fileUri = FileSystem.documentDirectory + filename;
    
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
      return { success: true, message: 'File berhasil diekspor!' };
    } else {
      return { success: false, message: 'Sharing tidak tersedia di perangkat ini' };
    }
  } catch (error) {
    console.error('Export CSV error:', error);
    return { success: false, message: 'Gagal mengekspor data' };
  }
};

// Export full backup (JSON)
export const exportBackup = async (data: {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: any;
}) => {
  try {
    const backup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data,
    };
    
    const json = JSON.stringify(backup, null, 2);
    const filename = `backup_finance_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`;
    const fileUri = FileSystem.documentDirectory + filename;
    
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
      return { success: true, message: 'Backup berhasil dibuat!' };
    } else {
      return { success: false, message: 'Sharing tidak tersedia' };
    }
  } catch (error) {
    console.error('Backup error:', error);
    return { success: false, message: 'Gagal membuat backup' };
  }
};

// Export monthly report as text
export const exportMonthlyReport = async (data: {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { [key: string]: number };
  transactions: Transaction[];
}) => {
  try {
    const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
    
    let report = `LAPORAN KEUANGAN BULANAN\n`;
    report += `${data.month}\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `RINGKASAN:\n`;
    report += `Pemasukan: ${formatCurrency(data.totalIncome)}\n`;
    report += `Pengeluaran: ${formatCurrency(data.totalExpense)}\n`;
    report += `Saldo: ${formatCurrency(data.balance)}\n\n`;
    
    report += `PENGELUARAN PER KATEGORI:\n`;
    Object.entries(data.categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, amount]) => {
        report += `- ${category}: ${formatCurrency(amount)}\n`;
      });
    
    report += `\n${'='.repeat(50)}\n`;
    report += `\nTotal Transaksi: ${data.transactions.length}\n`;
    report += `Dibuat: ${format(new Date(), 'dd MMMM yyyy HH:mm')}\n`;
    
    const filename = `laporan_${data.month.replace(/ /g, '_')}.txt`;
    const fileUri = FileSystem.documentDirectory + filename;
    
    await FileSystem.writeAsStringAsync(fileUri, report, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
      return { success: true, message: 'Laporan berhasil dibuat!' };
    } else {
      return { success: false, message: 'Sharing tidak tersedia' };
    }
  } catch (error) {
    console.error('Report error:', error);
    return { success: false, message: 'Gagal membuat laporan' };
  }
};
