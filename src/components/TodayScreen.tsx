import React, { useState } from 'react';
import { Customer, DayDelivery, Holiday } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { formatDateKey, getTodayDateKey, findUpcomingLeaveRange } from '../utils/dateUtils';

// Helper: build the WhatsApp holiday-announcement message for one customer
// A generic (not per-customer) holiday announcement, meant to be copied or
// shared once - e.g. into a WhatsApp broadcast list, group, or status -
// rather than sent to each customer one at a time.
function buildHolidayBroadcastMsg(
  reason: string,
  fromStr: string,
  toStr: string,
  sameDay: boolean,
  language: string
): string {
  if (language === 'mr') {
    return sameDay
      ? `नमस्कार! 🙏\n*श्रावणी टिफीन सेंटर*\n\n${reason} निमित्त आज (${fromStr}) आमचे टिफीन सेंटर बंद राहील.\nगैरसोयीबद्दल दिलगीर आहोत. धन्यवाद! 🙏`
      : `नमस्कार! 🙏\n*श्रावणी टिफीन सेंटर*\n\n${reason} निमित्त ${fromStr} ते ${toStr} या कालावधीत आमचे टिफीन सेंटर बंद राहील.\nगैरसोयीबद्दल दिलगीर आहोत. धन्यवाद! 🙏`;
  }
  return sameDay
    ? `Hello! 🙏\n*Shravani Tiffin Center*\n\nDue to ${reason}, our tiffin center will remain closed today (${fromStr}).\nSorry for the inconvenience. Thank you! 🙏`
    : `Hello! 🙏\n*Shravani Tiffin Center*\n\nDue to ${reason}, our tiffin center will remain closed from ${fromStr} to ${toStr}.\nSorry for the inconvenience. Thank you! 🙏`;
}

// Helper: build per-customer WhatsApp delivery message
function buildWhatsAppMsg(custName: string, session: 'morning' | 'evening', dateFull: string, price: number, language: string): string {
  const sessionLabel = language === 'mr' ? (session === 'morning' ? 'सकाळचा' : 'रात्रीचा') : (session === 'morning' ? 'Morning' : 'Evening');
  if (language === 'mr') {
    return `नमस्कार ${custName}जी! 🙏\n*श्रावणी टिफीन सेंटर*\n\n${dateFull} - ${sessionLabel} डबा दिला गेला.\nरक्कम: ₹${price}\n\nधन्यवाद! 😊`;
  }
  return `Hello ${custName}! 🙏\n*Shravani Tiffin Center*\n\n${dateFull} - ${sessionLabel} tiffin delivered.\nAmount: ₹${price}\n\nThank you! 😊`;
}

interface TodayScreenProps {
  customers: Customer[];
  dayDeliveries: Record<string, DayDelivery>;
  onOpenPricePicker: (customer: Customer, session: 'morning' | 'evening', dateKey: string, formattedDateStr?: string) => void;
  onAddFirstCustomer: () => void;
  onBatchMarkSession?: (session: 'morning' | 'evening', dateKey: string) => void;
  holidays?: Holiday[];
  onDeclareHoliday?: (fromDateKey: string, toDateKey: string, reason: string) => void;
  onEditHoliday?: (holidayId: string, fromDateKey: string, toDateKey: string, reason: string) => void;
  onCancelHoliday?: (holidayId: string) => void;
  onOpenEditModal?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  customers,
  dayDeliveries,
  onOpenPricePicker,
  onAddFirstCustomer,
  onBatchMarkSession,
  holidays = [],
  onDeclareHoliday,
  onEditHoliday,
  onCancelHoliday,
  onOpenEditModal,
  onDeleteCustomer,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'leave'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeMenuCustomer, setActiveMenuCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [holidayModal, setHolidayModal] = useState<{
    mode: 'declare' | 'edit';
    holidayId?: string;
    from: string;
    to: string;
    reason: string;
  } | null>(null);
  const [holidayToCancel, setHolidayToCancel] = useState<Holiday | null>(null);
  const [broadcastHoliday, setBroadcastHoliday] = useState<Holiday | null>(null);
  const [broadcastCopied, setBroadcastCopied] = useState(false);
  const [showMenuCard, setShowMenuCard] = useState(false);
  const [todaysMenu, setTodaysMenu] = useState<{ morning: string; evening: string }>(() => {
    try {
      const saved = localStorage.getItem('shravani_todays_menu');
      return saved ? JSON.parse(saved) : { morning: '', evening: '' };
    } catch { return { morning: '', evening: '' }; }
  });
  const { language, t, formatNum, formatCurrency, formatDate } = useLanguage();

  const saveMenu = (updated: { morning: string; evening: string }) => {
    setTodaysMenu(updated);
    localStorage.setItem('shravani_todays_menu', JSON.stringify(updated));
  };

  const { dayName, dateFull } = formatDate(currentDate);
  const dateKey = formatDateKey(currentDate);

  const parseDateKeyToDate = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatHolidayRange = (fromKey: string, toKey: string): string => {
    const fromStr = formatDate(parseDateKeyToDate(fromKey)).dateFull;
    if (fromKey === toKey) return fromStr;
    const toStr = formatDate(parseDateKeyToDate(toKey)).dateFull;
    return `${fromStr} ${language === 'mr' ? 'ते' : 'to'} ${toStr}`;
  };

  const holidayForViewedDay = holidays.find((h) => dateKey >= h.fromDateKey && dateKey <= h.toDateKey);

  const handlePrevDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleTodayJump = () => {
    setCurrentDate(new Date());
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const parts = e.target.value.split('-');
      if (parts.length === 3) {
        setCurrentDate(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        setShowDatePicker(false);
      }
    }
  };

  // Only consider active customers for daily delivery
  const activeCustomers = customers.filter((c) => c.status === 'active');

  // Upcoming/current leave range per customer (not tied to whichever day is
  // currently being viewed) - shown so a scheduled leave is visible even
  // before it starts, matching the same "On Leave" indicator on Customers.
  const leaveRangeByCustomerId: Record<string, { from: string; to: string } | null> = {};
  activeCustomers.forEach((c) => {
    leaveRangeByCustomerId[c.id] = findUpcomingLeaveRange(c.id, dayDeliveries, c.mealTiming);
  });

