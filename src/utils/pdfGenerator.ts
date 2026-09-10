import jsPDF from 'jspdf';
import { Customer, DayDelivery, PaymentRecord } from '../types';
import { getTodayDateKey } from './dateUtils';

export interface InvoiceMetrics {
  totalTiffins: number;
  totalBill: number;
  paidAmount: number;
  dueAmount: number;
  totalLeaveDays?: number;
  leaveDateKeys?: string[];
  noteEntries?: { dateKey: string; session: 'morning' | 'evening'; price: number; label: string }[];
}

const PDF_MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateKeyForPDF(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${PDF_MONTH_ABBREV[m - 1] || ''}`.trim();
}

/**
 * Cleanly format month strings for standard PDF fonts (e.g. 'सप्टेंबर २०२६' -> 'September 2026')
 */
export function formatBillingMonthForPDF(monthStr: string): string {
  if (!monthStr) return 'September 2026';
  const monthMap: Record<string, string> = {
    'जानेवारी': 'January',
    'फेब्रुवारी': 'February',
    'मार्च': 'March',
    'एप्रिल': 'April',
    'मे': 'May',
    'जून': 'June',
    'जुलै': 'July',
    'ऑगस्ट': 'August',
    'सप्टेंबर': 'September',
    'ऑक्टोबर': 'October',
    'नोव्हेंबर': 'November',
    'डिसेंबर': 'December',
  };
  let res = monthStr;
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  marathiDigits.forEach((d, i) => {
    res = res.replaceAll(d, String(i));
  });
  for (const [mr, en] of Object.entries(monthMap)) {
    res = res.replaceAll(mr, en);
  }
  return res.trim() || 'September 2026';
}

export function formatDateForPDF(dateStr: string): string {
  if (!dateStr) return new Date().toLocaleDateString('en-IN');
  return formatBillingMonthForPDF(dateStr);
}

export function formatPaymentTitleForPDF(title: string, method: string): string {
  if (!title) {
    return method === 'gpay' ? 'GPay Advance' : method === 'bank' ? 'Bank Transfer' : 'Cash Payment';
  }
  if (title.includes('रोख') || title.includes('कॅश') || title.toLowerCase().includes('cash')) {
    return 'Cash Payment';
  }
  if (title.includes('गुगल') || title.includes('GPay') || title.toLowerCase().includes('gpay')) {
    return 'GPay Advance';
  }
  if (title.includes('बँक') || title.includes('Bank') || title.toLowerCase().includes('bank')) {
    return 'Bank Transfer Payment';
  }
  if (title.includes('अग्रिम') || title.includes('हिशोब') || title.includes('जमा')) {
    return 'Advance Payment';
  }
  const clean = title.replace(/[^\x20-\x7E]/g, '').trim();
  return clean || (method === 'gpay' ? 'GPay Advance' : 'Cash Payment');
}

export function formatDietForPDF(dietType: string): string {
  if (dietType === 'non-veg') return 'Non-Veg';
  return 'Pure Veg';
}

/**
 * Generates and downloads a clean, professional Single Customer Bill PDF
 */
export function generateSingleInvoicePDF(
  customer: Customer,
  monthStr: string,
  metrics: InvoiceMetrics,
  customerPayments: PaymentRecord[]
) {
  const cleanMonth = formatBillingMonthForPDF(monthStr);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(163, 57, 0); // Primary Rust Orange (#a33900)
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SHRAVANI TIFFIN CENTER', pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Home Cooked, Fresh & Hygienic Daily Meals | Mob: 9823784142', pageWidth / 2, 23, {
    align: 'center',
  });
  doc.text('Monthly Delivery Invoice & Payment Statement', pageWidth / 2, 29, { align: 'center' });

  // Bill Meta Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`INVOICE DATE: ${new Date().toLocaleDateString('en-IN')}`, 14, 45);
  doc.text(`BILLING MONTH: ${cleanMonth}`, pageWidth - 14, 45, { align: 'right' });

  // Customer Details Box
  doc.setDrawColor(220, 230, 245);
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(14, 50, pageWidth - 28, 36, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 28, 48);
  doc.text(`Customer Name: ${customer.name}`, 20, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Phone Number: +91 ${customer.phone || 'N/A'}`, 20, 68);
  doc.text(`Delivery Address: ${customer.address || customer.shortAddress || 'Standard Delivery'}`, 20, 76);

  doc.setFont('helvetica', 'bold');
  doc.text(`Meal Plan: ${customer.mealTiming === 'both' ? 'Twice Daily (Lunch + Dinner)' : customer.mealTiming === 'morning' ? 'Morning Lunch Only' : 'Night Dinner Only'}`, pageWidth - 20, 60, { align: 'right' });
  doc.text(`Standard Rate: Rs. ${customer.ratePerTiffin} / tiffin`, pageWidth - 20, 68, { align: 'right' });
  doc.text(`Diet: ${formatDietForPDF(customer.dietType)}`, pageWidth - 20, 76, { align: 'right' });

  // Statement Summary Table Header
  let currentY = 96;
  doc.setFillColor(235, 242, 255);
  doc.rect(14, currentY, pageWidth - 28, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 28, 48);
  doc.text('Description / Details', 20, currentY + 6.5);
  doc.text('Rate', pageWidth - 80, currentY + 6.5, { align: 'right' });
  doc.text('Tiffins', pageWidth - 50, currentY + 6.5, { align: 'right' });
  doc.text('Total (Rs.)', pageWidth - 20, currentY + 6.5, { align: 'right' });

  // Table Row
  currentY += 10;
  doc.setDrawColor(230, 235, 245);
  doc.line(14, currentY, pageWidth - 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Tiffin Meal Deliveries (${cleanMonth})`, 20, currentY + 7);
  doc.text(`Rs. ${customer.ratePerTiffin}`, pageWidth - 80, currentY + 7, { align: 'right' });
  doc.text(`${metrics.totalTiffins}`, pageWidth - 50, currentY + 7, { align: 'right' });
  doc.text(`Rs. ${metrics.totalBill.toLocaleString('en-IN')}`, pageWidth - 20, currentY + 7, { align: 'right' });

  const hasLeaveDays = (metrics.totalLeaveDays ?? 0) > 0;
  if (hasLeaveDays) {
    currentY += 8;
    doc.setTextColor(141, 75, 0); // brownish accent, matches the app's holiday/leave color
    doc.text('Leave Days (not charged)', 20, currentY + 7);
    doc.text('-', pageWidth - 80, currentY + 7, { align: 'right' });
    doc.text(`${metrics.totalLeaveDays}`, pageWidth - 50, currentY + 7, { align: 'right' });
    doc.text('Rs. 0', pageWidth - 20, currentY + 7, { align: 'right' });

    if (metrics.leaveDateKeys && metrics.leaveDateKeys.length > 0) {
      currentY += 6;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 90, 60);
      const dateList = metrics.leaveDateKeys.map(formatDateKeyForPDF).join(', ');
      doc.text(`Leave dates: ${dateList}`, 20, currentY + 6, { maxWidth: pageWidth - 40 });
      doc.setFont('helvetica', 'normal');
    }
  }

  currentY += hasLeaveDays ? 18 : 12;
  doc.line(14, currentY, pageWidth - 14, currentY);

  // Financial Breakdown Box
  currentY += 6;
  const boxX = pageWidth - 100;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', boxX, currentY + 5);
  doc.text(`Rs. ${metrics.totalBill.toLocaleString('en-IN')}`, pageWidth - 20, currentY + 5, { align: 'right' });

  doc.text('Advance Received / Paid:', boxX, currentY + 12);
  doc.setTextColor(0, 110, 45); // Green
  doc.text(`- Rs. ${metrics.paidAmount.toLocaleString('en-IN')}`, pageWidth - 20, currentY + 12, { align: 'right' });

  // Due Highlight Bar
  currentY += 17;
  doc.setFillColor(255, 235, 230);
  doc.roundedRect(boxX - 5, currentY, 80 + 5, 12, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(186, 26, 26); // Alert Red
  doc.text('BALANCE DUE:', boxX, currentY + 8);
  doc.text(`Rs. ${metrics.dueAmount.toLocaleString('en-IN')}`, pageWidth - 20, currentY + 8, { align: 'right' });

  // Special Notes (custom-priced deliveries - extra chapati, extra dabba etc.)
  currentY += 22;
  if (metrics.noteEntries && metrics.noteEntries.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 28, 48);
    doc.text('Special Notes:', 14, currentY);

    currentY += 4;
    doc.setFontSize(9);
    metrics.noteEntries.forEach((entry) => {
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(141, 75, 0);
      const cleanDate = formatDateKeyForPDF(entry.dateKey);
      const sessionLabel = entry.session === 'morning' ? 'Morning' : 'Evening';
      doc.text(`- ${cleanDate} (${sessionLabel}, Rs. ${entry.price}): ${entry.label}`, 18, currentY);
    });
    currentY += 6;
  }

  // Payment History (if any)
  if (customerPayments && customerPayments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 28, 48);
    doc.text('Advance Payment Transactions:', 14, currentY);

    currentY += 4;
    doc.setFontSize(9);
    customerPayments.forEach((pay) => {
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const cleanDate = formatDateForPDF(pay.dateStr);
      const cleanTitle = formatPaymentTitleForPDF(pay.title, pay.method);
      doc.text(`- ${cleanDate} | ${cleanTitle} (${pay.method.toUpperCase()}): Rs. ${pay.amount}`, 18, currentY);
    });
  }

  // Payment Options & Verification
  currentY += 20;
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 28, 48);
  doc.text('Payment Instructions / Mode:', 20, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Google Pay / PhonePe / UPI: 9823784142 | Shravani Tiffin Center', 20, currentY + 14);
  doc.text('Please verify delivery count before making final settlement.', 20, currentY + 20);

  // Footer Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Customer Signature: __________________', 20, 270);
  doc.text('For Shravani Tiffin Center: Authorized Signatory', pageWidth - 20, 270, { align: 'right' });

  // Save PDF
  const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Shravani_Tiffin_Bill_${sanitizedName || 'Customer'}.pdf`);
}

