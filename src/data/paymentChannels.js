/**
 * Kenya local payment channels with amount restrictions, network costs, and SLA.
 * Used to recommend the optimal channel for funds transfers.
 */

const PAYMENT_CHANNELS = [
  {
    id: 'internal',
    name: 'Internal Transfer',
    description: 'Between accounts within the same bank',
    minAmount: 0,
    maxAmount: Infinity,
    networkCost: 0,
    percentageCost: 0,
    sla: 'Instant',
    availability: '24/7',
    destinations: ['same-bank'],
    realtime: true,
    icon: 'ArrowLeftRight',
  },
  {
    id: 'pesalink',
    name: 'PesaLink',
    description: 'Real-time interbank transfer via IPSL',
    minAmount: 10,
    maxAmount: 999999,
    networkCost: 25,
    percentageCost: 0,
    sla: 'Instant',
    availability: '24/7',
    destinations: ['other-bank', 'mobile-wallet'],
    realtime: true,
    icon: 'Zap',
  },
  {
    id: 'eft',
    name: 'EFT (ACH)',
    description: 'Electronic Funds Transfer via Kenya Bankers clearing',
    minAmount: 0,
    maxAmount: Infinity,
    networkCost: 50,
    percentageCost: 0,
    sla: 'T+1 (Next business day)',
    availability: 'Business days, cut-off 15:00',
    destinations: ['other-bank'],
    realtime: false,
    icon: 'Clock',
  },
  {
    id: 'rtgs',
    name: 'RTGS (KEPSS)',
    description: 'Real-Time Gross Settlement for high-value transfers',
    minAmount: 1000000,
    maxAmount: Infinity,
    networkCost: 500,
    percentageCost: 0,
    sla: 'Same day (within 2 hours)',
    availability: 'Business days 08:00–15:30',
    destinations: ['other-bank'],
    realtime: true,
    icon: 'Shield',
  },
  {
    id: 'mobile-money',
    name: 'Mobile Money (M-Pesa)',
    description: 'Send to mobile wallet via Safaricom M-Pesa',
    minAmount: 10,
    maxAmount: 250000,
    networkCost: 0,
    percentageCost: 0.005,
    sla: 'Instant',
    availability: '24/7',
    destinations: ['mobile-wallet'],
    realtime: true,
    icon: 'Smartphone',
  },
];

/**
 * Recommend optimal payment channel based on amount and destination.
 * Priority: lowest cost → fastest settlement → widest availability.
 */
function recommendChannels(amount, destination) {
  const results = PAYMENT_CHANNELS
    .filter(ch => ch.destinations.includes(destination))
    .map(channel => {
      const eligible = amount >= channel.minAmount && amount <= channel.maxAmount;
      const estimatedCost = channel.networkCost + (amount * channel.percentageCost);

      let ineligibleReason;
      if (amount < channel.minAmount) {
        ineligibleReason = `Minimum amount is KES ${channel.minAmount.toLocaleString()}`;
      } else if (amount > channel.maxAmount) {
        ineligibleReason = `Maximum amount is KES ${channel.maxAmount.toLocaleString()}`;
      }

      return {
        channel,
        eligible,
        ineligibleReason,
        estimatedCost: eligible ? Math.round(estimatedCost) : 0,
        recommended: false,
      };
    });

  // Pick recommended: among eligible, lowest cost first, then prefer realtime
  const eligible = results.filter(r => r.eligible);
  if (eligible.length > 0) {
    eligible.sort((a, b) => {
      if (a.estimatedCost !== b.estimatedCost) return a.estimatedCost - b.estimatedCost;
      if (a.channel.realtime !== b.channel.realtime) return a.channel.realtime ? -1 : 1;
      return 0;
    });
    eligible[0].recommended = true;
    eligible[0].recommendationReason = eligible[0].estimatedCost === 0
      ? 'No network charges'
      : 'Lowest cost option';
    if (eligible[0].channel.realtime && eligible[0].estimatedCost > 0) {
      eligible[0].recommendationReason = 'Best value — real-time at lowest cost';
    }
  }

  // Sort: recommended first, then eligible, then ineligible
  results.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return a.estimatedCost - b.estimatedCost;
  });

  return results;
}

// Export everything for use in React components
export {
  PAYMENT_CHANNELS,
  recommendChannels,
};