  const formatLeaveBadge = (from: string, to: string): string => {
    const fmt = (key: string) => {
      const [, m, d] = key.split('-');
      const monthNamesMr = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months = language === 'mr' ? monthNamesMr : monthNamesEn;
      return `${Number(d)} ${months[Number(m) - 1]}`;
    };
    return from === to ? fmt(from) : `${fmt(from)} - ${fmt(to)}`;
  };

  // Real-time calculation of planned, delivered, leaves, and revenue
  let plannedMorning = 0;
  let plannedEvening = 0;
  let morningDelivered = 0;
  let eveningDelivered = 0;
  let morningLeave = 0;
  let eveningLeave = 0;
  let totalCollected = 0;
  let pendingRevenue = 0;

  // Veg / Non-Veg cooking counters per session
  let morningVeg = 0;
  let morningNonVeg = 0;
  let eveningVeg = 0;
  let eveningNonVeg = 0;

  activeCustomers.forEach((cust) => {
    const morningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'morning';
    const eveningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'night';

    if (morningApplicable) plannedMorning++;
    if (eveningApplicable) plannedEvening++;

    // Count veg/non-veg based on customer default diet (for cooking prep)
    if (morningApplicable) {
      if (cust.dietType === 'non-veg') morningNonVeg++; else morningVeg++;
    }
    if (eveningApplicable) {
      if (cust.dietType === 'non-veg') eveningNonVeg++; else eveningVeg++;
    }

    // Lookup delivery for this specific date
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    const mStatus = rec?.morning?.status || 'pending';
    const eStatus = rec?.evening?.status || 'pending';
    const mPrice = rec?.morning?.price ?? cust.ratePerTiffin;
    const ePrice = rec?.evening?.price ?? cust.ratePerTiffin;

    if (morningApplicable) {
      if (mStatus === 'delivered') {
        morningDelivered++;
        totalCollected += mPrice;
      } else if (mStatus === 'leave') {
        morningLeave++;
      } else {
        pendingRevenue += mPrice;
      }
    }

    if (eveningApplicable) {
      if (eStatus === 'delivered') {
        eveningDelivered++;
        totalCollected += ePrice;
      } else if (eStatus === 'leave') {
        eveningLeave++;
      } else {
        pendingRevenue += ePrice;
      }
    }
  });

  // Pending morning / evening customers (for batch mark)
  const pendingMorningCustomers = activeCustomers.filter((cust) => {
    if (cust.mealTiming !== 'both' && cust.mealTiming !== 'morning') return false;
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    return (rec?.morning?.status || 'pending') === 'pending';
  });
  const pendingEveningCustomers = activeCustomers.filter((cust) => {
    if (cust.mealTiming !== 'both' && cust.mealTiming !== 'night') return false;
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    return (rec?.evening?.status || 'pending') === 'pending';
  });
  const deliveredMorningCustomers = activeCustomers.filter((cust) => {
    if (cust.mealTiming !== 'both' && cust.mealTiming !== 'morning') return false;
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    return rec?.morning?.status === 'delivered';
  });
  const deliveredEveningCustomers = activeCustomers.filter((cust) => {
    if (cust.mealTiming !== 'both' && cust.mealTiming !== 'night') return false;
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    return rec?.evening?.status === 'delivered';
  });

  const plannedCount = plannedMorning + plannedEvening;
  const deliveredTotalTiffins = morningDelivered + eveningDelivered;
  const leaveTotalTiffins = morningLeave + eveningLeave;
  const pendingTotalTiffins = Math.max(0, plannedCount - deliveredTotalTiffins - leaveTotalTiffins);
  const todayTotalRevenue = totalCollected + pendingRevenue;

  // Filter cards based on applicable meal sessions
  const filteredCustomers = activeCustomers.filter((cust) => {
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    const morningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'morning';
    const eveningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'night';

    const mStatus = rec?.morning?.status || 'pending';
    const eStatus = rec?.evening?.status || 'pending';

    const mDone = !morningApplicable || mStatus === 'delivered' || mStatus === 'leave';
    const eDone = !eveningApplicable || eStatus === 'delivered' || eStatus === 'leave';
    const isDone = mDone && eDone;

    const hasPending = (morningApplicable && mStatus === 'pending') || (eveningApplicable && eStatus === 'pending');

    if (filter === 'pending') return hasPending;
    if (filter === 'done') return isDone;
    if (filter === 'leave') return !!leaveRangeByCustomerId[cust.id];
    return true;
  });

  const pendingCount = activeCustomers.filter((cust) => {
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    const morningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'morning';
    const eveningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'night';
    const mStatus = rec?.morning?.status || 'pending';
    const eStatus = rec?.evening?.status || 'pending';
    return (morningApplicable && mStatus === 'pending') || (eveningApplicable && eStatus === 'pending');
  }).length;

  const doneCount = activeCustomers.filter((cust) => {
    const rec = dayDeliveries[`${dateKey}_${cust.id}`] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
    const morningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'morning';
    const eveningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'night';
    const mStatus = rec?.morning?.status || 'pending';
    const eStatus = rec?.evening?.status || 'pending';
    return (!morningApplicable || mStatus === 'delivered' || mStatus === 'leave') &&
           (!eveningApplicable || eStatus === 'delivered' || eStatus === 'leave');
  }).length;

  const leaveCount = activeCustomers.filter((cust) => !!leaveRangeByCustomerId[cust.id]).length;

