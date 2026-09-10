import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { BillingSentRecord, BillingSettings, Customer, DayDelivery, ExtraItem, Holiday, PaymentRecord } from './types';
import { getTodayDateKey } from './utils/dateUtils';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId as required by Firebase skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test Connection on startup. Reads a sentinel doc under the "customers"
// collection because that's the only path the security rules actually allow
// (see firestore.rules) - a "test/connection" path would be denied by rules
// and wrongly report the app as offline even when the real data is reachable.
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, CUSTOMERS_COLLECTION, 'connection-test-sentinel'));
    console.log('Firebase connection verified');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local fallback');
    } else {
      console.warn('Firebase connection test note:', error);
    }
    return false;
  }
}

// Collections
const CUSTOMERS_COLLECTION = 'customers';
const DELIVERIES_COLLECTION = 'daily_deliveries';
const PAYMENTS_COLLECTION = 'payments';
const HOLIDAYS_COLLECTION = 'holidays';
const EXTRA_ITEMS_COLLECTION = 'extraItems';
const BILLING_SENT_COLLECTION = 'billingSent';
const APP_SETTINGS_COLLECTION = 'appSettings';
const BILLING_SETTINGS_DOC_ID = 'billing';

// Customer operations
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customer.id);
    await setDoc(docRef, {
      ...customer,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${CUSTOMERS_COLLECTION}/${customer.id}`);
  }
}

export async function deleteCustomerFromFirestore(customerId: string): Promise<void> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${CUSTOMERS_COLLECTION}/${customerId}`);
  }
}

export async function fetchCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const colRef = collection(db, CUSTOMERS_COLLECTION);
    const snap = await getDocs(colRef);
    const list: Customer[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Customer);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, CUSTOMERS_COLLECTION);
    return [];
  }
}

// Live subscription: fires immediately with current data, then again on every
// change from any device (this, or another install like a family member's).
export function subscribeToCustomers(onData: (customers: Customer[]) => void): Unsubscribe {
  const colRef = collection(db, CUSTOMERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Customer[] = [];
      snap.forEach((d) => list.push(d.data() as Customer));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, CUSTOMERS_COLLECTION)
  );
}

// Daily Deliveries
export async function saveDeliveryToFirestore(customerId: string, delivery: DayDelivery): Promise<void> {
  try {
    const docRef = doc(db, DELIVERIES_COLLECTION, `${delivery.dateKey}_${customerId}`);
    await setDoc(docRef, {
      ...delivery,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${DELIVERIES_COLLECTION}/${delivery.dateKey}_${customerId}`);
  }
}

export async function fetchDeliveriesFromFirestore(): Promise<Record<string, DayDelivery>> {
  try {
    const colRef = collection(db, DELIVERIES_COLLECTION);
    const snap = await getDocs(colRef);
    const result: Record<string, DayDelivery> = {};
    snap.forEach((d) => {
      const data = d.data() as DayDelivery;
      const key = `${data.dateKey || getTodayDateKey()}_${data.customerId}`;
      result[key] = data;
      // Also keep a bare customerId-keyed mirror, but only for a record that
      // actually IS today's - otherwise a customer with several days of
      // history (e.g. a multi-day leave range) would have some other day's
      // record wrongly picked up as "today" by consumers using this fallback.
      if (data.dateKey === getTodayDateKey()) {
        result[data.customerId] = data;
      }
    });
    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, DELIVERIES_COLLECTION);
    return {};
  }
}

export function subscribeToDeliveries(
  onData: (deliveries: Record<string, DayDelivery>) => void
): Unsubscribe {
  const colRef = collection(db, DELIVERIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const result: Record<string, DayDelivery> = {};
      snap.forEach((d) => {
        const data = d.data() as DayDelivery;
        const key = `${data.dateKey || getTodayDateKey()}_${data.customerId}`;
        result[key] = data;
        // See comment in fetchDeliveriesFromFirestore - only mirror a record
        // that actually IS today's, not whichever one is enumerated first.
        if (data.dateKey === getTodayDateKey()) {
          result[data.customerId] = data;
        }
      });
      onData(result);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, DELIVERIES_COLLECTION)
  );
}

// Payments
export async function savePaymentToFirestore(payment: PaymentRecord): Promise<void> {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, payment.id);
    await setDoc(docRef, {
      ...payment,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PAYMENTS_COLLECTION}/${payment.id}`);
  }
}

export async function deletePaymentFromFirestore(paymentId: string): Promise<void> {
  try {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PAYMENTS_COLLECTION}/${paymentId}`);
  }
}

export async function fetchPaymentsFromFirestore(): Promise<PaymentRecord[]> {
  try {
    const colRef = collection(db, PAYMENTS_COLLECTION);
    const snap = await getDocs(colRef);
    const list: PaymentRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as PaymentRecord);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, PAYMENTS_COLLECTION);
    return [];
  }
}

export function subscribeToPayments(onData: (payments: PaymentRecord[]) => void): Unsubscribe {
  const colRef = collection(db, PAYMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: PaymentRecord[] = [];
      snap.forEach((d) => list.push(d.data() as PaymentRecord));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, PAYMENTS_COLLECTION)
  );
}

// Holidays
export async function saveHolidayToFirestore(holiday: Holiday): Promise<void> {
  try {
    const docRef = doc(db, HOLIDAYS_COLLECTION, holiday.id);
    await setDoc(docRef, {
      ...holiday,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${HOLIDAYS_COLLECTION}/${holiday.id}`);
  }
}

