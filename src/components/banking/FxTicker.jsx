import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const FX_RATES = [
  { currency: '🇺🇸 USD', code: 'USD', rate: 129.45, change: 0.32 },
  { currency: '🇬🇧 GBP', code: 'GBP', rate: 164.20, change: -0.18 },
  { currency: '🇪🇺 EUR', code: 'EUR', rate: 141.80, change: 0.45 },
  { currency: '🇯🇵 JPY', code: 'JPY', rate: 0.87, change: -0.62 },
  { currency: '🇨🇭 CHF', code: 'CHF', rate: 148.90, change: 0.15 },
  { currency: '🇿🇦 ZAR', code: 'ZAR', rate: 7.12, change: -0.28 },
  { currency: '🇦🇪 AED', code: 'AED', rate: 35.24, change: 0.08 },
];

function RateChip({ rate }) {
  const isUp = rate.change > 0;
  const isFlat = rate.change === 0;

  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 border border-border text-sm whitespace-nowrap">
      <span className="font-medium text-foreground">{rate.currency}</span>
      <span className="text-muted-foreground">{rate.rate.toFixed(2)}</span>
      <span className={`inline-flex items-center gap-0.5 font-semibold ${
        isFlat ? 'text-muted-foreground' : isUp ? 'text-[hsl(var(--success))]' : 'text-destructive'
      }`}>
        {isFlat ? <Minus className="h-3 w-3" /> : isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(rate.change).toFixed(2)}%
      </span>
    </span>
  );
}

export function FxTicker() {
  const doubled = [...FX_RATES, ...FX_RATES];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-secondary/50 py-3">
      <div className="flex items-center gap-2 px-4 mb-2">
        <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Live FX Rates vs KES — 1 Week Trend
        </span>
      </div>
      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-4 px-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((rate, i) => (
            <RateChip key={`${rate.code}-${i}`} rate={rate} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
