/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './components/TodayScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { PricePickerModal } from './components/PricePickerModal';
import { CustomerModal } from './components/CustomerModal';
import { AdvancePaymentModal } from './components/AdvancePaymentModal';
import { WhatsAppInvoicePreview } from './components/WhatsAppInvoicePreview';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './utils/usePWAInstall';
import { getTodayDateKey, getDateKeyRange } from './utils/dateUtils';
import {
  Customer,
  DayDelivery,
  DietType,
  PaymentRecord,
  Holiday,
  ExtraItem,
  BillingSettings,
  BillingSentRecord,
  ActiveTab,
  PricePickerState,
} from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_DAY_DELIVERIES,
  INITIAL_PAYMENTS,
} from './data/initialData';
import {
  testFirestoreConnection,
  subscribeToCustomers,
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  subscribeToDeliveries,
  saveDeliveryToFirestore,
  subscribeToPayments,
  savePaymentToFirestore,
  deletePaymentFromFirestore,
  subscribeToHolidays,
  saveHolidayToFirestore,
  deleteHolidayFromFirestore,
  deleteCustomerDeliveriesFromFirestore,
  subscribeToExtraItems,
  saveExtraItemToFirestore,
  deleteExtraItemFromFirestore,
  subscribeToBillingSettings,
  saveBillingSettingsToFirestore,
  subscribeToBillingSent,
  saveBillingSentToFirestore,
  clearFirestoreData,
  fetchCustomerDeliveryHistory,
  updateCustomerDueInFirestore,
} from './firebase';
import { NotificationsScreen } from './components/NotificationsScreen';
import { getMonthKey, formatDateKey } from './utils/dateUtils';
import { computeCustomerDueFromHistory } from './utils/duesUtils';

