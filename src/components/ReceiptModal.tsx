import React from 'react';
import { Transaction } from '../types';
import { CheckCircle2, Download, Printer, X, ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  accountName: string;
  accountNumber: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  accountName,
  accountNumber,
  onClose,
}) => {
  if (!transaction) return null;

  const isDeposit = transaction.type === 'dep';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptContent = `
=============================================
             MONDAL BANK RECEIPT
=============================================
Reference ID : ${transaction.referenceId}
Date & Time  : ${transaction.timestamp}
Status       : SUCCESSFUL / VERIFIED
---------------------------------------------
Account Holder: ${accountName}
Account No.   : ${accountNumber}
Type          : ${isDeposit ? 'CREDIT / DEPOSIT' : 'DEBIT / WITHDRAWAL'}
Category      : ${transaction.label}
${transaction.note ? `Notes         : ${transaction.note}\n` : ''}
Amount        : ₹${transaction.amount.toFixed(2)}
Post Balance  : ₹${transaction.balanceAfter.toFixed(2)}
---------------------------------------------
Owner & Founder: Piyush Mondal
Mondal Bank Digital Vault System
=============================================
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MondalBank_Receipt_${transaction.referenceId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B132B] border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8">
        {/* Header close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Bank Brand */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">
              🏦
            </div>
            <div>
              <div className="font-['Sora'] font-extrabold text-xl text-white tracking-tight">
                Mondal<span className="text-indigo-400">Bank</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Digital Banking Slip</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </div>
        </div>

        {/* Amount Showcase */}
        <div className="py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-white/5 border border-white/10">
            {isDeposit ? (
              <ArrowDownRight className="w-6 h-6 text-emerald-400" />
            ) : (
              <ArrowUpRight className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-1">
            {isDeposit ? 'Total Amount Credited' : 'Total Amount Debited'}
          </div>
          <div className={`font-['Sora'] text-3xl md:text-4xl font-extrabold tabular-nums ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isDeposit ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            Transaction ID: {transaction.referenceId}
          </div>
        </div>

        {/* Key Detail Ledger */}
        <div className="bg-slate-900/60 rounded-xl border border-white/5 p-4 space-y-3 text-sm">
          <div className="flex justify-between items-center text-slate-400">
            <span>Description</span>
            <span className="font-medium text-white">{transaction.label}</span>
          </div>
          {transaction.note && (
            <div className="flex justify-between items-center text-slate-400">
              <span>Remark / Purpose</span>
              <span className="font-medium text-slate-200">{transaction.note}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-400">
            <span>Beneficiary / Account</span>
            <span className="font-mono text-white">{accountNumber} ({accountName})</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Date & Time</span>
            <span className="text-white font-mono text-xs">{transaction.timestamp}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center font-semibold">
            <span className="text-slate-300">Remaining Balance</span>
            <span className="font-mono text-indigo-300 tabular-nums">
              ₹{transaction.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-sm transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Download Voucher
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          Owner & Founder — <span className="text-indigo-400 font-semibold">Piyush Mondal</span> · Mondal Bank
        </div>
      </div>
    </div>
  );
};
