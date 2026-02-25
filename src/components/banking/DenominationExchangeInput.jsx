import { useState, useMemo, useRef, useCallback } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown, Info, Zap, Globe, Search, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';
import { inferSegment, SEGMENT_LABELS } from '@/data/serviceCharges';
import { SWIFT_DIRECTORY, COUNTRIES, searchByBankName, searchByBic, getCountryName } from '@/data/swiftDirectory';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ─── FX Rate Engine ─── */

const FX_PAIRS = [
  { code: 'USD', flag: '🇺🇸', label: 'US Dollar', midRate: 129.45, baseSpreadBps: 150 },
  { code: 'GBP', flag: '🇬🇧', label: 'British Pound', midRate: 164.20, baseSpreadBps: 200 },
  { code: 'EUR', flag: '🇪🇺', label: 'Euro', midRate: 141.80, baseSpreadBps: 175 },
  { code: 'CHF', flag: '🇨🇭', label: 'Swiss Franc', midRate: 148.90, baseSpreadBps: 200 },
  { code: 'ZAR', flag: '🇿🇦', label: 'South African Rand', midRate: 7.12, baseSpreadBps: 250 },
  { code: 'AED', flag: '🇦🇪', label: 'UAE Dirham', midRate: 35.24, baseSpreadBps: 175 },
  { code: 'JPY', flag: '🇯🇵', label: 'Japanese Yen', midRate: 0.87, baseSpreadBps: 225 },
];

/** Segment discount multipliers on spread (lower = better rate for customer) */
const SEGMENT_SPREAD_MULTIPLIER = {
  'high-value': 0.35,
  sme: 0.65,
  retail: 1.0,
  'young-professional': 0.80,
};

/** Volume discount tiers (KES equivalent) */
function volumeDiscount(kesAmount) {
  if (kesAmount >= 5_000_000) return 0.40;
  if (kesAmount >= 2_000_000) return 0.55;
  if (kesAmount >= 1_000_000) return 0.70;
  if (kesAmount >= 500_000) return 0.85;
  return 1.0;
}

/** Engagement bonus: customers with FX accounts get tighter spreads */
function engagementMultiplier(customer) {
  const hasFx = customer.accounts.some(a => a.type === 'fx');
  const accountCount = customer.accounts.length;
  let mult = 1.0;
  if (hasFx) mult -= 0.10;
  if (accountCount >= 4) mult -= 0.05;
  return Math.max(mult, 0.60);
}

export function computeDynamicRate(
  pair,
  direction,
  segment,
  kesAmount,
  customer,
) {
  const segMult = SEGMENT_SPREAD_MULTIPLIER[segment];
  const volMult = volumeDiscount(kesAmount || 0);
  const engMult = engagementMultiplier(customer);

  const effectiveSpreadBps = pair.baseSpreadBps * segMult * volMult * engMult;
  const spreadDecimal = effectiveSpreadBps / 10_000;

  // BUY = customer buys FCY, pays more KES per unit; SELL = customer sells FCY, receives less KES
  const offeredRate = direction === 'BUY'
    ? pair.midRate * (1 + spreadDecimal)
    : pair.midRate * (1 - spreadDecimal);

  return {
    pair,
    direction,
    midRate: pair.midRate,
    spreadBps: Math.round(effectiveSpreadBps * 100) / 100,
    offeredRate: Math.round(offeredRate * 100) / 100,
    segmentDiscount: `${Math.round((1 - segMult) * 100)}%`,
    volumeDiscount: `${Math.round((1 - volMult) * 100)}%`,
    engagementDiscount: `${Math.round((1 - engMult) * 100)}%`,
  };
}

