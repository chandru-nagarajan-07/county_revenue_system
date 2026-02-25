import { useState, useMemo } from 'react';
import { BookOpen, FileText, CheckCircle2, AlertCircle, Calendar, Hash, Printer, Mail, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

const CHEQUE_LEAVES = [
  { value: '25', label: '25 Leaves' },
  { value: '50', label: '50 Leaves' },
  { value: '100', label: '100 Leaves' },
];

const SERIES_PREFS = [
  { value: 'continue', label: 'Continue from last series' },
  { value: 'new', label: 'New series' },
];

const STATEMENT_TYPES = [
  { value: 'mini', label: 'Mini Statement (Last 10 txns)' },
  { value: 'interim', label: 'Interim Statement' },
  { value: 'full', label: 'Full Period Statement' },
  { value: 'audit', label: 'Audit Confirmation Letter' },
];

const STATEMENT_FORMATS = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'csv', label: 'CSV Spreadsheet' },
  { value: 'printed', label: 'Printed Copy' },
];

const DELIVERY_METHODS = [
  { value: 'branch', label: 'Branch Collection' },
  { value: 'email', label: 'Email Delivery' },
  { value: 'both', label: 'Branch + Email Copy' },
];

const BRANCHES = [
  'Head Office', 'Westlands', 'Mombasa Road', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri',
];

