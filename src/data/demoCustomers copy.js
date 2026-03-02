const ACCOUNT_TYPE_LABELS = {
  savings: 'Savings Account',
  current: 'Current Account',
  'fixed-deposit': 'Fixed Deposit',
  fx: 'Foreign Currency Account',
  loan: 'Loan Account',
};

/** Which account types are allowed for each service (undefined = all active accounts) */
const SERVICE_ACCOUNT_RULES = {
  'cash-deposit': ['savings', 'current'],
  'cash-withdrawal': ['savings', 'current'],
  'funds-transfer': ['savings', 'current', 'fx'],
  'bill-payment': ['savings', 'current'],
  'standing-order': ['savings', 'current'],
  'fx-purchase': ['current', 'fx'],
  'fx-sale': ['fx'],
  'fx-transfer': ['fx', 'current'],
  'card-issuance': ['savings', 'current'],
  'card-replacement': ['savings', 'current'],
  'pin-management': ['savings', 'current'],
  'card-limit': ['savings', 'current'],
  'cheque-book': ['current'],
  'statement-request': ['savings', 'current', 'fixed-deposit', 'fx', 'loan'],
};

const DEMO_CUSTOMERS = [
  {
    customerId: 'CUST001',
    fullName: 'James Mwangi Kariuki',
    phone: '+254 712 345 678',
    email: 'james.kariuki@email.com',
    idNumber: '29384756',
    accounts: [
      { accountNumber: '0011-2345-6789', accountName: 'James M. Kariuki - Savings', type: 'savings', currency: 'KES', balance: 245000, status: 'active' },
      { accountNumber: '0011-2345-6790', accountName: 'James M. Kariuki - Current', type: 'current', currency: 'KES', balance: 1230000, status: 'active' },
      { accountNumber: '0011-2345-6791', accountName: 'James M. Kariuki - USD', type: 'fx', currency: 'USD', balance: 5200, status: 'active' },
      { accountNumber: '0011-2345-6792', accountName: 'James M. Kariuki - Fixed Deposit', type: 'fixed-deposit', currency: 'KES', balance: 500000, status: 'active' },
    ],
  },
  {
    customerId: 'CUST002',
    fullName: 'Amina Hassan Mohamed',
    phone: '+254 723 456 789',
    email: 'amina.mohamed@email.com',
    idNumber: '31245890',
    accounts: [
      { accountNumber: '0022-3456-7890', accountName: 'Amina H. Mohamed - Savings', type: 'savings', currency: 'KES', balance: 89000, status: 'active' },
      { accountNumber: '0022-3456-7891', accountName: 'Amina H. Mohamed - Current', type: 'current', currency: 'KES', balance: 456000, status: 'active' },
      { accountNumber: '0022-3456-7892', accountName: 'Amina H. Mohamed - Loan', type: 'loan', currency: 'KES', balance: -350000, status: 'active' },
    ],
  },
  {
    customerId: 'CUST003',
    fullName: 'Peter Ochieng Otieno',
    phone: '+254 734 567 890',
    email: 'peter.otieno@email.com',
    idNumber: '27456123',
    accounts: [
      { accountNumber: '0033-4567-8901', accountName: 'Peter O. Otieno - Savings', type: 'savings', currency: 'KES', balance: 178000, status: 'active' },
      { accountNumber: '0033-4567-8902', accountName: 'Peter O. Otieno - Current', type: 'current', currency: 'KES', balance: 2100000, status: 'active' },
      { accountNumber: '0033-4567-8903', accountName: 'Peter O. Otieno - EUR', type: 'fx', currency: 'EUR', balance: 3800, status: 'active' },
      { accountNumber: '0033-4567-8904', accountName: 'Peter O. Otieno - GBP', type: 'fx', currency: 'GBP', balance: 1500, status: 'active' },
      { accountNumber: '0033-4567-8905', accountName: 'Peter O. Otieno - Fixed Deposit', type: 'fixed-deposit', currency: 'KES', balance: 1000000, status: 'dormant' },
    ],
  },
  {
    customerId: 'CUST004',
    fullName: 'Grace Wanjiku Njoroge',
    phone: '+254 745 678 901',
    email: 'grace.njoroge@email.com',
    idNumber: '33567890',
    accounts: [
      { accountNumber: '0044-5678-9012', accountName: 'Grace W. Njoroge - Savings', type: 'savings', currency: 'KES', balance: 320000, status: 'active' },
      { accountNumber: '0044-5678-9013', accountName: 'Grace W. Njoroge - Current', type: 'current', currency: 'KES', balance: 780000, status: 'active' },
    ],
  },
];

function findCustomerById(customerId) {
  return DEMO_CUSTOMERS.find(c => c.customerId.toUpperCase() === customerId.toUpperCase());
}

function getEligibleAccounts(customer, serviceId) {
  const allowedTypes = SERVICE_ACCOUNT_RULES[serviceId];
  return customer.accounts.filter(a => {
    if (a.status !== 'active') return false;
    if (!allowedTypes) return true;
    return allowedTypes.includes(a.type);
  });
}

// Export everything for use in React components
export {
  ACCOUNT_TYPE_LABELS,
  SERVICE_ACCOUNT_RULES,
  DEMO_CUSTOMERS,
  findCustomerById,
  getEligibleAccounts,
};
