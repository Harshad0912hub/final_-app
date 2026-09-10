import React, { useState, useEffect } from 'react';
import { Customer, PaymentRecord } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface AdvancePaymentModalProps {
  isOpen: boolean;
  customer: Customer | null;
  dueAmount: number;
  paymentToEdit?: PaymentRecord | null;
  onClose: () => void;
  onSavePayment: (payment: {
    id?: string;
    amount: number;
    method: 'cash' | 'gpay' | 'bank';
    title: string;
    note: string;
  }) => void;
  onDeletePayment?: (paymentId: string) => void;
}

const marathiMonthNames = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const englishMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const marathiDigitsMap = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toMarathiDigits = (n: number) => String(n).split('').map((c) => marathiDigitsMap[+c] ?? c).join('');

function getTodayFullDateStr(language: string): string {
  const d = new Date();
  return language === 'mr'
    ? `${toMarathiDigits(d.getDate())} ${marathiMonthNames[d.getMonth()]} ${toMarathiDigits(d.getFullYear())} (आज)`
    : `${d.getDate()} ${englishMonthNames[d.getMonth()]} ${d.getFullYear()} (Today)`;
}

function getCurrentMonthYearStr(language: string): string {
  const d = new Date();
  return language === 'mr'
    ? `${marathiMonthNames[d.getMonth()]} ${toMarathiDigits(d.getFullYear())}`
    : `${englishMonthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function getDefaultAdvanceNote(language: string): string {
  const d = new Date();
  return language === 'mr'
    ? `${marathiMonthNames[d.getMonth()]} महिन्याची ॲडव्हान्स पावती`
    : `Advance receipt for ${englishMonthNames[d.getMonth()]}`;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  isOpen,
  customer,
  dueAmount,
  paymentToEdit,
  onClose,
  onSavePayment,
  onDeletePayment,
}) => {
  const { language, t, formatNum, formatCurrency } = useLanguage();
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<'cash' | 'gpay' | 'bank'>('cash');
  const [note, setNote] = useState(getDefaultAdvanceNote(language));

  useEffect(() => {
    if (paymentToEdit) {
      setAmount(paymentToEdit.amount || 0);
      setMethod(paymentToEdit.method || 'cash');
      setNote(paymentToEdit.note || paymentToEdit.title || '');
    } else {
      setAmount(1000);
      setMethod('cash');
      setNote(getDefaultAdvanceNote(language));
    }
  }, [paymentToEdit, isOpen, language]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert(language === 'mr' ? 'कृपया योग्य रक्कम प्रविष्ट करा' : 'Please enter a valid amount');
      return;
    }

    const methodTitleMap = {
      cash: language === 'mr' ? 'रोख रक्कम (कॅश)' : 'Cash Payment',
      gpay: language === 'mr' ? 'गुगल पे द्वारे ॲडव्हान्स जमा' : 'Google Pay Advance',
      bank: language === 'mr' ? 'बँक ट्रान्सफर द्वारे जमा' : 'Bank Transfer Payment',
    };

    onSavePayment({
      id: paymentToEdit?.id,
      amount: Number(amount),
      method,
      title: methodTitleMap[method],
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmed Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-up Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-[#ffffff] rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Grab Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-[#e2bfb2]/60"></div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="overflow-y-auto px-4 pb-8 flex flex-col gap-4 no-scrollbar">
          {/* Title Header Row */}
          <div className="flex items-start justify-between pt-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900] flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <h2 className="font-headline-md text-[20px] text-[#0b1c30] font-bold leading-tight">
                  {paymentToEdit
                    ? (language === 'mr' ? 'पेमेंट नोंद बदला / संपादन' : 'Edit Payment Record')
                    : t('advanceModalTitle')}
                </h2>
              </div>
              <p className="font-body-sm text-[12px] text-[#5a4138] mt-0.5 pl-10">
                {language === 'mr' ? 'ग्राहक' : 'Customer'}:{' '}
                <span className="text-[#0b1c30] font-semibold">{customer.name}</span> •{' '}
                {language === 'mr' ? 'मो.' : 'Mob.'} {formatNum(customer.phone)}
              </p>
            </div>

            <button
              type="button"
              aria-label={t('cancel')}
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#5a4138] hover:bg-[#dce9ff] transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Balance Status Notice Banner */}
          <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-[#ba1a1a]">pending_actions</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] text-[#5a4138] leading-none">
                  {language === 'mr' ? 'सध्याची देय बाकी' : 'Current Outstanding Due'}
                </span>
                <span className="font-headline-sm text-[17px] text-[#ba1a1a] leading-tight font-bold">
                  {formatCurrency(dueAmount)} {language === 'mr' ? 'बाकी' : 'due'}
                </span>
              </div>
            </div>
            <span className="font-label-sm text-[11px] px-2.5 py-1 rounded-full bg-[#ffffff] text-[#5a4138] shadow-xs border border-[#e2bfb2]/30 font-medium">
              {getCurrentMonthYearStr(language)}
            </span>
          </div>

          {/* Add Payment Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Field 1: Date */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold flex items-center justify-between">
                <span>
                  {language === 'mr' ? 'तारीख (Date)' : 'Date'} <span className="text-[#ba1a1a]">*</span>
                </span>
                <span className="font-label-sm text-[11px] text-[#a33900] font-bold">
                  {language === 'mr' ? 'आजची तारीख' : "Today's Date"}
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[#a33900] text-[20px] pointer-events-none">
                  calendar_today
                </span>
                <input
                  type="text"
                  readOnly
                  value={getTodayFullDateStr(language)}
                  className="w-full h-12 pl-11 pr-4 bg-[#eff4ff] rounded-xl font-body-lg text-[15px] text-[#0b1c30] focus:outline-none shadow-xs cursor-default font-medium"
                />
              </div>
            </div>

            {/* Field 2: Payment Amount (₹) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold flex items-center justify-between">
                <span>
                  {t('amountPrompt')} <span className="text-[#ba1a1a]">*</span>
                </span>
                <span className="font-body-sm text-[11px] text-[#5a4138] font-normal">
                  {language === 'mr' ? 'आवश्यक' : 'Required'}
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[#a33900] text-[22px] pointer-events-none">
                  currency_rupee
                </span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="1000"
                  className="w-full h-12 pl-11 pr-16 bg-[#eff4ff] rounded-xl font-headline-lg-mobile text-[22px] text-[#0b1c30] font-bold placeholder:text-[#5a4138]/40 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#a33900]/30 focus:outline-none shadow-xs transition-colors"
                />
                <span className="absolute right-3 font-label-md text-[12px] text-[#007230] font-bold bg-[#7cf994] px-2.5 py-0.5 rounded-full">
                  {language === 'mr' ? 'जमा' : 'Paid'}
                </span>
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAmount(500)}
                  className="py-1.5 px-1 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-label-md text-[12px] text-center font-semibold transition-colors"
                >
                  + {formatCurrency(500)}
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(1000)}
                  className="py-1.5 px-1 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-label-md text-[12px] text-center font-semibold transition-colors"
                >
                  + {formatCurrency(1000)}
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(1500)}
                  className="py-1.5 px-1 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-label-md text-[12px] text-center font-semibold transition-colors"
                >
                  + {formatCurrency(1500)}
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(dueAmount)}
                  className="py-1.5 px-1 rounded-xl bg-[#a33900]/10 text-[#a33900] hover:bg-[#a33900]/20 font-label-md text-[12px] font-bold text-center transition-colors"
                >
                  {language === 'mr' ? 'पूर्ण' : 'Full'} ({formatCurrency(dueAmount)})
                </button>
              </div>
            </div>

            {/* Field 3: Payment Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold">
                {t('paymentMethod')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={`py-2 px-1 rounded-xl font-label-md text-[13px] flex flex-col items-center justify-center gap-1 transition-all ${
                    method === 'cash'
                      ? 'bg-[#a33900] text-white font-bold shadow-sm'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>{t('methodCash')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('gpay')}
                  className={`py-2 px-1 rounded-xl font-label-md text-[13px] flex flex-col items-center justify-center gap-1 transition-all ${
                    method === 'gpay'
                      ? 'bg-[#a33900] text-white font-bold shadow-sm'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#006e2d]">qr_code_scanner</span>
                  <span>{t('methodGpay')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('bank')}
                  className={`py-2 px-1 rounded-xl font-label-md text-[13px] flex flex-col items-center justify-center gap-1 transition-all ${
                    method === 'bank'
                      ? 'bg-[#a33900] text-white font-bold shadow-sm'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#8d4b00]">account_balance</span>
                  <span>{t('methodBank')}</span>
                </button>
              </div>
            </div>

            {/* Field 4: Note */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold">
                {t('receiptNote')}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[#5a4138] text-[20px] pointer-events-none">
                  edit_note
                </span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    language === 'mr'
                      ? 'उदा. सप्टेंबर ॲडव्हान्स, रोख पावती'
                      : 'e.g. September advance, cash receipt'
                  }
                  className="w-full h-12 pl-11 pr-4 bg-[#eff4ff] rounded-xl font-body-md text-[14px] text-[#0b1c30] placeholder:text-[#5a4138]/50 focus:bg-[#ffffff] focus:outline-none shadow-xs transition-colors"
                />
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#a33900] text-white font-headline-sm text-[16px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#a33900]/25 hover:opacity-95 active:scale-[0.99] transition-all"
              >
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                <span>
                  {paymentToEdit
                    ? (language === 'mr' ? 'बदल जतन करा (अद्ययावत)' : 'Update Payment')
                    : t('savePaymentBtn')}
                </span>
              </button>

              {paymentToEdit && onDeletePayment && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        language === 'mr'
                          ? 'ही पेमेंट नोंद कायमची काढून टाकायची आहे का?'
                          : 'Delete this payment record permanently?'
                      )
                    ) {
                      onDeletePayment(paymentToEdit.id);
                      onClose();
                    }
                  }}
                  className="w-full h-11 rounded-xl bg-[#ffdad6] text-[#93000a] font-label-lg text-[14px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#ffdad6]/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>{language === 'mr' ? 'ही पेमेंट नोंद हटवा' : 'Delete Payment'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 text-center font-label-md text-[13px] text-[#5a4138] hover:text-[#0b1c30] transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