function ServiceRequestInput({ serviceId, customer, onSubmit }) {
  const eligibleAccounts = useMemo(() => getEligibleAccounts(customer, serviceId), [customer, serviceId]);
  const [selectedAccount, setSelectedAccount] = useState(
    eligibleAccounts.length === 1 ? eligibleAccounts[0] : null
  );
  const [errors, setErrors] = useState({});

  // Cheque Book State
  const [chequeLeaves, setChequeLeaves] = useState('50');
  const [seriesPref, setSeriesPref] = useState('continue');
  const [chqDelivery, setChqDelivery] = useState('branch');
  const [chqBranch, setChqBranch] = useState('');
  const [contactPhone, setContactPhone] = useState(customer.phone);
  const [contactEmail, setContactEmail] = useState(customer.email);
  const [smsNotify, setSmsNotify] = useState(true);
  const [chqReason, setChqReason] = useState('');

  // Statement State
  const [stmtType, setStmtType] = useState('full');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [stmtFormat, setStmtFormat] = useState('pdf');
  const [stmtDelivery, setStmtDelivery] = useState('email');
  const [stmtBranch, setStmtBranch] = useState('');
  const [stmtEmail, setStmtEmail] = useState(customer.email);
  const [certified, setCertified] = useState(false);
  const [purpose, setPurpose] = useState('');

  const needsPeriod = stmtType === 'interim' || stmtType === 'full' || stmtType === 'audit';

  const handleAccountSelect = (accNum) => {
    const acc = eligibleAccounts.find(a => a.accountNumber === accNum) || null;
    setSelectedAccount(acc);
    setErrors(prev => ({ ...prev, account: '' }));
  };

  const validateAndSubmit = () => {
    const errs = {};
    if (!selectedAccount) errs.account = 'Please select an account';

    if (serviceId === 'cheque-book') {
      if (chqDelivery === 'branch' && !chqBranch) errs.branch = 'Please select a collection branch';
      if (!contactPhone.trim()) errs.phone = 'Contact phone is required';
    } else {
      if (needsPeriod && !periodFrom) errs.periodFrom = 'Start date is required';
      if (needsPeriod && !periodTo) errs.periodTo = 'End date is required';
      if (needsPeriod && periodFrom && periodTo && periodFrom > periodTo) errs.periodTo = 'End date must be after start date';
      if ((stmtDelivery === 'email' || stmtDelivery === 'both') && !stmtEmail.trim()) errs.email = 'Email address is required';
      if ((stmtDelivery === 'branch' || stmtDelivery === 'both') && !stmtBranch) errs.branch = 'Please select a collection branch';
      if (certified && !purpose.trim()) errs.purpose = 'Purpose is required for certified statements';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (serviceId === 'cheque-book') {
      onSubmit({
        serviceType: 'cheque-book',
        accountNumber: selectedAccount.accountNumber,
        accountName: selectedAccount.accountName,
        chequeLeaves,
        chequeLeafLabel: CHEQUE_LEAVES.find(l => l.value === chequeLeaves)?.label || chequeLeaves,
        seriesPreference: seriesPref,
        seriesLabel: SERIES_PREFS.find(s => s.value === seriesPref)?.label || seriesPref,
        deliveryMethod: chqDelivery,
        deliveryLabel: chqDelivery === 'branch' ? 'Branch Collection' : 'Branch Collection',
        deliveryBranch: chqBranch,
        contactPhone,
        contactEmail,
        smsNotify,
        reason: chqReason,
      });
    } else {
      onSubmit({
        serviceType: 'statement-request',
        accountNumber: selectedAccount.accountNumber,
        accountName: selectedAccount.accountName,
        statementType: stmtType,
        statementTypeLabel: STATEMENT_TYPES.find(t => t.value === stmtType)?.label || stmtType,
        periodFrom: needsPeriod ? periodFrom : 'N/A',
        periodTo: needsPeriod ? periodTo : 'N/A',
        format: stmtFormat,
        formatLabel: STATEMENT_FORMATS.find(f => f.value === stmtFormat)?.label || stmtFormat,
        deliveryMethod: stmtDelivery,
        deliveryLabel: DELIVERY_METHODS.find(d => d.value === stmtDelivery)?.label || stmtDelivery,
        deliveryBranch: stmtBranch || undefined,
        deliveryEmail: stmtEmail || undefined,
        certified,
        purpose: purpose || undefined,
      });
    }
  };

  const isCheque = serviceId === 'cheque-book';

  return (
    <div className="space-y-6 max-w-lg mx-auto">
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

      {/* Service icon header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {isCheque ? <BookOpen className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {isCheque ? 'Cheque Book Request' : 'Account Statement'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isCheque ? 'Request a new cheque book for your current account' : 'Request a statement for any of your accounts'}
          </p>
        </div>
      </div>

      {/* Account selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Account *</Label>
        {eligibleAccounts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">
              {isCheque
                ? 'No current accounts available. Cheque books can only be issued for current accounts.'
                : 'No eligible accounts found for statement generation.'}
            </p>
          </div>
        ) : (
          <Select value={selectedAccount?.accountNumber || ''} onValueChange={handleAccountSelect}>
            <SelectTrigger className={`touch-target ${errors.account ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Choose an account..." />
            </SelectTrigger>
            <SelectContent>
              {eligibleAccounts.map(acc => (
                <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{acc.accountNumber}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-xs">{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs font-medium">{acc.currency} {acc.balance.toLocaleString()}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
      </div>

      {/* ════════════ CHEQUE BOOK FORM ════════════ */}
      {isCheque && (
        <>
          {/* Leaves */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" /> Number of Leaves *
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {CHEQUE_LEAVES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setChequeLeaves(opt.value)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                    chequeLeaves === opt.value
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Series preference */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Series Preference</Label>
            <Select value={seriesPref} onValueChange={setSeriesPref}>
              <SelectTrigger className="touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERIES_PREFS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Collection Branch *
            </Label>
            <Select value={chqBranch} onValueChange={(v) => { setChqBranch(v); setErrors(p => ({ ...p, branch: '' })); }}>
              <SelectTrigger className={`touch-target ${errors.branch ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select branch for collection..." />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branch && <p className="text-xs text-destructive">{errors.branch}</p>}
          </div>

          {/* ETA info */}
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 border border-border p-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Estimated Processing Time</p>
              <p className="text-xs text-muted-foreground">3-5 business days. SMS notification will be sent when ready for collection.</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contact Phone *</Label>
              <Input
                value={contactPhone}
                onChange={e => { setContactPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
                className={`touch-target ${errors.phone ? 'border-destructive' : ''}`}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contact Email</Label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="touch-target" />
            </div>
          </div>

          {/* SMS notify */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">SMS Notification</p>
              <p className="text-xs text-muted-foreground">Receive SMS when cheque book is ready</p>
            </div>
            <Switch checked={smsNotify} onCheckedChange={setSmsNotify} />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason / Notes (optional)</Label>
            <Textarea
              value={chqReason}
              onChange={e => setChqReason(e.target.value)}
              placeholder="e.g. First cheque book, previous exhausted, lost..."
              rows={2}
              className="touch-target"
            />
          </div>
        </>
      )}

      {/* ════════════ STATEMENT REQUEST FORM ════════════ */}
      {!isCheque && (
        <>
          {/* Statement type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statement Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATEMENT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setStmtType(t.value)}
                  className={`rounded-lg border px-3 py-3 text-left transition-all ${
                    stmtType === t.value
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm font-medium">{t.label.split(' (')[0]}</p>
                  {t.label.includes('(') && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">({t.label.split('(')[1]}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Period selector */}
          {needsPeriod && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> From *
                </Label>
                <Input
                  type="date"
                  value={periodFrom}
                  onChange={e => { setPeriodFrom(e.target.value); setErrors(p => ({ ...p, periodFrom: '' })); }}
                  className={`touch-target ${errors.periodFrom ? 'border-destructive' : ''}`}
                />
                {errors.periodFrom && <p className="text-xs text-destructive">{errors.periodFrom}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> To *
                </Label>
                <Input
                  type="date"
                  value={periodTo}
                  onChange={e => { setPeriodTo(e.target.value); setErrors(p => ({ ...p, periodTo: '' })); }}
                  className={`touch-target ${errors.periodTo ? 'border-destructive' : ''}`}
                />
                {errors.periodTo && <p className="text-xs text-destructive">{errors.periodTo}</p>}
              </div>
            </div>
          )}

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Output Format
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {STATEMENT_FORMATS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStmtFormat(f.value)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                    stmtFormat === f.value
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Delivery Method *
            </Label>
            <Select value={stmtDelivery} onValueChange={setStmtDelivery}>
              <SelectTrigger className="touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_METHODS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional: Email */}
          {(stmtDelivery === 'email' || stmtDelivery === 'both') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery Email *</Label>
              <Input
                type="email"
                value={stmtEmail}
                onChange={e => { setStmtEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                className={`touch-target ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          )}

          {/* Conditional: Branch */}
          {(stmtDelivery === 'branch' || stmtDelivery === 'both') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Collection Branch *</Label>
              <Select value={stmtBranch} onValueChange={v => { setStmtBranch(v); setErrors(p => ({ ...p, branch: '' })); }}>
                <SelectTrigger className={`touch-target ${errors.branch ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch && <p className="text-xs text-destructive">{errors.branch}</p>}
            </div>
          )}

          {/* Certified toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Certified Statement</p>
              <p className="text-xs text-muted-foreground">Bank-stamped & signed — additional fee applies</p>
            </div>
            <Switch checked={certified} onCheckedChange={setCertified} />
          </div>

          {certified && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Purpose of Certified Statement *</Label>
              <Input
                value={purpose}
                onChange={e => { setPurpose(e.target.value); setErrors(p => ({ ...p, purpose: '' })); }}
                placeholder="e.g. Visa application, Loan processing, Audit..."
                className={`touch-target ${errors.purpose ? 'border-destructive' : ''}`}
              />
              {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
            </div>
          )}

          {/* ETA */}
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 border border-border p-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Estimated Availability</p>
              <p className="text-xs text-muted-foreground">
                {stmtType === 'mini' ? 'Instant — generated immediately' :
                 certified ? '2-3 business days for certified copy' :
                 stmtDelivery === 'email' ? 'Within 1 hour via email' : '1 business day for branch collection'}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Submit */}
      <Button
        onClick={validateAndSubmit}
        disabled={eligibleAccounts.length === 0}
        className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Submit Request
      </Button>
    </div>
  );
}

export default ServiceRequestInput;
