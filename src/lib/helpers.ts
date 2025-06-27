import type { AppData, BudgetCategory, Transaction, Vendor, Payment, Guest, Task, GiftItem } from '@/types';
import { format, differenceInMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const formatDate = (dateString: string | null | undefined, dateFormat: string = 'dd/MM/yyyy'): string => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), dateFormat, { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return dateString; // return original if parsing fails
  }
};

export const getTotalBudget = (data: AppData | null): number => data?.budget.total || 0;

export const getTotalSpent = (data: AppData | null): number => {
  if (!data) return 0;
  return data.transactions
    .filter(tx => tx.amount < 0) // Only expenses
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
};

export const getTotalPaid = (data: AppData | null): number => {
  if (!data) return 0;
  return data.transactions
    .filter(tx => tx.amount < 0 && tx.isPaid)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export const getRemainingBudget = (data: AppData | null): number => getTotalBudget(data) - getTotalSpent(data);

export const getSpentPercentage = (data: AppData | null): number => {
  const total = getTotalBudget(data);
  if (total === 0) return 0;
  return (getTotalSpent(data) / total) * 100;
};

export const getActualBalance = (data: AppData | null): number => {
  if (!data) return 0;
  return data.transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

export const getTransactionsInMonth = (transactions: Transaction[], year: number, month: number): Transaction[] => {
  const SDate = startOfMonth(new Date(year, month));
  const EDate = endOfMonth(new Date(year, month));
  return transactions.filter(tx => {
    try {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start: SDate, end: EDate });
    } catch {
      return false;
    }
  });
};

export const getUpcomingPayments = (data: AppData | null, limit: number = 5): Transaction[] => {
  if (!data) return [];
  return data.transactions
    .filter(tx => tx.amount < 0 && !tx.isPaid)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
};

export const getThisWeekPayments = (data: AppData | null): Transaction[] => {
  if (!data) return [];
  return data.transactions.filter(tx => {
    if (tx.amount >= 0 || tx.isPaid) return false;
    try {
      return isThisWeek(parseISO(tx.date), { weekStartsOn: 1, locale: ptBR });
    } catch {
      return false;
    }
  });
};

export const getThisWeekTasks = (data: AppData | null): Task[] => {
  if (!data) return [];
  return data.tasks.filter(task => {
    if (task.status === 'done') return false;
    try {
      return isThisWeek(parseISO(task.dueDate), { weekStartsOn: 1, locale: ptBR });
    } catch {
      return false;
    }
  });
};

export const getPendingVendors = (data: AppData | null): Vendor[] => {
  if (!data) return [];
  return data.vendors.filter(v => !v.isContracted);
};

export const getContractedVendors = (data: AppData | null): Vendor[] => {
  if (!data) return [];
  return data.vendors.filter(v => v.isContracted);
};

export const calculateVendorPaidAmount = (vendor: Vendor): number => {
  return vendor.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
};

export const generateInstallmentPayments = (
  totalAmount: number,
  installments: number,
  firstDueDateString: string,
  vendorName: string
): Payment[] => {
  if (installments <= 0) return [];
  const firstDueDate = parseISO(firstDueDateString);
  const payments: Payment[] = [];
  const installmentAmount = Math.floor((totalAmount / installments) * 100) / 100;
  let remainingAmount = totalAmount;

  for (let i = 0; i < installments; i++) {
    const dueDate = addMonths(firstDueDate, i);
    const amount = (i === installments - 1) ? remainingAmount : installmentAmount;
    remainingAmount -= amount;

    payments.push({
      id: `payment-${i + 1}-${crypto.randomUUID().slice(0,8)}`,
      amount: parseFloat(amount.toFixed(2)),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      isPaid: false,
      description: `Parcela ${i + 1}/${installments} - ${vendorName}`,
    });
  }
  return payments;
};

export const getMonthsUntilWedding = (weddingDate: string | null): number => {
  if (!weddingDate) return 0;
  try {
    const today = new Date();
    const wedding = parseISO(weddingDate);
    if (wedding <= today) return 0;
    return differenceInMonths(wedding, today) + 1; // +1 to include current month
  } catch {
    return 0;
  }
};

export const getConfirmedGuestCount = (data: AppData | null): number => {
  if (!data) return 0;
  return data.guests.filter(g => g.isConfirmed).length;
};

export const getTotalGuestCount = (data: AppData | null): number => {
  if (!data) return 0;
  return data.guests.length;
};

export const getReceivedGiftsPercentage = (data: AppData | null): number => {
  if (!data || data.gifts.length === 0) return 0;
  const receivedCount = data.gifts.filter(g => g.isReceived).length;
  return (receivedCount / data.gifts.length) * 100;
};

export const getUniqueCategoriesFromVendors = (vendors: Vendor[]): string[] => {
  const categories = new Set<string>();
  vendors.forEach(v => categories.add(v.category));
  return Array.from(categories);
};

export const getCategoryById = (data: AppData | null, categoryId: string): BudgetCategory | undefined => {
  return data?.budget.categories.find(c => c.id === categoryId);
};

export const getCategoryByName = (data: AppData | null, categoryName: string): BudgetCategory | undefined => {
  return data?.budget.categories.find(c => c.name === categoryName);
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row =>
      headers
        .map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value))
        .join(',')
    )
  ];
  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};