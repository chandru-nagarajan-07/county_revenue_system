/**
 * Segment-specific service charge structure.
 * All amounts in KES unless otherwise noted.
 * VAT is 16% (Kenya standard rate).
 * Excise duty on financial services is 20% of the fee.
 */

const VAT_RATE = 0.16;
const EXCISE_DUTY_RATE = 0.20;

/**
 * Charge matrix: serviceId → segment → charge structure
 * High-value customers get discounted/waived fees.
 * Young-professional segment gets reduced rates.
 */
const CHARGE_MATRIX = {
  'cash-deposit': {
    'high-value':          { serviceFee: 0,   percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    sme:                   { serviceFee: 50,  percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    retail:                { serviceFee: 100, percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    'young-professional':  { serviceFee: 50,  percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
  },
  'cash-withdrawal': {
    'high-value':          { serviceFee: 0,   percentageFee: 0.001,  minCharge: 0,   maxCharge: 500 },
    sme:                   { serviceFee: 100, percentageFee: 0.002,  minCharge: 100, maxCharge: 2000 },
    retail:                { serviceFee: 100, percentageFee: 0.003,  minCharge: 100, maxCharge: 3000 },
    'young-professional':  { serviceFee: 50,  percentageFee: 0.002,  minCharge: 50,  maxCharge: 1500 },
  },
  'funds-transfer': {
    'high-value':          { serviceFee: 0,   percentageFee: 0.001,  minCharge: 0,   maxCharge: 1000 },
    sme:                   { serviceFee: 50,  percentageFee: 0.003,  minCharge: 50,  maxCharge: 5000 },
    retail:                { serviceFee: 50,  percentageFee: 0.005,  minCharge: 50,  maxCharge: 5000 },
    'young-professional':  { serviceFee: 30,  percentageFee: 0.003,  minCharge: 30,  maxCharge: 3000 },
  },
  'bill-payment': {
    'high-value':          { serviceFee: 0,   percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    sme:                   { serviceFee: 50,  percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    retail:                { serviceFee: 50,  percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    'young-professional':  { serviceFee: 30,  percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
  },
  'standing-order': {
    'high-value':          { serviceFee: 0,   percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    sme:                   { serviceFee: 100, percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    retail:                { serviceFee: 150, percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
    'young-professional':  { serviceFee: 75,  percentageFee: 0,      minCharge: 0,   maxCharge: 0 },
  },
  'fx-purchase': {
    'high-value':          { serviceFee: 0,   percentageFee: 0.002,  minCharge: 0,   maxCharge: 5000 },
    sme:                   { serviceFee: 200, percentageFee: 0.005,  minCharge: 200, maxCharge: 10000 },
    retail:                { serviceFee: 200, percentageFee: 0.008,  minCharge: 200, maxCharge: 10000 },
    'young-professional':  { serviceFee: 100, percentageFee: 0.005,  minCharge: 100, maxCharge: 5000 },
  },
  'fx-sale': {
    'high-value':          { serviceFee: 0,   percentageFee: 0.002,  minCharge: 0,   maxCharge: 5000 },
    sme:                   { serviceFee: 200, percentageFee: 0.005,  minCharge: 200, maxCharge: 10000 },
    retail:                { serviceFee: 200, percentageFee: 0.008,  minCharge: 200, maxCharge: 10000 },
    'young-professional':  { serviceFee: 100, percentageFee: 0.005,  minCharge: 100, maxCharge: 5000 },
  },
  'fx-transfer': {
    'high-value':          { serviceFee: 500, percentageFee: 0.003,  minCharge: 500,  maxCharge: 15000 },
    sme:                   { serviceFee: 1000, percentageFee: 0.005, minCharge: 1000, maxCharge: 25000 },
    retail:                { serviceFee: 1500, percentageFee: 0.008, minCharge: 1500, maxCharge: 25000 },
    'young-professional':  { serviceFee: 750, percentageFee: 0.005,  minCharge: 750,  maxCharge: 15000 },
  },
  'card-issuance': {
    'high-value':          { serviceFee: 0,    percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 250,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'card-replacement': {
    'high-value':          { serviceFee: 0,    percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 1000, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'pin-management': {
    'high-value':          { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 100, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'card-limit': {
    'high-value':          { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'cheque-book': {
    'high-value':          { serviceFee: 0,    percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 750,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'statement-request': {
    'high-value':          { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 100, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 200, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 100, percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'denomination-exchange': {
    'high-value':          { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 50,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 100, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 50,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'account-opening': {
    'high-value':          { serviceFee: 0,    percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 500,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 250,  percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 0,    percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'kyc-update': {
    'high-value':          { serviceFee: 0, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 0, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 0, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 0, percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
  'account-modification': {
    'high-value':          { serviceFee: 0,   percentageFee: 0, minCharge: 0, maxCharge: 0 },
    sme:                   { serviceFee: 200, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    retail:                { serviceFee: 200, percentageFee: 0, minCharge: 0, maxCharge: 0 },
    'young-professional':  { serviceFee: 100, percentageFee: 0, minCharge: 0, maxCharge: 0 },
  },
};

/** Default charge for any service not in the matrix */
const DEFAULT_CHARGE = { serviceFee: 100, percentageFee: 0, minCharge: 0, maxCharge: 0 };

function inferSegment(customer) {
  const totalBalance = customer.accounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const hasLoan = customer.accounts.some(a => a.type === 'loan');
  const hasFx = customer.accounts.some(a => a.type === 'fx');
  const accountCount = customer.accounts.length;

  if (totalBalance > 1500000 || hasFx) return 'high-value';
  if (accountCount >= 3 && hasLoan) return 'sme';
  if (totalBalance < 200000) return 'young-professional';
  return 'retail';
}

function computeCharges(serviceId, segment, transactionAmount) {
  const chargeMap = CHARGE_MATRIX[serviceId];
  const structure = chargeMap ? chargeMap[segment] : DEFAULT_CHARGE;

  let baseFee = structure.serviceFee;

  // Add percentage-based fee if applicable
  if (structure.percentageFee > 0 && transactionAmount && transactionAmount > 0) {
    let percentFee = transactionAmount * structure.percentageFee;
    if (structure.minCharge > 0) percentFee = Math.max(percentFee, structure.minCharge);
    if (structure.maxCharge > 0) percentFee = Math.min(percentFee, structure.maxCharge);
    baseFee = Math.max(baseFee, percentFee);
  }

  const exciseDuty = Math.round(baseFee * EXCISE_DUTY_RATE);
  const vat = Math.round((baseFee + exciseDuty) * VAT_RATE);
  const totalCharges = baseFee + exciseDuty + vat;

  return {
    serviceFee: baseFee,
    exciseDuty,
    vat,
    totalCharges,
  };
}

const SEGMENT_LABELS = {
  'high-value': 'Premium',
  sme: 'SME / Business',
  retail: 'Retail',
  'young-professional': 'Young Professional',
};

// Export everything for use in React components
export {
  VAT_RATE,
  EXCISE_DUTY_RATE,
  CHARGE_MATRIX,
  DEFAULT_CHARGE,
  inferSegment,
  computeCharges,
  SEGMENT_LABELS,
};
