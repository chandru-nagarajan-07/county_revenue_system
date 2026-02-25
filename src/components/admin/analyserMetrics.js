export const METRIC_CATEGORIES = {
  volume: 'Transaction Volume',
  performance: 'Performance',
  financial: 'Financial',
  user: 'User Activity',
  operator: 'Operator Metrics',
  quality: 'Quality & Compliance',
};

export const AVAILABLE_METRICS = [
  { id: 'txn-volume', label: 'Transaction Volume', description: 'Total number of transactions processed', unit: 'count', chartType: 'bar', category: 'volume' },
  { id: 'txn-value', label: 'Transaction Value', description: 'Total monetary value of transactions', unit: 'KES', chartType: 'area', category: 'financial' },
  { id: 'avg-processing-time', label: 'Avg Processing Time', description: 'Average time to complete a transaction', unit: 'mins', chartType: 'line', category: 'performance' },
  { id: 'approval-rate', label: 'Approval Rate', description: 'Percentage of transactions approved', unit: '%', chartType: 'line', category: 'quality' },
  { id: 'completion-rate', label: 'Completion Rate', description: 'Percentage of started transactions completed', unit: '%', chartType: 'line', category: 'quality' },
  { id: 'error-rate', label: 'Error / Rejection Rate', description: 'Percentage of failed or rejected transactions', unit: '%', chartType: 'bar', category: 'quality' },
  { id: 'active-users', label: 'Active Users', description: 'Number of unique users per day', unit: 'users', chartType: 'area', category: 'user' },
  { id: 'avg-session-duration', label: 'Avg Session Duration', description: 'Average time per user session', unit: 'mins', chartType: 'line', category: 'user' },
  { id: 'peak-hours', label: 'Peak Usage Hours', description: 'Distribution of transactions by hour of day', unit: 'count', chartType: 'bar', category: 'user' },
  { id: 'cross-sell-conversion', label: 'Cross-Sell Conversion', description: 'Rate of cross-sell offer acceptance', unit: '%', chartType: 'bar', category: 'financial' },
  { id: 'csat-score', label: 'Customer Satisfaction', description: 'Average customer satisfaction rating', unit: 'score', chartType: 'line', category: 'quality' },
  { id: 'operator-throughput', label: 'Operator Throughput', description: 'Average transactions handled per operator', unit: 'txns/hr', chartType: 'bar', category: 'operator' },
  { id: 'pending-approvals', label: 'Pending Approvals', description: 'Number of items awaiting approval', unit: 'count', chartType: 'bar', category: 'operator' },
  { id: 'sla-compliance', label: 'SLA Compliance', description: 'Percentage of transactions meeting SLA targets', unit: '%', chartType: 'area', category: 'operator' },
  { id: 'channel-distribution', label: 'Channel Distribution', description: 'Transaction distribution across channels', unit: 'count', chartType: 'pie', category: 'volume' },
  { id: 'segment-distribution', label: 'Segment Distribution', description: 'Transaction breakdown by customer segment', unit: 'count', chartType: 'pie', category: 'volume' },
  { id: 'monthly-growth', label: 'Monthly Growth Rate', description: 'Month-over-month transaction growth', unit: '%', chartType: 'line', category: 'financial' },
  { id: 'cost-per-txn', label: 'Cost per Transaction', description: 'Average operational cost per transaction', unit: 'KES', chartType: 'line', category: 'financial' },
  { id: 'revenue-per-service', label: 'Revenue per Service', description: 'Revenue generated per service type', unit: 'KES', chartType: 'bar', category: 'financial' },
  { id: 'avg-queue-time', label: 'Avg Queue Wait Time', description: 'Average time customers wait in queue', unit: 'mins', chartType: 'line', category: 'performance' },
  { id: 'first-contact-resolution', label: 'First Contact Resolution', description: 'Percentage resolved on first interaction', unit: '%', chartType: 'area', category: 'quality' },
  { id: 'operator-utilisation', label: 'Operator Utilisation', description: 'Percentage of operator time actively processing', unit: '%', chartType: 'area', category: 'operator' },
];

