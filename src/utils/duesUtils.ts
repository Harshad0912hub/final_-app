import { Customer, DayDelivery, PaymentRecord } from '../types';

// Computes a customer's true current balance (all delivered-tiffin bills
// ever, minus all payments ever) from their own full delivery history and
// payment list. Deliberately NOT scoped to any single month - a payment
// isn't tagged to a specific month's bill, so comparing one month's bill
// against the full payment total (independently, per month) double-counts
// the same payments against every month checked, silently hiding real
// arrears whenever more than one month is unpaid. A running cumulative
// balance is the only way to get a genuinely correct "how much is still
// owed" figure.
export function computeCustomerDueFromHistory(
  customer: Customer,
  deliveryHistory: DayDelivery[],
  payments: PaymentRecord[]
): number {
  const totalPaid = payments
    .filter((p) => p.customerId === customer.id)
    .reduce((acc, p) => acc + p.amount, 0);

  // Dedupe by dateKey in case a record is present more than once.
  const byDateKey: Record<string, DayDelivery> = {};
  deliveryHistory.forEach((del) => {
    if (del && del.customerId === customer.id && del.dateKey) {
      byDateKey[del.dateKey] = del;
    }
  });

  let totalBill = 0;
  Object.values(byDateKey).forEach((del) => {
    if (del.morning?.status === 'delivered') totalBill += del.morning.price ?? customer.ratePerTiffin;
    if (del.evening?.status === 'delivered') totalBill += del.evening.price ?? customer.ratePerTiffin;
  });

  return Math.max(0, totalBill - totalPaid);
}

const MARATHI_MONTH_NAMES = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const ENGLISH_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function getMonthLabel(monthPrefix: string, language: string): string {
  const [y, m] = monthPrefix.split('-').map(Number);
  const monthName = language === 'mr' ? MARATHI_MONTH_NAMES[m - 1] : ENGLISH_MONTH_NAMES[m - 1];
  const year = language === 'mr' ? String(y).split('').map((c) => MARATHI_DIGITS[+c] ?? c).join('') : String(y);
  return `${monthName} ${year}`;
}

export interface MonthlyDue {
  monthPrefix: string; // 'YYYY-MM'
  due: number;
}

// Breaks a customer's total outstanding balance down by month, oldest first,
// using the same FIFO logic real accounts-receivable aging uses: since
// payments aren't tagged to a specific month, the all-time payment pool is
// applied against each month's own bill in chronological order, so the
// oldest unpaid bills are considered "paid off first". Summing every
// month's returned `due` (across the customer's ENTIRE history, not just
// the months returned here) always equals computeCustomerDueFromHistory's
// result - this just shows WHICH months that total is coming from.
// `excludeMonthPrefix` (typically the month currently being viewed/billed)
// is left out of the returned list since its own bill is already shown
// separately - only genuinely PRIOR unpaid months are returned.
export function computeMonthlyDueBreakdown(
  customer: Customer,
  deliveryHistory: DayDelivery[],
  payments: PaymentRecord[],
  excludeMonthPrefix?: string
): MonthlyDue[] {
  const totalPaid = payments
    .filter((p) => p.customerId === customer.id)
    .reduce((acc, p) => acc + p.amount, 0);

  const byDateKey: Record<string, DayDelivery> = {};
  deliveryHistory.forEach((del) => {
    if (del && del.customerId === customer.id && del.dateKey) {
      byDateKey[del.dateKey] = del;
    }
  });

  const billByMonth: Record<string, number> = {};
  Object.values(byDateKey).forEach((del) => {
    const monthPrefix = del.dateKey.slice(0, 7);
    let dayBill = 0;
    if (del.morning?.status === 'delivered') dayBill += del.morning.price ?? customer.ratePerTiffin;
    if (del.evening?.status === 'delivered') dayBill += del.evening.price ?? customer.ratePerTiffin;
    if (dayBill > 0) billByMonth[monthPrefix] = (billByMonth[monthPrefix] || 0) + dayBill;
  });

  const orderedMonths = Object.keys(billByMonth).sort();
  let remainingPool = totalPaid;
  const result: MonthlyDue[] = [];

  orderedMonths.forEach((monthPrefix) => {
    const monthBill = billByMonth[monthPrefix];
    const due = Math.max(0, monthBill - remainingPool);
    remainingPool = Math.max(0, remainingPool - monthBill);
    if (monthPrefix !== excludeMonthPrefix && due > 0) {
      result.push({ monthPrefix, due });
    }
  });

  return result;
}
