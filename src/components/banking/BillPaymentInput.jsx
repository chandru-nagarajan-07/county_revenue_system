import { useState, useMemo, useEffect } from 'react';
import {
  Zap, Clock, Shield, ArrowLeftRight, Smartphone, Check, AlertCircle, Info, Star,
  Search, Receipt, Save, CalendarClock, Mail, Wallet, ChevronDown, ChevronUp,
  Landmark, HeartPulse, GraduationCap, Wifi, Tv, Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';
import { recommendChannels } from '@/data/paymentChannels';
import {
  PRESET_BILLERS, BILLER_CATEGORY_LABELS,
  RECURRENCE_LABELS, getAllBillers,
} from '@/data/billers';

const ICON_MAP = {
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />,
};

const BILLER_ICON_MAP = {
  Zap: <Zap className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />,
  Wifi: <Wifi className="h-4 w-4" />,
  Tv: <Tv className="h-4 w-4" />,
  Landmark: <Landmark className="h-4 w-4" />,
  HeartPulse: <HeartPulse className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Droplets: <Droplets className="h-4 w-4" />,
};

// Simulate OD credit limits per account
const OD_LIMITS = {
  'current': 500000,
  'savings': 100000,
};

export function BillPaymentInput({ customer, onSubmit }) {
  const eligibleAccounts = useMemo(() => getEligibleAccounts(customer, 'bill-payment'), [customer]);

  const [mode, setMode] = useState('preset');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [billerSearch, setBillerSearch] = useState('');
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [manualBillerCode, setManualBillerCode] = useState('');
  const [manualBillerName, setManualBillerName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // Presentment
  const [presentment, setPresentment] = useState(null);
  const [presentmentLoading, setPresentmentLoading] = useState(false);
  const [presentmentFetched, setPresentmentFetched] = useState(false);

  // Options
  const [emailConfirmation, setEmailConfirmation] = useState(true);
  const [emailAddress, setEmailAddress] = useState(customer.email);
  const [saveBiller, setSaveBiller] = useState(false);
  const [enableRecurrence, setEnableRecurrence] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('monthly');
  const [useOverdraft, setUseOverdraft] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [errors, setErrors] = useState({});

  const activeBiller = mode === 'preset' ? selectedBiller : null;
  const billerName = mode === 'preset' ? (selectedBiller?.name || '') : manualBillerName;
  const billerCode = mode === 'preset' ? (selectedBiller?.billerCode || '') : manualBillerCode;

  // Filter billers
  const allBillers = useMemo(() => getAllBillers(), []);

  const filteredBillers = useMemo(() => {
    if (!billerSearch.trim()) return allBillers;
    const q = billerSearch.toLowerCase();
    return allBillers.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.shortName.toLowerCase().includes(q) ||
      b.billerCode.includes(q) ||
      b.category.includes(q)
    );
  }, [billerSearch, allBillers]);

  // Group by category
  const groupedBillers = useMemo(() => {
    const groups = {};
    filteredBillers.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [filteredBillers]);

  // Fetch bill presentment
  const handleFetchBill = () => {
    if (!activeBiller?.supportsPresentment || !referenceNumber.trim()) return;
    setPresentmentLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const result = fetchBillPresentment(activeBiller.id, referenceNumber);
      setPresentment(result);
      setPresentmentFetched(true);
      setPresentmentLoading(false);
      if (result) {
        setAmount(String(result.outstandingAmount));
      }
    }, 800);
  };

  // Channel recommendations
  const numAmount = useMemo(() => {
    const n = Number(amount);
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [amount]);

  const recommendations = useMemo(() => {
    if (numAmount === 0) return [];
    return recommendChannels(numAmount, 'other-bank');
  }, [numAmount]);

  const recommendedId = recommendations.find(r => r.recommended)?.channel.id;
  const effectiveChannelId = selectedChannelId ?? recommendedId ?? null;
  const selectedRec = recommendations.find(r => r.channel.id === effectiveChannelId);

  // Overdraft calculation
  const odLimit = selectedAccount ? (OD_LIMITS[selectedAccount.type] || 0) : 0;
  const availableBalance = selectedAccount ? selectedAccount.balance : 0;
  const totalAvailable = availableBalance + (useOverdraft ? odLimit : 0);
  const shortfall = numAmount > availableBalance ? numAmount - availableBalance : 0;
  const canOverdraft = odLimit > 0 && shortfall > 0 && shortfall <= odLimit;

  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = 'Please select a source account';
    if (!billerName.trim()) errs.biller = 'Biller is required';
    if (!billerCode.trim()) errs.billerCode = 'Biller ID / Paybill is required';
    if (!referenceNumber.trim()) errs.reference = 'Reference number is required';
    if (numAmount <= 0) errs.amount = 'Enter a valid amount';
    if (activeBiller && numAmount < activeBiller.minAmount) errs.amount = `Minimum amount is KES ${activeBiller.minAmount.toLocaleString()}`;
    if (activeBiller && numAmount > activeBiller.maxAmount) errs.amount = `Maximum amount is KES ${activeBiller.maxAmount.toLocaleString()}`;
    if (!effectiveChannelId) errs.channel = 'Please select a payment channel';
    if (selectedRec && !selectedRec.eligible) errs.channel = selectedRec.ineligibleReason || 'Channel not available';
    if (numAmount > totalAvailable) errs.amount = 'Insufficient funds (including OD limit)';
    if (emailConfirmation && !emailAddress.trim()) errs.email = 'Email address is required';
    if (enableRecurrence && !recurrenceFrequency) errs.recurrence = 'Select a frequency';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !selectedRec) return;
    onSubmit({
      sourceAccount: selectedAccount.accountNumber,
      billerName,
      billerCode,
      referenceNumber,
      amount,
      channelId: selectedRec.channel.id,
      channelName: selectedRec.channel.name,
      channelSla: selectedRec.channel.sla,
      networkCost: selectedRec.estimatedCost,
      emailConfirmation,
      emailAddress: emailConfirmation ? emailAddress : '',
      saveBiller: mode === 'preset' ? saveBiller : false,
      enableRecurrence,
      recurrenceFrequency: enableRecurrence ? recurrenceFrequency : undefined,
      useOverdraft,
      overdraftAmount: useOverdraft ? shortfall : 0,
      presentment: presentment || undefined,
      isManualEntry: mode === 'manual',
    });
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Customer banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {customer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{customer.fullName}</p>
          <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone}</p>
        </div>
      </div>

      {/* Source Account */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Source Account *</Label>
        <Select
          value={selectedAccount?.accountNumber || ''}
          onValueChange={(val) => {
            const acc = eligibleAccounts.find(a => a.accountNumber === val) || null;
            setSelectedAccount(acc);
            setUseOverdraft(false);
            setErrors(prev => ({ ...prev, account: '' }));
          }}
        >
          <SelectTrigger className={`touch-target ${errors.account ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Choose an account..." />
          </SelectTrigger>
          <SelectContent>
            {eligibleAccounts.map((acc) => (
              <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                <span className="font-medium">{acc.accountNumber}</span>
                <span className="text-muted-foreground"> • {ACCOUNT_TYPE_LABELS[acc.type]} • {acc.currency} {acc.balance.toLocaleString()}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
      </div>

      {/* Biller mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'preset' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('preset'); setSelectedBiller(null); setPresentment(null); setPresentmentFetched(false); }}
          className="flex-1"
        >
          <Receipt className="h-4 w-4 mr-1.5" /> Preset Billers
        </Button>
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('manual'); setSelectedBiller(null); setPresentment(null); setPresentmentFetched(false); }}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-1.5" /> Enter Biller ID
        </Button>
      </div>

      {/* Preset biller selection */}
      {mode === 'preset' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search billers..."
              value={billerSearch}
              onChange={(e) => setBillerSearch(e.target.value)}
              className="pl-9 touch-target"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
            {Object.entries(groupedBillers).map(([cat, billers]) => (
              <div key={cat}>
                <div className="px-3 py-2 bg-muted/50 sticky top-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {BILLER_CATEGORY_LABELS[cat]}
                  </span>
                </div>
                {billers.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBiller(b);
                      setReferenceNumber('');
                      setPresentment(null);
                      setPresentmentFetched(false);
                      setAmount('');
                      setErrors(prev => ({ ...prev, biller: '' }));
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors ${
                      selectedBiller?.id === b.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                  >
                    <span className="text-muted-foreground">{BILLER_ICON_MAP[b.icon] || <Receipt className="h-4 w-4" />}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground">Paybill: {b.billerCode}</p>
                    </div>
                    {b.supportsPresentment && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-info border-info/30 shrink-0">
                        Bill Fetch
                      </Badge>
                    )}
                    {selectedBiller?.id === b.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filteredBillers.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No billers match your search</div>
            )}
          </div>
          {errors.biller && <p className="text-xs text-destructive">{errors.biller}</p>}
        </div>
      )}

      {/* Manual biller entry */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Biller Name *</Label>
            <Input
              placeholder="Enter biller name"
              value={manualBillerName}
              onChange={(e) => { setManualBillerName(e.target.value); setErrors(prev => ({ ...prev, biller: '' })); }}
              className={`touch-target ${errors.biller ? 'border-destructive' : ''}`}
            />
            {errors.biller && <p className="text-xs text-destructive">{errors.biller}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Biller ID / Paybill Number *</Label>
            <Input
              placeholder="e.g. 888880"
              value={manualBillerCode}
              onChange={(e) => { setManualBillerCode(e.target.value); setErrors(prev => ({ ...prev, billerCode: '' })); }}
              className={`touch-target ${errors.billerCode ? 'border-destructive' : ''}`}
            />
            {errors.billerCode && <p className="text-xs text-destructive">{errors.billerCode}</p>}
          </div>
        </div>
      )}

      {/* Reference number */}
      {(selectedBiller || mode === 'manual') && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {activeBiller?.referenceLabel || 'Bill / Reference Number'} *
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder={activeBiller?.referencePlaceholder || 'Enter reference number'}
              value={referenceNumber}
              onChange={(e) => {
                setReferenceNumber(e.target.value);
                setPresentmentFetched(false);
                setPresentment(null);
                setErrors(prev => ({ ...prev, reference: '' }));
              }}
              className={`touch-target flex-1 ${errors.reference ? 'border-destructive' : ''}`}
            />
            {activeBiller?.supportsPresentment && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchBill}
                disabled={!referenceNumber.trim() || presentmentLoading}
                className="shrink-0 h-10"
              >
                {presentmentLoading ? (
                  <span className="animate-pulse text-xs">Fetching...</span>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-1" /> Fetch Bill
                  </>
                )}
              </Button>
            )}
          </div>
          {errors.reference && <p className="text-xs text-destructive">{errors.reference}</p>}
        </div>
      )}

      {/* Bill Presentment Card */}
      {presentment && (
        <div className="rounded-xl border border-info/30 bg-info/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-info" />
            <h4 className="text-sm font-semibold text-info">Bill Presentment</h4>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biller</span>
              <span className="font-medium">{presentment.billerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Holder</span>
              <span className="font-medium">{presentment.accountHolder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bill Period</span>
              <span className="font-medium">{presentment.billPeriod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium text-warning">{presentment.dueDate}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-info/20">
              <span className="text-sm font-semibold">Outstanding Amount</span>
              <span className="text-base font-bold text-foreground">KES {presentment.outstandingAmount.toLocaleString()}</span>
            </div>
            {presentment.lastPayment && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Last Payment</span>
                <span>KES {presentment.lastPayment.amount.toLocaleString()} on {presentment.lastPayment.date}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {presentmentFetched && !presentment && activeBiller?.supportsPresentment && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0" />
          <p className="text-xs text-warning">Could not retrieve bill details. You can still enter the amount manually.</p>
        </div>
      )}

      {/* Amount */}
      {(selectedBiller || mode === 'manual') && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Amount (KES) *</Label>
          <Input
            type="number"
            placeholder="Enter payment amount"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setSelectedChannelId(null); setErrors(prev => ({ ...prev, amount: '', channel: '' })); }}
            className={`touch-target ${errors.amount ? 'border-destructive' : ''}`}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}

          {/* Overdraft option */}
          {selectedAccount && numAmount > availableBalance && odLimit > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Wallet className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-warning">Insufficient Balance — Overdraft Available</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Balance: KES {availableBalance.toLocaleString()} • Shortfall: KES {shortfall.toLocaleString()} • OD Limit: KES {odLimit.toLocaleString()}
                  </p>
                </div>
              </div>
              {canOverdraft && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={useOverdraft}
                    onCheckedChange={(checked) => setUseOverdraft(!!checked)}
                    id="use-overdraft"
                  />
                  <label htmlFor="use-overdraft" className="text-xs font-medium cursor-pointer">
                    Use overdraft facility (KES {shortfall.toLocaleString()} will be drawn from OD credit line)
                  </label>
                </div>
              )}
              {!canOverdraft && shortfall > odLimit && (
                <p className="text-xs text-destructive">Shortfall exceeds OD limit. Please reduce the amount.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Channel Recommendation */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Payment Channel *</Label>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Based on KES {numAmount.toLocaleString()}
            </span>
          </div>

          <RadioGroup
            value={effectiveChannelId || ''}
            onValueChange={(val) => { setSelectedChannelId(val); setErrors(prev => ({ ...prev, channel: '' })); }}
            className="space-y-2"
          >
            {recommendations.map((rec) => (
              <ChannelOption key={rec.channel.id} rec={rec} isSelected={effectiveChannelId === rec.channel.id} />
            ))}
          </RadioGroup>
          {errors.channel && <p className="text-xs text-destructive">{errors.channel}</p>}
        </div>
      )}

      {/* Additional Options */}
      {(selectedBiller || mode === 'manual') && (
        <div className="space-y-3">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {showOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Additional Options
          </button>

          {showOptions && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {/* Email confirmation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Email Confirmation</Label>
                  </div>
                  <Switch checked={emailConfirmation} onCheckedChange={setEmailConfirmation} />
                </div>
                {emailConfirmation && (
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailAddress}
                    onChange={(e) => { setEmailAddress(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                    className={`touch-target ${errors.email ? 'border-destructive' : ''}`}
                  />
                )}
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Save biller — only for preset mode; manual mode saves at validate stage */}
              {mode === 'preset' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Save Biller for Future</Label>
                  </div>
                  <Switch checked={saveBiller} onCheckedChange={setSaveBiller} />
                </div>
              )}

              {/* Recurrence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Set Recurring Payment</Label>
                  </div>
                  <Switch checked={enableRecurrence} onCheckedChange={setEnableRecurrence} />
                </div>
                {enableRecurrence && (
                  <Select value={recurrenceFrequency} onValueChange={setRecurrenceFrequency}>
                    <SelectTrigger className="touch-target">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={eligibleAccounts.length === 0}
        className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow mt-4"
      >
        Submit for Validation
      </Button>
    </div>
  );
}

function ChannelOption({ rec, isSelected }) {
  const { channel, eligible, ineligibleReason, estimatedCost, recommended, recommendationReason } = rec;

  return (
    <label
      className={`relative flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
        !eligible
          ? 'opacity-50 cursor-not-allowed border-border bg-muted/20'
          : isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      <RadioGroupItem value={channel.id} disabled={!eligible} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground">{ICON_MAP[channel.icon]}</span>
          <span className="text-sm font-semibold text-foreground">{channel.name}</span>
          {recommended && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5 gap-1 bg-primary/90">
              <Star className="h-3 w-3" /> Recommended
            </Badge>
          )}
          {channel.realtime && eligible && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-success border-success/30">
              Real-time
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{channel.description}</p>

        {eligible ? (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>
              Cost: {estimatedCost === 0
                ? <span className="text-success font-medium">Free</span>
                : <span className="font-medium text-foreground">KES {estimatedCost.toLocaleString()}</span>}
            </span>
            <span>SLA: <span className="font-medium text-foreground">{channel.sla}</span></span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-destructive mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{ineligibleReason}</span>
          </div>
        )}

        {recommended && recommendationReason && eligible && (
          <div className="flex items-center gap-1 text-xs text-primary mt-1">
            <Info className="h-3 w-3" />
            <span>{recommendationReason}</span>
          </div>
        )}
      </div>
    </label>
  );
}