/**
 * Generates and downloads the Master Monthly Audit & Cross-Check Report PDF
 * containing all customers, deliveries, revenue, advance collections, and pending dues.
 */
export function generateMonthlyCrossCheckPDF(
  customers: Customer[],
  monthStr: string,
  payments: PaymentRecord[],
  dayDeliveries?: Record<string, DayDelivery>
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  const cleanMonth = formatBillingMonthForPDF(monthStr);

  // Header Banner
  doc.setFillColor(163, 57, 0); // #a33900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SHRAVANI TIFFIN CENTER - MASTER MONTHLY AUDIT REPORT', pageWidth / 2, 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Month: ${cleanMonth} | Master Cross-Check Ledger | Contact: 9823784142`,
    pageWidth / 2,
    19,
    { align: 'center' }
  );

  // Meta stats calculation
  let grandTotalTiffins = 0;
  let grandTotalBilled = 0;
  let grandTotalPaid = 0;
  let grandTotalDue = 0;

  const rows = customers.map((c, index) => {
    const custPayments = payments.filter((p) => p.customerId === c.id);
    const paid = custPayments.reduce((acc, p) => acc + p.amount, 0);

    // Calculate real delivered tiffins & billing from dayDeliveries
    let tiffins = 0;
    let bill = 0;

    if (dayDeliveries) {
      const allDels = (Object.values(dayDeliveries) as DayDelivery[]).filter(Boolean);
      const custDeliveries = allDels.filter(
        (del) => del.customerId === c.id
      );
      const dateMap: Record<string, DayDelivery> = {};
      custDeliveries.forEach((del) => {
        const key = del.dateKey || getTodayDateKey();
        dateMap[key] = del;
      });

      Object.values(dateMap).forEach((del) => {
        if (del.morning?.status === 'delivered') {
          tiffins++;
          bill += del.morning.price ?? c.ratePerTiffin;
        }
        if (del.evening?.status === 'delivered') {
          tiffins++;
          bill += del.evening.price ?? c.ratePerTiffin;
        }
      });
    }

    const due = Math.max(0, bill - paid);

    grandTotalTiffins += tiffins;
    grandTotalBilled += bill;
    grandTotalPaid += paid;
    grandTotalDue += due;

    const dietStr = formatDietForPDF(c.dietType);
    const timingStr = c.mealTiming === 'both' ? 'Both (2x)' : c.mealTiming === 'morning' ? 'Lunch' : 'Dinner';

    return {
      sr: index + 1,
      name: c.name,
      phone: c.phone || '-',
      timing: `${timingStr} (${dietStr})`,
      rate: `Rs. ${c.ratePerTiffin}`,
      tiffins,
      bill,
      paid,
      due,
      status: c.status === 'active' ? 'Active' : 'Inactive',
    };
  });

  // KPI Summary Bar
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(10, 32, pageWidth - 20, 16, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 28, 48);

  const colWidth = (pageWidth - 20) / 5;
  doc.text(`TOTAL CUSTOMERS: ${customers.length}`, 15, 41);
  doc.text(`TOTAL TIFFINS: ${grandTotalTiffins}`, 15 + colWidth, 41);
  doc.text(`TOTAL BILLED: Rs. ${grandTotalBilled.toLocaleString('en-IN')}`, 15 + colWidth * 2, 41);
  doc.setTextColor(0, 110, 45);
  doc.text(`TOTAL ADVANCE: Rs. ${grandTotalPaid.toLocaleString('en-IN')}`, 15 + colWidth * 3, 41);
  doc.setTextColor(186, 26, 26);
  doc.text(`NET DUE: Rs. ${grandTotalDue.toLocaleString('en-IN')}`, 15 + colWidth * 4, 41);

  // Master Table
  let startY = 54;
  doc.setFillColor(230, 238, 250);
  doc.rect(10, startY, pageWidth - 20, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 28, 48);

  // Column Positions (Landscape A4: ~297mm width)
  const cPos = {
    sr: 14,
    name: 26,
    phone: 75,
    timing: 105,
    rate: 135,
    tiffins: 160,
    bill: 190,
    paid: 220,
    due: 250,
    status: 278,
  };

  doc.text('Sr.', cPos.sr, startY + 5.5);
  doc.text('Customer Name', cPos.name, startY + 5.5);
  doc.text('Phone', cPos.phone, startY + 5.5);
  doc.text('Meal Type', cPos.timing, startY + 5.5);
  doc.text('Rate/Tiffin', cPos.rate, startY + 5.5);
  doc.text('Tiffins', cPos.tiffins, startY + 5.5);
  doc.text('Total Bill', cPos.bill, startY + 5.5);
  doc.text('Advance Recd', cPos.paid, startY + 5.5);
  doc.text('Balance Due', cPos.due, startY + 5.5);
  doc.text('Status', cPos.status, startY + 5.5);

  startY += 8;

  // Table Data Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  rows.forEach((r, idx) => {
    // Check if new page needed
    if (startY > 185) {
      doc.addPage();
      startY = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 253);
      doc.rect(10, startY, pageWidth - 20, 7, 'F');
    }

    doc.setTextColor(50, 50, 50);
    doc.text(String(r.sr), cPos.sr, startY + 5);
    doc.text(r.name.slice(0, 26), cPos.name, startY + 5);
    doc.text(r.phone, cPos.phone, startY + 5);
    doc.text(r.timing, cPos.timing, startY + 5);
    doc.text(r.rate, cPos.rate, startY + 5);
    doc.text(String(r.tiffins), cPos.tiffins, startY + 5);
    doc.text(`Rs. ${r.bill}`, cPos.bill, startY + 5);
    doc.setTextColor(0, 110, 45);
    doc.text(`Rs. ${r.paid}`, cPos.paid, startY + 5);
    doc.setTextColor(r.due > 0 ? 186 : 50, r.due > 0 ? 26 : 50, r.due > 0 ? 26 : 50);
    doc.text(`Rs. ${r.due}`, cPos.due, startY + 5);
    doc.setTextColor(50, 50, 50);
    doc.text(r.status, cPos.status, startY + 5);

    startY += 7;
  });

  // Grand Total Summary Row
  startY += 2;
  doc.setFillColor(255, 235, 230);
  doc.rect(10, startY, pageWidth - 20, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(11, 28, 48);
  doc.text('GRAND TOTALS:', cPos.name, startY + 5.5);
  doc.text(String(grandTotalTiffins), cPos.tiffins, startY + 5.5);
  doc.text(`Rs. ${grandTotalBilled.toLocaleString('en-IN')}`, cPos.bill, startY + 5.5);
  doc.setTextColor(0, 110, 45);
  doc.text(`Rs. ${grandTotalPaid.toLocaleString('en-IN')}`, cPos.paid, startY + 5.5);
  doc.setTextColor(186, 26, 26);
  doc.text(`Rs. ${grandTotalDue.toLocaleString('en-IN')}`, cPos.due, startY + 5.5);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Report generated on ${new Date().toLocaleString('en-IN')} for Shravani Tiffin Center Month-End Verification.`,
    10,
    pageWidth > 200 ? 195 : 280
  );

  doc.save(`Shravani_Tiffin_Monthly_CrossCheck_${monthStr ? monthStr.replace(/\s+/g, '_') : 'Report'}.pdf`);
}