// How far back the live delivery sync looks by default. Keeps daily reads
// flat forever instead of growing every month as history accumulates;
// older months are fetched separately, on demand, when actually needed.
const DELIVERY_SYNC_WINDOW_DAYS = 90;

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('shravani_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('shravani_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [largeText, setLargeText] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shravani_large_text') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    try {
      localStorage.setItem('shravani_large_text', largeText ? '1' : '0');
    } catch {
      // ignore
    }
  }, [largeText]);

  const toggleLargeText = () => setLargeText((prev) => !prev);

  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('shravani_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Exclude any legacy sample/dummy customer entries
        return parsed.filter(
          (c: Customer) =>
            !['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5', 'cust-6', 'cust-7'].includes(c.id) &&
            c.name !== 'सचिन पाटील' &&
            c.name !== 'राहुल जोशी'
        );
      }
      return INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [dayDeliveries, setDayDeliveries] = useState<Record<string, DayDelivery>>(() => {
    try {
      const saved = localStorage.getItem('shravani_deliveries');
      return saved ? JSON.parse(saved) : INITIAL_DAY_DELIVERIES;
    } catch {
      return {};
    }
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('shravani_payments');
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    try {
      const saved = localStorage.getItem('shravani_holidays');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [extraItems, setExtraItems] = useState<ExtraItem[]>(() => {
    try {
      const saved = localStorage.getItem('shravani_extra_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [billingReminderDay, setBillingReminderDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('shravani_billing_reminder_day');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  const [billingSentRecords, setBillingSentRecords] = useState<BillingSentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('shravani_billing_sent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingDuesEnabled, setPendingDuesEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('shravani_pending_dues_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('shravani_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch {
      // ignore
    }
    return '';
  });

  // Live-sync with Firebase Firestore: subscriptions fire immediately with
  // current cloud data, then again whenever any device (this one, or a
  // family member's install) writes a change - so every device stays in sync
  // without needing a manual refresh.
  useEffect(() => {
    let isMounted = true;
    let unsubCustomers: (() => void) | undefined;
    let unsubDeliveries: (() => void) | undefined;
    let unsubPayments: (() => void) | undefined;
    let unsubHolidays: (() => void) | undefined;
    let unsubExtraItems: (() => void) | undefined;
    let unsubBillingSettings: (() => void) | undefined;
    let unsubBillingSent: (() => void) | undefined;

    async function connectCloudSync() {
      setIsLoadingCloud(true);
      try {
        const isConnected = await testFirestoreConnection();
        if (!isMounted) return;
        setIsCloudConnected(isConnected);

        if (isConnected) {
          unsubCustomers = subscribeToCustomers((remoteCusts) => {
            if (!isMounted) return;
            const cleanCusts = remoteCusts.filter(
              (c) =>
                !['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5', 'cust-6', 'cust-7'].includes(c.id) &&
                c.name !== 'सचिन पाटील' &&
                c.name !== 'राहुल जोशी'
            );
            setCustomers(cleanCusts);
            setSelectedCustomerId((prev) => {
              if (cleanCusts.length === 0) return '';
              if (prev && cleanCusts.some((c) => c.id === prev)) return prev;
              return cleanCusts[0].id;
            });
          });

          // Bounded to a rolling recent window (not the entire delivery
          // history since day one) so this stays cheap forever regardless of
          // how many years of history accumulate. Older months are fetched
          // separately, on demand, when Reports is opened for a customer.
          const deliveriesWindowStart = formatDateKey(new Date(Date.now() - DELIVERY_SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000));
          unsubDeliveries = subscribeToDeliveries((remoteDeliveries) => {
            if (!isMounted) return;
            setDayDeliveries(remoteDeliveries);
          }, deliveriesWindowStart);

          unsubPayments = subscribeToPayments((remotePayments) => {
            if (!isMounted) return;
            setPayments(remotePayments);
          });

          unsubHolidays = subscribeToHolidays((remoteHolidays) => {
            if (!isMounted) return;
            setHolidays(remoteHolidays);
          });

          unsubExtraItems = subscribeToExtraItems((remoteExtraItems) => {
            if (!isMounted) return;
            setExtraItems(remoteExtraItems);
          });

          unsubBillingSettings = subscribeToBillingSettings((settings) => {
            if (!isMounted || !settings) return;
            setBillingReminderDay(settings.reminderDay);
            if (typeof settings.pendingDuesEnabled === 'boolean') {
              setPendingDuesEnabled(settings.pendingDuesEnabled);
            }
          });

          unsubBillingSent = subscribeToBillingSent((records) => {
            if (!isMounted) return;
            setBillingSentRecords(records);
          });
        }
      } catch (e) {
        console.warn('Firebase live sync skipped or offline:', e);
      } finally {
        if (isMounted) setIsLoadingCloud(false);
      }
    }

    connectCloudSync();
    return () => {
      isMounted = false;
      unsubCustomers?.();
      unsubDeliveries?.();
      unsubPayments?.();
      unsubHolidays?.();
      unsubExtraItems?.();
      unsubBillingSettings?.();
      unsubBillingSent?.();
    };
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('shravani_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('shravani_deliveries', JSON.stringify(dayDeliveries));
  }, [dayDeliveries]);

  useEffect(() => {
    localStorage.setItem('shravani_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('shravani_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('shravani_extra_items', JSON.stringify(extraItems));
  }, [extraItems]);

  useEffect(() => {
    localStorage.setItem('shravani_billing_reminder_day', String(billingReminderDay));
  }, [billingReminderDay]);

  useEffect(() => {
    localStorage.setItem('shravani_billing_sent', JSON.stringify(billingSentRecords));
  }, [billingSentRecords]);

  useEffect(() => {
    localStorage.setItem('shravani_pending_dues_enabled', String(pendingDuesEnabled));
  }, [pendingDuesEnabled]);

  // Handler: Clear All Data
  const handleClearAllData = async () => {
    setCustomers([]);
    setDayDeliveries({});
    setPayments([]);
    setHolidays([]);
    setExtraItems([]);
    setSelectedCustomerId('');
    localStorage.removeItem('shravani_customers');
    localStorage.removeItem('shravani_deliveries');
    localStorage.removeItem('shravani_payments');
    localStorage.removeItem('shravani_holidays');
    localStorage.removeItem('shravani_extra_items');

    // Also clear from cloud database
    await clearFirestoreData();
    triggerToast('सर्व डेटा हटवला! आता खरे ग्राहक जोडू शकता.');
  };

  // Handler: Download a full backup (customers + all delivery history + payments) as one JSON file
  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: 1,
      customers,
      dayDeliveries,
      payments,
      holidays,
      extraItems,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shravani-tiffin-backup-${getTodayDateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('संपूर्ण बॅकअप डाऊनलोड झाला!');
  };

  // Handler: Restore all data from a previously downloaded backup file
  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.customers) || typeof parsed.dayDeliveries !== 'object') {
        triggerToast('अवैध बॅकअप फाईल.');
        return;
      }
      const restoredCustomers: Customer[] = parsed.customers;
      const restoredDeliveries: Record<string, DayDelivery> = parsed.dayDeliveries || {};
      const restoredPayments: PaymentRecord[] = Array.isArray(parsed.payments) ? parsed.payments : [];
      const restoredHolidays: Holiday[] = Array.isArray(parsed.holidays) ? parsed.holidays : [];
      const restoredExtraItems: ExtraItem[] = Array.isArray(parsed.extraItems) ? parsed.extraItems : [];

      // Clear existing cloud data first so restore is a true revert to the
      // backup, not a merge that leaves behind anything added since then.
      await clearFirestoreData();

      setCustomers(restoredCustomers);
      setDayDeliveries(restoredDeliveries);
      setPayments(restoredPayments);
      setHolidays(restoredHolidays);
      setExtraItems(restoredExtraItems);
      setSelectedCustomerId(restoredCustomers.length > 0 ? restoredCustomers[0].id : '');

      // Push everything back to the cloud so every device sees the restored data
      await Promise.all([
        ...restoredCustomers.map((c) => saveCustomerToFirestore(c)),
        ...Object.values(restoredDeliveries).map((d) => saveDeliveryToFirestore(d.customerId, d)),
        ...restoredPayments.map((p) => savePaymentToFirestore(p)),
        ...restoredHolidays.map((h) => saveHolidayToFirestore(h)),
        ...restoredExtraItems.map((it) => saveExtraItemToFirestore(it)),
      ]);

      triggerToast('बॅकअप यशस्वीरित्या पुनर्संचयित झाला!');
    } catch (err) {
      console.warn('Backup restore failed:', err);
      triggerToast('बॅकअप पुनर्संचयित करताना त्रुटी आली.');
    }
  };

  // Modal States
  const [pricePicker, setPricePicker] = useState<PricePickerState>({
    isOpen: false,
    customerId: '',
    session: 'morning',
    currentPrice: 70,
    currentStatus: 'pending',
  });

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [showWhatsAppInvoice, setShowWhatsAppInvoice] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [invoiceMetrics, setInvoiceMetrics] = useState({
    totalTiffins: 52,
    totalBill: 3380,
    paidAmount: 2280,
    dueAmount: 1100,
    totalLeaveDays: 0,
    leaveDateKeys: [] as string[],
    noteEntries: [] as { dateKey: string; session: 'morning' | 'evening'; price: number; label: string; extras?: { name: string; price: number }[] }[],
  });

  // Global toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Dynamic Marathi date formatter
  const getMarathiDateStr = (d: Date = new Date()): string => {
    const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
    const toMarathi = (n: number) => String(n).split('').map(c => marathiDigits[+c]).join('');
    const marathiMonths = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
    return `${toMarathi(d.getDate())} ${marathiMonths[d.getMonth()]} ${toMarathi(d.getFullYear())}`;
  };

  const getMarathiMonthYearStr = (d: Date = new Date()): string => {
    const marathiDigits = ['०','१','२','३','४','५','६','७','८','९'];
    const toMarathi = (n: number) => String(n).split('').map(c => marathiDigits[+c]).join('');
    const marathiMonths = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
    return `${marathiMonths[d.getMonth()]} ${toMarathi(d.getFullYear())}`;
  };

  // Handler: Open Price Picker
  const handleOpenPricePicker = (
    customer: Customer,
    session: 'morning' | 'evening',
    dateKey?: string,
    formattedDateStr?: string
  ) => {
    const activeDateKey = dateKey || getTodayDateKey();
    const rec =
      dayDeliveries[`${activeDateKey}_${customer.id}`] ||
      (activeDateKey === getTodayDateKey() ? dayDeliveries[customer.id] : undefined);
    const sessionRec = session === 'morning' ? rec?.morning : rec?.evening;
    setPricePicker({
      isOpen: true,
      customerId: customer.id,
      session,
      currentPrice: sessionRec?.price || customer.ratePerTiffin,
      currentStatus: sessionRec?.status || 'pending',
      currentDietType: sessionRec?.dietType || customer.dietType || 'veg',
      currentLabel: sessionRec?.label || '',
      currentExtras: sessionRec?.extras || [],
      dateKey: activeDateKey,
      formattedDateStr: formattedDateStr,
    });
  };

  // Handler: Add or update an Extra Item in the reusable catalog
  const handleSaveExtraItem = (item: ExtraItem) => {
    setExtraItems((prev) => {
      const exists = prev.some((it) => it.id === item.id);
      return exists ? prev.map((it) => (it.id === item.id ? item : it)) : [...prev, item];
    });
    saveExtraItemToFirestore(item).catch((err) => console.warn('Extra item save to cloud skipped:', err));
  };

  // Handler: Remove an Extra Item from the catalog (does not affect past bills already recorded)
  const handleDeleteExtraItem = (itemId: string) => {
    setExtraItems((prev) => prev.filter((it) => it.id !== itemId));
    deleteExtraItemFromFirestore(itemId).catch((err) => console.warn('Extra item delete from cloud skipped:', err));
  };

  // Handler: Owner sets which day of the month the billing reminder banner should appear on
  const handleSetBillingReminderDay = (day: number) => {
    setBillingReminderDay(day);
    saveBillingSettingsToFirestore({ reminderDay: day, pendingDuesEnabled }).catch((err) =>
      console.warn('Billing reminder setting save to cloud skipped:', err)
    );
  };

  // Handler: Toggle the "pending dues" notification banner (customers whose
  // last month's bill is still not fully paid) on or off
  const handleTogglePendingDues = () => {
    const next = !pendingDuesEnabled;
    setPendingDuesEnabled(next);
    saveBillingSettingsToFirestore({ reminderDay: billingReminderDay, pendingDuesEnabled: next }).catch((err) =>
      console.warn('Pending dues setting save to cloud skipped:', err)
    );
  };

  // Handler: Mark a customer as billed for the current month (called when the
  // owner actually sends or downloads that customer's bill), so the billing
  // reminder banner stops counting them until next month.
  const handleMarkBillSent = (customerId: string) => {
    const monthKey = getMonthKey();
    const record: BillingSentRecord = {
      id: `${customerId}_${monthKey}`,
      customerId,
      monthKey,
      sentAt: new Date().toISOString(),
    };
    setBillingSentRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      return exists ? prev : [...prev, record];
    });
    saveBillingSentToFirestore(record).catch((err) => console.warn('Billing-sent save to cloud skipped:', err));
  };

  // Recomputes one customer's true running due balance from their own full
  // delivery history (a bounded, single-customer query - not everyone's
  // history) and saves it, so the Pending Dues notification can just read
  // that saved number instead of ever scanning delivery history itself.
  // Called (fire-and-forget) after anything that could change what a
  // customer owes: a delivery marked/unmarked, a leave/holiday override, or
  // a payment added/edited/deleted.
  // `paymentsOverride` lets callers that just changed `payments` via setState
  // (whose closure still holds the pre-update array, since React state
  // updates aren't synchronous) pass the already-known-correct list directly
  // instead of reading stale state.
  const recomputeAndSaveCustomerDue = async (customerId: string, paymentsOverride?: PaymentRecord[]) => {
    try {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) return;
      const history = await fetchCustomerDeliveryHistory(customerId);
      const sourcePayments = paymentsOverride ?? payments;
      const custPayments = sourcePayments.filter((p) => p.customerId === customerId);
      const due = computeCustomerDueFromHistory(cust, history, custPayments);
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, currentDue: due } : c)));
      await updateCustomerDueInFirestore(customerId, due);
    } catch (err) {
      console.warn('Due recompute skipped:', err);
    }
  };

  // Manual safety net: recompute every active customer's currentDue from
  // scratch. This does read each customer's full delivery history (so it's
  // a deliberate, occasional action - not something run automatically) but
  // guarantees the saved balances can never permanently drift from the
  // truth, whatever the cause.
  const handleRecalculateAllDues = async () => {
    triggerToast('सर्व ग्राहकांची बाकी रक्कम पुन्हा मोजत आहे...');
    const activeCustomers = customers.filter((c) => c.status === 'active');
    for (const cust of activeCustomers) {
      await recomputeAndSaveCustomerDue(cust.id);
    }
    triggerToast('सर्व ग्राहकांची बाकी रक्कम अद्ययावत झाली!');
  };

  // Handler: Confirm delivery from Price Picker
  const handleConfirmDelivery = (
    price: number,
    dietType?: DietType,
    label?: string,
    extras?: { name: string; price: number }[]
  ) => {
    const custId = pricePicker.customerId;
    const session = pricePicker.session;
    const activeDateKey = pricePicker.dateKey || getTodayDateKey();
    const cust = customers.find((c) => c.id === custId);
    const chosenDiet: DietType = dietType || pricePicker.currentDietType || cust?.dietType || 'veg';

    const existing =
      dayDeliveries[`${activeDateKey}_${custId}`] ||
      (activeDateKey === getTodayDateKey() ? dayDeliveries[custId] : undefined) || {
        dateKey: activeDateKey,
        customerId: custId,
        morning: { status: 'pending', price: cust?.ratePerTiffin || 70, dietType: cust?.dietType || 'veg' },
        evening: { status: 'pending', price: cust?.ratePerTiffin || 70, dietType: cust?.dietType || 'veg' },
      };

    const updatedDelivery: DayDelivery = {
      ...existing,
      dateKey: activeDateKey,
      customerId: custId,
      [session]: {
        status: 'delivered',
        price,
        dietType: chosenDiet,
        // Firestore's setDoc() throws if any nested field is explicitly
        // `undefined` (rejecting the entire write) - so omit these keys
        // entirely instead of setting them to undefined when empty.
        ...(label ? { label } : {}),
        ...(extras && extras.length > 0 ? { extras } : {}),
      },
    };

    setDayDeliveries((prev) => ({
      ...prev,
      [`${activeDateKey}_${custId}`]: updatedDelivery,
      ...(activeDateKey === getTodayDateKey() ? { [custId]: updatedDelivery } : {}),
    }));

    setPricePicker((prev) => ({ ...prev, isOpen: false }));
    const dietLabel = chosenDiet === 'non-veg' ? 'नॉन-व्हेज' : 'व्हेज';
    triggerToast(`${cust?.name || 'ग्राहक'}: ₹${price} (${dietLabel}) डबा नोंदवला!`);

    saveDeliveryToFirestore(custId, updatedDelivery).catch((err) =>
      console.warn('Delivery save to cloud skipped:', err)
    );
    recomputeAndSaveCustomerDue(custId);
  };

  // Handler: Mark leave from Price Picker
  const handleMarkLeave = () => {
    const custId = pricePicker.customerId;
    const session = pricePicker.session;
    const activeDateKey = pricePicker.dateKey || getTodayDateKey();
    const cust = customers.find((c) => c.id === custId);

    const existing =
      dayDeliveries[`${activeDateKey}_${custId}`] ||
      (activeDateKey === getTodayDateKey() ? dayDeliveries[custId] : undefined) || {
        dateKey: activeDateKey,
        customerId: custId,
        morning: { status: 'pending', price: cust?.ratePerTiffin || 70, dietType: cust?.dietType || 'veg' },
        evening: { status: 'pending', price: cust?.ratePerTiffin || 70, dietType: cust?.dietType || 'veg' },
      };

    const updatedDelivery: DayDelivery = {
      ...existing,
      dateKey: activeDateKey,
      customerId: custId,
      [session]: {
        status: 'leave',
        price: 0,
        label: 'सुट्टी (रद्द)',
      },
    };

    setDayDeliveries((prev) => ({
      ...prev,
      [`${activeDateKey}_${custId}`]: updatedDelivery,
      ...(activeDateKey === getTodayDateKey() ? { [custId]: updatedDelivery } : {}),
    }));

    setPricePicker((prev) => ({ ...prev, isOpen: false }));
    triggerToast(`${cust?.name || 'ग्राहक'}: आज सुट्टी नोंदवली.`);

    saveDeliveryToFirestore(custId, updatedDelivery).catch((err) =>
      console.warn('Delivery save to cloud skipped:', err)
    );
    recomputeAndSaveCustomerDue(custId);
  };

  // Handler: Clear mark from Price Picker
  const handleClearMark = () => {
    const custId = pricePicker.customerId;
    const session = pricePicker.session;
    const activeDateKey = pricePicker.dateKey || getTodayDateKey();
    const cust = customers.find((c) => c.id === custId);

    const existing =
      dayDeliveries[`${activeDateKey}_${custId}`] ||
      (activeDateKey === getTodayDateKey() ? dayDeliveries[custId] : undefined);
    if (!existing) return;

    const updatedDelivery: DayDelivery = {
      ...existing,
      dateKey: activeDateKey,
      customerId: custId,
      [session]: {
        status: 'pending',
        price: cust?.ratePerTiffin || 70,
        dietType: cust?.dietType || 'veg',
      },
    };

    setDayDeliveries((prev) => ({
      ...prev,
      [`${activeDateKey}_${custId}`]: updatedDelivery,
      ...(activeDateKey === getTodayDateKey() ? { [custId]: updatedDelivery } : {}),
    }));

    setPricePicker((prev) => ({ ...prev, isOpen: false }));
    triggerToast('नोंद यशस्वीपणे हटवली गेली.');

    saveDeliveryToFirestore(custId, updatedDelivery).catch((err) =>
      console.warn('Delivery save to cloud skipped:', err)
    );
    recomputeAndSaveCustomerDue(custId);
  };

  // Handler: Batch mark all pending customers for a session as delivered,
  // or (when none are pending) undo and revert all delivered ones back to pending
  const handleBatchMarkSession = (session: 'morning' | 'evening', dateKey: string) => {
    const activeDateKey = dateKey || getTodayDateKey();
    const activeCustomers = customers.filter((c) => c.status === 'active');
    const updates: Record<string, DayDelivery> = {};
    let count = 0;

    const applicableCustomers = activeCustomers.filter((cust) =>
      session === 'morning'
        ? cust.mealTiming === 'both' || cust.mealTiming === 'morning'
        : cust.mealTiming === 'both' || cust.mealTiming === 'night'
    );

    const hasPending = applicableCustomers.some((cust) => {
      const existing =
        dayDeliveries[`${activeDateKey}_${cust.id}`] ||
        (activeDateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
      const status = session === 'morning' ? existing?.morning?.status : existing?.evening?.status;
      return (status || 'pending') === 'pending';
    });
    const targetStatus: 'delivered' | 'pending' = hasPending ? 'delivered' : 'pending';

    applicableCustomers.forEach((cust) => {
      const existing =
        dayDeliveries[`${activeDateKey}_${cust.id}`] ||
        (activeDateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined) || {
          dateKey: activeDateKey,
          customerId: cust.id,
          morning: { status: 'pending' as const, price: cust.ratePerTiffin, dietType: cust.dietType || 'veg' },
          evening: { status: 'pending' as const, price: cust.ratePerTiffin, dietType: cust.dietType || 'veg' },
        };

      const sessionRecord = session === 'morning' ? existing.morning : existing.evening;
      const currentStatus = sessionRecord?.status || 'pending';
      if (targetStatus === 'delivered' && currentStatus !== 'pending') return;
      if (targetStatus === 'pending' && currentStatus !== 'delivered') return;

      const updated: DayDelivery = {
        ...existing,
        dateKey: activeDateKey,
        customerId: cust.id,
        [session]: {
          status: targetStatus,
          // Keep whatever rate was already picked for this customer/day (e.g. via
          // the price picker) instead of silently resetting it to their regular rate.
          price: sessionRecord?.price ?? cust.ratePerTiffin,
          dietType: sessionRecord?.dietType || cust.dietType || 'veg',
        },
      };

      updates[`${activeDateKey}_${cust.id}`] = updated;
      if (activeDateKey === getTodayDateKey()) updates[cust.id] = updated;
      count++;

      saveDeliveryToFirestore(cust.id, updated).catch((err) =>
        console.warn('Batch delivery save to cloud skipped:', err)
      );
      recomputeAndSaveCustomerDue(cust.id);
    });

    if (count > 0) {
      setDayDeliveries((prev) => ({ ...prev, ...updates }));
      const sessionLabel = session === 'morning' ? 'सकाळचे' : 'रात्रीचे';
      triggerToast(
        targetStatus === 'delivered'
          ? `${sessionLabel} ${count} ग्राहकांचे डबे नोंदवले! ✅`
          : `${sessionLabel} ${count} ग्राहकांचे डबे पूर्ववत केले! ↩️`
      );
    }
  };

  // Applies (or, for days no longer in range, reverts) 'leave' status across
  // every active customer for a business-wide holiday date range. When
  // previousFromDateKey/previousToDateKey are given (editing an existing
  // holiday), any day that was in the old range but isn't in the new one is
  // reverted back to pending in the same pass. Already-recorded deliveries
  // are never touched. Returns how many customer-days were actually changed.
  const applyHolidayRange = (
    newFromDateKey: string,
    newToDateKey: string,
    previousFromDateKey?: string,
    previousToDateKey?: string
  ): number => {
    const activeCustomersList = customers.filter((c) => c.status === 'active');
    const newKeys = new Set(getDateKeyRange(newFromDateKey, newToDateKey));
    const oldKeys =
      previousFromDateKey && previousToDateKey ? getDateKeyRange(previousFromDateKey, previousToDateKey) : [];
    const allKeys = new Set([...newKeys, ...oldKeys]);
    const updates: Record<string, DayDelivery> = {};
    let touchedCount = 0;

    activeCustomersList.forEach((cust) => {
      const morningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'morning';
      const eveningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'night';

      allKeys.forEach((activeDateKey) => {
        const isInNewRange = newKeys.has(activeDateKey);
        const existing =
          dayDeliveries[`${activeDateKey}_${cust.id}`] ||
          (activeDateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined) || {
            dateKey: activeDateKey,
            customerId: cust.id,
            morning: { status: 'pending' as const, price: cust.ratePerTiffin, dietType: cust.dietType || 'veg' },
            evening: { status: 'pending' as const, price: cust.ratePerTiffin, dietType: cust.dietType || 'veg' },
          };

        const updated: DayDelivery = { ...existing, dateKey: activeDateKey, customerId: cust.id };
        let touched = false;

        if (isInNewRange) {
          if (morningApplicable && (existing.morning?.status || 'pending') === 'pending') {
            updated.morning = {
              status: 'leave',
              price: existing.morning?.price ?? cust.ratePerTiffin,
              dietType: existing.morning?.dietType || cust.dietType || 'veg',
            };
            touched = true;
          }
          if (eveningApplicable && (existing.evening?.status || 'pending') === 'pending') {
            updated.evening = {
              status: 'leave',
              price: existing.evening?.price ?? cust.ratePerTiffin,
              dietType: existing.evening?.dietType || cust.dietType || 'veg',
            };
            touched = true;
          }
        } else {
          if (morningApplicable && existing.morning?.status === 'leave') {
            updated.morning = { ...existing.morning, status: 'pending' };
            touched = true;
          }
          if (eveningApplicable && existing.evening?.status === 'leave') {
            updated.evening = { ...existing.evening, status: 'pending' };
            touched = true;
          }
        }

        if (!touched) return;

        updates[`${activeDateKey}_${cust.id}`] = updated;
        if (activeDateKey === getTodayDateKey()) updates[cust.id] = updated;
        touchedCount++;

        saveDeliveryToFirestore(cust.id, updated).catch((err) =>
          console.warn('Holiday delivery save to cloud skipped:', err)
        );
      });
    });

    if (Object.keys(updates).length > 0) {
      setDayDeliveries((prev) => ({ ...prev, ...updates }));
    }
    return touchedCount;
  };

  // Reverts a date range's 'leave' days (across every active customer) back
  // to pending - used when cancelling a holiday entirely.
  const clearHolidayRangeForAllCustomers = (fromDateKey: string, toDateKey: string): number => {
    const activeCustomersList = customers.filter((c) => c.status === 'active');
    const dateKeys = getDateKeyRange(fromDateKey, toDateKey);
    const updates: Record<string, DayDelivery> = {};
    let count = 0;

    activeCustomersList.forEach((cust) => {
      dateKeys.forEach((activeDateKey) => {
        const existing =
          dayDeliveries[`${activeDateKey}_${cust.id}`] ||
          (activeDateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
        if (!existing) return;

        const updated: DayDelivery = { ...existing, dateKey: activeDateKey, customerId: cust.id };
        let touched = false;

        if (existing.morning?.status === 'leave') {
          updated.morning = { ...existing.morning, status: 'pending' };
          touched = true;
        }
        if (existing.evening?.status === 'leave') {
          updated.evening = { ...existing.evening, status: 'pending' };
          touched = true;
        }

        if (!touched) return;

        updates[`${activeDateKey}_${cust.id}`] = updated;
        if (activeDateKey === getTodayDateKey()) updates[cust.id] = updated;
        count++;

        saveDeliveryToFirestore(cust.id, updated).catch((err) =>
          console.warn('Holiday-cancel delivery save to cloud skipped:', err)
        );
      });
    });

    if (Object.keys(updates).length > 0) {
      setDayDeliveries((prev) => ({ ...prev, ...updates }));
    }
    return count;
  };

  // Handler: Declare a new business-wide holiday across a date range with a
  // reason (festival name etc.) - marks every active customer's still-pending
  // tiffins in that range as leave.
  const handleDeclareHoliday = (fromDateKey: string, toDateKey: string, reason: string) => {
    const count = applyHolidayRange(fromDateKey, toDateKey);
    const holiday: Holiday = {
      id: `holiday-${Date.now()}`,
      fromDateKey,
      toDateKey,
      reason,
      createdAt: new Date().toISOString(),
    };
    setHolidays((prev) => [...prev, holiday]);
    saveHolidayToFirestore(holiday).catch((err) => console.warn('Holiday save to cloud skipped:', err));
    triggerToast(
      count > 0
        ? `सुट्टी जाहीर केली! ${count} नोंदी अद्ययावत झाल्या. 🎉`
        : 'सुट्टी जाहीर केली, पण नोंदवण्यासारखे प्रलंबित डबे सापडले नाहीत.'
    );
  };

  // Handler: Edit a previously declared holiday's dates/reason.
  const handleEditHoliday = (holidayId: string, newFromDateKey: string, newToDateKey: string, newReason: string) => {
    const existing = holidays.find((h) => h.id === holidayId);
    if (!existing) return;

    applyHolidayRange(newFromDateKey, newToDateKey, existing.fromDateKey, existing.toDateKey);

    const updated: Holiday = { ...existing, fromDateKey: newFromDateKey, toDateKey: newToDateKey, reason: newReason };
    setHolidays((prev) => prev.map((h) => (h.id === holidayId ? updated : h)));
    saveHolidayToFirestore(updated).catch((err) => console.warn('Holiday update to cloud skipped:', err));
    triggerToast('सुट्टी अद्ययावत केली!');
  };

  // Handler: Cancel a declared holiday entirely, reverting its date range's
  // leave days back to pending.
  const handleCancelHoliday = (holidayId: string) => {
    const existing = holidays.find((h) => h.id === holidayId);
    if (!existing) return;

    clearHolidayRangeForAllCustomers(existing.fromDateKey, existing.toDateKey);
    setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    deleteHolidayFromFirestore(holidayId).catch((err) => console.warn('Holiday delete from cloud skipped:', err));
    triggerToast('सुट्टी रद्द केली.');
  };

  // Handler: Mark one customer's pending tiffins (both sessions, whichever
  // applies) as "leave" across every day in a date range - e.g. a vacation.
  // If `previousFromDateKey`/`previousToDateKey` are given (editing an
  // existing leave period), any day that was in the old range but is no
  // longer in the new one is reverted back to pending in the same pass, so
  // shrinking/moving a leave period behaves correctly. Already-recorded
  // deliveries are never touched either way.
  const handleMarkLeaveRange = (
    customerId: string,
    fromDateKey: string,
    toDateKey: string,
    previousFromDateKey?: string,
    previousToDateKey?: string
  ) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const morningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'morning';
    const eveningApplicable = cust.mealTiming === 'both' || cust.mealTiming === 'night';
    const newKeys = new Set(getDateKeyRange(fromDateKey, toDateKey));
    const oldKeys =
      previousFromDateKey && previousToDateKey ? getDateKeyRange(previousFromDateKey, previousToDateKey) : [];
    const allKeys = new Set([...newKeys, ...oldKeys]);

    const updates: Record<string, DayDelivery> = {};
    let leaveCount = 0;
    let clearedCount = 0;

    allKeys.forEach((activeDateKey) => {
      const isInNewRange = newKeys.has(activeDateKey);
      const existing =
        dayDeliveries[`${activeDateKey}_${cust.id}`] ||
        (activeDateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined) || {
          dateKey: activeDateKey,
          customerId: cust.id,
          morning: { status: 'pending' as const, price: cust.ratePerTiffin, dietType: cust.dietType || 'veg' },
          evening: { status: 'pending' as const, price: cust.ratePerTiffin, dietType: cust.dietType || 'veg' },
        };

      const updated: DayDelivery = { ...existing, dateKey: activeDateKey, customerId: cust.id };
      let touched = false;

      if (isInNewRange) {
        if (morningApplicable && (existing.morning?.status || 'pending') === 'pending') {
          updated.morning = {
            status: 'leave',
            price: existing.morning?.price ?? cust.ratePerTiffin,
            dietType: existing.morning?.dietType || cust.dietType || 'veg',
          };
          touched = true;
        }
        if (eveningApplicable && (existing.evening?.status || 'pending') === 'pending') {
          updated.evening = {
            status: 'leave',
            price: existing.evening?.price ?? cust.ratePerTiffin,
            dietType: existing.evening?.dietType || cust.dietType || 'veg',
          };
          touched = true;
        }
        if (touched) leaveCount++;
      } else {
        if (morningApplicable && existing.morning?.status === 'leave') {
          updated.morning = { ...existing.morning, status: 'pending' };
          touched = true;
        }
        if (eveningApplicable && existing.evening?.status === 'leave') {
          updated.evening = { ...existing.evening, status: 'pending' };
          touched = true;
        }
        if (touched) clearedCount++;
      }

      if (!touched) return;

      updates[`${activeDateKey}_${cust.id}`] = updated;
      if (activeDateKey === getTodayDateKey()) updates[cust.id] = updated;

      saveDeliveryToFirestore(cust.id, updated).catch((err) =>
        console.warn('Leave-range save to cloud skipped:', err)
      );
    });

    if (Object.keys(updates).length > 0) {
      setDayDeliveries((prev) => ({ ...prev, ...updates }));
    }
    triggerToast(
      leaveCount > 0
        ? `${cust.name}: ${newKeys.size} दिवसांपैकी ${leaveCount} दिवस सुट्टी नोंदवली! ✈️`
        : clearedCount > 0
        ? `${cust.name}: सुट्टी अद्ययावत केली.`
        : `${cust.name}: निवडलेल्या कालावधीत नोंदवण्यासारखे काही नाही.`
    );
  };

  // Handler: Cancel a previously set leave period, reverting any 'leave' day
  // in the range back to pending. Delivered days are left untouched.
  const handleClearLeaveRange = (customerId: string, fromDateKey: string, toDateKey: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const dateKeys = getDateKeyRange(fromDateKey, toDateKey);
    const updates: Record<string, DayDelivery> = {};
    let count = 0;

    dateKeys.forEach((activeDateKey) => {
      const existing =
        dayDeliveries[`${activeDateKey}_${cust.id}`] ||
        (activeDateKey === getTodayDateKey() ? dayDeliveries[cust.id] : undefined);
      if (!existing) return;

      const updated: DayDelivery = { ...existing, dateKey: activeDateKey, customerId: cust.id };
      let touched = false;

      if (existing.morning?.status === 'leave') {
        updated.morning = { ...existing.morning, status: 'pending' };
        touched = true;
      }
      if (existing.evening?.status === 'leave') {
        updated.evening = { ...existing.evening, status: 'pending' };
        touched = true;
      }

      if (!touched) return;

      updates[`${activeDateKey}_${cust.id}`] = updated;
      if (activeDateKey === getTodayDateKey()) updates[cust.id] = updated;
      count++;

      saveDeliveryToFirestore(cust.id, updated).catch((err) =>
        console.warn('Leave-clear save to cloud skipped:', err)
      );
    });

    if (Object.keys(updates).length > 0) {
      setDayDeliveries((prev) => ({ ...prev, ...updates }));
    }
    triggerToast(`${cust.name}: सुट्टी रद्द केली.`);
  };

  // Handler: Save or Update Customer
  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    if (customerToEdit) {
      const updatedCust: Customer = { ...customerToEdit, ...customerData };
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerToEdit.id ? updatedCust : c))
      );
      triggerToast(`${customerData.name || 'ग्राहक'} माहिती अद्ययावत केली!`);
      saveCustomerToFirestore(updatedCust).catch((err) =>
        console.warn('Customer update to cloud skipped:', err)
      );
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: customerData.name || '',
        initial: customerData.initial || (customerData.name ? customerData.name.charAt(0) : 'ग'),
        phone: customerData.phone || '',
        address: customerData.address || '',
        shortAddress: customerData.shortAddress || '',
        mealTiming: customerData.mealTiming || 'both',
        mealTimingLabel: customerData.mealTimingLabel || 'दोन वेळ',
        ratePerTiffin: customerData.ratePerTiffin || 70,
        monthlyCharge: customerData.monthlyCharge || '₹२,४०० / महिना',
        dietType: customerData.dietType || 'veg',
        specialNote: customerData.specialNote || 'साधा डबा',
        status: 'active',
        avatarBg: 'bg-primary/10 text-[#a33900]',
      };
      setCustomers((prev) => [newCust, ...prev]);
      if (!selectedCustomerId) setSelectedCustomerId(newCust.id);
      triggerToast(`नवीन ग्राहक '${newCust.name}' जोडला गेला!`);
      saveCustomerToFirestore(newCust).catch((err) =>
        console.warn('Customer add to cloud skipped:', err)
      );
    }
    setCustomerModalOpen(false);
    setCustomerToEdit(null);
  };

  // Handler: Toggle Customer Active/Inactive
  const handleToggleCustomerStatus = (customerId: string, status: 'active' | 'inactive') => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          // Firestore's setDoc() throws on an explicit `undefined` field value
          // (rejecting the whole write), so drop deactivatedDate entirely on
          // reactivation instead of setting it to undefined.
          const { deactivatedDate: _oldDeactivatedDate, ...rest } = c;
          const updated: Customer =
            status === 'inactive'
              ? { ...rest, status, deactivatedDate: getMarathiDateStr() }
              : { ...rest, status };
          saveCustomerToFirestore(updated).catch((err) =>
            console.warn('Customer status update skipped:', err)
          );
          return updated;
        }
        return c;
      })
    );
    triggerToast(
      status === 'active' ? 'ग्राहक पुन्हा सक्रिय केला!' : 'ग्राहक तात्पुरता बंद केला.'
    );
  };

  // Handler: Delete Customer
  const handleDeleteCustomer = (customerId: string) => {
    const custToDelete = customers.find((c) => c.id === customerId);
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== customerId);
      if (selectedCustomerId === customerId) {
        setSelectedCustomerId(updated.length > 0 ? updated[0].id : '');
      }
      return updated;
    });

    // Clean up any deliveries recorded for this customer
    setDayDeliveries((prev) => {
      const updated = { ...prev };
      delete updated[customerId];
      Object.keys(updated).forEach((k) => {
        if (k.includes(customerId)) {
          delete updated[k];
        }
      });
      return updated;
    });

    triggerToast(`'${custToDelete?.name || 'ग्राहक'}' कायमचा काढून टाकला.`);
    deleteCustomerFromFirestore(customerId).catch((err) =>
      console.warn('Customer delete from cloud skipped:', err)
    );
    deleteCustomerDeliveriesFromFirestore(customerId).catch((err) =>
      console.warn('Customer delivery history delete from cloud skipped:', err)
    );
  };

  // Handler: Save or Update Advance Payment
  const handleSavePayment = (paymentData: {
    id?: string;
    amount: number;
    method: 'cash' | 'gpay' | 'bank';
    title: string;
    note: string;
  }) => {
    if (paymentData.id) {
      const existingPay = payments.find((p) => p.id === paymentData.id);
      const updatedPayments = payments.map((p) =>
        p.id === paymentData.id
          ? {
              ...p,
              amount: paymentData.amount,
              method: paymentData.method,
              title: paymentData.title,
              note: paymentData.note,
            }
          : p
      );
      setPayments(updatedPayments);
      const updatedPayment: PaymentRecord = {
        id: paymentData.id,
        customerId: existingPay?.customerId || selectedCustomerId,
        amount: paymentData.amount,
        dateStr: existingPay?.dateStr || getMarathiDateStr(),
        method: paymentData.method,
        title: paymentData.title,
        note: paymentData.note,
      };
      triggerToast(`₹${paymentData.amount} पेमेंट नोंद अद्ययावत केली!`);
      savePaymentToFirestore(updatedPayment).catch((err) =>
        console.warn('Payment update to cloud skipped:', err)
      );
      recomputeAndSaveCustomerDue(updatedPayment.customerId, updatedPayments);
    } else {
      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        customerId: selectedCustomerId,
        amount: paymentData.amount,
        dateStr: getMarathiDateStr(),
        method: paymentData.method,
        title: paymentData.title,
        note: paymentData.note,
      };
      const updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      triggerToast(`₹${paymentData.amount} ॲडव्हान्स जमा नोंदवले!`);
      savePaymentToFirestore(newPayment).catch((err) =>
        console.warn('Payment save to cloud skipped:', err)
      );
      recomputeAndSaveCustomerDue(newPayment.customerId, updatedPayments);
    }
    setPaymentToEdit(null);
  };

  // Handler: Delete Payment
  const handleDeletePayment = (paymentId: string) => {
    const payToDelete = payments.find((p) => p.id === paymentId);
    const updatedPayments = payments.filter((p) => p.id !== paymentId);
    setPayments(updatedPayments);
    triggerToast(`₹${payToDelete?.amount || ''} पेमेंट नोंद हटवली.`);
    deletePaymentFromFirestore(paymentId).catch((err) =>
      console.warn('Payment delete from cloud skipped:', err)
    );
    if (payToDelete) {
      recomputeAndSaveCustomerDue(payToDelete.customerId, updatedPayments);
    }
  };

  // Active customer for modals
  const activeCustomerForPicker = customers.find((c) => c.id === pricePicker.customerId) || null;
  const activeCustomerForReports =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Active customers who haven't been billed (WhatsApp or PDF) for the current month yet
  const currentMonthKey = getMonthKey();
  const billedCustomerIdsThisMonth = new Set(
    billingSentRecords.filter((r) => r.monthKey === currentMonthKey).map((r) => r.customerId)
  );
  const unbilledCustomerCount = customers.filter(
    (c) => c.status === 'active' && !billedCustomerIdsThisMonth.has(c.id)
  ).length;

  // Customers with a current outstanding balance. Reads each customer's
  // precomputed `currentDue` (kept up to date after every delivery/payment
  // change) instead of scanning delivery history here, so this stays cheap
  // regardless of how many years of history have accumulated.
  const overdueCustomers = customers
    .filter((c) => c.status === 'active' && (c.currentDue ?? 0) > 0)
    .map((c) => ({ id: c.id, name: c.name, due: c.currentDue ?? 0 }));

  const isBillingReminderActive = new Date().getDate() >= billingReminderDay && unbilledCustomerCount > 0;
  const notificationCount =
    (isBillingReminderActive ? 1 : 0) + (pendingDuesEnabled ? overdueCustomers.length : 0);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="app-shell app-content min-h-screen bg-gradient-to-b from-[#fff6ec] via-[#f8f9ff] to-[#eef1ff] text-[#0b1c30] flex flex-col selection:bg-[#a33900]/20">
      {/* Top Header */}
      <Header
        customerCount={customers.length}
        onClearAllData={handleClearAllData}
        onInstallPWA={install}
        isInstallable={isInstallable || isIOS}
        isInstalled={isInstalled}
        isCloudSynced={isCloudConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
        largeText={largeText}
        onToggleLargeText={toggleLargeText}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        billingReminderDay={billingReminderDay}
        onSetBillingReminderDay={handleSetBillingReminderDay}
        unbilledCount={unbilledCustomerCount}
        pendingDuesEnabled={pendingDuesEnabled}
        onTogglePendingDues={handleTogglePendingDues}
        notificationCount={notificationCount}
        onOpenNotifications={() => setShowNotifications(true)}
        onRecalculateAllDues={handleRecalculateAllDues}
      />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-20 px-3 max-w-md mx-auto">
        {/* PWA Install Banner on mobile/desktop browsers */}
        <PWAInstallBanner />

        {showWhatsAppInvoice && activeCustomerForReports ? (
          <WhatsAppInvoicePreview
            customer={activeCustomerForReports}
            totalTiffins={invoiceMetrics.totalTiffins}
            totalBill={invoiceMetrics.totalBill}
            paidAmount={invoiceMetrics.paidAmount}
            dueAmount={invoiceMetrics.dueAmount}
            totalLeaveDays={invoiceMetrics.totalLeaveDays}
            leaveDateKeys={invoiceMetrics.leaveDateKeys}
            noteEntries={invoiceMetrics.noteEntries}
            monthStr={getMarathiMonthYearStr()}
            payments={payments}
            onBack={() => setShowWhatsAppInvoice(false)}
            onMarkBillSent={() => handleMarkBillSent(activeCustomerForReports.id)}
          />
        ) : activeTab === 'today' ? (
          <TodayScreen
            customers={customers}
            dayDeliveries={dayDeliveries}
            onOpenPricePicker={handleOpenPricePicker}
            onAddFirstCustomer={() => {
              setActiveTab('customers');
              setCustomerToEdit(null);
              setCustomerModalOpen(true);
            }}
            onOpenEditModal={(cust) => {
              setCustomerToEdit(cust);
              setCustomerModalOpen(true);
            }}
            onDeleteCustomer={handleDeleteCustomer}
            onBatchMarkSession={handleBatchMarkSession}
            holidays={holidays}
            onDeclareHoliday={handleDeclareHoliday}
            onEditHoliday={handleEditHoliday}
            onCancelHoliday={handleCancelHoliday}
          />
        ) : activeTab === 'customers' ? (
          <CustomersScreen
            customers={customers}
            dayDeliveries={dayDeliveries}
            onOpenAddModal={() => {
              setCustomerToEdit(null);
              setCustomerModalOpen(true);
            }}
            onOpenEditModal={(cust) => {
              setCustomerToEdit(cust);
              setCustomerModalOpen(true);
            }}
            onToggleCustomerStatus={handleToggleCustomerStatus}
            onDeleteCustomer={handleDeleteCustomer}
            onMarkLeaveRange={handleMarkLeaveRange}
            onClearLeaveRange={handleClearLeaveRange}
          />
        ) : (
          <ReportsScreen
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            payments={payments}
            dayDeliveries={dayDeliveries}
            onOpenAdvancePaymentModal={() => {
              setPaymentToEdit(null);
              setAdvanceModalOpen(true);
            }}
            onEditPayment={(payment) => {
              setPaymentToEdit(payment);
              setAdvanceModalOpen(true);
            }}
            onDeletePayment={handleDeletePayment}
            onAddCustomer={() => {
              setActiveTab('customers');
              setCustomerToEdit(null);
              setCustomerModalOpen(true);
            }}
            onOpenWhatsAppInvoice={(metrics) => {
              setInvoiceMetrics(metrics);
              setShowWhatsAppInvoice(true);
            }}
            onMarkBillSent={handleMarkBillSent}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {!showWhatsAppInvoice && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setShowWhatsAppInvoice(false);
            setActiveTab(tab);
          }}
        />
      )}

      {/* Notifications Center - billing reminder + pending dues, opened via the header bell */}
      <NotificationsScreen
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        isBillingReminderActive={isBillingReminderActive}
        unbilledCount={unbilledCustomerCount}
        pendingDuesEnabled={pendingDuesEnabled}
        overdueCustomers={overdueCustomers}
        onGoToReports={(customerId) => {
          setShowNotifications(false);
          if (customerId) setSelectedCustomerId(customerId);
          setActiveTab('reports');
        }}
      />

      {/* Price Picker Bottom Sheet Modal */}
      <PricePickerModal
        isOpen={pricePicker.isOpen}
        customer={activeCustomerForPicker}
        session={pricePicker.session}
        currentPrice={pricePicker.currentPrice}
        currentStatus={pricePicker.currentStatus}
        currentDietType={pricePicker.currentDietType}
        currentLabel={pricePicker.currentLabel}
        currentExtras={pricePicker.currentExtras}
        dateStr={pricePicker.formattedDateStr}
        extraItems={extraItems}
        onSaveExtraItem={handleSaveExtraItem}
        onDeleteExtraItem={handleDeleteExtraItem}
        onClose={() => setPricePicker((prev) => ({ ...prev, isOpen: false }))}
        onConfirmDelivery={handleConfirmDelivery}
        onMarkLeave={handleMarkLeave}
        onClearMark={handleClearMark}
      />

      {/* Customer Add / Edit Bottom Sheet Modal */}
      <CustomerModal
        isOpen={customerModalOpen}
        customerToEdit={customerToEdit}
        onClose={() => {
          setCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />

      {/* Advance Payment Bottom Sheet Modal */}
      <AdvancePaymentModal
        isOpen={advanceModalOpen}
        customer={activeCustomerForReports}
        dueAmount={invoiceMetrics.dueAmount}
        paymentToEdit={paymentToEdit}
        onClose={() => {
          setAdvanceModalOpen(false);
          setPaymentToEdit(null);
        }}
        onSavePayment={handleSavePayment}
        onDeletePayment={handleDeletePayment}
      />

      {/* Delightful Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 z-50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-[#213145] text-[#eaf1ff] px-4 py-2 rounded-full shadow-xl flex items-center gap-2 font-label-md text-[13px] border border-white/10">
            <span className="material-symbols-outlined text-[#7cf994] text-[18px]">verified</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Offline Status Alert */}
      <OfflineIndicator />
    </div>
  );
}
