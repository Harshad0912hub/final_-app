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
