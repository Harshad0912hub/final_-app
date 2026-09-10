import { Customer, DayDelivery, PaymentRecord } from '../types';

// Same formula ReportsScreen already uses per selected customer/month:
// that month's delivered-tiffin bill total minus all payments ever recorded
// for that customer (payments act as a running advance against bills).
export function computeCustomerDueForMonth(
  customer: Customer,
  dayDeliveries: Record<string, DayDelivery>,
  payments: PaymentRecord[],
  monthPrefix: string // 'YYYY-MM'
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

  let totalBill = 0;
  Object.values(byDateKey).forEach((del) => {
    if (!del.dateKey.startsWith(monthPrefix)) return;
    if (del.morning?.status === 'delivered') totalBill += del.morning.price ?? customer.ratePerTiffin;
    if (del.evening?.status === 'delivered') totalBill += del.evening.price ?? customer.ratePerTiffin;
  });

  return Math.max(0, totalBill - totalPaid);
}

export function getPreviousMonthPrefix(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed
  const prevMonth = m === 0 ? 11 : m - 1;
  const prevYear = m === 0 ? y - 1 : y;
  return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
}
