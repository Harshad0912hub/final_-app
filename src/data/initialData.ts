import { Customer, DayDelivery, PaymentRecord } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_DAY_DELIVERIES: Record<string, DayDelivery> = {};

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

export const MARATHI_MONTHS = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

export const MARATHI_DAYS = [
  'रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरूवार', 'शुक्रवार', 'शनिवार'
];

export function toMarathiDigits(num: number | string): string {
  const map: Record<string, string> = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
  };
  return String(num).replace(/[0-9]/g, (w) => map[w] || w);
}
