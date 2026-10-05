import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, Copy, Check, RotateCw, Wifi } from 'lucide-react';

interface VirtualCardProps {
  name: string;
  accountNumber: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  balance: number;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({
  name,
  accountNumber,
  cardNumber,
  expiry,
  cvv,
  balance,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedCardNumber = cardNumber.replace(/(\d{4})/g, '$1 ').trim();
  const maskedCardNumber = `•••• •••• •••• ${cardNumber.slice(-4)}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group perspective-1000 max-w-md w-full mx-auto select-none">
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl p-6 transition-all duration-700 [transform-style:preserve-3d] cursor-pointer shadow-2xl ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
        onClick={() => setFlipped(!flipped)}
      >
        {/* FRONT SIDE */}
        <div className="absolute inset-0 rounded-2xl p-6 bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#2E1065] border border-indigo-500/30 overflow-hidden [backface-visibility:hidden] flex flex-col justify-between shadow-[0_20px_50px_rgba(99,102,241,0.25)]">
          {/* Specular highlight lines */}
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* Top Row: Brand & Contactless */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md text-sm font-bold">
                🏦
              </div>
              <div>
                <span className="font-['Sora'] font-extrabold tracking-tight text-white text-base">
                  Mondal<span className="text-indigo-400">Bank</span>
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-indigo-300/80 font-medium">
                  Platinum Debit
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-indigo-300/80">
              <Wifi className="w-5 h-5 rotate-90" />
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-slate-400">
                RUPEE
              </span>
            </div>
          </div>

          {/* Chip & Action Bar */}
          <div className="flex items-center justify-between z-10 my-1">
            <div className="relative w-11 h-8 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[2px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full border border-amber-700/40 rounded-sm grid grid-cols-3 gap-0.5 p-0.5 opacity-80">
                <div className="border border-amber-900/30 rounded-xs"></div>
                <div className="border border-amber-900/30 rounded-xs"></div>
                <div className="border border-amber-900/30 rounded-xs"></div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-slate-300">
              <RotateCw className="w-3 h-3 text-indigo-400 animate-spin-slow" />
              <span>Tap to Flip</span>
            </div>
          </div>

          {/* Card Number */}
          <div className="z-10">
            <div className="flex items-center justify-between">
              <div className="font-['JetBrains_Mono'] tracking-widest text-lg md:text-xl font-medium text-white drop-shadow-sm tabular-nums">
                {showSensitive ? formattedCardNumber : maskedCardNumber}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSensitive(!showSensitive);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 transition-colors"
                  title={showSensitive ? 'Hide Details' : 'Show Details'}
                >
                  {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 transition-colors"
                  title="Copy Card Number"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Cardholder & Expiry */}
          <div className="flex items-end justify-between z-10 pt-1">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Cardholder</div>
              <div className="font-['Sora'] text-xs md:text-sm font-semibold text-white tracking-wide uppercase">
                {name || 'Piyush Mondal'}
              </div>
              <div className="text-[10px] text-indigo-300/70 font-mono">
                A/C: {accountNumber}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Expires</div>
              <div className="font-mono text-xs md:text-sm font-semibold text-white">
                {expiry}
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-bl from-[#0C0A1E] via-[#0F172A] to-[#1E1B4B] border border-indigo-500/30 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between py-5 shadow-2xl">
          <div className="space-y-4">
            {/* Magnetic Stripe */}
            <div className="w-full h-11 bg-slate-950 border-y border-white/5" />

            {/* Signature & CVV Panel */}
            <div className="px-6 flex items-center justify-between">
              <div className="w-7/12 h-8 bg-slate-200/90 rounded flex items-center px-3 font-serif italic text-slate-800 text-xs tracking-wider">
                {name || 'Piyush Mondal'}
              </div>
              <div className="w-4/12 bg-white rounded p-1.5 text-right border border-slate-300 shadow-inner">
                <span className="text-[8px] uppercase tracking-widest text-slate-600 block leading-tight">
                  CVV
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm tracking-widest tabular-nums">
                  {showSensitive ? cvv : '•••'}
                </span>
              </div>
            </div>

            <div className="px-6 text-[10px] text-slate-400 leading-relaxed">
              This card is property of Mondal Bank. If found, please return to any Mondal Bank branch or contact customer support. Authorized Signature required.
            </div>
          </div>

          <div className="px-6 flex items-center justify-between text-xs text-slate-400">
            <span className="font-['Sora'] font-bold text-white text-xs">Mondal<span className="text-indigo-400">Bank</span></span>
            <span className="font-mono text-[10px] text-indigo-400">24/7 HELPLINE: 1800-MONDAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