export async function deleteHolidayFromFirestore(holidayId: string): Promise<void> {
  try {
    const docRef = doc(db, HOLIDAYS_COLLECTION, holidayId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${HOLIDAYS_COLLECTION}/${holidayId}`);
  }
}

export function subscribeToHolidays(onData: (holidays: Holiday[]) => void): Unsubscribe {
  const colRef = collection(db, HOLIDAYS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: Holiday[] = [];
      snap.forEach((d) => list.push(d.data() as Holiday));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, HOLIDAYS_COLLECTION)
  );
}

// Extra Items catalog (custom-priced extras like extra chapati, extra dabba, etc.)
export async function saveExtraItemToFirestore(item: ExtraItem): Promise<void> {
  try {
    const docRef = doc(db, EXTRA_ITEMS_COLLECTION, item.id);
    await setDoc(docRef, {
      ...item,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${EXTRA_ITEMS_COLLECTION}/${item.id}`);
  }
}

export async function deleteExtraItemFromFirestore(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, EXTRA_ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EXTRA_ITEMS_COLLECTION}/${itemId}`);
  }
}

export function subscribeToExtraItems(onData: (items: ExtraItem[]) => void): Unsubscribe {
  const colRef = collection(db, EXTRA_ITEMS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: ExtraItem[] = [];
      snap.forEach((d) => list.push(d.data() as ExtraItem));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, EXTRA_ITEMS_COLLECTION)
  );
}

// Billing reminder settings (which day of the month to show the reminder banner)
export async function saveBillingSettingsToFirestore(settings: BillingSettings): Promise<void> {
  try {
    const docRef = doc(db, APP_SETTINGS_COLLECTION, BILLING_SETTINGS_DOC_ID);
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${APP_SETTINGS_COLLECTION}/${BILLING_SETTINGS_DOC_ID}`);
  }
}

export function subscribeToBillingSettings(onData: (settings: BillingSettings | null) => void): Unsubscribe {
  const docRef = doc(db, APP_SETTINGS_COLLECTION, BILLING_SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      onData(snap.exists() ? (snap.data() as BillingSettings) : null);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `${APP_SETTINGS_COLLECTION}/${BILLING_SETTINGS_DOC_ID}`)
  );
}

// Billing-sent log (tracks which customer already got this month's bill, so the
// reminder banner only counts customers who genuinely haven't been billed yet)
export async function saveBillingSentToFirestore(record: BillingSentRecord): Promise<void> {
  try {
    const docRef = doc(db, BILLING_SENT_COLLECTION, record.id);
    await setDoc(docRef, record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${BILLING_SENT_COLLECTION}/${record.id}`);
  }
}

export function subscribeToBillingSent(onData: (records: BillingSentRecord[]) => void): Unsubscribe {
  const colRef = collection(db, BILLING_SENT_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const list: BillingSentRecord[] = [];
      snap.forEach((d) => list.push(d.data() as BillingSentRecord));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, BILLING_SENT_COLLECTION)
  );
}

// Clear all Firestore data
export async function clearFirestoreData(): Promise<void> {
  try {
    const batch = writeBatch(db);
    const customersSnap = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    customersSnap.forEach((d) => batch.delete(d.ref));

    const deliveriesSnap = await getDocs(collection(db, DELIVERIES_COLLECTION));
    deliveriesSnap.forEach((d) => batch.delete(d.ref));

    const paymentsSnap = await getDocs(collection(db, PAYMENTS_COLLECTION));
    paymentsSnap.forEach((d) => batch.delete(d.ref));

    const holidaysSnap = await getDocs(collection(db, HOLIDAYS_COLLECTION));
    holidaysSnap.forEach((d) => batch.delete(d.ref));

    const extraItemsSnap = await getDocs(collection(db, EXTRA_ITEMS_COLLECTION));
    extraItemsSnap.forEach((d) => batch.delete(d.ref));

    const billingSentSnap = await getDocs(collection(db, BILLING_SENT_COLLECTION));
    billingSentSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch-clear');
  }
}
