import React, { useState } from 'react';
import { Customer, PaymentRecord, DayDelivery, SelectedExtra } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import {
  generateSingleInvoicePDF,
  generateMonthlyCrossCheckPDF,
} from '../utils/pdfGenerator';
import { exportMonthlyCrossCheckCSV } from '../utils/csvExporter';
import { getTodayDateKey } from '../utils/dateUtils';

interface ReportsScreenProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  payments: PaymentRecord[];
  dayDeliveries?: Record<string, DayDelivery>;
  onOpenAdvancePaymentModal: () => void;
  onEditPayment?: (payment: PaymentRecord) => void;
  onDeletePayment?: (paymentId: string) => void;
  onAddCustomer?: () => void;
  onOpenWhatsAppInvoice: (metrics: {
    totalTiffins: number;
    totalBill: number;
    paidAmount: number;
    dueAmount: number;
    totalLeaveDays: number;
    leaveDateKeys: string[];
    noteEntries: { dateKey: string; session: 'morning' | 'evening'; price: number; label: string; extras?: SelectedExtra[] }[];
  }) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  payments,
  dayDeliveries = {},
  onOpenAdvancePaymentModal,
  onEditPayment,
  onDeletePayment,
  onAddCustomer,
  onOpenWhatsAppInvoice,
}) => {
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(1); // September
  const { language, t, formatNum, formatCurrency } = useLanguage();

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  if (!selectedCustomer || customers.length === 0) {
    return (
      <div className="flex flex-col w-full pb-20 pt-4 items-center">
        <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 w-full flex flex-col items-center text-center border border-[#eff4ff]">
          <div className="w-20 h-20 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900] mb-3 shadow-inner">
            <span className="material-symbols-outlined text-[44px]">receipt_long</span>
          </div>
          <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold mb-1.5">
            {language === 'mr' ? 'कोणताही ग्राहक उपलब्ध नाही' : 'No Customers Available'}
          </h4>
          <p className="font-body-md text-[13px] text-[#5a4138] max-w-xs mb-5">
            {language === 'mr'
              ? 'मासिक बिल, ॲडव्हान्स जमा आणि व्हॉट्सॲप पावती पाहण्यासाठी प्रथम ग्राहक जोडा.'
              : 'Add a customer first to view monthly bills, advances, and WhatsApp invoices.'}
          </p>
          {onAddCustomer && (
            <button
              type="button"
              onClick={onAddCustomer}
              className="h-12 px-6 rounded-full bg-[#a33900] text-white font-label-lg text-[14px] font-bold flex items-center gap-2 shadow-md hover:bg-[#8d4b00] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>{t('addFirstCustomer')}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const filteredPayments = payments.filter((p) => p.customerId === selectedCustomer.id);
  const totalPaid = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  // Filter all delivery records for the selected customer from dayDeliveries
  const allDeliveries = (Object.values(dayDeliveries || {}) as DayDelivery[]).filter(Boolean);
  const customerDeliveryEntries = allDeliveries.filter(
    (del) => del.customerId === selectedCustomer.id
  );

  const monthsList = [
    language === 'mr' ? 'ऑगस्ट २०२६' : 'August 2026',
    language === 'mr' ? 'सप्टेंबर २०२६' : 'September 2026',
    language === 'mr' ? 'ऑक्टोबर २०२६' : 'October 2026',
  ];
  const monthPrefixes = ['2026-08', '2026-09', '2026-10'];
  const activeMonthPrefix = monthPrefixes[selectedMonthIndex] || '2026-09';

  // Deduplicate by dateKey if multiple entries exist
  const dateMap: Record<string, DayDelivery> = {};
  customerDeliveryEntries.forEach((del) => {
    const key = del.dateKey || getTodayDateKey();
    dateMap[key] = del;
  });

  // Filter deliveries belonging to the selected month
  const monthlyDeliveries = Object.values(dateMap).filter((del) => {
    const key = del.dateKey || getTodayDateKey();
    return key.startsWith(activeMonthPrefix);
  });

  // Sort dates descending (latest first)
  const deliveryList = monthlyDeliveries.sort((a, b) =>
    (b.dateKey || '').localeCompare(a.dateKey || '')
  );

  let totalTiffins = 0;
  let totalLeaveDays = 0;
  let totalBill = 0;
  const leaveDateKeys: string[] = [];
  const noteEntries: { dateKey: string; session: 'morning' | 'evening'; price: number; label: string; extras?: SelectedExtra[] }[] = [];

  deliveryList.forEach((del) => {
    let dayLeaves = 0;
    if (del.morning?.status === 'delivered') {
      totalTiffins++;
      totalBill += del.morning.price ?? selectedCustomer.ratePerTiffin;
      if (del.morning.label || (del.morning.extras && del.morning.extras.length > 0)) {
        noteEntries.push({ dateKey: del.dateKey, session: 'morning', price: del.morning.price, label: del.morning.label || '', extras: del.morning.extras });
      }
    } else if (del.morning?.status === 'leave') {
      dayLeaves++;
    }

    if (del.evening?.status === 'delivered') {
      totalTiffins++;
      totalBill += del.evening.price ?? selectedCustomer.ratePerTiffin;
      if (del.evening.label || (del.evening.extras && del.evening.extras.length > 0)) {
        noteEntries.push({ dateKey: del.dateKey, session: 'evening', price: del.evening.price, label: del.evening.label || '', extras: del.evening.extras });
      }
    } else if (del.evening?.status === 'leave') {
      dayLeaves++;
    }

    if (dayLeaves > 0) {
      totalLeaveDays++;
      if (del.dateKey) leaveDateKeys.push(del.dateKey);
    }
  });

  // Oldest first, for a readable list in the invoice
  noteEntries.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  // Oldest first, for a readable list in the invoice
  leaveDateKeys.sort();

  const dueAmount = Math.max(0, totalBill - totalPaid);

  return (
    <div className="flex flex-col w-full gap-3.5 pb-20 pt-1">
      {/* Customer Picker Header */}
      <div className="w-full bg-[#ffffff] p-3.5 rounded-2xl shadow-sm flex flex-col gap-2 border border-[#eff4ff] relative">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-[13px] text-[#5a4138] flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-[16px] text-[#a33900]">person_pin</span>
            {t('selectCustomer')}
          </span>
          <span className="font-label-sm text-[11px] px-2.5 py-0.5 rounded-full bg-[#7cf994] text-[#007230] font-bold">
            {t('regularCustomer')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomerPickerOpen(!isCustomerPickerOpen)}
          className="flex items-center justify-between w-full bg-[#eff4ff] p-2.5 rounded-xl text-left active:bg-[#dce9ff] transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900] flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">account_circle</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-[16px] text-[#0b1c30] font-bold truncate">
                {selectedCustomer?.name}
              </span>
              <span className="font-body-sm text-[12px] text-[#5a4138] truncate">
                {language === 'mr' ? `मो. ${selectedCustomer?.phone || ''}` : `Mob. ${selectedCustomer?.phone || ''}`} • {selectedCustomer?.shortAddress}
              </span>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-[20px] text-[#5a4138] flex-shrink-0 transition-transform ${
              isCustomerPickerOpen ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {/* Dropdown overlay */}
        {isCustomerPickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] rounded-2xl shadow-xl border border-[#d3e4fe] z-30 p-2 max-h-56 overflow-y-auto no-scrollbar">
            {customers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectCustomer(c.id);
                  setIsCustomerPickerOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                  c.id === selectedCustomer?.id
                    ? 'bg-[#a33900]/10 text-[#a33900] font-bold'
                    : 'hover:bg-[#eff4ff] text-[#0b1c30]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#ffdbce] text-[#a33900] flex items-center justify-center text-[12px] font-bold">
                    {c.initial}
                  </span>
                  <span className="text-[14px]">{c.name}</span>
                </div>
                <span className="text-[12px] text-[#5a4138]">{c.shortAddress}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Month Switcher Row */}
      <div className="w-full flex items-center justify-between bg-[#ffffff] px-3.5 py-2.5 rounded-2xl shadow-sm border border-[#eff4ff]">
        <button
          type="button"
          aria-label={language === 'mr' ? 'मागील महिना' : 'Previous Month'}
          onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#5a4138] hover:bg-[#eff4ff] active:bg-[#dce9ff] transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">chevron_left</span>
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#a33900]">calendar_month</span>
            <span className="font-headline-md text-[18px] text-[#0b1c30] font-bold leading-tight">
              {monthsList[selectedMonthIndex] || monthsList[1]}
            </span>
          </div>
          <span className="font-label-sm text-[11px] text-[#a33900] font-bold tracking-normal cursor-pointer active:opacity-75">
            {t('currentMonth')}
          </span>
        </div>

        <button
          type="button"
          aria-label={language === 'mr' ? 'पुढील महिना' : 'Next Month'}
          onClick={() => setSelectedMonthIndex(Math.min(2, selectedMonthIndex + 1))}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#5a4138] hover:bg-[#eff4ff] active:bg-[#dce9ff] transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">chevron_right</span>
        </button>
      </div>

      {/* Month-End Cross-Check Audit PDF Card */}
      <div className="w-full bg-[#ffffff] p-3.5 rounded-2xl shadow-sm border border-[#eff4ff] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#a33900]/10 flex items-center justify-center text-[#a33900] flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-headline-sm text-[14.5px] text-[#0b1c30] font-bold">
                  {t('crossCheckTitle')}
                </h4>
                <span className="px-2 py-0.2 rounded-full bg-[#ffdbce] text-[#a33900] text-[10px] font-bold whitespace-nowrap">
                  {language === 'mr' ? 'ताळेबंद' : 'Audit'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-[#5a4138] truncate mt-0.5">
                {t('crossCheckSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            generateMonthlyCrossCheckPDF(
              customers,
              monthsList[selectedMonthIndex],
              payments,
              dayDeliveries
            )
          }
          className="w-full h-11 px-4 rounded-xl bg-[#a33900] hover:bg-[#8d4b00] active:scale-98 text-white font-label-md text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[19px]">download</span>
          <span>{t('downloadAllPdf')}</span>
        </button>
        <button
          type="button"
          onClick={() =>
            exportMonthlyCrossCheckCSV(
              customers,
              monthsList[selectedMonthIndex],
              payments,
              dayDeliveries
            )
          }
          className="w-full h-11 px-4 rounded-xl bg-[#006e2d] hover:bg-[#007230] active:scale-98 text-white font-label-md text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[19px]">table_view</span>
          <span>{language === 'mr' ? 'Excel (CSV) डाउनलोड करा' : 'Download Excel (CSV)'}</span>
        </button>
      </div>

      {/* 2x2 Grid of Summary Tiles */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {/* Tile 1: Total Tiffins */}
        <div className="bg-[#ffffff] p-3.5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-[#eff4ff]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-[12px] text-[#5a4138] font-semibold">{t('totalTiffins')}</span>
            <div className="w-7 h-7 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900]">
              <span className="material-symbols-outlined text-[16px]">lunch_dining</span>
            </div>
          </div>
          <div>
            <span className="font-headline-lg-mobile text-[24px] text-[#0b1c30] font-bold">
              {formatNum(totalTiffins)}
            </span>
            <span className="font-body-sm text-[12px] text-[#5a4138] ml-1">
              {language === 'mr' ? 'डबे' : 'tiffins'}
            </span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#a33900] h-full rounded-full" style={{ width: '86%' }}></div>
          </div>
        </div>

        {/* Tile 2: Leaves */}
        <div className="bg-[#ffffff] p-3.5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-[#eff4ff]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-[12px] text-[#5a4138] font-semibold">{t('totalLeaves')}</span>
            <div className="w-7 h-7 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#5a4138]">
              <span className="material-symbols-outlined text-[16px]">event_busy</span>
            </div>
          </div>
          <div>
            <span className="font-headline-lg-mobile text-[24px] text-[#0b1c30] font-bold">
              {formatNum(totalLeaveDays)}
            </span>
            <span className="font-body-sm text-[12px] text-[#5a4138] ml-1">
              {language === 'mr' ? 'दिवस' : 'days'}
            </span>
          </div>
          <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#8e7166] h-full rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Tile 3: Total Bill */}
        <div className="bg-[#ffffff] p-3.5 rounded-2xl shadow-sm flex flex-col justify-between border border-[#eff4ff]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-[12px] text-[#5a4138] font-semibold">{t('totalAmount')}</span>
            <div className="w-7 h-7 rounded-full bg-[#ffdcc3] flex items-center justify-center text-[#6e3900]">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="font-headline-lg-mobile text-[24px] text-[#a33900] font-bold">
              {formatCurrency(totalBill)}
            </span>
          </div>
          <span className="font-body-sm text-[11px] text-[#5a4138] mt-0.5">
            {language === 'mr' ? 'सप्टेंबर बिल तपशील' : 'Monthly Bill'}
          </span>
        </div>

        {/* Tile 4: Balance Due */}
        <div className="bg-[#ffdad6]/40 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between border border-[#ba1a1a]/15">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-md text-[12px] text-[#ba1a1a] font-bold">{t('pendingAmount')}</span>
            <div className="w-7 h-7 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">pending_actions</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg-mobile text-[22px] text-[#ba1a1a] leading-tight font-bold">
              {formatCurrency(dueAmount)} {language === 'mr' ? 'बाकी' : 'due'}
            </span>
            <span className="font-label-sm text-[11px] text-[#006e2d] font-bold mt-1">
              {t('collected')}: {formatCurrency(totalPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Actions Row: WhatsApp & Single PDF Bill */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          id="whatsapp-share-btn"
          onClick={() =>
            onOpenWhatsAppInvoice({
              totalTiffins,
              totalBill,
              paidAmount: totalPaid,
              dueAmount,
              totalLeaveDays,
              leaveDateKeys,
              noteEntries,
            })
          }
          className="w-full min-h-[50px] bg-[#25D366] hover:bg-[#1EBE5D] active:bg-[#1bb354] text-white p-3 rounded-2xl shadow-sm flex items-center justify-between transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px] text-white">share</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[15px] text-white font-bold leading-tight">
                {t('sendInvoiceWhatsapp')}
              </span>
              <span className="font-body-sm text-[12px] text-white/90">
                {language === 'mr' ? 'हिशोबाचा मेसेज एका क्लिकवर पाठवा' : 'Send monthly statement in one click'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[22px] text-white flex-shrink-0">send</span>
        </button>

        <button
          type="button"
          onClick={() =>
            generateSingleInvoicePDF(
              selectedCustomer,
              monthsList[selectedMonthIndex],
              {
                totalTiffins,
                totalBill,
                paidAmount: totalPaid,
                dueAmount,
                totalLeaveDays,
                leaveDateKeys,
                noteEntries,
              },
              filteredPayments
            )
          }
          className="w-full min-h-[46px] bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] p-3 rounded-2xl shadow-xs flex items-center justify-between border border-[#ffdbce]/60 transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900] flex-shrink-0">
              <span className="material-symbols-outlined text-[19px]">picture_as_pdf</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[14px] text-[#0b1c30] font-bold leading-tight">
                {language === 'mr' ? `${selectedCustomer.name} यांचे PDF बिल` : `Download ${selectedCustomer.name} PDF Bill`}
              </span>
              <span className="font-body-sm text-[11px] text-[#5a4138]">
                {language === 'mr' ? 'छापील किंवा सेव्ह करण्यासाठी PDF फाईल' : 'Download official customer PDF invoice'}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-[#a33900] flex-shrink-0">download</span>
        </button>
      </div>

      {/* Payment Ledger Section */}
      <div className="w-full bg-[#ffffff] p-3.5 rounded-2xl shadow-sm flex flex-col gap-2.5 border border-[#eff4ff]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#006e2d]">payments</span>
            <span className="font-headline-sm text-[16px] text-[#0b1c30] font-bold">
              {t('paymentLedger')}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAdvancePaymentModal}
            className="bg-[#a33900]/10 text-[#a33900] hover:bg-[#a33900]/20 active:bg-[#a33900]/25 px-3 py-1 rounded-full font-label-md text-[12px] font-bold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>{t('addAdvance')}</span>
          </button>
        </div>

        {/* Payments List */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredPayments.length === 0 ? (
            <div className="py-4 text-center text-[12px] text-[#5a4138]">
              {language === 'mr' ? 'अद्याप कोणतीही पेमेंट नोंद नाही.' : 'No payment records yet.'}
            </div>
          ) : (
            filteredPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-xl border border-[#e5eeff] hover:border-[#a33900]/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#7cf994] text-[#007230] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {p.method === 'gpay' ? 'account_balance_wallet' : p.method === 'bank' ? 'account_balance' : 'local_atm'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-lg text-[13px] text-[#0b1c30] font-bold leading-tight truncate">
                      {language === 'mr' ? p.title : p.title.replace('अग्रिम जमा (GPay)', 'Advance (GPay)').replace('हिशोब जमा (रोकड)', 'Payment (Cash)')}
                    </span>
                    <span className="font-body-sm text-[11px] text-[#5a4138]">{p.dateStr}</span>
                    {p.note && (
                      <span className="font-body-sm text-[11px] text-[#5a4138]/80 italic truncate">{p.note}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-label-lg text-[14px] text-[#006e2d] font-bold">
                      + {formatCurrency(p.amount)}
                    </span>
                    <span className="font-label-sm text-[10px] text-[#006e2d] font-semibold">{t('paidLabel')}</span>
                  </div>
                  <div className="flex items-center gap-0.5 ml-1">
                    {onEditPayment && (
                      <button
                        type="button"
                        onClick={() => onEditPayment(p)}
                        title={language === 'mr' ? 'रक्कम / नोंद संपादित करा' : 'Edit Payment'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a4138] hover:text-[#a33900] hover:bg-[#a33900]/10 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    )}
                    {onDeletePayment && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              language === 'mr'
                                ? `₹${p.amount} ची ही पेमेंट नोंद कायमची हटवायची आहे का?`
                                : `Are you sure you want to delete this payment of ₹${p.amount}?`
                            )
                          ) {
                            onDeletePayment(p.id);
                          }
                        }}
                        title={language === 'mr' ? 'पेमेंट नोंद हटवा' : 'Delete Payment'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5a4138] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/60 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total Paid Badge */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-body-sm text-[12px] text-[#5a4138]">
            {language === 'mr' ? 'मासिक पावती नोंदणी' : 'Monthly Receipts'}
          </span>
          <span className="font-label-md text-[12px] bg-[#7cf994] text-[#007230] px-3 py-0.5 rounded-full font-bold">
            {t('collected')}: {formatCurrency(totalPaid)}
          </span>
        </div>
      </div>

      {/* Day-by-Day Breakdown */}
      <div className="w-full bg-[#ffffff] p-3.5 rounded-2xl shadow-sm flex flex-col gap-2.5 border border-[#eff4ff]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-[#a33900]">view_timeline</span>
              <span className="font-headline-sm text-[16px] text-[#0b1c30] font-bold">
                {t('dayBreakdown')} ({monthsList[selectedMonthIndex]})
              </span>
            </div>
          </div>

          {/* Quick Status Legend */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006e2d]"></span>
              <span className="font-body-sm text-[11px] text-[#5a4138]">{t('deliveredMeal')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8e7166]"></span>
              <span className="font-body-sm text-[11px] text-[#5a4138]">{t('leaveCancelled')}</span>
            </div>
          </div>
        </div>

        {/* Day Rows Stack */}
        {deliveryList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center bg-[#eff4ff]/60 rounded-xl border border-dashed border-[#cbdbf5]">
            <span className="material-symbols-outlined text-[32px] text-[#5a4138] mb-1.5 opacity-60">
              event_busy
            </span>
            <p className="font-label-lg text-[13px] text-[#0b1c30] font-bold">
              {language === 'mr' ? 'कोणतीही डबा नोंद उपलब्ध नाही' : 'No Delivery Records Yet'}
            </p>
            <p className="font-body-sm text-[12px] text-[#5a4138] max-w-xs mt-0.5">
              {language === 'mr'
                ? "'आजचे डबे' टॅबमधून आजचे डबे नोंदवा, येथे आपोआप अचूक हिशोब दिसेल."
                : "Mark deliveries from 'Today's Tiffins' tab to see real live attendance and bills here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            {deliveryList.map((dayItem, idx) => {
              const dateObj = dayItem.dateKey ? new Date(dayItem.dateKey) : new Date();
              const dayTiffins =
                (dayItem.morning?.status === 'delivered' ? 1 : 0) +
                (dayItem.evening?.status === 'delivered' ? 1 : 0);

              const formattedDateStr = !isNaN(dateObj.getTime())
                ? `${dateObj.getDate()} ${
                    language === 'mr'
                      ? ['जाने', 'फेब्रु', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टें', 'ऑक्टो', 'नोव्हे', 'डिसें'][dateObj.getMonth()]
                      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dateObj.getMonth()]
                  } (${
                    language === 'mr'
                      ? ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()]
                      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()]
                  })`
                : dayItem.dateKey;

              const isSunday = !isNaN(dateObj.getTime()) && dateObj.getDay() === 0;

              const formatSessionNote = (icon: string, rec: typeof dayItem.morning) => {
                if (rec?.status !== 'delivered') return null;
                const extrasText =
                  rec.extras && rec.extras.length > 0
                    ? rec.extras.map((ex) => `${ex.name} (+₹${ex.price})`).join(', ')
                    : '';
                if (!extrasText && !rec.label) return null;
                return `${icon} ${[extrasText, rec.label].filter(Boolean).join(' · ')}`;
              };

              const dayNotes = [
                formatSessionNote('🌅', dayItem.morning),
                formatSessionNote('🌙', dayItem.evening),
              ].filter(Boolean);

              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl border transition-colors ${
                    isSunday
                      ? 'bg-[#eff4ff]/70 border-dashed border-[#cbdbf5]'
                      : 'bg-[#eff4ff] border-[#e5eeff] hover:bg-[#dce9ff]'
                  }`}
                >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-lg text-[13px] text-[#0b1c30] font-semibold">
                      {formattedDateStr}
                    </span>
                    <span className="font-body-sm text-[11px] text-[#5a4138]">
                      {isSunday && dayTiffins === 0
                        ? t('sundayWeeklyOff')
                        : `${formatNum(dayTiffins)} ${language === 'mr' ? 'डबे' : 'tiffins'}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Morning pill */}
                    <span
                      className={`font-label-sm text-[10px] px-2 py-1 rounded-full flex items-center gap-0.5 font-bold ${
                        dayItem.morning?.status === 'delivered'
                          ? dayItem.morning.dietType === 'non-veg'
                            ? 'bg-[#ffcdd2] text-[#b71c1c]'
                            : 'bg-[#7cf994] text-[#007230]'
                          : dayItem.morning?.status === 'leave'
                          ? 'bg-[#e5eeff] text-[#5a4138]'
                          : 'bg-[#ffeedd] text-[#8d4b00]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {dayItem.morning?.status === 'delivered'
                          ? 'wb_sunny'
                          : dayItem.morning?.status === 'leave'
                          ? 'block'
                          : 'schedule'}
                      </span>
                      <span>
                        {dayItem.morning?.status === 'delivered'
                          ? `${language === 'mr' ? 'सकाळ' : 'Morning'} ₹${dayItem.morning.price} ${
                              dayItem.morning.dietType === 'non-veg'
                                ? language === 'mr'
                                  ? '(नॉन-व्हेज)'
                                  : '(Non-Veg)'
                                : language === 'mr'
                                ? '(व्हेज)'
                                : '(Veg)'
                            }`
                          : dayItem.morning?.status === 'leave'
                          ? language === 'mr'
                            ? 'सकाळ (सुट्टी)'
                            : 'Morning Leave'
                          : language === 'mr'
                          ? 'सकाळ प्रलंबित'
                          : 'Morning Pending'}
                      </span>
                    </span>

                    {/* Evening pill */}
                    <span
                      className={`font-label-sm text-[10px] px-2 py-1 rounded-full flex items-center gap-0.5 font-bold ${
                        dayItem.evening?.status === 'delivered'
                          ? dayItem.evening.dietType === 'non-veg'
                            ? 'bg-[#ffcdd2] text-[#b71c1c]'
                            : 'bg-[#7cf994] text-[#007230]'
                          : dayItem.evening?.status === 'leave'
                          ? 'bg-[#e5eeff] text-[#5a4138]'
                          : 'bg-[#ffeedd] text-[#8d4b00]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {dayItem.evening?.status === 'delivered'
                          ? 'nights_stay'
                          : dayItem.evening?.status === 'leave'
                          ? 'block'
                          : 'schedule'}
                      </span>
                      <span>
                        {dayItem.evening?.status === 'delivered'
                          ? `${language === 'mr' ? 'संध्याकाळ' : 'Evening'} ₹${dayItem.evening.price} ${
                              dayItem.evening.dietType === 'non-veg'
                                ? language === 'mr'
                                  ? '(नॉन-व्हेज)'
                                  : '(Non-Veg)'
                                : language === 'mr'
                                ? '(व्हेज)'
                                : '(Veg)'
                            }`
                          : dayItem.evening?.status === 'leave'
                          ? language === 'mr'
                            ? 'सं. (सुट्टी)'
                            : 'Evening Leave'
                          : language === 'mr'
                          ? 'सं. प्रलंबित'
                          : 'Evening Pending'}
                      </span>
                    </span>
                  </div>
                </div>
                {dayNotes.length > 0 && (
                  <div className="flex flex-col gap-0.5 pl-0.5">
                    {dayNotes.map((note, noteIdx) => (
                      <span key={noteIdx} className="font-body-sm text-[11px] text-[#8d4b00] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">edit_note</span>
                        {note}
                      </span>
                    ))}
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warm Gujarati/Marathi Home-Cooked Footer note */}
      <div className="p-3 bg-[#eff4ff] rounded-2xl flex items-center justify-center gap-1.5 text-[#5a4138] border border-[#eff4ff]">
        <span className="material-symbols-outlined text-[16px] text-[#a33900]">favorite</span>
        <span className="font-body-sm text-[12px] font-medium">
          {language === 'mr'
            ? 'घरचा स्वाद, नियमित हिशोब आणि खात्रीशीर सेवा!'
            : 'Homemade taste, transparent billing, and reliable service!'}
        </span>
      </div>
    </div>
  );
};