// Note: SERVICE_CATEGORIES needs to be imported or defined here for full functionality
// Assuming it's available globally or you'll need to import it
const SERVICE_CATEGORIES = {
  'cash-operations': { label: 'Cash Operations' },
  'customer-account': { label: 'Customer Accounts' },
  'payment-operations': { label: 'Payment Operations' },
  'fx-operations': { label: 'FX Operations' },
  'card-services': { label: 'Card Services' },
};
const SERVICE_CATEGORY_KEYS = Object.keys(SERVICE_CATEGORIES);
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateMockTimeSeries(metricId, serviceCategory, days = 30) {
  const baseSeed = metricId.length * 31 + serviceCategory.length * 17;
  const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const seed = baseSeed + i * 7;
    const rand = seededRandom(seed);

    let value;
    switch (metricId) {
      case 'txn-volume': value = Math.round(50 + rand * 200 + (days - i) * 2); break;
      case 'txn-value': value = Math.round((100000 + rand * 500000 + (days - i) * 5000)); break;
      case 'avg-processing-time': value = +(2 + rand * 8).toFixed(1); break;
      case 'approval-rate': value = +(85 + rand * 14).toFixed(1); break;
      case 'completion-rate': value = +(80 + rand * 18).toFixed(1); break;
      case 'error-rate': value = +(1 + rand * 8).toFixed(1); break;
      case 'active-users': value = Math.round(20 + rand * 60); break;
      case 'avg-session-duration': value = +(5 + rand * 25).toFixed(1); break;
      case 'peak-hours': value = Math.round(10 + rand * 90); break;
      case 'cross-sell-conversion': value = +(5 + rand * 25).toFixed(1); break;
      case 'csat-score': value = +(3.2 + rand * 1.7).toFixed(1); break;
      case 'operator-throughput': value = +(4 + rand * 12).toFixed(1); break;
      case 'pending-approvals': value = Math.round(2 + rand * 15); break;
      case 'sla-compliance': value = +(88 + rand * 12).toFixed(1); break;
      case 'monthly-growth': value = +(-5 + rand * 20).toFixed(1); break;
      case 'cost-per-txn': value = +(50 + rand * 200).toFixed(0); break;
      case 'revenue-per-service': value = Math.round(20000 + rand * 150000); break;
      case 'avg-queue-time': value = +(1 + rand * 10).toFixed(1); break;
      case 'first-contact-resolution': value = +(70 + rand * 28).toFixed(1); break;
      case 'operator-utilisation': value = +(55 + rand * 40).toFixed(1); break;
      default: value = Math.round(rand * 100); break;
    }

    data.push({ date: d.toISOString().slice(0, 10), value });
  }
  return data;
}

export function generatePieData(metricId) {
  if (metricId === 'channel-distribution') {
    return [
      { name: 'Branch', value: 45 },
      { name: 'Mobile', value: 28 },
      { name: 'Internet', value: 15 },
      { name: 'Agent', value: 12 },
    ];
  }
  if (metricId === 'segment-distribution') {
    return [
      { name: 'Retail', value: 40 },
      { name: 'SME', value: 25 },
      { name: 'Corporate', value: 20 },
      { name: 'Premium', value: 15 },
    ];
  }
  return SERVICE_CATEGORY_KEYS.map((cat, i) => ({
    name: SERVICE_CATEGORIES[cat].label,
    value: Math.round(20 + seededRandom(metricId.length + i) * 80),
  }));
}

const DEFAULT_DASHBOARD = {
  id: 'default',
  name: 'My Dashboard',
  metrics: [
    { metricId: 'txn-volume', serviceFilter: 'all' },
    { metricId: 'txn-value', serviceFilter: 'all' },
    { metricId: 'approval-rate', serviceFilter: 'all' },
    { metricId: 'active-users', serviceFilter: 'all' },
    { metricId: 'operator-throughput', serviceFilter: 'all' },
    { metricId: 'completion-rate', serviceFilter: 'all' },
  ],
};

export function loadDashboard() {
  try {
    const stored = localStorage.getItem('analyser-dashboard');
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_DASHBOARD;
}

export function saveDashboard(config) {
  localStorage.setItem('analyser-dashboard', JSON.stringify(config));
}
