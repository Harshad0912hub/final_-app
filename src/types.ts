export type MealTiming = 'both' | 'morning' | 'night';
export type DietType = 'veg' | 'non-veg';
export type CustomerStatus = 'active' | 'inactive';
export type DeliveryStatus = 'delivered' | 'pending' | 'leave';

export interface Customer {
  id: string;
  name: string;
  initial: string;
  phone: string;
  address: string;
  shortAddress: string;
  mealTiming: MealTiming;
  mealTimingLabel: string;
  ratePerTiffin: number;
  monthlyCharge: string;
  dietType: DietType;
  specialNote: string;
  status: CustomerStatus;
  deactivatedDate?: string;
  avatarBg: string;
}

export interface SelectedExtra {
  name: string;
  price: number;
}

export interface MealSessionRecord {
  status: DeliveryStatus;
  price: number;
  dietType?: DietType;
  label?: string;
  extras?: SelectedExtra[];
}

export interface DayDelivery {
  dateKey: string; // '2026-09-09'
  customerId: string;
  morning: MealSessionRecord;
  evening: MealSessionRecord;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  amount: number;
  dateStr: string;
  method: 'gpay' | 'cash' | 'bank';
  title: string;
  note?: string;
}

export interface Holiday {
  id: string;
  fromDateKey: string;
  toDateKey: string;
  reason: string;
  createdAt?: string;
}

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
  createdAt?: string;
}

export interface BillingSettings {
  reminderDay: number; // day of month (1-28) to show the billing reminder banner
  pendingDuesEnabled?: boolean; // show a banner naming customers whose previous month's dues are still unpaid
}

export interface BillingSentRecord {
  id: string; // `${customerId}_${monthKey}`
  customerId: string;
  monthKey: string; // 'YYYY-MM'
  sentAt: string;
}

export type ActiveTab = 'today' | 'customers' | 'reports';

export interface PricePickerState {
  isOpen: boolean;
  customerId: string;
  session: 'morning' | 'evening';
  currentPrice: number;
  currentStatus: DeliveryStatus;
  currentDietType?: DietType;
  currentLabel?: string;
  currentExtras?: SelectedExtra[];
  dateKey?: string;
  formattedDateStr?: string;
}