  return (
    <div className="flex flex-col w-full pb-20 pt-1">
      {/* 1. Date Switcher Row */}
      <section className="w-full mb-3">
        <div className="bg-[#ffffff] rounded-2xl shadow-sm p-3 flex items-center justify-between border border-[#eff4ff]">
          <button
            type="button"
            aria-label={language === 'mr' ? 'मागील दिवस' : 'Previous Day'}
            onClick={handlePrevDay}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-[#a33900]">calendar_today</span>
              <span className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">{dayName}</span>
            </div>
            <span className="font-body-sm text-[12px] text-[#5a4138] font-normal">{dateFull}</span>
            <button
              type="button"
              onClick={handleTodayJump}
              className="font-label-sm text-[11px] text-[#a33900] underline underline-offset-2 mt-0.5 active:opacity-70 font-semibold"
            >
              {language === 'mr' ? 'आज वर जा' : 'Jump to Today'}
            </button>
          </div>

          <button
            type="button"
            aria-label={language === 'mr' ? 'पुढील दिवस' : 'Next Day'}
            onClick={handleNextDay}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </section>

      {/* 2. Two Stat Cards (2-Column Grid) */}
      <section className="grid grid-cols-2 gap-2 mb-3">
        {/* Stat 1: Total Tiffins */}
        <div className="bg-[#ffffff] rounded-2xl shadow-sm p-3 flex flex-col justify-between relative overflow-hidden border border-[#eff4ff]">
          <div className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full bg-[#a33900]/5 flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[36px] text-[#a33900]/20">lunch_dining</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[#5a4138] mb-1">
              <span className="material-symbols-outlined text-[16px] text-[#a33900]">soup_kitchen</span>
              <p className="font-label-sm text-[11px] font-semibold">{t('totalTiffins')}</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="font-headline-lg-mobile text-[26px] text-[#0b1c30] tracking-tight font-bold">
                {formatNum(plannedCount)}
              </h2>
              <span className="font-body-sm text-[12px] text-[#006e2d] font-semibold">{t('planned')}</span>
            </div>
          </div>
          <div className="pt-2 mt-2 bg-[#eff4ff] rounded-lg px-2 py-1 flex items-center justify-between text-[#5a4138]">
            <span className="font-label-sm text-[11px]">
              {t('morning')}: {formatNum(morningDelivered)}/{formatNum(plannedMorning)}
            </span>
            <span className="text-[#e2bfb2] font-body-sm">•</span>
            <span className="font-label-sm text-[11px]">
              {t('evening')}: {formatNum(eveningDelivered)}/{formatNum(plannedEvening)}
            </span>
          </div>
        </div>

        {/* Stat 2: Total Revenue */}
        <div className="bg-[#ffffff] rounded-2xl shadow-sm p-3 flex flex-col justify-between relative overflow-hidden border border-[#eff4ff]">
          <div className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full bg-[#006e2d]/5 flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[36px] text-[#006e2d]/20">payments</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[#5a4138] mb-1">
              <span className="material-symbols-outlined text-[16px] text-[#006e2d]">account_balance_wallet</span>
              <p className="font-label-sm text-[11px] font-semibold">
                {language === 'mr' ? 'आजची रक्कम' : "Today's Amount"}
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="font-headline-lg-mobile text-[26px] text-[#0b1c30] tracking-tight font-bold">
                {formatCurrency(todayTotalRevenue)}
              </h2>
              {todayTotalRevenue > 0 && (
                <span className="bg-[#7cf994] text-[#007230] rounded-full px-1.5 py-0.5 font-label-sm text-[10px] font-bold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">trending_up</span>
                  {totalCollected > 0
                    ? `${Math.min(100, Math.round((totalCollected / todayTotalRevenue) * 100))}%`
                    : t('planned')}
                </span>
              )}
            </div>
          </div>
          <div className="pt-2 mt-2 bg-[#7cf994]/30 rounded-lg px-2 py-1 flex items-center justify-between text-[#007230]">
            <span className="font-label-sm text-[11px]">{t('collected')}: {formatCurrency(totalCollected)}</span>
            <span className="font-label-sm text-[11px] font-bold">{t('pendingAmount')}: {formatCurrency(pendingRevenue)}</span>
          </div>
        </div>
      </section>

      {/* Cooking Prep Counter Strip */}
      {activeCustomers.length > 0 && (
        <section className="w-full mb-3">
          <div className="bg-gradient-to-r from-[#1a2f1a] to-[#2a1a10] rounded-2xl p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="material-symbols-outlined text-[16px] text-[#7cf994]">restaurant</span>
              <span className="font-label-md text-[12px] font-bold text-white">
                {language === 'mr' ? 'आजचा स्वयंपाक अंदाज' : "Today's Cooking Prep"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Morning */}
              <div className="bg-white/10 rounded-xl px-2.5 py-2">
                <p className="font-label-sm text-[10px] text-white/60 mb-1">
                  {language === 'mr' ? '🌅 सकाळ' : '🌅 Morning'} ({formatNum(plannedMorning - morningLeave)} {language === 'mr' ? 'डबे' : 'tiffins'})
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7cf994] inline-block"></span>
                    <span className="font-label-md text-[12px] font-bold text-white">{formatNum(morningVeg)}</span>
                    <span className="font-label-sm text-[10px] text-white/70">{language === 'mr' ? 'व्हेज' : 'Veg'}</span>
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff8a80] inline-block"></span>
                    <span className="font-label-md text-[12px] font-bold text-white">{formatNum(morningNonVeg)}</span>
                    <span className="font-label-sm text-[10px] text-white/70">{language === 'mr' ? 'नॉन-व्हेज' : 'Non-Veg'}</span>
                  </span>
                </div>
              </div>
              {/* Evening */}
              <div className="bg-white/10 rounded-xl px-2.5 py-2">
                <p className="font-label-sm text-[10px] text-white/60 mb-1">
                  {language === 'mr' ? '🌙 रात्र' : '🌙 Evening'} ({formatNum(plannedEvening - eveningLeave)} {language === 'mr' ? 'डबे' : 'tiffins'})
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7cf994] inline-block"></span>
                    <span className="font-label-md text-[12px] font-bold text-white">{formatNum(eveningVeg)}</span>
                    <span className="font-label-sm text-[10px] text-white/70">{language === 'mr' ? 'व्हेज' : 'Veg'}</span>
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff8a80] inline-block"></span>
                    <span className="font-label-md text-[12px] font-bold text-white">{formatNum(eveningNonVeg)}</span>
                    <span className="font-label-sm text-[10px] text-white/70">{language === 'mr' ? 'नॉन-व्हेज' : 'Non-Veg'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Batch Mark Session Buttons */}
      {activeCustomers.length > 0 && (
        <section className="w-full mb-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={pendingMorningCustomers.length === 0 && deliveredMorningCustomers.length === 0}
              onClick={() => onBatchMarkSession?.('morning', dateKey)}
              className={`h-11 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-[12px] font-bold shadow-sm active:scale-95 transition-all ${
                pendingMorningCustomers.length > 0
                  ? 'bg-[#006e2d] text-white hover:bg-[#007230]'
                  : deliveredMorningCustomers.length > 0
                  ? 'bg-white text-[#006e2d] border-2 border-[#006e2d] hover:bg-[#e8f5e9]'
                  : 'bg-[#e8f5e9] text-[#a5d6a7] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {pendingMorningCustomers.length > 0
                  ? 'done_all'
                  : deliveredMorningCustomers.length > 0
                  ? 'undo'
                  : 'check_circle'}
              </span>
              <span>
                {pendingMorningCustomers.length > 0
                  ? (language === 'mr' ? `सकाळचे सर्व दिले (${pendingMorningCustomers.length})` : `All Morning Done (${pendingMorningCustomers.length})`)
                  : deliveredMorningCustomers.length > 0
                  ? (language === 'mr' ? `सकाळचे पूर्ववत करा (${deliveredMorningCustomers.length})` : `Undo Morning (${deliveredMorningCustomers.length})`)
                  : (language === 'mr' ? 'सकाळचे काही प्रलंबित नाही' : 'Nothing Pending (Morning)')}
              </span>
            </button>
            <button
              type="button"
              disabled={pendingEveningCustomers.length === 0 && deliveredEveningCustomers.length === 0}
              onClick={() => onBatchMarkSession?.('evening', dateKey)}
              className={`h-11 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-[12px] font-bold shadow-sm active:scale-95 transition-all ${
                pendingEveningCustomers.length > 0
                  ? 'bg-[#5c3317] text-white hover:bg-[#4a2a12]'
                  : deliveredEveningCustomers.length > 0
                  ? 'bg-white text-[#5c3317] border-2 border-[#5c3317] hover:bg-[#fbe9e7]'
                  : 'bg-[#fbe9e7] text-[#ffccbc] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {pendingEveningCustomers.length > 0
                  ? 'done_all'
                  : deliveredEveningCustomers.length > 0
                  ? 'undo'
                  : 'check_circle'}
              </span>
              <span>
                {pendingEveningCustomers.length > 0
                  ? (language === 'mr' ? `रात्रीचे सर्व दिले (${pendingEveningCustomers.length})` : `All Evening Done (${pendingEveningCustomers.length})`)
                  : deliveredEveningCustomers.length > 0
                  ? (language === 'mr' ? `रात्रीचे पूर्ववत करा (${deliveredEveningCustomers.length})` : `Undo Evening (${deliveredEveningCustomers.length})`)
                  : (language === 'mr' ? 'रात्रीचे काही प्रलंबित नाही' : 'Nothing Pending (Evening)')}
              </span>
            </button>
          </div>

          {/* Holiday: business-wide closure for a date range (festivals etc.) */}
          {holidayForViewedDay ? (
            <div className="mt-2 w-full rounded-xl border-2 border-[#8d4b00] bg-[#8d4b00]/10 p-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#8d4b00] shrink-0">event_busy</span>
                <div className="min-w-0">
                  <p className="font-label-md text-[12px] font-bold text-[#6e3900] truncate">
                    {holidayForViewedDay.reason}
                  </p>
                  <p className="font-body-sm text-[11px] text-[#8d4b00]">
                    {formatHolidayRange(holidayForViewedDay.fromDateKey, holidayForViewedDay.toDateKey)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setHolidayModal({
                      mode: 'edit',
                      holidayId: holidayForViewedDay.id,
                      from: holidayForViewedDay.fromDateKey,
                      to: holidayForViewedDay.toDateKey,
                      reason: holidayForViewedDay.reason,
                    })
                  }
                  className="h-9 rounded-lg bg-white text-[#6e3900] font-label-sm text-[11px] font-bold border border-[#8d4b00]/40 hover:bg-[#ffdcc3] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  {language === 'mr' ? 'संपादन' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => setHolidayToCancel(holidayForViewedDay)}
                  className="h-9 rounded-lg bg-white text-[#ba1a1a] font-label-sm text-[11px] font-bold border border-[#ba1a1a]/30 hover:bg-[#ffdad6] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                  {language === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastCopied(false);
                    setBroadcastHoliday(holidayForViewedDay);
                  }}
                  className="h-9 rounded-lg bg-[#25D366] text-white font-label-sm text-[11px] font-bold hover:bg-[#1EBE5D] active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">chat</span>
                  WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setHolidayModal({ mode: 'declare', from: dateKey, to: dateKey, reason: '' })
              }
              className="mt-2 w-full h-10 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-[12px] font-bold border-2 border-dashed border-[#8d4b00] text-[#8d4b00] hover:bg-[#8d4b00]/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">event_busy</span>
              <span>{language === 'mr' ? 'सुट्टी जाहीर करा (सण/उत्सव)' : 'Declare Holiday (Festival/Event)'}</span>
            </button>
          )}
        </section>
      )}

      {/* Today's Menu Card */}
      {activeCustomers.length > 0 && (
        <section className="w-full mb-3">
          <div className="bg-[#ffffff] rounded-2xl shadow-sm border border-[#eff4ff] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMenuCard(!showMenuCard)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#eff4ff]/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#a33900]">menu_book</span>
                <span className="font-label-md text-[13px] font-bold text-[#0b1c30]">
                  {language === 'mr' ? 'आजचा मेनू' : "Today's Menu"}
                </span>
                {(todaysMenu.morning || todaysMenu.evening) && (
                  <span className="w-2 h-2 rounded-full bg-[#006e2d] inline-block"></span>
                )}
              </div>
              <span className={`material-symbols-outlined text-[18px] text-[#5a4138] transition-transform ${showMenuCard ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {showMenuCard && (
              <div className="px-3.5 pb-3.5 flex flex-col gap-2.5 border-t border-[#eff4ff]">
                <div className="pt-2.5 grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                      🌅 {language === 'mr' ? 'सकाळचे जेवण' : 'Morning Meal'}
                    </label>
                    <input
                      type="text"
                      value={todaysMenu.morning}
                      onChange={(e) => saveMenu({ ...todaysMenu, morning: e.target.value })}
                      placeholder={language === 'mr' ? 'उदा. वरण भात, भाजी...' : 'e.g. Dal Rice, Sabzi...'}
                      className="w-full rounded-xl bg-[#eff4ff] px-3 py-2 font-body-sm text-[12px] text-[#0b1c30] border border-[#dce9ff] focus:outline-none focus:border-[#a33900] placeholder:text-[#5a4138]/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                      🌙 {language === 'mr' ? 'रात्रीचे जेवण' : 'Evening Meal'}
                    </label>
                    <input
                      type="text"
                      value={todaysMenu.evening}
                      onChange={(e) => saveMenu({ ...todaysMenu, evening: e.target.value })}
                      placeholder={language === 'mr' ? 'उदा. चपाती, आमटी...' : 'e.g. Chapati, Curry...'}
                      className="w-full rounded-xl bg-[#eff4ff] px-3 py-2 font-body-sm text-[12px] text-[#0b1c30] border border-[#dce9ff] focus:outline-none focus:border-[#a33900] placeholder:text-[#5a4138]/40"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const menuText = language === 'mr'
                      ? `🍽️ *श्रावणी टिफीन सेंटर - आजचा मेनू* 🍽️\n\n${dateFull}\n\n🌅 सकाळ: ${todaysMenu.morning || '—'}\n🌙 रात्र: ${todaysMenu.evening || '—'}\n\nताजे व घरगुती जेवण! 😊`
                      : `🍽️ *Shravani Tiffin Center - Today's Menu* 🍽️\n\n${dateFull}\n\n🌅 Morning: ${todaysMenu.morning || '—'}\n🌙 Evening: ${todaysMenu.evening || '—'}\n\nFresh & homemade! 😊`;
                    if (navigator.share) {
                      try {
                        await navigator.share({ text: menuText });
                      } catch {
                        // user cancelled — no action needed
                      }
                    } else {
                      // fallback: open WhatsApp web with pre-filled text
                      window.open(`https://wa.me/?text=${encodeURIComponent(menuText)}`, '_blank');
                    }
                  }}
                  className="w-full h-12 rounded-xl bg-[#25D366] text-white font-label-md text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1ebe5a] active:scale-95 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                  <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[13px] font-bold">
                      {language === 'mr' ? 'मेनू शेअर करा (सर्व ग्राहकांना)' : 'Share Menu (All Customers)'}
                    </span>
                    <span className="text-[10px] opacity-80 mt-0.5">
                      {language === 'mr' ? 'WhatsApp Broadcast निवडा' : 'Pick WhatsApp Broadcast List'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Section Header & Filter Pills */}
      <section className="w-full mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#0b1c30]">checklist</span>
            <h3 className="font-headline-sm text-[17px] text-[#0b1c30] font-bold">{t('customerList')}</h3>
            <span className="bg-[#dce9ff] text-[#0b1c30] font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full">
              {formatNum(activeCustomers.length)}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full font-label-md text-[12px] flex items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
              filter === 'all'
                ? 'bg-[#a33900] text-white shadow-sm font-bold'
                : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>{t('filterAll')} ({formatNum(activeCustomers.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-full font-label-md text-[12px] flex items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
              filter === 'pending'
                ? 'bg-[#a33900] text-white shadow-sm font-bold'
                : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#8d4b00]">schedule</span>
            <span>{t('filterPending')} ({formatNum(pendingCount)})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('done')}
            className={`px-3.5 py-1.5 rounded-full font-label-md text-[12px] flex items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
              filter === 'done'
                ? 'bg-[#a33900] text-white shadow-sm font-bold'
                : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#006e2d]">check_circle</span>
            <span>{t('filterDone')} ({formatNum(doneCount)})</span>
          </button>

          {leaveCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('leave')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-[12px] flex items-center gap-1 whitespace-nowrap transition-transform active:scale-95 ${
                filter === 'leave'
                  ? 'bg-[#a33900] text-white shadow-sm font-bold'
                  : 'bg-[#ffffff] text-[#5a4138] border border-[#eff4ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-[#8d4b00]">flight_takeoff</span>
              <span>{language === 'mr' ? 'सुट्टीवर' : 'On Leave'} ({formatNum(leaveCount)})</span>
            </button>
          )}
        </div>
      </section>

      {/* 4. Customer Cards List or Direct Zero State */}
      {activeCustomers.length === 0 ? (
        <section className="w-full mb-6">
          <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 flex flex-col items-center text-center border border-[#eff4ff]">
            <div className="w-20 h-20 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900] mb-3 shadow-inner">
              <span className="material-symbols-outlined text-[44px]">takeout_dining</span>
            </div>
            <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold mb-1.5">
              {t('noCustomersAddedYet')}
            </h4>
            <p className="font-body-md text-[13px] text-[#5a4138] max-w-xs mb-5">
              {t('noCustomersDesc')}
            </p>
            <button
              type="button"
              onClick={onAddFirstCustomer}
              className="h-12 px-6 rounded-full bg-[#a33900] text-white font-label-lg text-[14px] font-bold flex items-center gap-2 shadow-md hover:bg-[#8d4b00] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>{t('addFirstCustomer')}</span>
            </button>
          </div>
        </section>
      ) : filteredCustomers.length === 0 ? (
        <section className="w-full mb-6">
          <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 flex flex-col items-center text-center border border-[#eff4ff]">
            <span className="material-symbols-outlined text-[36px] text-[#5a4138]/40 mb-2">filter_alt_off</span>
            <p className="font-label-md text-[14px] text-[#5a4138] font-semibold">
              {t('noCustomersInFilter')}
            </p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-3 text-[#a33900] text-[13px] font-bold underline underline-offset-2"
            >
              {t('showAllCustomers')}
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3 mb-6">
        {filteredCustomers.map((cust) => {
          const recKey = `${dateKey}_${cust.id}`;
          const record = dayDeliveries[recKey] || (dateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
          const mRec = record?.morning || { status: 'pending', price: cust.ratePerTiffin };
          const eRec = record?.evening || { status: 'pending', price: cust.ratePerTiffin };

          const cardLeaveRange = leaveRangeByCustomerId[cust.id];

          // WhatsApp delivery message link builder
          const buildWALink = (session: 'morning' | 'evening', price: number) => {
            const msg = buildWhatsAppMsg(cust.name, session, dateFull, price, language);
            return `https://wa.me/91${cust.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
          };

          return (
            <div
              key={cust.id}
              className="bg-[#ffffff] rounded-2xl shadow-sm p-3.5 flex flex-col gap-3 border border-[#eff4ff] transition-all"
            >
              {/* Top Row: Avatar, Name, Flat/Room, Phone & Note */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-sm font-bold text-[18px] flex-shrink-0 ${cust.avatarBg}`}
                  >
                    {cust.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold truncate">
                        {cust.name}
                      </h4>
                      <span className="bg-[#dce9ff] text-[#5a4138] font-label-sm text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {cust.shortAddress}
                      </span>
                      <span
                        className={`font-label-sm text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          cust.dietType === 'non-veg'
                            ? 'bg-[#ffcdd2] text-[#b71c1c]'
                            : 'bg-[#c8e6c9] text-[#1b5e20]'
                        }`}
                      >
                        {cust.dietType === 'non-veg'
                          ? (language === 'mr' ? 'मांसाहारी' : 'Non-Veg')
                          : (language === 'mr' ? 'शाकाहारी' : 'Veg')}
                      </span>
                      {cardLeaveRange && (
                        <span className="font-label-sm text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#ffdcc3] text-[#6e3900] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">flight_takeoff</span>
                          {language === 'mr' ? 'सुट्टी: ' : 'Leave: '}
                          {formatLeaveBadge(cardLeaveRange.from, cardLeaveRange.to)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <a
                        href={`tel:${cust.phone}`}
                        className="font-body-sm text-[12px] text-[#5a4138] flex items-center gap-0.5 active:text-[#a33900]"
                      >
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        <span>{cust.phone}</span>
                      </a>
                      <span className="text-[#e2bfb2] font-body-sm">•</span>
                      <span
                        className={`font-body-sm text-[12px] truncate ${
                          cust.specialNote.includes('खास') ? 'text-[#a33900] font-semibold' : 'text-[#5a4138]'
                        }`}
                      >
                        {cust.specialNote}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* WhatsApp delivery alert button */}
                  {cust.phone && (
                    <a
                      href={buildWALink(
                        cust.mealTiming === 'night' ? 'evening' : 'morning',
                        cust.mealTiming === 'night' ? (eRec.price ?? cust.ratePerTiffin) : (mRec.price ?? cust.ratePerTiffin)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="WhatsApp"
                      className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center active:scale-95 hover:bg-[#bbf7d0]"
                      title={language === 'mr' ? 'WhatsApp वर पाठवा' : 'Send on WhatsApp'}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  )}
                  <button
                    type="button"
                    aria-label="Options"
                    onClick={() => setActiveMenuCustomer(cust)}
                    className="w-8 h-8 rounded-full bg-[#eff4ff] text-[#5a4138] flex items-center justify-center active:scale-95 hover:bg-[#dce9ff]"
                    title={language === 'mr' ? 'पर्याय' : 'Options'}
                  >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons Grid: Morning & Evening */}
              <div className="grid grid-cols-2 gap-2">
                {/* Morning Action Button */}
                {mRec.status === 'delivered' ? (
                  <button
                    type="button"
                    onClick={() => onOpenPricePicker(cust, 'morning', dateKey, `${dayName}, ${dateFull}`)}
                    className={`h-12 rounded-full text-white flex items-center justify-center gap-1.5 px-3 shadow-xs active:scale-95 transition-all ${
                      mRec.dietType === 'non-veg' ? 'bg-[#93000a]' : 'bg-[#006e2d]'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="flex flex-col items-start leading-none text-left">
                      <div className="flex items-center gap-1">
                        <span className="font-label-sm text-[10px] opacity-90">{t('morning')}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 font-bold">
                          {mRec.dietType === 'non-veg' ? (language === 'mr' ? 'नॉन-व्हेज' : 'Non-Veg') : (language === 'mr' ? 'व्हेज' : 'Veg')}
                        </span>
                      </div>
                      <span className="font-label-lg text-[13px] font-bold">
                        {formatCurrency(mRec.price)} {t('statusDelivered')}
                      </span>
                    </div>
                  </button>
                ) : mRec.status === 'leave' ? (
                  <button
                    type="button"
                    onClick={() => onOpenPricePicker(cust, 'morning', dateKey, `${dayName}, ${dateFull}`)}
                    className="h-12 rounded-full bg-[#e5eeff] text-[#5a4138] flex items-center justify-center gap-1.5 px-3 opacity-90 shadow-xs active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">event_busy</span>
                    <div className="flex flex-col items-start leading-none text-left">
                      <span className="font-label-sm text-[10px]">{t('morning')}</span>
                      <span className="font-label-lg text-[13px] font-semibold">
                        {mRec.label || (language === 'mr' ? 'सुट्टी (रद्द)' : 'Leave')}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenPricePicker(cust, 'morning', dateKey, `${dayName}, ${dateFull}`)}
                    className="h-12 rounded-full bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center gap-1.5 px-3 shadow-xs active:scale-95 transition-all hover:bg-[#a33900]/10"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#a33900]">add_circle</span>
                    <div className="flex flex-col items-start leading-none text-left">
                      <span className="font-label-sm text-[10px] text-[#5a4138]">{t('morning')}</span>
                      <span className="font-label-lg text-[13px] font-semibold text-[#a33900]">
                        {language === 'mr' ? 'नोंदवा (बाकी)' : 'Log (Pending)'}
                      </span>
                    </div>
                  </button>
                )}

                {/* Evening Action Button */}
                {eRec.status === 'delivered' ? (
                  <button
                    type="button"
                    onClick={() => onOpenPricePicker(cust, 'evening', dateKey, `${dayName}, ${dateFull}`)}
                    className={`h-12 rounded-full text-white flex items-center justify-center gap-1.5 px-3 shadow-xs active:scale-95 transition-all ${
                      eRec.dietType === 'non-veg' ? 'bg-[#93000a]' : 'bg-[#006e2d]'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div className="flex flex-col items-start leading-none text-left">
                      <div className="flex items-center gap-1">
                        <span className="font-label-sm text-[10px] opacity-90">{t('evening')}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 font-bold">
                          {eRec.dietType === 'non-veg' ? (language === 'mr' ? 'नॉन-व्हेज' : 'Non-Veg') : (language === 'mr' ? 'व्हेज' : 'Veg')}
                        </span>
                      </div>
                      <span className="font-label-lg text-[13px] font-bold">
                        {formatCurrency(eRec.price)} {t('statusDelivered')}
                      </span>
                    </div>
                  </button>
                ) : eRec.status === 'leave' ? (
                  <button
                    type="button"
                    onClick={() => onOpenPricePicker(cust, 'evening', dateKey, `${dayName}, ${dateFull}`)}
                    className="h-12 rounded-full bg-[#e5eeff] text-[#5a4138] flex items-center justify-center gap-1.5 px-3 opacity-90 shadow-xs active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">event_busy</span>
                    <div className="flex flex-col items-start leading-none text-left">
                      <span className="font-label-sm text-[10px]">{t('evening')}</span>
                      <span className="font-label-lg text-[13px] font-semibold">
                        {eRec.label || (language === 'mr' ? 'सुट्टी (रद्द)' : 'Leave')}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenPricePicker(cust, 'evening', dateKey, `${dayName}, ${dateFull}`)}
                    className="h-12 rounded-full bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center gap-1.5 px-3 shadow-xs active:scale-95 transition-all hover:bg-[#a33900]/10"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#a33900]">add_circle</span>
                    <div className="flex flex-col items-start leading-none text-left">
                      <span className="font-label-sm text-[10px] text-[#5a4138]">{t('evening')}</span>
                      <span className="font-label-lg text-[13px] font-semibold text-[#a33900]">
                        {language === 'mr' ? 'नोंदवा (बाकी)' : 'Log (Pending)'}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    )}

      {/* Customer Quick Options Bottom Sheet */}
      {activeMenuCustomer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setActiveMenuCustomer(null)}
          />
          <div className="relative w-full max-w-md bg-[#ffffff] rounded-t-3xl shadow-2xl z-10 p-5 flex flex-col gap-3.5 animate-in slide-in-from-bottom duration-200 border-t border-[#eff4ff]">
            <div className="w-12 h-1.5 rounded-full bg-[#e2bfb2]/60 mx-auto -mt-1 mb-1"></div>

            {/* Header info */}
            <div className="flex items-center gap-3 pb-2 border-b border-[#eff4ff]">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-headline-sm font-bold text-[18px] shrink-0 ${activeMenuCustomer.avatarBg}`}
              >
                {activeMenuCustomer.initial}
              </div>
              <div className="min-w-0">
                <h4 className="font-headline-sm text-[17px] text-[#0b1c30] font-bold truncate">
                  {activeMenuCustomer.name}
                </h4>
                <p className="font-body-sm text-[12px] text-[#5a4138] truncate">
                  {activeMenuCustomer.phone} • {activeMenuCustomer.shortAddress}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {onOpenEditModal && (
                <button
                  type="button"
                  onClick={() => {
                    const cust = activeMenuCustomer;
                    setActiveMenuCustomer(null);
                    onOpenEditModal(cust);
                  }}
                  className="w-full h-12 rounded-2xl bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[14px] font-semibold flex items-center justify-start px-4 gap-3 hover:bg-[#dce9ff] active:scale-[0.99] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#a33900]">edit</span>
                  <span>{language === 'mr' ? 'ग्राहक माहिती बदला / संपादन करा' : 'Edit Customer Details'}</span>
                </button>
              )}

              {onDeleteCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    const cust = activeMenuCustomer;
                    setActiveMenuCustomer(null);
                    setCustomerToDelete(cust);
                  }}
                  className="w-full h-12 rounded-2xl bg-[#ffdad6]/60 text-[#93000a] font-label-lg text-[14px] font-semibold flex items-center justify-start px-4 gap-3 hover:bg-[#ffdad6] active:scale-[0.99] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                  <span>{language === 'mr' ? 'हा ग्राहक कायमचा काढून टाका' : 'Delete Customer Permanently'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveMenuCustomer(null)}
                className="w-full h-11 rounded-full text-[#5a4138] font-label-md text-[13px] font-medium hover:text-[#0b1c30] transition-colors mt-1"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declare / Edit Holiday Modal */}
      {holidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 border border-[#eff4ff]">
            <div className="w-14 h-14 rounded-full bg-[#8d4b00]/10 text-[#8d4b00] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[28px]">event_busy</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">
                {holidayModal.mode === 'edit'
                  ? (language === 'mr' ? 'सुट्टी संपादित करा' : 'Edit Holiday')
                  : (language === 'mr' ? 'सुट्टी जाहीर करा' : 'Declare Holiday')}
              </h4>
              <p className="font-body-sm text-[13px] text-[#5a4138] mt-1.5 leading-relaxed">
                {language === 'mr'
                  ? 'या कालावधीतील सर्व सक्रिय ग्राहकांचे प्रलंबित डबे सुट्टी म्हणून नोंदवले जातील.'
                  : "All active customers' pending tiffins in this range will be marked as leave."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <label className="flex flex-col gap-1 text-left">
                <span className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                  {language === 'mr' ? 'पासून' : 'From'}
                </span>
                <input
                  type="date"
                  value={holidayModal.from}
                  onChange={(e) => setHolidayModal({ ...holidayModal, from: e.target.value })}
                  className="h-10 px-2 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]/30"
                />
              </label>
              <label className="flex flex-col gap-1 text-left">
                <span className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                  {language === 'mr' ? 'पर्यंत' : 'To'}
                </span>
                <input
                  type="date"
                  value={holidayModal.to}
                  onChange={(e) => setHolidayModal({ ...holidayModal, to: e.target.value })}
                  className="h-10 px-2 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]/30"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-left w-full">
              <span className="font-label-sm text-[11px] text-[#5a4138] font-semibold">
                {language === 'mr' ? 'कारण (उदा. दिवाळी, गणपती)' : 'Reason (e.g. Diwali, Ganpati)'}
              </span>
              <input
                type="text"
                value={holidayModal.reason}
                onChange={(e) => setHolidayModal({ ...holidayModal, reason: e.target.value })}
                placeholder={language === 'mr' ? 'उदा. दिवाळी सुट्टी' : 'e.g. Diwali break'}
                className="h-10 px-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] text-[13px] border border-[#dce9ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]/30"
              />
            </label>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => setHolidayModal(null)}
                className="flex-1 h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[14px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!holidayModal.from || !holidayModal.to || !holidayModal.reason.trim()}
                onClick={() => {
                  if (holidayModal.mode === 'edit' && holidayModal.holidayId) {
                    onEditHoliday?.(holidayModal.holidayId, holidayModal.from, holidayModal.to, holidayModal.reason.trim());
                  } else {
                    onDeclareHoliday?.(holidayModal.from, holidayModal.to, holidayModal.reason.trim());
                  }
                  setHolidayModal(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#8d4b00] text-white font-label-lg text-[14px] font-bold shadow-md hover:bg-[#6e3900] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">event_busy</span>
                <span>
                  {holidayModal.mode === 'edit'
                    ? (language === 'mr' ? 'अद्ययावत करा' : 'Update')
                    : (language === 'mr' ? 'जाहीर करा' : 'Declare')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Holiday Confirmation Modal */}
      {holidayToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 border border-[#eff4ff]">
            <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[28px]">cancel</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">
                {language === 'mr' ? 'सुट्टी रद्द करायची?' : 'Cancel this holiday?'}
              </h4>
              <p className="font-body-sm text-[13px] text-[#5a4138] mt-1.5 leading-relaxed">
                <strong className="text-[#0b1c30] font-semibold">{holidayToCancel.reason}</strong>
                {language === 'mr'
                  ? ` (${formatHolidayRange(holidayToCancel.fromDateKey, holidayToCancel.toDateKey)}) - या कालावधीतील सुट्टी नोंदी पूर्ववत (प्रलंबित) केल्या जातील.`
                  : ` (${formatHolidayRange(holidayToCancel.fromDateKey, holidayToCancel.toDateKey)}) - leave records in this range will be reverted back to pending.`}
              </p>
            </div>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => setHolidayToCancel(null)}
                className="flex-1 h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[14px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelHoliday?.(holidayToCancel.id);
                  setHolidayToCancel(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#ba1a1a] text-white font-label-lg text-[14px] font-bold shadow-md hover:bg-[#93000a] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>{language === 'mr' ? 'होय, रद्द करा' : 'Yes, Cancel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Holiday Broadcast Modal - one message, sent however you like */}
      {broadcastHoliday && (() => {
        const sameDay = broadcastHoliday.fromDateKey === broadcastHoliday.toDateKey;
        const fromStr = formatDate(parseDateKeyToDate(broadcastHoliday.fromDateKey)).dateFull;
        const toStr = formatDate(parseDateKeyToDate(broadcastHoliday.toDateKey)).dateFull;
        const msg = buildHolidayBroadcastMsg(broadcastHoliday.reason, fromStr, toStr, sameDay, language);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 border border-[#eff4ff]">
              <div className="w-14 h-14 rounded-full bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[28px]">chat</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">
                  {language === 'mr' ? 'सुट्टीचा निरोप' : 'Holiday Notice'}
                </h4>
                <p className="font-body-sm text-[12px] text-[#5a4138] mt-1">
                  {language === 'mr'
                    ? 'एका क्लिकवर शेअर करा - WhatsApp ब्रॉडकास्ट लिस्ट किंवा ग्रुप निवडा.'
                    : 'Share in one tap - pick your WhatsApp broadcast list or group.'}
                </p>
              </div>
              <div className="w-full bg-[#eff4ff] rounded-xl p-3 text-left">
                <pre className="font-body-sm text-[13px] text-[#0b1c30] whitespace-pre-wrap font-sans">{msg}</pre>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({ text: msg });
                    } catch {
                      // user cancelled - no action needed
                    }
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }
                }}
                className="w-full h-12 rounded-xl bg-[#25D366] text-white font-label-md text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#1ebe5a] active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[13px] font-bold">
                    {language === 'mr' ? 'सुट्टीचा निरोप शेअर करा' : 'Share Holiday Notice'}
                  </span>
                  <span className="text-[10px] opacity-80 mt-0.5">
                    {language === 'mr' ? 'WhatsApp Broadcast निवडा' : 'Pick WhatsApp Broadcast List'}
                  </span>
                </div>
              </button>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setBroadcastHoliday(null)}
                  className="flex-1 h-10 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-md text-[13px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
                >
                  {language === 'mr' ? 'बंद करा' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(msg);
                      setBroadcastCopied(true);
                      setTimeout(() => setBroadcastCopied(false), 2000);
                    } catch {
                      // ignore - clipboard may be unavailable
                    }
                  }}
                  className={`flex-1 h-10 rounded-full font-label-md text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    broadcastCopied ? 'bg-[#7cf994] text-[#007230]' : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {broadcastCopied ? 'done' : 'content_copy'}
                  </span>
                  <span>
                    {broadcastCopied
                      ? (language === 'mr' ? 'कॉपी झाले!' : 'Copied!')
                      : (language === 'mr' ? 'कॉपी करा' : 'Copy')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3.5 border border-[#eff4ff]">
            <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold">
                {language === 'mr' ? 'ग्राहक कायमचा काढायचा आहे?' : 'Delete Customer?'}
              </h4>
              <p className="font-body-sm text-[13px] text-[#5a4138] mt-1.5 leading-relaxed">
                <strong className="text-[#0b1c30] font-semibold">{customerToDelete.name}</strong>
                {language === 'mr'
                  ? ' आणि त्यांच्या सर्व नोंदी कायमच्या काढून टाकल्या जातील.'
                  : ' and all their daily delivery records will be permanently removed.'}
              </p>
            </div>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[14px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCustomer) {
                    onDeleteCustomer(customerToDelete.id);
                  }
                  setCustomerToDelete(null);
                }}
                className="flex-1 h-11 rounded-full bg-[#ba1a1a] text-white font-label-lg text-[14px] font-bold shadow-md hover:bg-[#93000a] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>{language === 'mr' ? 'हटवा' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
