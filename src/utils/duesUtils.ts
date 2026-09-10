import { Customer, DayDelivery, PaymentRecord } from '../types';

// Cumulative due through the end of `throughMonthPrefix` (inclusive): sums
// every delivered-tiffin bill from the customer's entire history up to that
// month, and subtracts every payment ever made. This is deliberately NOT
// scoped to a single month's bill in isolation - doing that (and comparing
// it against the same all-time payment total independently, per month)
// double-counts the same payments against every month checked, silently
// hiding real arrears whenever more than one month is unpaid. Since payments
// aren't tagged to a specific month, a running cumulative balance is the
// only way to get a genuinely correct "how much is still owed" figure.
export function computeCustomerCumulativeDueThroughMonth(
  customer: Customer,
  dayDeliveries: Record<string, DayDelivery>,
  payments: PaymentRecord[],
  throughMonthPrefix: string // 'YYYY-MM' inclusive cutoff
): number {
  const totalPaid = payments
    .filter((p) => p.customerId === customer.id)
    .reduce((acc, p) => acc + p.amount, 0);

  const byDateKey: Record<string, DayDelivery> = {};
  Object.values(dayDeliveries || {}).forEach((del) => {
    if (del && del.customerId === customer.id && del.dateKey) {
      byDateKey[del.dateKey] = del;
    }
  });

  let cumulativeBill = 0;
  Object.values(byDateKey).forEach((del) => {
    if (del.dateKey.slice(0, 7) > throughMonthPrefix) return;
    if (del.morning?.status === 'delivered') cumulativeBill += del.morning.price ?? customer.ratePerTiffin;
    if (del.evening?.status === 'delivered') cumulativeBill += del.evening.price ?? customer.ratePerTiffin;
  });

  return Math.max(0, cumulativeBill - totalPaid);
}
