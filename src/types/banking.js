// ServiceCategory union type converted to array of valid values
const SERVICE_CATEGORIES_LIST = [
  'customer-account',
  'cash-operations', 
  'payment-operations',
  'card-services',
  'fx-operations',
  'service-requests'
];

export const SERVICE_CATEGORIES = {
  'customer-account': {
    label: 'Customer & Account',
    description: 'Account opening, KYC updates, profile management',
    icon: 'UserCircle',
    color: 'info',
  },
  'cash-operations': {
    label: 'Cash Operations',
    description: 'Deposits, withdrawals, denomination exchange',
    icon: 'Banknote',
    color: 'success',
  },
  'payment-operations': {
    label: 'Payment Operations',
    description: 'Transfers, bill payments, standing orders',
    icon: 'ArrowLeftRight',
    color: 'accent',
  },
  'card-services': {
    label: 'Card Services',
    description: 'Card issuance, management, PIN services',
    icon: 'CreditCard',
    color: 'primary',
  },
  'fx-operations': {
    label: 'FX Operations',
    description: 'Currency exchange, FX transfers, rates',
    icon: 'Globe',
    color: 'warning',
  },
  'service-requests': {
    label: 'Service Requests',
    description: 'Cheque books, cards, statements, complaints',
    icon: 'ClipboardList',
    color: 'primary',
  },
};

export const SERVICES = [
  { id: 'account-opening', title: 'Open New Account', description: 'Individual or joint account opening', category: 'customer-account', icon: 'UserPlus' },
  { id: 'kyc-update', title: 'KYC Update', description: 'Update customer identification documents', category: 'customer-account', icon: 'ShieldCheck' },
  { id: 'account-modification', title: 'Account Modification', description: 'Change account details or preferences', category: 'customer-account', icon: 'Settings' },
  { id: 'cash-deposit', title: 'Cash Deposit', description: 'Deposit cash into an account', category: 'cash-operations', icon: 'Download' },
  { id: 'cash-withdrawal', title: 'Cash Withdrawal', description: 'Withdraw cash from an account', category: 'cash-operations', icon: 'Upload' },
  { id: 'denomination-exchange', title: 'Denomination Exchange', description: 'Exchange notes for different denominations', category: 'cash-operations', icon: 'RefreshCw' },
  { id: 'funds-transfer', title: 'Funds Transfer', description: 'Transfer between accounts or to other banks', category: 'payment-operations', icon: 'Send' },
  { id: 'bill-payment', title: 'Bill Payment', description: 'Pay utility bills and other invoices', category: 'payment-operations', icon: 'Receipt' },
  { id: 'standing-order', title: 'Standing Order', description: 'Set up recurring payments', category: 'payment-operations', icon: 'Calendar' },
  { id: 'fx-purchase', title: 'Buy Foreign Currency', description: 'Purchase foreign currency', category: 'fx-operations', icon: 'TrendingUp' },
  { id: 'fx-sale', title: 'Sell Foreign Currency', description: 'Sell foreign currency', category: 'fx-operations', icon: 'TrendingDown' },
  { id: 'fx-transfer', title: 'FX Transfer', description: 'International wire transfer', category: 'fx-operations', icon: 'Globe' },
  { id: 'card-issuance', title: 'Card Issuance', description: 'Request new debit or credit card', category: 'card-services', icon: 'CreditCard' },
  { id: 'card-replacement', title: 'Card Replacement', description: 'Replace lost, stolen or damaged card', category: 'card-services', icon: 'RefreshCw' },
  { id: 'pin-management', title: 'PIN Management', description: 'Set or reset card PIN', category: 'card-services', icon: 'ShieldCheck' },
  { id: 'card-limit', title: 'Card Limit Update', description: 'Adjust daily transaction limits', category: 'card-services', icon: 'Settings' },
  { id: 'cheque-book', title: 'Cheque Book Request', description: 'Request new cheque book', category: 'service-requests', icon: 'BookOpen' },
  { id: 'statement-request', title: 'Statement Request', description: 'Request account statement', category: 'service-requests', icon: 'FileText' },
];

// Validation helper functions (replaces TypeScript interfaces)
export function isValidServiceItem(obj) {
  return obj && typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.category === 'string' &&
    SERVICE_CATEGORIES_LIST.includes(obj.category) &&
    typeof obj.icon === 'string';
}

export function isValidWorkflowStage(stage) {
  return ['input', 'validation', 'review', 'processing', 'verification', 
          'authorization', 'cross-sell', 'feedback', 'complete'].includes(stage);
}
