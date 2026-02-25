import { useState, useMemo } from 'react';
import { Zap, Clock, Shield, ArrowLeftRight, Smartphone, Check, AlertCircle, Info, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';
import { recommendChannels } from '@/data/paymentChannels';

const ICON_MAP = {
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />,
};

export function FundsTransferInput({ customer, onSubmit }) {
  const eligibleAccounts = useMemo(() => getEligibleAccounts(customer, 'funds-transfer'), [customer]);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [destination, setDestination] = useState('other-bank');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [errors, setErrors] = useState({});

  const numAmount = useMemo(() => {
    const n = Number(amount);
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [amount]);

  const recommendations = useMemo(() => {
    if (numAmount === 0) return [];
    return recommendChannels(numAmount, destination);
  }, [numAmount, destination]);

  // Auto-select recommended channel when recommendations change
  const recommendedId = recommendations.find(r => r.recommended)?.channel.id;
  const effectiveChannelId = selectedChannelId ?? recommendedId ?? null;

  const selectedRec = recommendations.find(r => r.channel.id === effectiveChannelId);

  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = 'Please select a source account';
    if (!beneficiaryAccount.trim()) errs.beneficiaryAccount = 'Beneficiary account is required';
    if (!beneficiaryName.trim()) errs.beneficiaryName = 'Beneficiary name is required';
    if (numAmount <= 0) errs.amount = 'Enter a valid amount';
    if (!effectiveChannelId) errs.channel = 'Please select a payment channel';
    if (selectedRec && !selectedRec.eligible) errs.channel = selectedRec.ineligibleReason || 'Channel not available for this amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !selectedRec) return;
    onSubmit({
      sourceAccount: selectedAccount.accountNumber,
      beneficiaryAccount,
      beneficiaryName,
      amount,
      reference,
      destination,
      channelId: selectedRec.channel.id,
      channelName: selectedRec.channel.name,
      channelSla: selectedRec.channel.sla,
      networkCost: selectedRec.estimatedCost,
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
                <span className="text-muted-foreground"> • {ACCOUNT_TYPE_LABELS[acc.type]} • {acc.currency}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
      </div>

      {/* Destination type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Payment Destination *</Label>
        <Select value={destination} onValueChange={(val) => {
          setDestination(val);
          setSelectedChannelId(null); // reset channel on destination change
        }}>
          <SelectTrigger className="touch-target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="same-bank">Same Bank (Internal)</SelectItem>
            <SelectItem value="other-bank">Other Bank</SelectItem>
            <SelectItem value="mobile-wallet">Mobile Wallet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Beneficiary */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {destination === 'mobile-wallet' ? 'Mobile Number' : 'Beneficiary Account'} *
        </Label>
        <Input
          placeholder={destination === 'mobile-wallet' ? '07XX XXX XXX' : 'Enter account number'}
          value={beneficiaryAccount}
          onChange={(e) => { setBeneficiaryAccount(e.target.value); setErrors(prev => ({ ...prev, beneficiaryAccount: '' })); }}
          className={`touch-target ${errors.beneficiaryAccount ? 'border-destructive' : ''}`}
        />
        {errors.beneficiaryAccount && <p className="text-xs text-destructive">{errors.beneficiaryAccount}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Beneficiary Name *</Label>
        <Input
          placeholder="Enter beneficiary name"
          value={beneficiaryName}
          onChange={(e) => { setBeneficiaryName(e.target.value); setErrors(prev => ({ ...prev, beneficiaryName: '' })); }}
          className={`touch-target ${errors.beneficiaryName ? 'border-destructive' : ''}`}
        />
        {errors.beneficiaryName && <p className="text-xs text-destructive">{errors.beneficiaryName}</p>}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Amount (KES) *</Label>
        <Input
          type="number"
          placeholder="Enter transfer amount"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setSelectedChannelId(null); setErrors(prev => ({ ...prev, amount: '', channel: '' })); }}
          className={`touch-target ${errors.amount ? 'border-destructive' : ''}`}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
      </div>

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
            onValueChange={(val) => {
              setSelectedChannelId(val);
              setErrors(prev => ({ ...prev, channel: '' }));
            }}
            className="space-y-2"
          >
            {recommendations.map((rec) => (
              <ChannelOption key={rec.channel.id} rec={rec} isSelected={effectiveChannelId === rec.channel.id} />
            ))}
          </RadioGroup>
          {errors.channel && <p className="text-xs text-destructive">{errors.channel}</p>}
        </div>
      )}

      {/* Reference */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Reference / Narration</Label>
        <Input
          placeholder="Enter reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="touch-target"
        />
      </div>

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
            <span className="hidden sm:inline">Hours: {channel.availability}</span>
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