/** The officer can improve the rate within a corridor — max improvement = 50% of remaining spread */
export function getRateCorridor(rate) {
  const maxImprovementBps = rate.spreadBps * 0.5;
  const improvementDecimal = maxImprovementBps / 10_000;
  if (rate.direction === 'BUY') {
    return { minRate: rate.offeredRate * (1 - improvementDecimal), maxRate: rate.offeredRate };
  }
  return { minRate: rate.offeredRate, maxRate: rate.offeredRate * (1 + improvementDecimal) };
}

/* ─── Wire Transfer Types ─── */

const PAYMENT_RAIL_CONFIG = {
  SWIFT: { label: 'SWIFT', codeLabel: 'SWIFT/BIC Code', codePlaceholder: 'e.g. BARCKENX', description: 'International wire via SWIFT network — Global reach, T+1/T+2 settlement' },
  SEPA: { label: 'SEPA', codeLabel: 'BIC Code', codePlaceholder: 'e.g. DEUTDEFF', description: 'Single Euro Payments Area — EUR transfers within Europe, same-day/T+1' },
  PAPSS: { label: 'PAPSS', codeLabel: 'PAPSS Institution Code', codePlaceholder: 'e.g. PAPSS-KE-001', description: 'Pan-African Payment & Settlement System — Intra-Africa transfers in local currencies' },
};

/* ─── Component ─── */

const EMPTY_WIRE = { paymentRail: '', beneficiaryName: '', beneficiaryAccount: '', bankName: '', bankCode: '', bankCountry: '', intermediaryBank: '', purpose: '' };

/* ─── Smart SWIFT Autocomplete ─── */

