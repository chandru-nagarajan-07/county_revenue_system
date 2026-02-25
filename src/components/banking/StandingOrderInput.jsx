import { useState, useMemo } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

function StandingOrderInput({ customer, onSubmit }) {
  const eligibleAccounts = useMemo(() => getEligibleAccounts(customer, 'standing-order'), [customer]);

  const [selectedAccount, setSelectedAccount] = useState(
    eligibleAccounts.length === 1 ? eligibleAccounts[0] : null
  );
  const [beneficiary, setBeneficiary] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = 'Please select a source account';
    if (!beneficiary.trim()) errs.beneficiary = 'Enter beneficiary account';
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!frequency) errs.frequency = 'Select frequency';
    if (!startDate) errs.startDate = 'Select start date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      sourceAccount: selectedAccount.accountNumber,
      beneficiary,
      beneficiaryName,
      amount,
      frequency,
      startDate,
      endDate,
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

      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-[hsl(var(--accent))] shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Set Standing Order</h3>
          <p className="text-xs text-muted-foreground">Create or modify recurring payment instructions</p>
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
                <span className="text-muted-foreground"> • {ACCOUNT_TYPE_LABELS[acc.type]} • {acc.currency} {acc.balance.toLocaleString()}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
      </div>

      {/* Beneficiary Account */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Beneficiary Account *</Label>
        <Input
          placeholder="Enter beneficiary account number"
          value={beneficiary}
          onChange={(e) => { setBeneficiary(e.target.value); setErrors(prev => ({ ...prev, beneficiary: '' })); }}
          className={`touch-target ${errors.beneficiary ? 'border-destructive' : ''}`}
        />
        {errors.beneficiary && <p className="text-xs text-destructive">{errors.beneficiary}</p>}
      </div>

      {/* Beneficiary Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Beneficiary Name</Label>
        <Input
          placeholder="Enter beneficiary name"
          value={beneficiaryName}
          onChange={(e) => setBeneficiaryName(e.target.value)}
          className="touch-target"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Amount ({selectedAccount?.currency || 'KES'}) *</Label>
        <Input
          type="number"
          placeholder="Enter amount per payment"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
          className={`touch-target ${errors.amount ? 'border-destructive' : ''}`}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Frequency *</Label>
        <Select value={frequency} onValueChange={(v) => { setFrequency(v); setErrors(prev => ({ ...prev, frequency: '' })); }}>
          <SelectTrigger className={`touch-target ${errors.frequency ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Select frequency..." />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.frequency && <p className="text-xs text-destructive">{errors.frequency}</p>}
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Start Date *</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: '' })); }}
          className={`touch-target ${errors.startDate ? 'border-destructive' : ''}`}
        />
        {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">End Date (optional)</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
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

export default StandingOrderInput;
