export type Language = 'mr' | 'en';

export const MARATHI_DAYS = [
  'रविवार',
  'सोमवार',
  'मंगळवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार',
];

export const ENGLISH_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const MARATHI_MONTHS = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toMarathiDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => MARATHI_DIGITS[parseInt(d, 10)]);
}

export function formatNumberByLang(num: number | string, lang: Language): string {
  if (lang === 'mr') {
    return toMarathiDigits(num);
  }
  return String(num);
}

export const TRANSLATIONS = {
  // App Identity
  appName: {
    mr: 'श्रावणी टिफीन सेंटर',
    en: 'Shravani Tiffin Center',
  },
  appTagline: {
    mr: 'दैनिक वाटप व हिशोब',
    en: 'Daily Delivery & Accounts',
  },
  
  // Navigation
  tabToday: {
    mr: 'आज',
    en: 'Today',
  },
  tabCustomers: {
    mr: 'ग्राहक',
    en: 'Customers',
  },
  tabReports: {
    mr: 'अहवाल',
    en: 'Reports',
  },

  // Header & Menu
  dataManagement: {
    mr: 'डेटा व्यवस्थापन',
    en: 'Data Management',
  },
  totalCustomers: {
    mr: 'एकूण ग्राहक',
    en: 'Total Customers',
  },
  clearAllData: {
    mr: 'सर्व डेटा हटवा',
    en: 'Clear All Data',
  },
  loadSampleData: {
    mr: 'नमुना डेटा लोड करा',
    en: 'Load Demo Data',
  },
  switchLanguage: {
    mr: 'इंग्रजी भाषा (English)',
    en: 'मराठी भाषा (Marathi)',
  },
  clearDataConfirmTitle: {
    mr: 'सर्व डेटा हटवायचा आहे का?',
    en: 'Delete all data?',
  },
  clearDataConfirmMsg: {
    mr: 'सर्व ग्राहक, रोजच्या डिलिव्हरी नोंदी आणि जमा पावत्या कायमस्वरूपी हटवल्या जातील.',
    en: 'All customers, daily delivery records, and payment history will be permanently deleted.',
  },
  cancel: {
    mr: 'रद्द करा',
    en: 'Cancel',
  },
  confirmDelete: {
    mr: 'हो, हटवा',
    en: 'Yes, Delete',
  },
  notificationTitle: {
    mr: 'सूचना',
    en: 'Notification',
  },
  notificationMsg: {
    mr: 'सर्व डिलिव्हरी अद्ययावत आहेत.',
    en: 'All deliveries are up to date.',
  },

  // Today Screen
  todaysDeliveries: {
    mr: 'आजचे वाटप',
    en: "Today's Delivery",
  },
  planned: {
    mr: 'नियोजित',
    en: 'Planned',
  },
  morning: {
    mr: 'सकाळ',
    en: 'Morning',
  },
  evening: {
    mr: 'संध्याकाळ',
    en: 'Evening',
  },
  collected: {
    mr: 'जमा',
    en: 'Collected',
  },
  pendingAmount: {
    mr: 'बाकी',
    en: 'Pending',
  },
  filterAll: {
    mr: 'सर्व ग्राहक',
    en: 'All Customers',
  },
  filterPending: {
    mr: 'बाकी',
    en: 'Pending',
  },
  filterDone: {
    mr: 'झालेले',
    en: 'Done',
  },
  noCustomersAddedYet: {
    mr: 'अजून एकही ग्राहक जोडलेला नाही',
    en: 'No customers added yet',
  },
  noCustomersDesc: {
    mr: 'श्रावणी टिफीन सेंटरमध्ये नवीन ग्राहकांची नावे जोडा आणि रोजचे सकाळ-संध्याकाळचे डबे एका क्लिकवर नोंदवा.',
    en: 'Add customers to record daily morning & evening tiffins and track accounts with one tap.',
  },
  addFirstCustomer: {
    mr: 'पहिला ग्राहक जोडा',
    en: 'Add First Customer',
  },
  noCustomersInFilter: {
    mr: 'ह्या फिल्टरमध्ये कोणताही ग्राहक नाही',
    en: 'No customers found in this filter',
  },
  showAllCustomers: {
    mr: 'सर्व ग्राहक दाखवा',
    en: 'Show all customers',
  },
  mealBoth: {
    mr: 'दोन वेळ (सकाळ + संध्याकाळ)',
    en: 'Both (Morning + Evening)',
  },
  mealMorning: {
    mr: 'फक्त दुपार डबा',
    en: 'Lunch Only',
  },
  mealNight: {
    mr: 'फक्त संध्याकाळ डबा',
    en: 'Dinner Only',
  },
  dietVeg: {
    mr: 'शाकाहारी',
    en: 'Veg',
  },
  dietNonVeg: {
    mr: 'मांसाहारी',
    en: 'Non-Veg',
  },
  statusDelivered: {
    mr: 'डबा दिला',
    en: 'Delivered',
  },
  statusLeave: {
    mr: 'रजा',
    en: 'Leave',
  },
  statusPending: {
    mr: 'नोंद बाकी',
    en: 'Pending',
  },
  actionDeliver: {
    mr: 'डबा वितरित',
    en: 'Deliver',
  },
  actionLeave: {
    mr: 'रजा',
    en: 'Leave',
  },
  actionChangeRate: {
    mr: 'दर',
    en: 'Rate',
  },
  actionReset: {
    mr: 'रद्द',
    en: 'Reset',
  },

  // Customers Screen
  customerList: {
    mr: 'ग्राहक यादी',
    en: 'Customer List',
  },
  activeCustomersCount: {
    mr: 'सक्रिय ग्राहक',
    en: 'Active Customers',
  },
  searchPlaceholder: {
    mr: 'नाव किंवा पत्त्यावरून शोधा...',
    en: 'Search by name or address...',
  },
  addNewCustomer: {
    mr: 'नवीन ग्राहक जोडा',
    en: 'Add New Customer',
  },
  newCustomer: {
    mr: 'नवीन ग्राहक',
    en: 'New Customer',
  },
  searchCustomerPlaceholder: {
    mr: 'नाव किंवा पत्त्यावरून शोधा...',
    en: 'Search by name or address...',
  },
  filterStatusAll: {
    mr: 'सर्व',
    en: 'All',
  },
  filterStatusActive: {
    mr: 'सक्रिय',
    en: 'Active',
  },
  filterStatusInactive: {
    mr: 'बंद',
    en: 'Inactive',
  },
  callCustomer: {
    mr: 'कॉल करा',
    en: 'Call',
  },
  editCustomer: {
    mr: 'संपादन',
    en: 'Edit',
  },
  addressLabel: {
    mr: 'पत्ता',
    en: 'Address',
  },
  timingLabel: {
    mr: 'वेळ',
    en: 'Timing',
  },
  rateLabel: {
    mr: 'दर',
    en: 'Rate',
  },
  perTiffin: {
    mr: '/ डबा',
    en: '/ tiffin',
  },
  noteLabel: {
    mr: 'सूचना',
    en: 'Note',
  },
  monthlyEst: {
    mr: 'अंदाजे महिना',
    en: 'Approx Monthly',
  },
  markActive: {
    mr: 'सक्रिय करा',
    en: 'Make Active',
  },
  markInactive: {
    mr: 'डबा बंद करा',
    en: 'Stop Service',
  },
  customerSaved: {
    mr: 'ग्राहक माहिती जतन केली!',
    en: 'Customer information saved!',
  },
  customerDeleted: {
    mr: 'ग्राहक हटवला गेला!',
    en: 'Customer removed!',
  },

  // Reports Screen
  monthlyReports: {
    mr: 'मासिक हिशोब',
    en: 'Monthly Accounts',
  },
  selectCustomerPrompt: {
    mr: 'ग्राहक निवडा',
    en: 'Select Customer',
  },
  totalTiffins: {
    mr: 'एकूण टिफीन',
    en: 'Total Tiffins',
  },
  leaveDays: {
    mr: 'रजा दिवस',
    en: 'Leave Days',
  },
  totalBill: {
    mr: 'एकूण बिल',
    en: 'Total Bill',
  },
  advancePaid: {
    mr: 'जमा (ॲडव्हान्स)',
    en: 'Paid (Advance)',
  },
  dueAmount: {
    mr: 'उर्वरित बाकी',
    en: 'Balance Due',
  },
  sendWhatsAppBill: {
    mr: 'व्हॉट्सॲप पावती पाठवा',
    en: 'Share WhatsApp Bill',
  },
  recordAdvancePayment: {
    mr: 'ॲडव्हान्स जमा करा',
    en: 'Add Advance Payment',
  },
  paymentHistory: {
    mr: 'जमा पावत्या इतिहास',
    en: 'Payment Receipt History',
  },
  noPaymentHistory: {
    mr: 'या ग्राहकाची कोणतीही ॲडव्हान्स पावती उपलब्ध नाही.',
    en: 'No advance payment receipts for this customer yet.',
  },
  noCustomersForReports: {
    mr: 'कोणताही ग्राहक उपलब्ध नाही',
    en: 'No customer available',
  },
  noCustomersReportsDesc: {
    mr: 'मासिक बिल, ॲडव्हान्स जमा आणि व्हॉट्सॲप पावती पाहण्यासाठी प्रथम ग्राहक जोडा.',
    en: 'Add a customer first to view monthly bills, payments, and WhatsApp receipts.',
  },

  // Customer Modal
  customerModalTitleNew: {
    mr: 'नवीन ग्राहक जोडा',
    en: 'Add New Customer',
  },
  customerModalTitleEdit: {
    mr: 'ग्राहक माहिती संपादन',
    en: 'Edit Customer Details',
  },
  fullName: {
    mr: 'ग्राहकाचे पूर्ण नाव',
    en: 'Full Name',
  },
  fullNamePlaceholder: {
    mr: 'उदा. सचिन पाटील',
    en: 'e.g. Sachin Patil',
  },
  phone: {
    mr: 'मोबाईल नंबर',
    en: 'Mobile Number',
  },
  address: {
    mr: 'पत्ता / फ्लॅट नं / परिसर',
    en: 'Address / Flat No / Area',
  },
  addressPlaceholder: {
    mr: 'उदा. फ्लॅट ३०२, साई रेसिडेन्सी, कोथरूड',
    en: 'e.g. Flat 302, Sai Residency, Kothrud',
  },
  mealTimingHeading: {
    mr: 'डबा वेळ व स्वरूप',
    en: 'Meal Timing & Sessions',
  },
  ratePerTiffinField: {
    mr: 'प्रति टिफीन दर (₹)',
    en: 'Rate Per Tiffin (₹)',
  },
  dietTypeField: {
    mr: 'अन्न प्रकार',
    en: 'Diet Type',
  },
  specialNoteField: {
    mr: 'विशेष सूचना / पसंती',
    en: 'Special Instructions / Preferences',
  },
  specialNotePlaceholder: {
    mr: 'उदा. कमी तिखट, २ चपात्या, भात नको',
    en: 'e.g. Less spicy, 2 extra rotis, no rice',
  },
  saveCustomerBtn: {
    mr: 'ग्राहक जतन करा',
    en: 'Save Customer',
  },
  deleteCustomerBtn: {
    mr: 'ग्राहक हटवा',
    en: 'Delete Customer',
  },
  deleteConfirm: {
    mr: 'खात्री आहे का? हा ग्राहक कायमचा काढायचा आहे?',
    en: 'Are you sure you want to permanently delete this customer?',
  },

  // Advance Payment Modal
  advanceModalTitle: {
    mr: 'ॲडव्हान्स पेमेंट नोंदणी',
    en: 'Record Advance Payment',
  },
  amountPrompt: {
    mr: 'जमा रक्कम (₹)',
    en: 'Received Amount (₹)',
  },
  paymentMethod: {
    mr: 'पेमेंट प्रकार',
    en: 'Payment Mode',
  },
  methodCash: {
    mr: 'रोख रक्कम (Cash)',
    en: 'Cash',
  },
  methodGpay: {
    mr: 'गुगल पे / UPI',
    en: 'Google Pay / UPI',
  },
  methodBank: {
    mr: 'बँक ट्रान्सफर (NEFT/IMPS)',
    en: 'Bank Transfer',
  },
  receiptNote: {
    mr: 'पावती शेरा / महिना',
    en: 'Receipt Note / Month',
  },
  savePaymentBtn: {
    mr: 'पावती जमा करा',
    en: 'Save Payment Receipt',
  },
  paymentSavedToast: {
    mr: 'पेमेंट यशस्वीपणे नोंदवले गेले!',
    en: 'Payment recorded successfully!',
  },

  // Price Picker Modal
  pricePickerTitle: {
    mr: 'डबा नोंदणी व दर',
    en: 'Tiffin Log & Rate',
  },
  pricePickerSub: {
    mr: 'आजचा डबा वितरित नोंदवा किंवा दर बदला',
    en: 'Mark today delivery or change custom rate',
  },
  selectRate: {
    mr: 'दर निवडा (रुपये):',
    en: 'Select Rate (₹):',
  },
  customRateBtn: {
    mr: 'इतर सानुकूल दर',
    en: 'Custom Rate',
  },
  markDeliveredBtn: {
    mr: 'डबा वितरित नोंदवा',
    en: 'Mark Delivered',
  },
  markLeaveBtn: {
    mr: 'आज रजा नोंदवा',
    en: 'Mark as Leave',
  },
  clearRecordBtn: {
    mr: 'डिलिव्हरी नोंद हटवा',
    en: 'Clear Record',
  },

  // WhatsApp Preview
  downloadSinglePdf: {
    mr: 'PDF बिल डाऊनलोड',
    en: 'Download Bill PDF',
  },
  downloadAllPdf: {
    mr: 'संपूर्ण महिन्याचा हिशोब PDF',
    en: 'Download Full Month Audit PDF',
  },
  crossCheckTitle: {
    mr: 'महिन्याचा क्रॉस-चेक अहवाल (PDF)',
    en: 'Monthly Cross-Check Audit (PDF)',
  },
  crossCheckSubtitle: {
    mr: 'सर्व ग्राहकांचे डबे, एकूण बिल, ॲडव्हान्स आणि बाकी हिशोब',
    en: 'All customers tiffins, billing, advance & balance',
  },
  clearSamplePrompt: {
    mr: 'सध्या नमुना (Demo) डेटा दिसत आहे',
    en: 'Currently showing demo dummy data',
  },
  clearSampleBtn: {
    mr: 'खरे ग्राहक सुरू करा (Clear Demo)',
    en: 'Start Real Customers (Clear Demo)',
  },
  whatsappTitle: {
    mr: 'व्हॉट्सॲप बिल पावती',
    en: 'WhatsApp Bill Receipt',
  },
  copyMessage: {
    mr: 'मजकूर कॉपी करा',
    en: 'Copy Message',
  },
  copiedSuccess: {
    mr: 'कॉपी झाले!',
    en: 'Copied!',
  },
  sendDirectWhatsApp: {
    mr: 'व्हॉट्सॲपवर पाठवा',
    en: 'Send on WhatsApp',
  },
  editText: {
    mr: 'मजकूर संपादित करा',
    en: 'Edit Text',
  },
  saveChanges: {
    mr: 'बदल जतन करा',
    en: 'Save Changes',
  },
  thankYouMsg: {
    mr: 'धन्यवाद!',
    en: 'Thank you!',
  },
  tiffinBillHeader: {
    mr: 'श्रावणी टिफीन सेंटर\nमो. 9823784142',
    en: 'Shravani Tiffin Center\nMob. 9823784142',
  },
  inactiveCustomers: {
    mr: 'निष्क्रिय ग्राहक',
    en: 'Inactive Customers',
  },
  activeCustomers: {
    mr: 'सक्रिय ग्राहक',
    en: 'Active Customers',
  },
  statusActive: {
    mr: 'सक्रिय',
    en: 'Active',
  },
  statusInactive: {
    mr: 'निष्क्रिय',
    en: 'Inactive',
  },
  mealTimingBoth: {
    mr: 'दोन्ही वेळ (दुपार + रात्र)',
    en: 'Both (Day + Night)',
  },
  mealTimingMorning: {
    mr: 'फक्त दुपार',
    en: 'Morning Only',
  },
  mealTimingNight: {
    mr: 'फक्त रात्र',
    en: 'Night Only',
  },
  reactivateCustomer: {
    mr: 'पुन्हा सुरू करा',
    en: 'Reactivate',
  },
  selectCustomer: {
    mr: 'ग्राहक निवडा',
    en: 'Select Customer',
  },
  regularCustomer: {
    mr: 'नियमित ग्राहक',
    en: 'Regular Customer',
  },
  currentMonth: {
    mr: 'चालू महिना',
    en: 'Current Month',
  },
  totalLeaves: {
    mr: 'एकूण सुट्ट्या',
    en: 'Total Leaves',
  },
  totalAmount: {
    mr: 'एकूण रक्कम',
    en: 'Total Amount',
  },
  sendInvoiceWhatsapp: {
    mr: 'व्हॉट्सॲप बिल पावती पाठवा',
    en: 'Send WhatsApp Bill',
  },
  paymentLedger: {
    mr: 'पेमेंट जमा नोंदवही (लेजर)',
    en: 'Payment Ledger',
  },
  addAdvance: {
    mr: 'ऍडव्हान्स जमा करा',
    en: 'Add Advance',
  },
  paidLabel: {
    mr: 'जमा',
    en: 'Paid',
  },
  dayBreakdown: {
    mr: 'दररोजचा हिशोब व नोंदी',
    en: 'Daily Breakdown',
  },
  deliveredMeal: {
    mr: 'डबा दिला',
    en: 'Delivered',
  },
  leaveCancelled: {
    mr: 'सुट्टी',
    en: 'Leave',
  },
  sundayWeeklyOff: {
    mr: 'रविवार (साप्ताहिक सुट्टी)',
    en: 'Sunday (Weekly Off)',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

export function t(key: TranslationKey, lang: Language): string {
  const item = TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item.mr;
}
