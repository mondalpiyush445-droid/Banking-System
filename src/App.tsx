import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  KeyRound,
  FileText,
  Send,
  Volume2,
  VolumeX,
  Search,
  Download,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Receipt,
  Users,
  PlusCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { BankAccount, NavTab, ToastItem, Transaction } from './types';
import { sound } from './utils/audio';
import { ParticleBackground } from './components/ParticleBackground';
import { VirtualCard } from './components/VirtualCard';
import { ReceiptModal } from './components/ReceiptModal';

const STORAGE_KEY_V2 = 'mondal_bank_accounts_v2';
const STORAGE_KEY_V1 = 'mondal_bank_data_v1';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Multiple Accounts State
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Check migration from single account v1
      const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        if (parsedV1 && parsedV1.name) {
          const migrated: BankAccount = {
            ...parsedV1,
            id: parsedV1.accountNumber || 'acc_default_1',
          };
          return [migrated];
        }
      }
    } catch {
      // Ignore JSON parse error
    }
    return [];
  });

  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    try {
      const savedActive = localStorage.getItem('mondal_bank_active_id');
      if (savedActive) return savedActive;
      const savedV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
      const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
      if (savedV1) {
        const parsedV1 = JSON.parse(savedV1);
        return parsedV1.accountNumber || 'acc_default_1';
      }
    } catch {
      // Ignore storage error
    }
    return null;
  });

  // Current Active Account object
  const activeAccount = useMemo(() => {
    if (!accounts.length) return null;
    return accounts.find((a) => a.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);

  // Ensure activeAccountId is synced if accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      if (!activeAccountId || !accounts.some((a) => a.id === activeAccountId)) {
        setActiveAccountId(accounts[0].id);
      }
    } else {
      setActiveAccountId(null);
    }
  }, [accounts, activeAccountId]);

  // Save accounts to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(accounts));
      if (activeAccountId) {
        localStorage.setItem('mondal_bank_active_id', activeAccountId);
      } else {
        localStorage.removeItem('mondal_bank_active_id');
      }
    } catch {
      // Ignore storage error
    }
  }, [accounts, activeAccountId]);

  // Balance Verification State for Balance Tab
  const [isBalanceVerified, setIsBalanceVerified] = useState(false);
  const [balancePasswordInput, setBalancePasswordInput] = useState('');

  // Audio mute state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Passbook filters
  const [passbookSearch, setPassbookSearch] = useState('');
  const [passbookFilter, setPassbookFilter] = useState<'all' | 'dep' | 'crd'>('all');

  // Virtual Card toggle in Dashboard
  const [showCardInDashboard, setShowCardInDashboard] = useState(true);

  // Form states
  // 1. Open Account Form
  const [openName, setOpenName] = useState('');
  const [openPass, setOpenPass] = useState('');
  const [openConfirm, setOpenConfirm] = useState('');
  const [openInitial, setOpenInitial] = useState('');
  const [openAccountType, setOpenAccountType] = useState<'Savings' | 'Privilege Current' | 'Wealth Vault'>('Savings');
  const [showOpenPass, setShowOpenPass] = useState(false);

  // 2. Deposit Form
  const [depAmount, setDepAmount] = useState('');
  const [depPassword, setDepPassword] = useState('');
  const [depMethod, setDepMethod] = useState('UPI Instant Transfer');
  const [depNote, setDepNote] = useState('');

  // 3. Withdraw Form
  const [withAmount, setWithAmount] = useState('');
  const [withPassword, setWithPassword] = useState('');
  const [withPurpose, setWithPurpose] = useState('Cash Withdrawal');

  // 4. Transfer Form
  const [transferMode, setTransferMode] = useState<'external' | 'internal'>('external');
  const [internalTargetId, setInternalTargetId] = useState('');
  const [transRecipient, setTransRecipient] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transPassword, setTransPassword] = useState('');
  const [transNote, setTransNote] = useState('');

  // 5. Close Account Form
  const [closePassword, setClosePassword] = useState('');
  const [confirmCloseAcknowledged, setConfirmCloseAcknowledged] = useState(false);

  // Audio preference sync
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playClick();
  };

  // Toast helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Formatted timestamp
  const getFormattedTime = () => {
    return new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Generate Reference ID
  const generateRefId = (prefix = 'TXN') => {
    return `${prefix}${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
  };

  // Generate 16 digit card number
  const generateCardDetails = () => {
    const p1 = '4921';
    const p2 = Math.floor(1000 + Math.random() * 9000).toString();
    const p3 = Math.floor(1000 + Math.random() * 9000).toString();
    const p4 = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryMonth = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const expiryYear = '31';
    const cvv = String(Math.floor(100 + Math.random() * 900));
    return {
      cardNumber: `${p1}${p2}${p3}${p4}`,
      expiry: `${expiryMonth}/${expiryYear}`,
      cvv,
    };
  };

  // Helper to switch active account
  const handleSwitchAccount = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    setActiveAccountId(id);
    setIsBalanceVerified(false);
    sound.playClick();
    addToast(`Switched active account to ${target.name}.`, 'info');
  };

  // ----------------------------------------------------
  // Handler: Open New Account (Multiple Accounts Supported)
  // ----------------------------------------------------
  const handleOpenAccount = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const trimmedName = openName.trim();
    const trimmedPass = openPass.trim();
    const trimmedConfirm = openConfirm.trim();
    const initialAmt = parseFloat(openInitial) || 0;

    if (!trimmedName) {
      addToast('Please enter your full legal name.', 'warning');
      sound.playError();
      return;
    }

    if (!trimmedPass) {
      addToast('Please set a numeric security password.', 'warning');
      sound.playError();
      return;
    }

    if (!/^\d+$/.test(trimmedPass)) {
      addToast('Password must contain digits only (numeric PIN).', 'error');
      sound.playError();
      return;
    }

    if (trimmedPass.length < 4) {
      addToast('Password should be at least 4 digits long for security.', 'warning');
      sound.playError();
      return;
    }

    if (trimmedPass !== trimmedConfirm) {
      addToast('Passwords do not match. Please verify and re-enter.', 'error');
      sound.playError();
      return;
    }

    if (initialAmt < 0) {
      addToast('Initial deposit amount cannot be negative.', 'error');
      sound.playError();
      return;
    }

    const newId = `acc_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const { cardNumber, expiry, cvv } = generateCardDetails();
    const accNumber = `MB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const initialTransactions: Transaction[] = [];
    if (initialAmt > 0) {
      initialTransactions.push({
        id: generateRefId('OPN'),
        type: 'dep',
        amount: initialAmt,
        label: 'Initial Account Funding',
        category: 'Deposit',
        timestamp: getFormattedTime(),
        balanceAfter: initialAmt,
        referenceId: generateRefId('DEP'),
        note: 'Welcome deposit on account creation',
      });
    }

    const newAccount: BankAccount = {
      id: newId,
      isActive: true,
      accountNumber: accNumber,
      name: trimmedName,
      password: trimmedPass,
      balance: initialAmt,
      accountType: openAccountType,
      createdAt: getFormattedTime(),
      cardNumber,
      cardExpiry: expiry,
      cardCvv: cvv,
      transactions: initialTransactions,
      totalDeposits: initialAmt,
      totalWithdrawals: 0,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setActiveAccountId(newId);
    setOpenName('');
    setOpenPass('');
    setOpenConfirm('');
    setOpenInitial('');

    // Trigger celebration
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#8B5CF6', '#22C55E', '#F59E0B'],
    });

    sound.playSuccess();
    addToast(`Account for ${trimmedName} is now active (Total: ${accounts.length + 1} accounts)!`, 'success');
    setActiveTab('home');
  };

  // ----------------------------------------------------
  // Handler: Check / Verify Balance
  // ----------------------------------------------------
  const handleCheckBalance = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!activeAccount) {
      addToast('No active account selected.', 'error');
      sound.playError();
      return;
    }

    if (!balancePasswordInput.trim()) {
      addToast('Please enter your security password to verify.', 'warning');
      sound.playError();
      return;
    }

    if (balancePasswordInput.trim() !== activeAccount.password) {
      addToast('Authentication failed: Incorrect password.', 'error');
      sound.playError();
      return;
    }

    setIsBalanceVerified(true);
    setBalancePasswordInput('');
    sound.playSuccess();
    addToast(`Identity verified for ${activeAccount.name}. Balance revealed.`, 'success');
  };

  // ----------------------------------------------------
  // Handler: Deposit Money
  // ----------------------------------------------------
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!activeAccount) {
      addToast('No active account selected.', 'error');
      sound.playError();
      return;
    }

    if (!depPassword.trim()) {
      addToast('Please enter your security password.', 'warning');
      sound.playError();
      return;
    }

    if (depPassword.trim() !== activeAccount.password) {
      addToast('Incorrect password. Deposit rejected.', 'error');
      sound.playError();
      return;
    }

    const amt = parseFloat(depAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid deposit amount greater than ₹0.', 'warning');
      sound.playError();
      return;
    }

    const newBalance = activeAccount.balance + amt;
    const newTxn: Transaction = {
      id: generateRefId('DEP'),
      type: 'dep',
      amount: amt,
      label: `Deposit via ${depMethod}`,
      category: 'Deposit',
      timestamp: getFormattedTime(),
      balanceAfter: newBalance,
      referenceId: generateRefId('MB'),
      note: depNote.trim() || undefined,
    };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === activeAccount.id) {
          return {
            ...acc,
            balance: newBalance,
            totalDeposits: acc.totalDeposits + amt,
            transactions: [newTxn, ...acc.transactions],
          };
        }
        return acc;
      })
    );

    setDepAmount('');
    setDepPassword('');
    setDepNote('');
    sound.playCash();
    addToast(
      `₹${amt.toFixed(2)} deposited to ${activeAccount.name}. Balance: ₹${newBalance.toFixed(2)}`,
      'success'
    );
    setActiveReceipt(newTxn);
  };

  // ----------------------------------------------------
  // Handler: Withdraw Money
  // ----------------------------------------------------
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!activeAccount) {
      addToast('No active account selected.', 'error');
      sound.playError();
      return;
    }

    if (!withPassword.trim()) {
      addToast('Please enter your security password.', 'warning');
      sound.playError();
      return;
    }

    if (withPassword.trim() !== activeAccount.password) {
      addToast('Incorrect password. Withdrawal rejected.', 'error');
      sound.playError();
      return;
    }

    const amt = parseFloat(withAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid withdrawal amount greater than ₹0.', 'warning');
      sound.playError();
      return;
    }

    if (amt > activeAccount.balance) {
      addToast(`Insufficient funds! Available balance: ₹${activeAccount.balance.toFixed(2)}`, 'error');
      sound.playError();
      return;
    }

    const newBalance = activeAccount.balance - amt;
    const newTxn: Transaction = {
      id: generateRefId('CRD'),
      type: 'crd',
      amount: amt,
      label: withPurpose,
      category: 'Withdrawal',
      timestamp: getFormattedTime(),
      balanceAfter: newBalance,
      referenceId: generateRefId('MB'),
      note: `Cash debited for ${withPurpose}`,
    };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === activeAccount.id) {
          return {
            ...acc,
            balance: newBalance,
            totalWithdrawals: acc.totalWithdrawals + amt,
            transactions: [newTxn, ...acc.transactions],
          };
        }
        return acc;
      })
    );

    setWithAmount('');
    setWithPassword('');
    sound.playCash();
    addToast(
      `₹${amt.toFixed(2)} withdrawn from ${activeAccount.name}. Remaining: ₹${newBalance.toFixed(2)}`,
      'info'
    );
    setActiveReceipt(newTxn);
  };

  // ----------------------------------------------------
  // Handler: Send / Transfer Money (Supports Inter-Account or External)
  // ----------------------------------------------------
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!activeAccount) {
      addToast('No active account selected.', 'error');
      sound.playError();
      return;
    }

    const amt = parseFloat(transAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast('Please enter a valid transfer amount.', 'warning');
      sound.playError();
      return;
    }

    if (amt > activeAccount.balance) {
      addToast(`Insufficient balance for transfer! Available: ₹${activeAccount.balance.toFixed(2)}`, 'error');
      sound.playError();
      return;
    }

    if (!transPassword.trim()) {
      addToast('Please enter your security password.', 'warning');
      sound.playError();
      return;
    }

    if (transPassword.trim() !== activeAccount.password) {
      addToast('Incorrect password. Transfer cancelled.', 'error');
      sound.playError();
      return;
    }

    // Handle Transfer between own accounts
    if (transferMode === 'internal') {
      const targetAcc = accounts.find((a) => a.id === internalTargetId && a.id !== activeAccount.id);
      if (!targetAcc) {
        addToast('Please select a valid destination account.', 'warning');
        sound.playError();
        return;
      }

      const senderNewBal = activeAccount.balance - amt;
      const targetNewBal = targetAcc.balance + amt;

      const senderTxn: Transaction = {
        id: generateRefId('TRF'),
        type: 'crd',
        amount: amt,
        label: `Transfer to own account (${targetAcc.name})`,
        category: 'Transfer',
        timestamp: getFormattedTime(),
        balanceAfter: senderNewBal,
        referenceId: generateRefId('TXN'),
        note: transNote.trim() || `Inter-account transfer to ${targetAcc.accountNumber}`,
      };

      const targetTxn: Transaction = {
        id: generateRefId('DEP'),
        type: 'dep',
        amount: amt,
        label: `Transfer from ${activeAccount.name}`,
        category: 'Deposit',
        timestamp: getFormattedTime(),
        balanceAfter: targetNewBal,
        referenceId: generateRefId('TXN'),
        note: transNote.trim() || `Received from own account ${activeAccount.accountNumber}`,
      };

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === activeAccount.id) {
            return {
              ...acc,
              balance: senderNewBal,
              totalWithdrawals: acc.totalWithdrawals + amt,
              transactions: [senderTxn, ...acc.transactions],
            };
          }
          if (acc.id === targetAcc.id) {
            return {
              ...acc,
              balance: targetNewBal,
              totalDeposits: acc.totalDeposits + amt,
              transactions: [targetTxn, ...acc.transactions],
            };
          }
          return acc;
        })
      );

      setTransAmount('');
      setTransPassword('');
      setTransNote('');
      sound.playSuccess();
      addToast(`₹${amt.toFixed(2)} transferred instantly to ${targetAcc.name}!`, 'success');
      setActiveReceipt(senderTxn);
      return;
    }

    // External Transfer
    const recipient = transRecipient.trim();
    if (!recipient) {
      addToast('Please enter the recipient Name or UPI ID / Account Number.', 'warning');
      sound.playError();
      return;
    }

    const newBalance = activeAccount.balance - amt;
    const newTxn: Transaction = {
      id: generateRefId('TRF'),
      type: 'crd',
      amount: amt,
      label: `Transfer to ${recipient}`,
      category: 'Transfer',
      timestamp: getFormattedTime(),
      balanceAfter: newBalance,
      referenceId: generateRefId('TXN'),
      note: transNote.trim() || `Interbank transfer to ${recipient}`,
    };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === activeAccount.id) {
          return {
            ...acc,
            balance: newBalance,
            totalWithdrawals: acc.totalWithdrawals + amt,
            transactions: [newTxn, ...acc.transactions],
          };
        }
        return acc;
      })
    );

    setTransRecipient('');
    setTransAmount('');
    setTransPassword('');
    setTransNote('');
    sound.playSuccess();
    addToast(`₹${amt.toFixed(2)} transferred to ${recipient} successfully!`, 'success');
    setActiveReceipt(newTxn);
  };

  // ----------------------------------------------------
  // Handler: Close Active Account
  // ----------------------------------------------------
  const handleCloseAccount = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!activeAccount) {
      addToast('No active account found to close.', 'error');
      sound.playError();
      return;
    }

    if (!closePassword.trim()) {
      addToast('Please enter your security password to confirm closure.', 'warning');
      sound.playError();
      return;
    }

    if (closePassword.trim() !== activeAccount.password) {
      addToast('Incorrect password. Account closure prohibited.', 'error');
      sound.playError();
      return;
    }

    if (!confirmCloseAcknowledged) {
      addToast('Please check the acknowledgment checkbox before proceeding.', 'warning');
      sound.playError();
      return;
    }

    const closedName = activeAccount.name;
    const closedId = activeAccount.id;
    const refundedBalance = activeAccount.balance;

    const remainingAccounts = accounts.filter((a) => a.id !== closedId);
    setAccounts(remainingAccounts);
    setActiveAccountId(remainingAccounts.length > 0 ? remainingAccounts[0].id : null);
    setClosePassword('');
    setConfirmCloseAcknowledged(false);
    setIsBalanceVerified(false);

    sound.playClick();
    addToast(
      `Account for ${closedName} closed. Remaining accounts: ${remainingAccounts.length}. Settled funds: ₹${refundedBalance.toFixed(2)}.`,
      'info'
    );
    setActiveTab(remainingAccounts.length > 0 ? 'home' : 'open');
  };

  // ----------------------------------------------------
  // Presets & Filter helpers
  // ----------------------------------------------------
  const addDepositPreset = (val: number) => {
    sound.playClick();
    const current = parseFloat(depAmount) || 0;
    setDepAmount((current + val).toString());
  };

  const setWithdrawPercentage = (pct: number) => {
    sound.playClick();
    if (!activeAccount) return;
    const amt = Math.floor((activeAccount.balance * pct) / 100);
    setWithAmount(amt.toString());
  };

  // Filtered Passbook Transactions for current active account
  const filteredTransactions = useMemo(() => {
    if (!activeAccount) return [];
    return activeAccount.transactions.filter((tx) => {
      const matchesSearch =
        tx.label.toLowerCase().includes(passbookSearch.toLowerCase()) ||
        tx.referenceId.toLowerCase().includes(passbookSearch.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(passbookSearch.toLowerCase()));
      const matchesType =
        passbookFilter === 'all' ||
        (passbookFilter === 'dep' && tx.type === 'dep') ||
        (passbookFilter === 'crd' && tx.type === 'crd');
      return matchesSearch && matchesType;
    });
  }, [activeAccount, passbookSearch, passbookFilter]);

  // Export Passbook as CSV
  const handleExportCSV = () => {
    if (!activeAccount || activeAccount.transactions.length === 0) {
      addToast('No transaction data to export.', 'warning');
      return;
    }

    const headers = ['Transaction ID', 'Type', 'Amount (INR)', 'Label', 'Remarks', 'Date & Time', 'Balance After (INR)'];
    const rows = activeAccount.transactions.map((tx) => [
      `"${tx.referenceId}"`,
      `"${tx.type === 'dep' ? 'CREDIT' : 'DEBIT'}"`,
      tx.amount.toFixed(2),
      `"${tx.label.replace(/"/g, '""')}"`,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
      `"${tx.timestamp}"`,
      tx.balanceAfter.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MondalBank_Passbook_${activeAccount.accountNumber}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    sound.playClick();
    addToast('Account statement exported successfully (CSV).', 'success');
  };

  // Seed sample demo accounts for immediate multiple-account testing
  const handleSeedMultipleDemo = () => {
    sound.playClick();
    const c1 = generateCardDetails();
    const c2 = generateCardDetails();
    const c3 = generateCardDetails();

    const acc1: BankAccount = {
      id: 'acc_piyush_primary',
      isActive: true,
      accountNumber: 'MB-2026-894102',
      name: 'Piyush Mondal',
      password: '1234',
      balance: 145000,
      accountType: 'Wealth Vault',
      createdAt: '01/01/2026, 10:00 AM',
      cardNumber: c1.cardNumber,
      cardExpiry: c1.expiry,
      cardCvv: c1.cvv,
      totalDeposits: 175000,
      totalWithdrawals: 30000,
      transactions: [
        {
          id: 'TXN-901',
          type: 'dep',
          amount: 50000,
          label: 'Client Milestone Payout',
          category: 'Deposit',
          timestamp: 'Today, 02:40 PM',
          balanceAfter: 145000,
          referenceId: 'DEP883912',
          note: 'Full-stack software contract settlement',
        },
        {
          id: 'TXN-902',
          type: 'crd',
          amount: 15000,
          label: 'Cloud Compute Infrastructure',
          category: 'Transfer',
          timestamp: 'Yesterday, 06:15 PM',
          balanceAfter: 95000,
          referenceId: 'TRF771024',
          note: 'Server cluster expansion',
        },
        {
          id: 'TXN-903',
          type: 'dep',
          amount: 100000,
          label: 'Vault Founding Capital',
          category: 'Deposit',
          timestamp: '01 Jan 2026, 09:00 AM',
          balanceAfter: 110000,
          referenceId: 'OPN100001',
          note: 'Initial account funding',
        },
      ],
    };

    const acc2: BankAccount = {
      id: 'acc_piyush_business',
      isActive: true,
      accountNumber: 'MB-2026-512994',
      name: 'Mondal Tech Ventures',
      password: '1234',
      balance: 380000,
      accountType: 'Privilege Current',
      createdAt: '15/01/2026, 11:20 AM',
      cardNumber: c2.cardNumber,
      cardExpiry: c2.expiry,
      cardCvv: c2.cvv,
      totalDeposits: 420000,
      totalWithdrawals: 40000,
      transactions: [
        {
          id: 'TXN-801',
          type: 'dep',
          amount: 220000,
          label: 'Corporate Enterprise Contract',
          category: 'Deposit',
          timestamp: '02 Oct 2026, 04:30 PM',
          balanceAfter: 380000,
          referenceId: 'DEP619283',
          note: 'Quarterly client retainer',
        },
      ],
    };

    const acc3: BankAccount = {
      id: 'acc_piyush_savings',
      isActive: true,
      accountNumber: 'MB-2026-104882',
      name: 'Personal Emergency Fund',
      password: '1234',
      balance: 62500,
      accountType: 'Savings',
      createdAt: '01/02/2026, 09:15 AM',
      cardNumber: c3.cardNumber,
      cardExpiry: c3.expiry,
      cardCvv: c3.cvv,
      totalDeposits: 62500,
      totalWithdrawals: 0,
      transactions: [
        {
          id: 'TXN-701',
          type: 'dep',
          amount: 62500,
          label: 'High-Yield Rainy Day Reserve',
          category: 'Deposit',
          timestamp: '01 Feb 2026, 09:30 AM',
          balanceAfter: 62500,
          referenceId: 'DEP194820',
          note: 'Emergency savings reserve',
        },
      ],
    };

    setAccounts([acc1, acc2, acc3]);
    setActiveAccountId(acc1.id);
    sound.playSuccess();
    addToast('Loaded 3 sample accounts for Piyush Mondal (PIN: 1234).', 'success');
    setActiveTab('home');
  };

  // Other accounts available for internal transfer
  const otherAccounts = useMemo(() => {
    if (!activeAccount) return [];
    return accounts.filter((a) => a.id !== activeAccount.id);
  }, [accounts, activeAccount]);

  return (
    <div className="relative min-h-screen bg-[#060B18] text-[#F1F5F9] font-['Inter'] selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background dynamic particle canvas */}
      <ParticleBackground />

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border text-sm transition-all transform animate-in slide-in-from-right-5 duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/85 border-rose-500/30 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/85 border-amber-500/30 text-amber-200'
                : 'bg-indigo-950/85 border-indigo-500/30 text-indigo-200'
            }`}
          >
            <span className="text-base select-none mt-0.5">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <div className="flex-1 font-medium leading-snug">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Digital Transaction Slip Modal */}
      {activeReceipt && (
        <ReceiptModal
          transaction={activeReceipt}
          accountName={activeAccount?.name || 'Valued Client'}
          accountNumber={activeAccount?.accountNumber || 'MB-0000'}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Main Grid Shell */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* TOP BAR */}
        <header className="sticky top-0 z-40 bg-[#060B18]/92 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              🏦
            </div>
            <div>
              <div className="font-['Sora'] font-extrabold text-lg tracking-tight text-white flex items-center gap-0.5">
                Mondal<span className="text-indigo-400">Bank</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider hidden sm:block">
                MULTIPLE ACCOUNTS SYSTEM
              </div>
            </div>
          </div>

          {/* Center: Active Account Status & Switcher */}
          <div className="flex items-center gap-3">
            {activeAccount ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
                <span className="text-xs font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]">
                  {activeAccount.name}
                </span>
                <span className="text-xs text-indigo-300 font-mono font-bold hidden sm:inline tabular-nums">
                  ₹{activeAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]"></span>
                <span>No Accounts Open</span>
              </div>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('accounts');
              }}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}</span>
            </button>
          </div>

          {/* Actions & Audio toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {accounts.length === 0 ? (
              <button
                onClick={handleSeedMultipleDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                title="Populate test accounts for Piyush Mondal"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Load Demo Accounts</span>
                <span className="sm:hidden">Demo</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('open');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Open Another Account</span>
                <span className="sm:hidden">+ Account</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body with Left Sidebar & Main Panel */}
        <div className="flex-1 flex flex-col md:flex-row">
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-68 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#060B18]/70 backdrop-blur-md p-4 md:p-5 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 max-h-none md:max-h-[calc(100vh-65px)]">
            <div className="hidden md:block text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-1">
              Navigation
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('home');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'home'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">🏠</span>
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('accounts');
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">👥</span>
                <span>All Accounts</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-indigo-300 font-mono">
                {accounts.length}
              </span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('open');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'open'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">✨</span>
              <span>Open Account</span>
            </button>

            <div className="hidden md:block my-2 border-t border-white/[0.08]" />

            <div className="hidden md:block text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-1">
              Active Account Actions
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('balance');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'balance'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">💳</span>
              <span>Balance Check</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('deposit');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'deposit'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">📥</span>
              <span>Deposit Funds</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('credit');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'credit'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">📤</span>
              <span>Withdraw Money</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('transfer');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'transfer'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">💸</span>
              <span>Send / Transfer</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('passbook');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'passbook'
                  ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">📜</span>
              <span>Passbook & Ledger</span>
            </button>

            {/* SWITCH ACCOUNT SECTION (As specifically requested in prompt) */}
            <div className="hidden md:block my-2 border-t border-white/[0.08]" />

            <div className="hidden md:flex items-center justify-between px-3 py-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Switch Account
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">{accounts.length} Total</span>
            </div>

            <div className="hidden md:flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {accounts.length === 0 ? (
                <div className="text-xs text-slate-500 px-3 py-2 italic">No accounts yet</div>
              ) : (
                accounts.map((acc) => {
                  const isCurrent = acc.id === activeAccount?.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleSwitchAccount(acc.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                        isCurrent
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-medium'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/5 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-white truncate max-w-[125px]">
                          {acc.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                          ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e] shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden md:block my-2 border-t border-white/[0.08]" />

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('close');
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap mt-auto ${
                activeTab === 'close'
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-sm">🔒</span>
              <span>Close Active Account</span>
            </button>
          </aside>

          {/* MAIN VIEWPORT */}
          <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
            {/* ---------------------------------------------------- */}
            {/* TAB: HOME */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'home' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {activeAccount ? (
                  // LOGGED IN DASHBOARD
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                            Dashboard
                          </h1>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono">
                            {activeAccount.accountType}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                          Active Account: <span className="text-white font-semibold">{activeAccount.name}</span> ·{' '}
                          <span className="font-mono text-slate-300">{activeAccount.accountNumber}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            sound.playClick();
                            setActiveTab('accounts');
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Switch / View Accounts ({accounts.length})</span>
                        </button>
                        <button
                          onClick={() => setShowCardInDashboard(!showCardInDashboard)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{showCardInDashboard ? 'Hide Card' : 'Show Card'}</span>
                        </button>
                      </div>
                    </div>

                    {/* TOP HERO GRID: Balance & Quick Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Balance Card */}
                      <div className={`space-y-6 ${showCardInDashboard ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#0C0A1E] border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                          <div className="relative z-10 flex items-center justify-between">
                            <span className="text-xs uppercase tracking-widest text-indigo-300/80 font-medium">
                              Available Balance
                            </span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
                              <ShieldCheck className="w-3 h-3" />
                              Encrypted & Verified
                            </div>
                          </div>

                          <div className="relative z-10 mt-3 mb-2 flex items-baseline gap-1">
                            <span className="font-['Sora'] text-2xl font-normal text-indigo-300/80">₹</span>
                            <span className="font-['Sora'] text-3xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums">
                              {activeAccount.balance.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          <div className="relative z-10 text-xs text-slate-400 flex items-center gap-2">
                            <span>Account Holder:</span>
                            <span className="font-semibold text-white">{activeAccount.name}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-200">{activeAccount.accountNumber}</span>
                          </div>

                          {/* Fast Action Buttons */}
                          <div className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-2 sm:gap-3">
                            <button
                              onClick={() => {
                                sound.playClick();
                                setActiveTab('deposit');
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                              <span>Deposit</span>
                            </button>
                            <button
                              onClick={() => {
                                sound.playClick();
                                setActiveTab('credit');
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all"
                            >
                              <ArrowUpRight className="w-4 h-4 text-rose-400" />
                              <span>Withdraw</span>
                            </button>
                            <button
                              onClick={() => {
                                sound.playClick();
                                setActiveTab('transfer');
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all"
                            >
                              <Send className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Transfer</span>
                            </button>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-xl bg-[#0F172A]/80 border border-white/[0.08] p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
                              📥
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-400 font-medium">Deposits</div>
                              <div className="font-['Sora'] text-base font-bold text-white tabular-nums">
                                {activeAccount.transactions.filter((t) => t.type === 'dep').length}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl bg-[#0F172A]/80 border border-white/[0.08] p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-lg">
                              📤
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-400 font-medium">Withdrawals</div>
                              <div className="font-['Sora'] text-base font-bold text-white tabular-nums">
                                {activeAccount.transactions.filter((t) => t.type === 'crd').length}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl bg-[#0F172A]/80 border border-white/[0.08] p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-lg">
                              🔄
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-400 font-medium">Total Txns</div>
                              <div className="font-['Sora'] text-base font-bold text-white tabular-nums">
                                {activeAccount.transactions.length}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Virtual Platinum Card */}
                      {showCardInDashboard && (
                        <div className="lg:col-span-5 flex flex-col items-center">
                          <div className="w-full flex items-center justify-between mb-2 px-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Virtual Platinum Debit
                            </span>
                            <span className="text-[11px] text-indigo-400">Click card to reveal CVV</span>
                          </div>
                          <VirtualCard
                            name={activeAccount.name}
                            accountNumber={activeAccount.accountNumber}
                            cardNumber={activeAccount.cardNumber}
                            expiry={activeAccount.cardExpiry}
                            cvv={activeAccount.cardCvv}
                            balance={activeAccount.balance}
                          />
                        </div>
                      )}
                    </div>

                    {/* RECENT TRANSACTIONS TABLE */}
                    <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-['Sora'] text-base font-bold text-white">Recent Transactions</h2>
                          <p className="text-xs text-slate-400">Ledger history for {activeAccount.name}</p>
                        </div>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setActiveTab('passbook');
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          View Passbook →
                        </button>
                      </div>

                      {activeAccount.transactions.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-sm">
                          No transactions recorded yet. Make a deposit to begin.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.06]">
                          {activeAccount.transactions.slice(0, 6).map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => {
                                sound.playClick();
                                setActiveReceipt(tx);
                              }}
                              className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${
                                    tx.type === 'dep'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {tx.type === 'dep' ? '↓' : '↑'}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                    {tx.label}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                                    <span>{tx.timestamp}</span>
                                    <span>·</span>
                                    <span>Ref: {tx.referenceId}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div
                                  className={`font-['Sora'] font-bold text-sm sm:text-base tabular-nums ${
                                    tx.type === 'dep' ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {tx.type === 'dep' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Bal: ₹{tx.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // NO ACCOUNT OPENED YET
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#070D1E] border border-white/[0.08] p-8 md:p-14 text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/25 mx-auto mb-6">
                      🏦
                    </div>

                    <h1 className="font-['Sora'] font-extrabold text-3xl md:text-5xl text-white tracking-tight max-w-2xl mx-auto leading-tight">
                      Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">Mondal Bank</span>
                    </h1>

                    <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                      Open multiple accounts, switch between them instantly, and manage all your funds in one place with numeric PIN security.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setActiveTab('open');
                        }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                      >
                        Open First Account →
                      </button>
                      <button
                        onClick={handleSeedMultipleDemo}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-sm transition-all"
                      >
                        Load Sample Accounts
                      </button>
                    </div>

                    {/* Features list */}
                    <div className="mt-12 pt-8 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-indigo-400 font-semibold text-xs mb-1">👥 Multiple Accounts</div>
                        <div className="text-slate-400 text-xs">Create unlimited distinct bank accounts</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-indigo-400 font-semibold text-xs mb-1">⚡ Instant Switch</div>
                        <div className="text-slate-400 text-xs">Switch between profiles in 1 click</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-indigo-400 font-semibold text-xs mb-1">💸 Self & Inter-Bank</div>
                        <div className="text-slate-400 text-xs">Transfer between your own accounts</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-indigo-400 font-semibold text-xs mb-1">🔐 Password Protected</div>
                        <div className="text-slate-400 text-xs">Independent PIN security for each account</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: ALL ACCOUNTS (Multiple Account Overview) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'accounts' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                      All Accounts
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} active in Mondal Bank
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setActiveTab('open');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Open Another Account</span>
                  </button>
                </div>

                {accounts.length === 0 ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-12 text-center space-y-4">
                    <div className="text-4xl">🏦</div>
                    <h3 className="font-['Sora'] text-lg font-bold text-white">No Accounts Open Yet</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Create your first banking account or populate the system with multiple test accounts.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={() => setActiveTab('open')}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Open First Account
                      </button>
                      <button
                        onClick={handleSeedMultipleDemo}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium"
                      >
                        Load Demo Profiles
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {accounts.map((acc) => {
                      const isCurrent = acc.id === activeAccount?.id;
                      return (
                        <div
                          key={acc.id}
                          className={`relative rounded-2xl p-6 transition-all border ${
                            isCurrent
                              ? 'bg-gradient-to-b from-[#1E1B4B]/80 to-[#0F172A] border-indigo-500/50 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                              : 'bg-[#0F172A]/80 border-white/[0.08] hover:border-white/20 hover:bg-[#0F172A]'
                          }`}
                        >
                          {/* Active badge */}
                          {isCurrent && (
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                              🏦
                            </div>
                            <div className="min-w-0 flex-1 pr-14">
                              <h3 className="font-['Sora'] font-bold text-base text-white truncate">
                                {acc.name}
                              </h3>
                              <span className="text-[11px] text-indigo-300 font-mono">
                                {acc.accountType}
                              </span>
                            </div>
                          </div>

                          <div className="my-3 py-3 border-y border-white/5 space-y-1">
                            <div className="text-[11px] text-slate-400 font-medium">Available Balance</div>
                            <div className="font-['Sora'] text-2xl font-extrabold text-white tabular-nums">
                              ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-400 font-mono pb-4">
                            <div className="flex justify-between">
                              <span>Account No:</span>
                              <span className="text-slate-200">{acc.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Opened:</span>
                              <span className="text-slate-300">{acc.createdAt}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transactions:</span>
                              <span className="text-slate-300">{acc.transactions.length} records</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex gap-2">
                            {isCurrent ? (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setActiveTab('home');
                                }}
                                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                              >
                                View Active Dashboard →
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSwitchAccount(acc.id)}
                                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                              >
                                <span>Switch to this Account</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: OPEN ACCOUNT (Allows multiple accounts!) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'open' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                    Open New Account
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Create another account — unlimited multiple accounts supported simultaneously.
                  </p>
                </div>

                <form
                  onSubmit={handleOpenAccount}
                  className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 md:p-8 shadow-2xl space-y-5"
                >
                  {/* Account Type Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Select Account Category
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(['Savings', 'Privilege Current', 'Wealth Vault'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setOpenAccountType(type);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            openAccountType === type
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-sm'
                              : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold">{type}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {type === 'Savings' && '4.5% annual yield'}
                            {type === 'Privilege Current' && 'High transaction limits'}
                            {type === 'Wealth Vault' && 'Premium concierge'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={openName}
                      onChange={(e) => setOpenName(e.target.value)}
                      placeholder="e.g. Piyush Mondal (or Business Name)"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>

                  {/* Numeric Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Set Password (PIN)
                        </label>
                        <span className="text-[10px] text-indigo-400 font-mono">Digits Only</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showOpenPass ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={openPass}
                          onChange={(e) => setOpenPass(e.target.value)}
                          placeholder="e.g. 1234"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenPass(!showOpenPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showOpenPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Confirm Password
                      </label>
                      <input
                        type={showOpenPass ? 'text' : 'password'}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={openConfirm}
                        onChange={(e) => setOpenConfirm(e.target.value)}
                        placeholder="Re-enter PIN"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Initial Deposit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Initial Deposit Amount (Optional)
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">INR (₹)</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={openInitial}
                      onChange={(e) => setOpenInitial(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tabular-nums"
                    />
                    {/* Presets */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[500, 1000, 5000, 10000, 50000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setOpenInitial(preset.toString());
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                        >
                          + ₹{preset.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    ✨ Activate Account & Switch
                  </button>
                </form>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: BALANCE */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'balance' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                    Check Balance
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Verify identity to view balance for{' '}
                    <span className="text-white font-semibold">{activeAccount?.name || 'selected account'}</span>
                  </p>
                </div>

                {!activeAccount ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-8 text-center space-y-3">
                    <Lock className="w-10 h-10 text-slate-500 mx-auto" />
                    <h3 className="font-['Sora'] text-base font-semibold text-white">No Active Account Selected</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Please open or switch to an account first.
                    </p>
                    <button
                      onClick={() => setActiveTab('open')}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Open Account →
                    </button>
                  </div>
                ) : isBalanceVerified ? (
                  <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#0C0A1E] border border-indigo-500/40 p-6 md:p-8 shadow-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-indigo-300/80 font-medium">
                          Available Balance
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </div>
                      </div>

                      <div className="mt-4 mb-2 flex items-baseline gap-1.5">
                        <span className="font-['Sora'] text-2xl font-light text-indigo-300">₹</span>
                        <span className="font-['Sora'] text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums">
                          {activeAccount.balance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <span>Account Holder:</span>
                        <span className="font-semibold text-white">{activeAccount.name}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">{activeAccount.accountNumber}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 space-y-3 text-sm">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Account Breakdown
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-slate-300">
                        <span>Ledger Balance</span>
                        <span className="font-mono text-white font-medium">₹{activeAccount.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-slate-300">
                        <span>Holds / Uncleared</span>
                        <span className="font-mono text-slate-400">₹0.00</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-slate-300">
                        <span>Tier</span>
                        <span className="text-white font-medium">{activeAccount.accountType}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 text-slate-300">
                        <span>Created Date</span>
                        <span className="font-mono text-xs text-slate-400">{activeAccount.createdAt}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsBalanceVerified(false);
                        addToast('Balance display locked.', 'info');
                      }}
                      className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Balance View</span>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCheckBalance}
                    className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 md:p-8 shadow-2xl space-y-5"
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Security Verification</div>
                        <div className="text-xs text-slate-400">Active: {activeAccount.name}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Enter Security Password (PIN)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={balancePasswordInput}
                        onChange={(e) => setBalancePasswordInput(e.target.value)}
                        placeholder="Enter your PIN"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      Show Balance
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: DEPOSIT */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'deposit' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                    Deposit Money
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Add funds to {activeAccount ? <strong className="text-white">{activeAccount.name}</strong> : 'selected account'}
                  </p>
                </div>

                {!activeAccount ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-8 text-center space-y-3">
                    <p className="text-sm text-slate-400">No active account selected. Switch or open an account first.</p>
                    <button
                      onClick={() => setActiveTab('open')}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Open Account →
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleDeposit}
                    className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 md:p-8 shadow-2xl space-y-5"
                  >
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Depositing to: </span>
                        <strong className="text-white font-semibold">{activeAccount.name}</strong>
                      </div>
                      <span className="font-mono text-indigo-300">{activeAccount.accountNumber}</span>
                    </div>

                    {/* Method Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Deposit Channel
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {['UPI Instant Transfer', 'Cash Vault Simulation', 'Bank Wire Clearance'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setDepMethod(m);
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                              depMethod === m
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                                : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Password (PIN)
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={depPassword}
                          onChange={(e) => setDepPassword(e.target.value)}
                          placeholder="Enter PIN"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={depAmount}
                          onChange={(e) => setDepAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tabular-nums"
                          required
                        />
                      </div>
                    </div>

                    {/* Quick Amount presets */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                        Quick Add Presets:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[500, 1000, 5000, 10000, 25000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => addDepositPreset(val)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                          >
                            + ₹{val.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional Note */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        value={depNote}
                        onChange={(e) => setDepNote(e.target.value)}
                        placeholder="e.g. Salary, Client milestone, Savings"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      <span>💰 Deposit to {activeAccount.name}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: WITHDRAW / CREDIT */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'credit' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                    Withdraw Funds
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Debit funds from {activeAccount ? <strong className="text-white">{activeAccount.name}</strong> : 'selected account'}
                  </p>
                </div>

                {!activeAccount ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-8 text-center space-y-3">
                    <p className="text-sm text-slate-400">No active account selected. Switch or open an account first.</p>
                    <button
                      onClick={() => setActiveTab('open')}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Open Account →
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleWithdraw}
                    className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 md:p-8 shadow-2xl space-y-5"
                  >
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Available for Withdrawal ({activeAccount.name})</div>
                        <div className="font-['Sora'] text-xl font-bold text-white tabular-nums">
                          ₹{activeAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-xs text-indigo-400 font-mono">
                        A/C: {activeAccount.accountNumber}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Password (PIN)
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={withPassword}
                          onChange={(e) => setWithPassword(e.target.value)}
                          placeholder="Enter PIN"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Withdraw Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={activeAccount.balance}
                          step="1"
                          value={withAmount}
                          onChange={(e) => setWithAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono tabular-nums"
                          required
                        />
                      </div>
                    </div>

                    {/* Percentage chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                        Quick Percentage Withdrawals:
                      </span>
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setWithdrawPercentage(pct)}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                          >
                            {pct === 100 ? 'All (100%)' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Withdrawal Purpose
                      </label>
                      <select
                        value={withPurpose}
                        onChange={(e) => setWithPurpose(e.target.value)}
                        className="w-full bg-[#060B18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="Cash Withdrawal">ATM Cash Withdrawal</option>
                        <option value="Online Shopping & POS">Online Shopping & POS</option>
                        <option value="Utility Bill Payment">Utility Bill Settlement</option>
                        <option value="Emergency Reserve">Emergency Reserve</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-xl shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>📤 Withdraw from {activeAccount.name}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: TRANSFER / SEND MONEY (Inter-account & External) */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'transfer' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                    Send / Transfer Money
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Transfer between your own accounts or send to external beneficiaries.
                  </p>
                </div>

                {!activeAccount ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-8 text-center space-y-3">
                    <p className="text-sm text-slate-400">Please select or open an account first.</p>
                    <button
                      onClick={() => setActiveTab('open')}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Open Account →
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleTransfer}
                    className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 md:p-8 shadow-2xl space-y-5"
                  >
                    {/* Transfer Mode selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Destination Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setTransferMode('external');
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                            transferMode === 'external'
                              ? 'bg-indigo-500/20 border-indigo-500 text-white'
                              : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          External Recipient / UPI
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setTransferMode('internal');
                            if (otherAccounts.length > 0 && !internalTargetId) {
                              setInternalTargetId(otherAccounts[0].id);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                            transferMode === 'internal'
                              ? 'bg-indigo-500/20 border-indigo-500 text-white'
                              : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Between Your Own Accounts ({otherAccounts.length})
                        </button>
                      </div>
                    </div>

                    {/* Source summary */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Transferring From: </span>
                        <strong className="text-white">{activeAccount.name}</strong>
                      </div>
                      <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                        Available: ₹{activeAccount.balance.toFixed(2)}
                      </span>
                    </div>

                    {transferMode === 'internal' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Select Destination Account
                        </label>
                        {otherAccounts.length === 0 ? (
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-amber-300">
                            You only have 1 account open. Open another account to transfer between your accounts.
                          </div>
                        ) : (
                          <select
                            value={internalTargetId}
                            onChange={(e) => setInternalTargetId(e.target.value)}
                            className="w-full bg-[#060B18] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                          >
                            {otherAccounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.accountNumber}) — ₹{acc.balance.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Recipient Name / UPI ID / Account Number
                        </label>
                        <input
                          type="text"
                          value={transRecipient}
                          onChange={(e) => setTransRecipient(e.target.value)}
                          placeholder="e.g. rahul@upi or MB-2026-992101"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          {activeAccount.name}'s Password (PIN)
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={transPassword}
                          onChange={(e) => setTransPassword(e.target.value)}
                          placeholder="Enter PIN"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Transfer Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={activeAccount.balance}
                          step="1"
                          value={transAmount}
                          onChange={(e) => setTransAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono tabular-nums"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={transNote}
                        onChange={(e) => setTransNote(e.target.value)}
                        placeholder="e.g. Rent, Gift, Project Settlement"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={transferMode === 'internal' && otherAccounts.length === 0}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Execute Transfer</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: PASSBOOK & LEDGER */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'passbook' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                      Passbook & Statement
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Audit ledger for <span className="text-white font-semibold">{activeAccount?.name || 'selected account'}</span>
                    </p>
                  </div>

                  {activeAccount && activeAccount.transactions.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-colors"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>Export Statement (CSV)</span>
                    </button>
                  )}
                </div>

                {!activeAccount ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-8 text-center space-y-3">
                    <p className="text-sm text-slate-400">Open or switch to an account to view its passbook.</p>
                    <button
                      onClick={() => setActiveTab('open')}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Open Account →
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-6 shadow-xl space-y-4">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={passbookSearch}
                          onChange={(e) => setPassbookSearch(e.target.value)}
                          placeholder="Search transactions or Ref ID..."
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl w-full sm:w-auto">
                        {(['all', 'dep', 'crd'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              sound.playClick();
                              setPassbookFilter(mode);
                            }}
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              passbookFilter === mode
                                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {mode === 'all' && 'All Txns'}
                            {mode === 'dep' && 'Deposits (Cr)'}
                            {mode === 'crd' && 'Withdrawals (Dr)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table View */}
                    {filteredTransactions.length === 0 ? (
                      <div className="py-16 text-center text-slate-500 text-sm">
                        No transactions found matching your criteria.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                              <th className="py-3 px-3">Date & Time</th>
                              <th className="py-3 px-3">Reference ID</th>
                              <th className="py-3 px-3">Description</th>
                              <th className="py-3 px-3 text-right">Debit (Dr)</th>
                              <th className="py-3 px-3 text-right">Credit (Cr)</th>
                              <th className="py-3 px-3 text-right">Balance</th>
                              <th className="py-3 px-3 text-center">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredTransactions.map((tx) => (
                              <tr
                                key={tx.id}
                                className="hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="py-3.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                                  {tx.timestamp}
                                </td>
                                <td className="py-3.5 px-3 font-mono text-indigo-300 font-medium whitespace-nowrap">
                                  {tx.referenceId}
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="font-medium text-white">{tx.label}</div>
                                  {tx.note && <div className="text-[11px] text-slate-400">{tx.note}</div>}
                                </td>
                                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-rose-400 font-medium">
                                  {tx.type === 'crd' ? `₹${tx.amount.toFixed(2)}` : '—'}
                                </td>
                                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-emerald-400 font-medium">
                                  {tx.type === 'dep' ? `₹${tx.amount.toFixed(2)}` : '—'}
                                </td>
                                <td className="py-3.5 px-3 text-right font-mono tabular-nums text-white font-semibold">
                                  ₹{tx.balanceAfter.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      sound.playClick();
                                      setActiveReceipt(tx);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-300 transition-colors"
                                    title="View & Download Receipt"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB: CLOSE ACCOUNT */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'close' && (
              <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <div>
                  <h1 className="font-['Sora'] font-bold text-2xl md:text-3xl tracking-tight text-white">
                    Close Active Account
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Permanently remove the currently selected account ({activeAccount?.name || 'None'})
                  </p>
                </div>

                {!activeAccount ? (
                  <div className="rounded-2xl bg-[#0F172A]/80 border border-white/[0.08] p-8 text-center space-y-3">
                    <p className="text-sm text-slate-400">No active account is currently open.</p>
                    <button
                      onClick={() => setActiveTab('open')}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Open Account →
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCloseAccount}
                    className="rounded-2xl bg-[#0F172A]/80 border border-rose-500/20 p-6 md:p-8 shadow-2xl space-y-5"
                  >
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-3 leading-relaxed">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <strong className="block font-semibold text-rose-200">Irreversible Action Warning</strong>
                        Closing will permanently erase <span className="font-bold text-white">{activeAccount.name}'s</span>{' '}
                        account (<span className="font-mono text-white font-bold">{activeAccount.accountNumber}</span>) and its{' '}
                        {activeAccount.transactions.length} transactions.
                        {accounts.length > 1 && (
                          <div className="mt-1 text-slate-300">
                            Your other {accounts.length - 1} {accounts.length - 1 === 1 ? 'account' : 'accounts'} will remain safe and intact.
                          </div>
                        )}
                        <div className="mt-1 text-slate-300">
                          Remaining balance of <span className="font-mono text-white font-bold">₹{activeAccount.balance.toFixed(2)}</span> will be settled.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Enter {activeAccount.name}'s Password (PIN) to Confirm
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={closePassword}
                        onChange={(e) => setClosePassword(e.target.value)}
                        placeholder="Enter your PIN"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                        required
                      />
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmCloseAcknowledged}
                        onChange={(e) => setConfirmCloseAcknowledged(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500"
                        required
                      />
                      <span className="text-xs text-slate-400 leading-normal">
                        I confirm the closure of account {activeAccount.accountNumber}.
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>🔒 Close This Account</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </main>
        </div>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-white/[0.08] bg-[#060B18]/90 backdrop-blur-md py-6 px-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🏦</span>
            <span className="font-['Sora'] font-extrabold text-base tracking-tight text-white">
              Mondal<span className="text-indigo-400">Bank</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">· SECURE VAULT</span>
          </div>

          <div className="text-xs text-slate-400">
            Owner &amp; Founder — <span className="text-indigo-300 font-semibold">Piyush Mondal</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Designed &amp; Developed by <span className="text-indigo-300/80 font-medium">Piyush Mondal</span> · © 2026 Mondal Bank. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
