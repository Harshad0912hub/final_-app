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

export interface MealSessionRecord {
  status: DeliveryStatus;
  price: number;
  dietType?: DietType;
  label?: string;
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

export type ActiveTab = 'today' | 'customers' | 'reports';

export interface PricePickerState {
  isOpen: boolean;
  customerId: string;
  session: 'morning' | 'evening';
  currentPrice: number;
  currentStatus: DeliveryStatus;
  currentDietType?: DietType;
  dateKey?: string;
  formattedDateStr?: string;
}
