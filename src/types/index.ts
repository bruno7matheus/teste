export interface BudgetCategory {
  id: string;
  name: string;
  allocation: number; // decimal 0-1
  spent: number;
}

export interface Budget {
  total: number;
  categories: BudgetCategory[];
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // positive for income, negative for expense
  description: string;
  categoryId: string; // BudgetCategory.id
  isPaid: boolean;
  vendorId?: string; // Vendor.id (optional)
}

export interface Payment {
  id: string; // e.g., "payment-1"
  amount: number;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
  description: string; // "Parcela X/Y - NomeDoFornecedor"
}

export interface VendorAttachment {
  id: string;
  name: string;
  type: string;
  size: number; // in bytes
  dataUrl: string;
  uploadedAt: string; // ISO date string
}

export interface Vendor {
  id: string;
  name: string;
  category: string; // Corresponds to BudgetCategory.name
  description: string;
  contact: string;
  price: number; // Original quote price
  rating?: number;
  isContracted: boolean;
  totalContractAmount: number;
  paymentType: 'single' | 'installment';
  paidAmount: number;
  payments: Payment[];
  attachments?: VendorAttachment[];
}

export interface Guest {
  id: string;
  name: string;
  group: string; // Guest group category name
  contact: string;
  isConfirmed: boolean;
  note: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: 'todo' | 'inProgress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface GiftItem {
  id: string;
  name: string;
  room: string;
  price?: number;
  isReceived: boolean;
  note?: string;
}

export interface UserProfile {
  brideName?: string;
  groomName?: string;
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  userInstagram?: string;
}

export interface WeddingDetails {
  ceremonyTime?: string; // HH:MM
  ceremonyLocation?: string;
  receptionLocation?: string;
  guestEstimate?: number;
  rsvpDeadline?: string; // YYYY-MM-DD
}

export interface AppData {
  weddingDate: string | null; // ISO YYYY-MM-DD
  budget: Budget;
  transactions: Transaction[];
  vendors: Vendor[];
  guests: Guest[];
  tasks: Task[];
  gifts: GiftItem[];
  guestGroups: string[];
  userProfile: UserProfile;
  weddingDetails: WeddingDetails;
  selectedPackages?: string[]; // Store keys of selected packages
}
