/**
 * Kenya preset billers with bill presentment capability, categories, and reference formats.
 */

const BILLER_CATEGORY_LABELS = {
  utility: 'Utilities',
  telecom: 'Telecom & Internet',
  government: 'Government & Tax',
  insurance: 'Insurance',
  education: 'Education',
  other: 'Other',
};

/** Runtime store for user-added custom billers */
let customBillers = [];

function getCustomBillers() {
  return customBillers;
}

function addCustomBiller(biller) {
  if (!customBillers.find(b => b.id === biller.id)) {
    customBillers = [...customBillers, biller];
  }
}

function getAllBillers() {
  // Define PRESET_BILLERS first
  return [...PRESET_BILLERS, ...customBillers];
}

const PRESET_BILLERS = [
  {
    id: 'kplc-prepaid',
    name: 'Kenya Power (Prepaid)',
    shortName: 'KPLC Prepaid',
    category: 'utility',
    billerCode: '888880',
    supportsPresentment: false,
    referenceLabel: 'Meter Number',
    referencePattern: '^\\d{11,13}$',
    referencePlaceholder: 'e.g. 54321678901',
    icon: 'Zap',
    minAmount: 50,
    maxAmount: 500000,
  },
  {
    id: 'kplc-postpaid',
    name: 'Kenya Power (Postpaid)',
    shortName: 'KPLC Postpaid',
    category: 'utility',
    billerCode: '888888',
    supportsPresentment: true,
    referenceLabel: 'Account Number',
    referencePattern: '^\\d{7,10}$',
    referencePlaceholder: 'e.g. 7654321',
    icon: 'Zap',
    minAmount: 100,
    maxAmount: 1000000,
  },
  {
    id: 'nairobi-water',
    name: 'Nairobi Water & Sewerage',
    shortName: 'Nairobi Water',
    category: 'utility',
    billerCode: '444400',
    supportsPresentment: true,
    referenceLabel: 'Account Number',
    referencePlaceholder: 'e.g. NW-12345678',
    icon: 'Droplets',
    minAmount: 100,
    maxAmount: 500000,
  },
  {
    id: 'safaricom-postpaid',
    name: 'Safaricom Postpaid',
    shortName: 'Safaricom',
    category: 'telecom',
    billerCode: '100100',
    supportsPresentment: true,
    referenceLabel: 'Phone Number',
    referencePattern: '^0[17]\\d{8}$',
    referencePlaceholder: 'e.g. 0712345678',
    icon: 'Smartphone',
    minAmount: 10,
    maxAmount: 100000,
  },
  {
    id: 'zuku',
    name: 'Zuku Internet & TV',
    shortName: 'Zuku',
    category: 'telecom',
    billerCode: '320320',
    supportsPresentment: true,
    referenceLabel: 'Account Number',
    referencePlaceholder: 'e.g. ZK-1234567',
    icon: 'Wifi',
    minAmount: 500,
    maxAmount: 50000,
  },
  {
    id: 'dstv',
    name: 'DSTV / Multichoice',
    shortName: 'DSTV',
    category: 'telecom',
    billerCode: '444000',
    supportsPresentment: true,
    referenceLabel: 'Smart Card Number',
    referencePlaceholder: 'e.g. 1234567890',
    icon: 'Tv',
    minAmount: 500,
    maxAmount: 30000,
  },
  {
    id: 'kra',
    name: 'Kenya Revenue Authority',
    shortName: 'KRA',
    category: 'government',
    billerCode: '572572',
    supportsPresentment: true,
    referenceLabel: 'Payment Registration Number (PRN)',
    referencePlaceholder: 'e.g. PRN-2024-123456',
    icon: 'Landmark',
    minAmount: 1,
    maxAmount: 50000000,
  },
  {
    id: 'nhif',
    name: 'NHIF (SHA)',
    shortName: 'NHIF',
    category: 'government',
    billerCode: '200222',
    supportsPresentment: true,
    referenceLabel: 'NHIF Number',
    referencePattern: '^\\d{8,10}$',
    referencePlaceholder: 'e.g. 12345678',
    icon: 'HeartPulse',
    minAmount: 500,
    maxAmount: 100000,
  },
  {
    id: 'jubilee-insurance',
    name: 'Jubilee Insurance',
    shortName: 'Jubilee',
    category: 'insurance',
    billerCode: '333222',
    supportsPresentment: true,
    referenceLabel: 'Policy Number',
    referencePlaceholder: 'e.g. JIL-2024-001234',
    icon: 'Shield',
    minAmount: 500,
    maxAmount: 5000000,
  },
  {
    id: 'university-nairobi',
    name: 'University of Nairobi',
    shortName: 'UoN',
    category: 'education',
    billerCode: '517517',
    supportsPresentment: true,
    referenceLabel: 'Registration Number',
    referencePlaceholder: 'e.g. F17/1234/2024',
    icon: 'GraduationCap',
    minAmount: 1000,
    maxAmount: 2000000,
  },
];

/** Simulated bill presentment lookup */
function fetchBillPresentment(billerId, reference) {
  const biller = PRESET_BILLERS.find(b => b.id === billerId);
  if (!biller || !biller.supportsPresentment || !reference.trim()) return null;

  // Simulated presentment data
  const now = new Date();
  const dueDate = new Date(now.getTime() + 14 * 86400000);
  const lastMonth = new Date(now.getTime() - 30 * 86400000);

  const amounts = {
    'kplc-postpaid': 4850,
    'nairobi-water': 2340,
    'safaricom-postpaid': 1250,
    'zuku': 4999,
    'dstv': 5500,
    'kra': 125000,
    'nhif': 1700,
    'jubilee-insurance': 15800,
    'university-nairobi': 85000,
  };

  return {
    billerName: biller.name,
    referenceNumber: reference,
    accountHolder: 'Demo Customer',
    outstandingAmount: amounts[billerId] || 5000,
    dueDate: dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    billPeriod: `${lastMonth.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} — ${now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
    lastPayment: {
      amount: (amounts[billerId] || 5000) * 0.9,
      date: lastMonth.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
  };
}

const RECURRENCE_LABELS = {
  weekly: 'Every Week',
  monthly: 'Every Month',
  quarterly: 'Every 3 Months',
  annually: 'Every Year',
};

// Export everything for use in React components
export {
  BILLER_CATEGORY_LABELS,
  PRESET_BILLERS,
  customBillers,
  getCustomBillers,
  addCustomBiller,
  getAllBillers,
  fetchBillPresentment,
  RECURRENCE_LABELS,
};
