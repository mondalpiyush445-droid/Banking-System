export type TransactionType = 'dep' | 'crd';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  label: string;
  category?: string;
  timestamp: string;
  balanceAfter: number;
  referenceId: string;
  note?: string;
}

export interface BankAccount {
  id: string;
  isActive: boolean;
  accountNumber: string;
  name: string;
  password: string; // numeric password string
  balance: number;
  accountType: 'Savings' | 'Privilege Current' | 'Wealth Vault';
  createdAt: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  transactions: Transaction[];
  totalDeposits: number;
  totalWithdrawals: number;
}

export type NavTab = 'home' | 'accounts' | 'open' | 'balance' | 'deposit' | 'credit' | 'transfer' | 'passbook' | 'close';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