function SwiftBankAutocomplete({ value, onSelect, onChange, placeholder, error, searchFn, displayFn, subFn, mono }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const results = useMemo(() => searchFn(inputValue || value), [inputValue, value, searchFn]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setInputValue(e.target.value);
              if (e.target.value.length >= 2) setOpen(true);
            }}
            onFocus={() => { if (value.length >= 2) setOpen(true); }}
            placeholder={placeholder}
            className={`touch-target pr-8 ${mono ? 'font-mono' : ''} ${error ? 'border-destructive' : ''}`}
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
        <ScrollArea className="max-h-60">
          {results.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">
              {(inputValue || value).length < 2 ? 'Type at least 2 characters…' : 'No matches in SWIFT directory'}
            </p>
          ) : (
            <div className="p-1">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1 tracking-wider">Bankers Almanac — SWIFT Directory</p>
              {results.map((entry) => (
                <button
                  key={entry.bic}
                  onClick={() => {
                    onSelect(entry);
                    setOpen(false);
                    setInputValue('');
                  }}
                  className="w-full flex flex-col items-start rounded-md px-2 py-2 text-sm hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <span className="font-medium text-foreground">{displayFn(entry)}</span>
                  <span className="text-xs text-muted-foreground font-mono">{subFn(entry)} • {getCountryName(entry.countryCode)}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function DenominationExchangeInput({ customer, onSubmit }) {
  const [direction, setDirection] = useState('BUY');
  const [selectedPair, setSelectedPair] = useState(null);
  const [fcyAmount, setFcyAmount] = useState('');
  const [settlementMethod, setSettlementMethod] = useState('');
  const [sourceAccNum, setSourceAccNum] = useState('');
  const [settlementAccNum, setSettlementAccNum] = useState('');
  const [errors, setErrors] = useState({});
  const [wireBeneficiary, setWireBeneficiary] = useState({ ...EMPTY_WIRE });

  const segment = useMemo(() => inferSegment(customer), [customer]);

  // Accounts
  const kesAccounts = useMemo(() =>
    customer.accounts.filter(a => a.status === 'active' && a.currency === 'KES' && (a.type === 'current' || a.type === 'savings')),
    [customer]
  );
  const fxAccounts = useMemo(() =>
    customer.accounts.filter(a => a.status === 'active' && a.type === 'fx'),
    [customer]
  );

  const sourceAccount = direction === 'BUY'
    ? kesAccounts.find(a => a.accountNumber === sourceAccNum) || null
    : fxAccounts.find(a => a.accountNumber === sourceAccNum) || null;

  const settlementAccount = direction === 'BUY'
    ? fxAccounts.find(a => a.accountNumber === settlementAccNum) || null
    : kesAccounts.find(a => a.accountNumber === settlementAccNum) || null;

  // Dynamic rate
  const fcyNum = Number(fcyAmount) || 0;
  const kesEquivalent = selectedPair ? fcyNum * selectedPair.midRate : 0;

  const dynamicRate = useMemo(() => {
    if (!selectedPair) return null;
    return computeDynamicRate(selectedPair, direction, segment, kesEquivalent, customer);
  }, [selectedPair, direction, segment, kesEquivalent, customer]);

  const kesTotal = dynamicRate ? fcyNum * dynamicRate.offeredRate : 0;
  const corridor = dynamicRate ? getRateCorridor(dynamicRate) : null;

  const updateWire = (key, value) => {
    setWireBeneficiary(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!selectedPair) errs.currency = 'Select a currency';
    if (!fcyAmount || fcyNum <= 0) errs.amount = 'Enter a valid amount';
    if (!sourceAccNum) errs.source = 'Select source account';
    if (!settlementMethod) errs.method = 'Select settlement method';
    if (settlementMethod === 'account-credit' && !settlementAccNum) errs.settlement = 'Select settlement account';
    if (settlementMethod === 'wire-transfer') {
      if (!wireBeneficiary.paymentRail) errs.paymentRail = 'Select a payment rail';
      if (!wireBeneficiary.beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary name is required';
      if (!wireBeneficiary.beneficiaryAccount.trim()) errs.beneficiaryAccount = 'Beneficiary account/IBAN is required';
      if (!wireBeneficiary.bankName.trim()) errs.bankName = 'Bank name is required';
      if (!wireBeneficiary.bankCode.trim()) errs.bankCode = `${wireBeneficiary.paymentRail ? PAYMENT_RAIL_CONFIG[wireBeneficiary.paymentRail].codeLabel : 'Bank code'} is required`;
      if (!wireBeneficiary.bankCountry.trim()) errs.bankCountry = 'Bank country is required';
      if (!wireBeneficiary.purpose.trim()) errs.purpose = 'Purpose of payment is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !dynamicRate || !corridor || !selectedPair) return;
    onSubmit({
      direction,
      currencyCode: selectedPair.code,
      currencyLabel: `${selectedPair.flag} ${selectedPair.label}`,
      fcyAmount,
      kesAmount: kesTotal.toFixed(2),
      offeredRate: dynamicRate.offeredRate,
      spreadBps: dynamicRate.spreadBps,
      rateCorridor: corridor,
      sourceAccount: sourceAccNum,
      settlementAccount: settlementAccNum,
      settlementMethod,
      dynamicRate,
      ...(settlementMethod === 'wire-transfer' ? { wireBeneficiary } : {}),
    });
  };

  const sourceOptions = direction === 'BUY' ? kesAccounts : fxAccounts;
  const settlementOptions = direction === 'BUY' ? fxAccounts : kesAccounts;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Customer banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {customer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{customer.fullName}</p>
          <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
          {SEGMENT_LABELS[segment]}
        </span>
      </div>

      {/* BUY / SELL toggle */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Transaction Direction *</Label>
        <div className="grid grid-cols-2 gap-3">
          {(['BUY', 'SELL']).map((dir) => (
            <button
              key={dir}
              onClick={() => { setDirection(dir); setSourceAccNum(''); setSettlementAccNum(''); }}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all touch-target font-semibold text-sm ${
                direction === dir
                  ? dir === 'BUY'
                    ? 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                    : 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
              }`}
            >
              {dir === 'BUY' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {dir === 'BUY' ? 'Buy Foreign Currency' : 'Sell Foreign Currency'}
            </button>
          ))}
        </div>
      </div>

      {/* Currency selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Currency *</Label>
        <Select value={selectedPair?.code || ''} onValueChange={(v) => setSelectedPair(FX_PAIRS.find(p => p.code === v) || null)}>
          <SelectTrigger className={`touch-target ${errors.currency ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Select currency..." />
          </SelectTrigger>
          <SelectContent>
            {FX_PAIRS.map(p => (
              <SelectItem key={p.code} value={p.code}>
                <span className="flex items-center gap-2">
                  <span>{p.flag}</span>
                  <span className="font-medium">{p.code}</span>
                  <span className="text-muted-foreground">— {p.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Mid: {p.midRate.toFixed(2)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
      </div>

      {/* FCY Amount */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{selectedPair?.code || 'FCY'} Amount *</Label>
        <Input
          type="number"
          placeholder={`Enter ${selectedPair?.code || 'foreign currency'} amount`}
          value={fcyAmount}
          onChange={(e) => setFcyAmount(e.target.value)}
          className={`touch-target ${errors.amount ? 'border-destructive' : ''}`}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
      </div>

      {/* Dynamic rate card */}
      {dynamicRate && fcyNum > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dynamic Rate</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground uppercase">Mid-Market</p>
              <p className="text-lg font-bold text-foreground">{dynamicRate.midRate.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-[11px] text-accent uppercase font-semibold">Your Rate</p>
              <p className="text-lg font-bold text-accent">{dynamicRate.offeredRate.toFixed(4)}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Effective Spread</span><span className="font-medium">{dynamicRate.spreadBps.toFixed(1)} bps</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Segment Discount ({SEGMENT_LABELS[segment]})</span><span className="font-medium text-[hsl(var(--success))]">-{dynamicRate.segmentDiscount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Volume Discount</span><span className="font-medium text-[hsl(var(--success))]">-{dynamicRate.volumeDiscount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Engagement Bonus</span><span className="font-medium text-[hsl(var(--success))]">-{dynamicRate.engagementDiscount}</span></div>
          </div>

          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">
              {direction === 'BUY' ? 'Total KES to Pay' : 'Total KES to Receive'}
            </span>
            <span className="text-lg font-bold text-foreground">
              KES {kesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {corridor && (
            <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3">
              <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p className="text-[11px] text-info">
                Officer rate corridor: {corridor.minRate.toFixed(4)} – {corridor.maxRate.toFixed(4)}. 
                Any improvement beyond the offered rate requires Approval.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Source Account */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Source Account ({direction === 'BUY' ? 'KES' : 'FCY'}) *
        </Label>
        {sourceOptions.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <Info className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">No eligible {direction === 'BUY' ? 'KES' : 'FX'} accounts found.</p>
          </div>
        ) : (
          <Select value={sourceAccNum} onValueChange={setSourceAccNum}>
            <SelectTrigger className={`touch-target ${errors.source ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select source account..." />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map(acc => (
                <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{acc.accountNumber}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs font-medium">{acc.currency} {acc.balance.toLocaleString()}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
      </div>

      {/* Settlement Method */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Settlement Method *</Label>
        <Select value={settlementMethod} onValueChange={(v) => {
          setSettlementMethod(v);
          if (v !== 'account-credit') setSettlementAccNum('');
          if (v !== 'wire-transfer') setWireBeneficiary({ ...EMPTY_WIRE });
        }}>
          <SelectTrigger className={`touch-target ${errors.method ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="How should funds be settled?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="account-credit">Credit to Settlement Account</SelectItem>
            <SelectItem value="cash-collection">Cash Collection at Branch</SelectItem>
            <SelectItem value="wire-transfer">Wire Transfer (T+1)</SelectItem>
          </SelectContent>
        </Select>
        {errors.method && <p className="text-xs text-destructive">{errors.method}</p>}
      </div>

      {/* Wire Transfer Beneficiary Details */}
      {settlementMethod === 'wire-transfer' && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Beneficiary Details</h4>
          </div>

          {/* Payment Rail */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Rail *</Label>
            <Select value={wireBeneficiary.paymentRail} onValueChange={(v) => updateWire('paymentRail', v)}>
              <SelectTrigger className={`touch-target ${errors.paymentRail ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select payment network..." />
              </SelectTrigger>
              <SelectContent>
                {(['SWIFT', 'SEPA', 'PAPSS']).map(rail => (
                  <SelectItem key={rail} value={rail}>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{PAYMENT_RAIL_CONFIG[rail].label}</span>
                      <span className="text-xs text-muted-foreground">— {PAYMENT_RAIL_CONFIG[rail].description.split('—')[0]}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentRail && <p className="text-xs text-destructive">{errors.paymentRail}</p>}
            {wireBeneficiary.paymentRail && (
              <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3">
                <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <p className="text-[11px] text-info">{PAYMENT_RAIL_CONFIG[wireBeneficiary.paymentRail].description}</p>
              </div>
            )}
          </div>

          {/* Beneficiary Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Beneficiary Name *</Label>
            <Input
              placeholder="Full name as per bank records"
              value={wireBeneficiary.beneficiaryName}
              onChange={(e) => updateWire('beneficiaryName', e.target.value)}
              className={`touch-target ${errors.beneficiaryName ? 'border-destructive' : ''}`}
            />
            {errors.beneficiaryName && <p className="text-xs text-destructive">{errors.beneficiaryName}</p>}
          </div>

          {/* Beneficiary Account / IBAN */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {wireBeneficiary.paymentRail === 'SEPA' ? 'IBAN *' : 'Beneficiary Account Number *'}
            </Label>
            <Input
              placeholder={wireBeneficiary.paymentRail === 'SEPA' ? 'e.g. DE89370400440532013000' : 'Enter account number'}
              value={wireBeneficiary.beneficiaryAccount}
              onChange={(e) => updateWire('beneficiaryAccount', e.target.value)}
              className={`touch-target ${errors.beneficiaryAccount ? 'border-destructive' : ''}`}
            />
            {errors.beneficiaryAccount && <p className="text-xs text-destructive">{errors.beneficiaryAccount}</p>}
          </div>

          {/* Bank Name with autocomplete — populates BIC & Country */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Beneficiary Bank *
            </Label>
            <SwiftBankAutocomplete
              value={wireBeneficiary.bankName}
              onSelect={(entry) => {
                updateWire('bankName', entry.bankName);
                updateWire('bankCode', entry.bic);
                updateWire('bankCountry', entry.countryCode);
              }}
              onChange={(v) => updateWire('bankName', v)}
              placeholder="Start typing bank name…"
              error={errors.bankName}
              searchFn={searchByBankName}
              displayFn={(e) => `${e.bankName} — ${e.city}`}
              subFn={(e) => e.bic}
            />
            {errors.bankName && <p className="text-xs text-destructive">{errors.bankName}</p>}
          </div>

          {/* BIC Code with autocomplete — populates Bank Name & Country */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {wireBeneficiary.paymentRail ? PAYMENT_RAIL_CONFIG[wireBeneficiary.paymentRail].codeLabel : 'Bank Code'} *
            </Label>
            <SwiftBankAutocomplete
              value={wireBeneficiary.bankCode}
              onSelect={(entry) => {
                updateWire('bankCode', entry.bic);
                updateWire('bankName', entry.bankName);
                updateWire('bankCountry', entry.countryCode);
              }}
              onChange={(v) => updateWire('bankCode', v.toUpperCase())}
              placeholder={wireBeneficiary.paymentRail ? PAYMENT_RAIL_CONFIG[wireBeneficiary.paymentRail].codePlaceholder : 'Select payment rail first'}
              error={errors.bankCode}
              searchFn={searchByBic}
              displayFn={(e) => e.bic}
              subFn={(e) => `${e.bankName}, ${e.city}`}
              mono
            />
            {errors.bankCode && <p className="text-xs text-destructive">{errors.bankCode}</p>}
          </div>

          {/* Bank Country dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bank Country *</Label>
            <Select value={wireBeneficiary.bankCountry} onValueChange={(v) => updateWire('bankCountry', v)}>
              <SelectTrigger className={`touch-target ${errors.bankCountry ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select country…" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-64">
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">({c.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            {errors.bankCountry && <p className="text-xs text-destructive">{errors.bankCountry}</p>}
          </div>

          {/* Intermediary Bank (optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Intermediary / Correspondent Bank</Label>
            <Input
              placeholder="Optional — enter if required by beneficiary bank"
              value={wireBeneficiary.intermediaryBank}
              onChange={(e) => updateWire('intermediaryBank', e.target.value)}
              className="touch-target"
            />
          </div>

          {/* Purpose of Payment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Purpose of Payment *</Label>
            <Select value={wireBeneficiary.purpose} onValueChange={(v) => updateWire('purpose', v)}>
              <SelectTrigger className={`touch-target ${errors.purpose ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select purpose..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trade-payment">Trade / Commercial Payment</SelectItem>
                <SelectItem value="personal-remittance">Personal Remittance</SelectItem>
                <SelectItem value="education">Education Fees</SelectItem>
                <SelectItem value="medical">Medical Expenses</SelectItem>
                <SelectItem value="investment">Investment / Capital Transfer</SelectItem>
                <SelectItem value="loan-repayment">Loan Repayment</SelectItem>
                <SelectItem value="salary">Salary / Payroll</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
          </div>
        </div>
      )}

      {/* Settlement Account — only when crediting an account */}
      {settlementMethod === 'account-credit' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Settlement Account ({direction === 'BUY' ? 'FCY' : 'KES'}) *
          </Label>
          {settlementOptions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <Info className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">No eligible {direction === 'BUY' ? 'FX' : 'KES'} accounts found. Customer may need to open one first.</p>
            </div>
          ) : (
            <Select value={settlementAccNum} onValueChange={setSettlementAccNum}>
              <SelectTrigger className={`touch-target ${errors.settlement ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select settlement account..." />
              </SelectTrigger>
              <SelectContent>
                {settlementOptions.map(acc => (
                  <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{acc.accountNumber}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs font-medium">{acc.currency} {acc.balance.toLocaleString()}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.settlement && <p className="text-xs text-destructive">{errors.settlement}</p>}
        </div>
      )}

      {/* Settlement instructions summary */}
      {settlementMethod && sourceAccount && dynamicRate && fcyNum > 0 && (settlementMethod !== 'account-credit' || settlementAccount) && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Settlement Instructions
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Debit</span>
              <span className="font-medium">
                {sourceAccount.currency} {direction === 'BUY' ? kesTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) : Number(fcyAmount).toLocaleString()} from {sourceAccount.accountNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credit</span>
              <span className="font-medium">
                {settlementMethod === 'account-credit' && settlementAccount
                  ? `${settlementAccount.currency} ${direction === 'BUY' ? Number(fcyAmount).toLocaleString() : kesTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} to ${settlementAccount.accountNumber}`
                  : settlementMethod === 'cash-collection'
                    ? 'Cash at branch counter'
                    : 'Wire transfer — T+1 settlement'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settlement</span>
              <span className="font-medium">
                {settlementMethod === 'account-credit' ? 'Immediate account credit' : settlementMethod === 'cash-collection' ? 'Cash at branch counter' : 'Wire — T+1 settlement'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium text-accent">{dynamicRate.offeredRate.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={sourceOptions.length === 0 || (settlementMethod === 'account-credit' && settlementOptions.length === 0)}
        className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow mt-4"
      >
        Submit for Validation
      </Button>
    </div>
  );
}