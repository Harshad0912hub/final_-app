import React, { useState } from 'react';
import { Customer, PaymentRecord, SelectedExtra } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { generateSingleInvoicePDF } from '../utils/pdfGenerator';

interface WhatsAppInvoicePreviewProps {
  customer: Customer;
  totalTiffins: number;
  totalBill: number;
  paidAmount: number;
  dueAmount: number;
  monthStr: string;
  payments?: PaymentRecord[];
  totalLeaveDays?: number;
  leaveDateKeys?: string[];
  noteEntries?: { dateKey: string; session: 'morning' | 'evening'; price: number; label: string; extras?: SelectedExtra[] }[];
  onBack: () => void;
}

export const WhatsAppInvoicePreview: React.FC<WhatsAppInvoicePreviewProps> = ({
  customer,
  totalTiffins,
  totalBill,
  paidAmount,
  dueAmount,
  monthStr,
  payments = [],
  totalLeaveDays = 0,
  leaveDateKeys = [],
  noteEntries = [],
  onBack,
}) => {
  const { language, t, formatNum, formatCurrency } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const dietLabel =
    customer.dietType === 'non-veg'
      ? (language === 'mr' ? 'मांसाहारी' : 'Non-Veg')
      : (language === 'mr' ? 'शाकाहारी' : 'Pure Veg');

  const monthNamesMr = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatLeaveDateKey = (key: string): string => {
    const [, m, d] = key.split('-').map(Number);
    const months = language === 'mr' ? monthNamesMr : monthNamesEn;
    return `${Number(d)} ${months[m - 1] || ''}`.trim();
  };

  const leaveDatesStr = leaveDateKeys.map(formatLeaveDateKey).join(', ');
  const leaveLineMr =
    totalLeaveDays > 0
      ? `सुट्टीचे दिवस: ${formatNum(totalLeaveDays)}${leaveDatesStr ? ` (${leaveDatesStr})` : ''} - बिल आकारले नाही\n`
      : '';
  const leaveLineEn =
    totalLeaveDays > 0
      ? `Leave Days: ${formatNum(totalLeaveDays)}${leaveDatesStr ? ` (${leaveDatesStr})` : ''} - not charged\n`
      : '';

  const formatExtrasForText = (extras?: SelectedExtra[]) =>
    extras && extras.length > 0 ? extras.map((ex) => `${ex.name} (+₹${ex.price})`).join(', ') : '';

  const noteLinesMr =
    noteEntries.length > 0
      ? `\nविशेष नोंदी:\n${noteEntries
          .map((e) => {
            const extrasText = formatExtrasForText(e.extras);
            const detail = [extrasText, e.label].filter(Boolean).join(' · ');
            return `- ${formatLeaveDateKey(e.dateKey)} (${e.session === 'morning' ? 'सकाळ' : 'संध्याकाळ'}, ₹${e.price})${detail ? `: ${detail}` : ''}`;
          })
          .join('\n')}\n`
      : '';
  const noteLinesEn =
    noteEntries.length > 0
      ? `\nSpecial Notes:\n${noteEntries
          .map((e) => {
            const extrasText = formatExtrasForText(e.extras);
            const detail = [extrasText, e.label].filter(Boolean).join(' · ');
            return `- ${formatLeaveDateKey(e.dateKey)} (${e.session === 'morning' ? 'Morning' : 'Evening'}, ₹${e.price})${detail ? `: ${detail}` : ''}`;
          })
          .join('\n')}\n`
      : '';

  const defaultInvoiceText =
    language === 'mr'
      ? `श्रावणी टिफीन सेंटर
मो. 9823784142

${customer.name} — ${monthStr} (${dietLabel})

एकुण टिफीन: ${formatNum(totalTiffins)}
एकुण रक्कम: ${formatCurrency(totalBill)}
${leaveLineMr}ऍडव्हान्स पेमेंट: ${formatCurrency(paidAmount)}
उर्वरित रक्कम: ${formatCurrency(dueAmount)}
${noteLinesMr}
धन्यवाद!`
      : `Shravani Tiffin Center
Mob. 9823784142

${customer.name} — ${monthStr} (${dietLabel})

Total Tiffins: ${formatNum(totalTiffins)}
Total Amount: ${formatCurrency(totalBill)}
${leaveLineEn}Advance Paid: ${formatCurrency(paidAmount)}
Balance Due: ${formatCurrency(dueAmount)}
${noteLinesEn}
Thank you!`;

  const [invoiceText, setInvoiceText] = useState(defaultInvoiceText);
  const [editText, setEditText] = useState(defaultInvoiceText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invoiceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(language === 'mr' ? 'मजकूर कॉपी केला' : 'Text copied to clipboard');
    }
  };

  const handleVerify = () => {
    setVerified(true);
    setTimeout(() => setVerified(false), 2500);
  };

  const handleSaveEdit = () => {
    setInvoiceText(editText);
    setIsEditDrawerOpen(false);
  };

  const whatsappUrl = `https://wa.me/91${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(invoiceText)}`;

  return (
    <div className="flex flex-col w-full pb-20 pt-1">
      {/* Screen Navigation & Title Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={language === 'mr' ? 'मागे जा' : 'Back'}
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eff4ff] hover:bg-[#dce9ff] active:scale-95 transition-all text-[#0b1c30]"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-sm text-[18px] text-[#0b1c30] tracking-tight leading-tight font-bold">
              {language === 'mr' ? 'पावती प्रिव्ह्यू' : 'Invoice Preview'}
            </h2>
            <p className="font-body-sm text-[12px] text-[#5a4138] leading-tight mt-0.5">
              {customer.name} • {monthStr}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] font-label-sm text-[11px] font-bold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#006e2d]"></span>
          {language === 'mr' ? 'अंतिम बिल' : 'Final Bill'}
        </span>
      </div>

      {/* Customer Contact Snapshot Card */}
      <div className="mt-2.5 bg-[#ffffff] rounded-2xl p-3.5 shadow-sm border border-[#eff4ff]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center text-[#a33900] font-headline-md text-[20px] font-bold flex-shrink-0 shadow-inner">
              {customer.initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-sm text-[17px] text-[#0b1c30] font-bold truncate">
                  {customer.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#7cf994] text-[#007230] font-label-sm text-[10px] font-bold whitespace-nowrap">
                  {language === 'mr' ? 'नियमित ग्राहक' : 'Active Customer'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[#5a4138] font-body-sm text-[12px]">
                <span className="material-symbols-outlined text-[16px] text-[#006e2d]">chat</span>
                <span>+91 {customer.phone}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleVerify}
            className="px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#a33900] font-label-sm text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform flex-shrink-0 hover:bg-[#dce9ff]"
          >
            <span className="material-symbols-outlined text-[16px]">
              {verified ? 'done' : 'verified'}
            </span>
            <span>
              {verified
                ? (language === 'mr' ? 'तपासले' : 'Verified')
                : (language === 'mr' ? 'तपासा' : 'Verify')}
            </span>
          </button>
        </div>
      </div>

      {/* Tiffin Business Metrics At A Glance */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <div className="bg-[#ffffff] rounded-2xl p-3 flex flex-col justify-between shadow-sm border border-[#eff4ff]">
          <div className="flex items-center justify-between text-[#5a4138]">
            <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">
              {t('totalTiffins')}
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#a33900]">lunch_dining</span>
          </div>
          <div className="mt-1.5">
            <span className="font-headline-md text-[20px] text-[#0b1c30] font-bold">
              {formatNum(totalTiffins)}
            </span>
            <span className="font-body-sm text-[11px] text-[#5a4138] ml-1">
              {language === 'mr' ? 'डबे (दुपार+रात्र)' : 'Tiffins (Day+Night)'}
            </span>
          </div>
        </div>

        <div className="bg-[#ffffff] rounded-2xl p-3 flex flex-col justify-between shadow-sm border border-[#eff4ff]">
          <div className="flex items-center justify-between text-[#5a4138]">
            <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">
              {t('totalBill')}
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#5a4138]">receipt_long</span>
          </div>
          <div className="mt-1.5">
            <span className="font-headline-md text-[20px] text-[#0b1c30] font-bold">
              {formatCurrency(totalBill)}
            </span>
            <span className="font-body-sm text-[11px] text-[#5a4138] ml-1">
              {language === 'mr' ? 'महिना दर' : 'Monthly'}
            </span>
          </div>
        </div>

        <div className="bg-[#ffffff] rounded-2xl p-3 flex flex-col justify-between shadow-sm border border-[#eff4ff]">
          <div className="flex items-center justify-between text-[#006e2d]">
            <span className="font-label-sm text-[10px] uppercase text-[#5a4138] font-bold tracking-wider">
              {t('advancePaid')}
            </span>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div className="mt-1.5">
            <span className="font-headline-md text-[20px] text-[#006e2d] font-bold">
              {formatCurrency(paidAmount)}
            </span>
            <span className="font-body-sm text-[11px] text-[#5a4138] ml-1">
              {language === 'mr' ? 'ऍडव्हान्स' : 'Advance'}
            </span>
          </div>
        </div>

        <div className="bg-[#a33900]/10 rounded-2xl p-3 flex flex-col justify-between shadow-sm border border-[#a33900]/15">
          <div className="flex items-center justify-between text-[#a33900]">
            <span className="font-label-sm text-[10px] uppercase font-bold tracking-wider">
              {t('dueAmount')}
            </span>
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          </div>
          <div className="mt-1.5">
            <span className="font-headline-md text-[20px] text-[#a33900] font-bold">
              {formatCurrency(dueAmount)}
            </span>
            <span className="font-body-sm text-[11px] text-[#a33900] ml-1 font-semibold">
              {language === 'mr' ? 'येणे बाकी' : 'Balance'}
            </span>
          </div>
        </div>
      </div>

      {/* Leave Days Note - so the customer clearly sees why some days weren't charged */}
      {totalLeaveDays > 0 && (
        <div className="mt-2.5 bg-[#ffdcc3]/50 rounded-2xl p-3 flex items-start gap-2 border border-[#ffdcc3]">
          <span className="material-symbols-outlined text-[18px] text-[#8d4b00] shrink-0 mt-0.5">
            flight_takeoff
          </span>
          <div className="min-w-0">
            <p className="font-label-md text-[12px] text-[#6e3900] font-bold">
              {language === 'mr'
                ? `${formatNum(totalLeaveDays)} सुट्टीचे दिवस - बिल आकारले नाही`
                : `${formatNum(totalLeaveDays)} Leave Days - not charged`}
            </p>
            {leaveDatesStr && (
              <p className="font-body-sm text-[11px] text-[#8d4b00] mt-0.5">{leaveDatesStr}</p>
            )}
          </div>
        </div>
      )}

      {/* Special Notes - custom-priced days (extra dabba, extra chapati etc.) */}
      {noteEntries.length > 0 && (
        <div className="mt-2.5 bg-[#eff4ff] rounded-2xl p-3 flex items-start gap-2 border border-[#dce9ff]">
          <span className="material-symbols-outlined text-[18px] text-[#a33900] shrink-0 mt-0.5">
            edit_note
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-label-md text-[12px] text-[#0b1c30] font-bold mb-1">
              {language === 'mr' ? 'विशेष नोंदी' : 'Special Notes'}
            </p>
            <div className="flex flex-col gap-0.5">
              {noteEntries.map((entry, idx) => (
                <p key={idx} className="font-body-sm text-[11px] text-[#5a4138]">
                  {formatLeaveDateKey(entry.dateKey)} ({entry.session === 'morning' ? (language === 'mr' ? 'सकाळ' : 'Morning') : (language === 'mr' ? 'संध्याकाळ' : 'Evening')}, {formatCurrency(entry.price)}):{' '}
                  {[formatExtrasForText(entry.extras), entry.label].filter(Boolean).join(' · ')}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Authentic Chat Canvas & Message Bubble */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="flex items-center gap-1.5 text-[#5a4138]">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span className="font-label-md text-[13px] font-semibold">
              {language === 'mr' ? 'WhatsApp प्रिव्ह्यू' : 'WhatsApp Preview'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 font-label-md text-[12px] px-2.5 py-1 rounded-xl transition-all active:scale-95 ${
              copied
                ? 'bg-[#7cf994] text-[#007230] font-bold'
                : 'bg-[#a33900]/10 text-[#a33900] hover:bg-[#a33900]/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'done' : 'content_copy'}
            </span>
            <span>{copied ? (language === 'mr' ? 'कॉपी झाले! ✓' : 'Copied! ✓') : t('copyMessage')}</span>
          </button>
        </div>

        {/* WhatsApp Simulated Wallpaper */}
        <div className="relative bg-[#EFEAE2] rounded-2xl p-4 shadow-sm overflow-hidden border border-[#d3e4fe]/50">
          {/* Subtle Doodle Canvas Background */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="chatPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M10 10 L15 15 M25 10 L20 15 M15 25 L20 20 M30 30 L35 35"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                  />
                  <circle cx="20" cy="8" r="2" fill="#000" />
                  <circle cx="8" cy="28" r="2" fill="#000" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chatPattern)" />
            </svg>
          </div>

          {/* Outgoing WhatsApp Chat Bubble */}
          <div className="relative max-w-[92%] ml-auto bg-[#E7FFDB] rounded-2xl rounded-tr-xs p-3.5 shadow-sm text-[#111B21]">
            <pre className="font-body-md text-[14px] whitespace-pre-wrap font-sans text-[#111B21] leading-relaxed select-text">
              {invoiceText}
            </pre>

            {/* Message Meta Row */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[#667781]">
              <span className="text-[11px] font-sans leading-none">10:45 AM</span>
              <span
                className="material-symbols-outlined text-[16px] text-[#53BDEB] leading-none"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                done_all
              </span>
            </div>
          </div>

          {/* Trust Tag */}
          <div className="relative mt-3 text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/85 backdrop-blur-xs text-[11px] font-body-sm text-[#54656F] shadow-xs">
              <span className="material-symbols-outlined text-[12px]">lock</span>{' '}
              {language === 'mr' ? 'एंड-टू-एंड एन्क्रिप्टेड मेसेज' : 'End-to-end encrypted message'}
            </span>
          </div>
        </div>
      </div>

      {/* Real Tiffin Kitchen Photo Proof */}
      <div className="mt-3.5 bg-[#ffffff] rounded-2xl p-2.5 shadow-sm flex items-center gap-3 border border-[#eff4ff]">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#eff4ff]">
          <img
            alt="घरगुती स्वच्छ जेवण"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBpcbTXk_-KjmxjcdhTvaUYQsEXYT_xR76iKERf6D4m4lhoD7U8-_pchDFqcgsj5X6v8pXJhQWSutsST9aQCkkybLI5aX99BlhTAHUeEhgPIkkaWtdMWKDLTwJzM5AItzhr2BSKHlc60C3Eun34vJZQYs4jzkJfZ0EYZyfW9ke_DOZ6dYxATogsYMYZ6Mj0P3FsElnXz3eKU5vZDkGIXU9pod4vJHQaLiOHC01Ilxjv_oTPw-duApj"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-headline-sm text-[14px] text-[#0b1c30] font-bold truncate">
            {language === 'mr' ? 'घरगुती, स्वच्छ आणि चवदार जेवण' : 'Home-cooked, fresh & hygienic food'}
          </p>
          <p className="font-body-sm text-[12px] text-[#5a4138] line-clamp-2 leading-tight mt-0.5">
            {language === 'mr'
              ? `सप्टेंबर महिन्याचे सर्व ${formatNum(totalTiffins)} टिफीन वेळेवर पोहोच झाले आहेत. पावती पाठवताना आपण सुट्टीचे दिवस वजा केले आहेत.`
              : `All ${formatNum(totalTiffins)} tiffins for September have been delivered on time. Leaves have been accounted for.`}
          </p>
        </div>
      </div>

      {/* Primary WhatsApp Dispatch CTA */}
      <div className="mt-5 flex flex-col gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-13 py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center gap-2 font-label-lg text-[16px] font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.25-1.92 1.33-.5.08-1.14.12-3.66-.92-3.23-1.34-5.32-4.63-5.48-4.85-.16-.22-1.3-1.74-1.3-3.32 0-1.58.82-2.35 1.12-2.67.29-.32.64-.4.86-.4.21 0 .43.01.62.02.2.01.46-.08.72.55.27.65.92 2.25 1 2.41.08.16.13.36.03.57-.1.21-.15.34-.3.51-.15.18-.32.39-.46.53-.15.15-.31.32-.13.63.18.31.8 1.33 1.73 2.15 1.19 1.06 2.19 1.39 2.5 1.55.31.16.49.13.68-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.1 1.83.86 2.14 1.02.31.16.52.24.6.37.08.13.08.76-.16 1.44z" />
          </svg>
          <span className="tracking-wide">{t('sendDirectWhatsApp')}</span>
        </a>
        <p className="text-center font-body-sm text-[12px] text-[#5a4138]">
          {language === 'mr'
            ? 'बटणावर क्लिक केल्यावर थेट ग्राहकाची WhatsApp चॅट उघडेल.'
            : 'Clicking this button directly opens the customer WhatsApp chat.'}
        </p>

        {/* Secondary Utilities */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              setEditText(invoiceText);
              setIsEditDrawerOpen(true);
            }}
            className="h-11 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center gap-1.5 font-label-md text-[13px] font-semibold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>{t('editText')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              generateSingleInvoicePDF(
                customer,
                monthStr,
                { totalTiffins, totalBill, paidAmount, dueAmount, totalLeaveDays, leaveDateKeys, noteEntries },
                payments
              );
            }}
            className="h-11 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center gap-1.5 font-label-md text-[13px] font-semibold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#a33900]">download</span>
            <span>{language === 'mr' ? 'PDF बिल डाऊनलोड' : 'Download PDF Bill'}</span>
          </button>
        </div>
      </div>

      {/* Edit Drawer Modal */}
      {isEditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-xs"
            onClick={() => setIsEditDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#ffffff] rounded-t-3xl shadow-2xl p-4 pb-8 z-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-[#d3e4fe] rounded-full mx-auto mb-3"></div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline-sm text-[17px] text-[#0b1c30] font-bold">
                {language === 'mr' ? 'पावती संदेश संपादित करा' : 'Edit WhatsApp Invoice Text'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#5a4138]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 bg-[#eff4ff] rounded-xl text-[#0b1c30] font-body-md text-[14px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a33900]/30 resize-none font-sans"
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="w-full mt-3 py-3 rounded-full bg-[#a33900] text-white font-label-lg text-[15px] font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
            >
              {t('saveChanges')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
