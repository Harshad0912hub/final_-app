import { Customer, DayDelivery, PaymentRecord } from '../types';

/**
 * Exports a clean, UTF-8 encoded CSV file suitable for Microsoft Excel and Google Sheets
 */
export function exportMonthlyCrossCheckCSV(
  customers: Customer[],
  monthStr: string,
  payments: PaymentRecord[],
  dayDeliveries?: Record<string, DayDelivery>
) {
  const headers = [
    'अनुक्रमांक (Sr)',
    'ग्राहकाचे नाव (Customer Name)',
    'मोबाईल (Phone)',
    'पत्ता (Address)',
    'जेवणाची वेळ (Meal Timing)',
    'अन्न प्रकार (Diet Type)',
    'नियमित दर (Rate/Tiffin)',
    'एकूण डबे (Total Tiffins)',
    'एकूण बिल (Total Bill Rs)',
    'जमा ऍडव्हान्स (Paid Rs)',
    'उर्वरित बाकी (Due Rs)',
    'स्थिती (Status)',
  ];

  const rows: (string | number)[][] = [];

  let grandTiffins = 0;
  let grandBilled = 0;
  let grandPaid = 0;
  let grandDue = 0;

  customers.forEach((c, index) => {
    const custPayments = payments.filter((p) => p.customerId === c.id);
    const paid = custPayments.reduce((acc, p) => acc + p.amount, 0);

    let tiffins = 0;
    let bill = 0;

    if (dayDeliveries) {
      const allDels = (Object.values(dayDeliveries) as DayDelivery[]).filter(Boolean);
      const custDeliveries = allDels.filter((del) => del.customerId === c.id);
      const dateMap: Record<string, DayDelivery> = {};
      custDeliveries.forEach((del) => {
        const key = del.dateKey || '2026-09-09';
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

    grandTiffins += tiffins;
    grandBilled += bill;
    grandPaid += paid;
    grandDue += due;

    const timingLabel =
      c.mealTiming === 'both'
        ? 'दोन वेळ (Lunch + Dinner)'
        : c.mealTiming === 'morning'
        ? 'सकाळ (Lunch)'
        : 'संध्याकाळ (Dinner)';

    const dietLabel = c.dietType === 'non-veg' ? 'मांसाहारी (Non-Veg)' : 'शाकाहारी (Veg)';

    rows.push([
      index + 1,
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone || '-',
      `"${(c.address || c.shortAddress || '').replace(/"/g, '""')}"`,
      `"${timingLabel}"`,
      dietLabel,
      c.ratePerTiffin,
      tiffins,
      bill,
      paid,
      due,
      c.status === 'active' ? 'सक्रिय (Active)' : 'बंद (Inactive)',
    ]);
  });

  // Summary row
  rows.push([
    'एकूण (Total)',
    `"${customers.length} ग्राहक"`,
    '',
    '',
    '',
    '',
    '',
    grandTiffins,
    grandBilled,
    grandPaid,
    grandDue,
    '',
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM so Excel opens Marathi text properly
    headers.join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanMonthName = (monthStr || 'September_2026').replace(/\s+/g, '_');
  link.setAttribute('download', `Shravani_Tiffin_Report_${cleanMonthName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
