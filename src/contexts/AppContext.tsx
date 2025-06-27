
"use client";

import type { AppData, BudgetCategory, Transaction, Vendor, Guest, Task, GiftItem, Payment, UserProfile, WeddingDetails, VendorAttachment } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { INITIAL_GUEST_GROUPS, BASE_WEIGHTS, INITIAL_PACKAGES } from '@/lib/constants';
import { generateInstallmentPayments, calculateVendorPaidAmount, getCategoryById as findCategoryById } from '@/lib/helpers';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  appData: AppData | null;
  loading: boolean;
  setWeddingDate: (date: string) => Promise<void>;
  updateBudget: (total: number) => Promise<void>;
  updateBudgetCategories: (categories: BudgetCategory[]) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addVendor: (vendorData: Omit<Vendor, 'id' | 'isContracted' | 'totalContractAmount' | 'paymentType' | 'paidAmount' | 'payments'> & { attachments?: VendorAttachment[] }) => Promise<Vendor | undefined>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  contractVendor: (id: string, totalContractAmount: number, paymentType: 'single' | 'installment', installments?: number, firstDueDate?: string) => Promise<void>;
  updateVendorPaymentStatus: (vendorId: string, paymentId: string, isPaid: boolean) => Promise<void>;
  addGuest: (guest: Omit<Guest, 'id'>) => Promise<void>;
  updateGuest: (guest: Guest) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  updateGuestGroups: (groups: string[]) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addGift: (gift: Omit<GiftItem, 'id'>) => Promise<void>;
  updateGift: (gift: GiftItem) => Promise<void>;
  deleteGift: (id: string) => Promise<void>;
  saveInitialSetup: (details: {
    userProfile: UserProfile;
    weddingDate: string;
    weddingDetails: WeddingDetails;
    budgetTotal: number;
    selectedPackages: string[];
    otherPackageName?: string;
  }) => Promise<void>;
  resetApp: () => Promise<void>;
  getCategoryById: (data: AppData | null, categoryId: string) => BudgetCategory | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    await db.initialize();
    const data = await db.getData();
    if (data) {
      if (!data.guestGroups || data.guestGroups.length === 0) {
        data.guestGroups = [...INITIAL_GUEST_GROUPS];
        await db.updateData({ guestGroups: data.guestGroups });
      }
      if (!data.userProfile) data.userProfile = {};
      if (!data.weddingDetails) data.weddingDetails = {};
      if (!data.selectedPackages) data.selectedPackages = [];
      // Ensure vendors have attachments array
      if (data.vendors && Array.isArray(data.vendors)) {
        data.vendors.forEach(vendor => {
          if (!vendor.attachments) {
            vendor.attachments = [];
          }
        });
      } else {
        data.vendors = [];
      }


      setAppData(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateAppData = useCallback(async (newData: Partial<AppData>) => {
    const updatedData = await db.updateData(newData);
    setAppData(updatedData);
    return updatedData;
  }, []);

  const setWeddingDate = async (date: string) => {
    await updateAppData({ weddingDate: date });
  };

  const updateBudget = async (total: number) => {
    if (!appData) return;
    const newBudget = { ...appData.budget, total };
    await updateAppData({ budget: newBudget });
  };

  const updateBudgetCategories = async (categories: BudgetCategory[]) => {
    if (!appData) return;
    const totalAllocation = categories.reduce((sum, cat) => sum + cat.allocation, 0);
    const normalizedCategories = totalAllocation !== 1 && totalAllocation > 0 && categories.length > 0
      ? categories.map(cat => ({ ...cat, allocation: cat.allocation / totalAllocation }))
      : categories;
    const newBudget = { ...appData.budget, categories: normalizedCategories };
    await updateAppData({ budget: newBudget });
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!appData) return;
    const newTransaction: Transaction = { ...transaction, id: crypto.randomUUID() };
    await updateAppData({ transactions: [...appData.transactions, newTransaction] });
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (!appData) return;
    await updateAppData({
      transactions: appData.transactions.map(t => t.id === transaction.id ? transaction : t),
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!appData) return;
    await updateAppData({ transactions: appData.transactions.filter(t => t.id !== id) });
  };

  const addVendor = async (vendorData: Omit<Vendor, 'id' | 'isContracted' | 'totalContractAmount' | 'paymentType' | 'paidAmount' | 'payments'> & { attachments?: VendorAttachment[] }) => {
    if (!appData) return undefined;
    const newVendor: Vendor = {
      ...vendorData,
      id: crypto.randomUUID(),
      isContracted: false,
      totalContractAmount: 0,
      paymentType: 'single', 
      paidAmount: 0,
      payments: [],
      attachments: vendorData.attachments || [],
    };
    const updatedData = await updateAppData({ vendors: [...appData.vendors, newVendor] });
    return updatedData.vendors.find(v => v.id === newVendor.id);
  };

  const updateVendor = async (vendor: Vendor) => {
    if (!appData) return;
    // Ensure attachments array exists
    const vendorToUpdate = { ...vendor, attachments: vendor.attachments || [] };
    await updateAppData({ vendors: appData.vendors.map(v => v.id === vendor.id ? vendorToUpdate : v) });
  };

  const deleteVendor = async (id: string) => {
    if (!appData) return;
    const newTransactions = appData.transactions.filter(t => t.vendorId !== id);
    await updateAppData({ 
      vendors: appData.vendors.filter(v => v.id !== id),
      transactions: newTransactions 
    });
  };

  const contractVendor = async (id: string, totalContractAmount: number, paymentType: 'single' | 'installment', installments: number = 1, firstDueDate?: string) => {
    if (!appData) return;
    const vendor = appData.vendors.find(v => v.id === id);
    if (!vendor) return;

    let payments: Payment[] = [];
    if (paymentType === 'single') {
      payments.push({
        id: `payment-1-${crypto.randomUUID().slice(0,8)}`,
        amount: totalContractAmount,
        dueDate: firstDueDate || appData.weddingDate || new Date().toISOString().split('T')[0],
        isPaid: false,
        description: `Pagamento único - ${vendor.name}`,
      });
    } else if (firstDueDate) {
      payments = generateInstallmentPayments(totalContractAmount, installments, firstDueDate, vendor.name);
    }

    const updatedVendor: Vendor = {
      ...vendor,
      isContracted: true,
      totalContractAmount,
      paymentType,
      payments,
      paidAmount: calculateVendorPaidAmount({...vendor, payments}),
      attachments: vendor.attachments || [], // Preserve existing attachments
    };

    let currentTransactions = appData.transactions.filter(t => t.vendorId !== id);
    
    const category = appData.budget.categories.find(c => c.name === vendor.category);
    const transactionsToAdd: Transaction[] = payments.map(p => ({
      id: crypto.randomUUID(),
      date: p.dueDate,
      amount: -p.amount,
      description: p.description,
      categoryId: category?.id || '',
      isPaid: false,
      vendorId: vendor.id,
    }));

    await updateAppData({
      vendors: appData.vendors.map(v => v.id === id ? updatedVendor : v),
      transactions: [...currentTransactions, ...transactionsToAdd],
    });
  };

  const updateVendorPaymentStatus = async (vendorId: string, paymentId: string, isPaid: boolean) => {
    if (!appData) return;
    const vendor = appData.vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const updatedPayments = vendor.payments.map(p =>
      p.id === paymentId ? { ...p, isPaid } : p
    );
    const updatedVendor = { ...vendor, payments: updatedPayments, attachments: vendor.attachments || [] };
    updatedVendor.paidAmount = calculateVendorPaidAmount(updatedVendor);

    const payment = updatedPayments.find(p => p.id === paymentId);
    const updatedTransactions = appData.transactions.map(t => {
      if (t.vendorId === vendorId && payment && t.description === payment.description && Math.abs(t.amount) === payment.amount && t.date.startsWith(payment.dueDate.substring(0,10)) ) {
        return { ...t, isPaid };
      }
      return t;
    });
    
    await updateAppData({
      vendors: appData.vendors.map(v => v.id === vendorId ? updatedVendor : v),
      transactions: updatedTransactions,
    });
  };

  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    if (!appData) return;
    const newGuest: Guest = { ...guest, id: crypto.randomUUID() };
    await updateAppData({ guests: [...appData.guests, newGuest] });
  };

  const updateGuest = async (guest: Guest) => {
    if (!appData) return;
    await updateAppData({ guests: appData.guests.map(g => g.id === guest.id ? guest : g) });
  };

  const deleteGuest = async (id: string) => {
    if (!appData) return;
    await updateAppData({ guests: appData.guests.filter(g => g.id !== id) });
  };
  
  const updateGuestGroups = async (groups: string[]) => {
    await updateAppData({ guestGroups: groups });
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!appData) return;
    const newTask: Task = { ...task, id: crypto.randomUUID() };
    await updateAppData({ tasks: [...appData.tasks, newTask] });
  };

  const updateTask = async (task: Task) => {
    if (!appData) return;
    await updateAppData({ tasks: appData.tasks.map(t => t.id === task.id ? task : t) });
  };

  const deleteTask = async (id: string) => {
    if (!appData) return;
    await updateAppData({ tasks: appData.tasks.filter(t => t.id !== id) });
  };
  
  const addGift = async (gift: Omit<GiftItem, 'id'>) => {
    if (!appData) return;
    const newGift: GiftItem = { ...gift, id: crypto.randomUUID() };
    await updateAppData({ gifts: [...appData.gifts, newGift] });
  };

  const updateGift = async (gift: GiftItem) => {
    if (!appData) return;
    await updateAppData({ gifts: appData.gifts.map(g => g.id === gift.id ? gift : g) });
  };

  const deleteGift = async (id: string) => {
    if (!appData) return;
    await updateAppData({ gifts: appData.gifts.filter(g => g.id !== id) });
  };

  const saveInitialSetup = async (details: {
    userProfile: UserProfile;
    weddingDate: string;
    weddingDetails: WeddingDetails;
    budgetTotal: number;
    selectedPackages: string[];
    otherPackageName?: string;
  }) => {
    if (!appData) return;

    const budgetCategories: BudgetCategory[] = [];
    let totalWeight = 0;
    
    const packagesToProcess: {key: string, label: string, weight: number}[] = [];

    details.selectedPackages.forEach(pkgKeyOrCustom => {
        const initialPkg = INITIAL_PACKAGES.find(p => p.key === pkgKeyOrCustom);
        if (initialPkg) {
            packagesToProcess.push({key: initialPkg.key, label: initialPkg.label, weight: BASE_WEIGHTS[initialPkg.key] || 0 });
        }
    });
    
    if (details.selectedPackages.includes('outros') && details.otherPackageName) {
        const defaultOutrosIndex = packagesToProcess.findIndex(p => p.key === 'outros');
        if (defaultOutrosIndex > -1) {
            packagesToProcess.splice(defaultOutrosIndex, 1);
        }
        packagesToProcess.push({
            key: `outros_${details.otherPackageName.toLowerCase().replace(/\s+/g, '_')}`,
            label: details.otherPackageName,
            weight: BASE_WEIGHTS['outros'] || 3 
        });
    }
    
    totalWeight = packagesToProcess.reduce((sum, pkg) => sum + pkg.weight, 0);
    if (totalWeight === 0 && packagesToProcess.length > 0) totalWeight = packagesToProcess.length;

    packagesToProcess.forEach(pkg => {
        const allocation = totalWeight > 0 ? pkg.weight / totalWeight : (packagesToProcess.length > 0 ? 1 / packagesToProcess.length : 0);
        if (allocation > 0) { 
             budgetCategories.push({
                id: crypto.randomUUID(),
                name: pkg.label,
                allocation: allocation,
                spent: 0,
            });
        }
    });

    const finalTotalAllocation = budgetCategories.reduce((sum, cat) => sum + cat.allocation, 0);
    const normalizedFinalBudgetCategories = (finalTotalAllocation > 0 && Math.abs(finalTotalAllocation - 1) > 0.0001 && budgetCategories.length > 0)
      ? budgetCategories.map(cat => ({...cat, allocation: cat.allocation / finalTotalAllocation}))
      : budgetCategories;


    await updateAppData({
      userProfile: details.userProfile,
      weddingDate: details.weddingDate,
      weddingDetails: details.weddingDetails,
      budget: { total: details.budgetTotal, categories: normalizedFinalBudgetCategories },
      selectedPackages: details.selectedPackages, 
    });
    toast({ title: "Sucesso!", description: "Informações iniciais salvas com sucesso!" });
  };
  
  const resetApp = async () => {
    setLoading(true);
    await db.clearData();
    await loadData(); 
    toast({ title: "Aplicativo Resetado", description: "Todos os dados foram apagados e o aplicativo foi restaurado para o estado inicial." });
  };
  
  const getCategoryByIdCallback = (data: AppData | null, categoryId: string): BudgetCategory | undefined => {
    return findCategoryById(data, categoryId);
  };


  return (
    <AppContext.Provider
      value={{
        appData,
        loading,
        setWeddingDate,
        updateBudget,
        updateBudgetCategories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addVendor,
        updateVendor,
        deleteVendor,
        contractVendor,
        updateVendorPaymentStatus,
        addGuest,
        updateGuest,
        deleteGuest,
        updateGuestGroups,
        addTask,
        updateTask,
        deleteTask,
        addGift,
        updateGift,
        deleteGift,
        saveInitialSetup,
        resetApp,
        getCategoryById: getCategoryByIdCallback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
