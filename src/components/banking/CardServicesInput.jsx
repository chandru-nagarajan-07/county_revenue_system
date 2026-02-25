import { useState, useMemo } from 'react';
import { CreditCard, ShieldCheck, Settings, RefreshCw, AlertCircle, Check, Mail, Truck, Building2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const CARD_TYPES = [
  { value: 'visa-debit', label: 'Visa Debit', icon: '💳' },
  { value: 'mastercard-debit', label: 'Mastercard Debit', icon: '💳' },
  { value: 'visa-credit', label: 'Visa Credit', icon: '🏦' },
  { value: 'mastercard-credit', label: 'Mastercard Credit', icon: '🏦' },
  { value: 'visa-prepaid', label: 'Visa Prepaid', icon: '💲' },
];

const CARD_TIERS = [
  { value: 'classic', label: 'Classic', description: 'Standard card with essential features', fee: 'KES 500' },
  { value: 'gold', label: 'Gold', description: 'Enhanced limits, lounge access, travel insurance', fee: 'KES 2,500' },
  { value: 'platinum', label: 'Platinum', description: 'Premium rewards, concierge, global lounge access', fee: 'KES 5,000' },
  { value: 'infinite', label: 'Infinite', description: 'Unlimited benefits, priority banking, lifestyle perks', fee: 'KES 10,000' },
];

const DELIVERY_METHODS = [
  { value: 'branch-pickup', label: 'Branch Pickup', eta: '3-5 business days', icon: Building2 },
  { value: 'courier', label: 'Courier Delivery', eta: '5-7 business days', icon: Truck },
  { value: 'registered-mail', label: 'Registered Mail', eta: '7-14 business days', icon: Mail },
];

const REPLACEMENT_REASONS = [
  { value: 'lost', label: 'Lost Card', requiresPolice: true },
  { value: 'stolen', label: 'Stolen Card', requiresPolice: true },
  { value: 'damaged', label: 'Damaged / Defective', requiresPolice: false },
  { value: 'expired', label: 'Expired Card', requiresPolice: false },
  { value: 'name-change', label: 'Name Change', requiresPolice: false },
];

const PIN_ACTIONS = [
  { value: 'set-new', label: 'Set New PIN', description: 'Set PIN for a newly issued card' },
  { value: 'reset', label: 'Reset PIN', description: 'Change your current card PIN' },
  { value: 'unblock', label: 'Unblock PIN', description: 'Unblock after too many incorrect attempts' },
];

const BRANCHES = [
  'Nairobi CBD Branch', 'Westlands Branch', 'Mombasa Branch', 'Kisumu Branch',
  'Nakuru Branch', 'Eldoret Branch', 'Thika Branch', 'Karen Branch',
];

// Mock existing cards for a customer
function getCustomerCards(customer) {
  const cards = [];
  const activeAccounts = customer.accounts.filter(a => a.status === 'active' && ['savings', 'current'].includes(a.type));
  if (activeAccounts.length > 0) {
    cards.push({ last4: '4521', type: 'Visa Debit', tier: 'Gold', account: activeAccounts[0].accountNumber, status: 'active', posLimit: 200000, atmLimit: 100000 });
  }
  if (activeAccounts.length > 1) {
    cards.push({ last4: '8734', type: 'Mastercard Debit', tier: 'Classic', account: activeAccounts[1].accountNumber, status: 'active', posLimit: 100000, atmLimit: 50000 });
  }
  return cards;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function CardServicesInput({ serviceId, customer, onSubmit }) {
  const eligibleAccounts = useMemo(() => getEligibleAccounts(customer, serviceId), [customer, serviceId]);
  const existingCards = useMemo(() => getCustomerCards(customer), [customer]);

  // Shared
  const [linkedAccount, setLinkedAccount] = useState(eligibleAccounts.length === 1 ? eligibleAccounts[0].accountNumber : '');
  const [errors, setErrors] = useState({});

  // Card Issuance
  const [cardType, setCardType] = useState('');
  const [cardTier, setCardTier] = useState('');
  const [nameOnCard, setNameOnCard] = useState(customer.fullName.toUpperCase());
  const [deliveryMethod, setDeliveryMethod] = useState('branch-pickup');
  const [deliveryBranch, setDeliveryBranch] = useState('');
  const [enableContactless, setEnableContactless] = useState(true);
  const [enableInternational, setEnableInternational] = useState(false);
  const [dailyPosLimit, setDailyPosLimit] = useState('200000');
  const [dailyAtmLimit, setDailyAtmLimit] = useState('100000');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  // Card Replacement
  const [selectedCard, setSelectedCard] = useState('');
  const [replacementReason, setReplacementReason] = useState('');
  const [retainCardNumber, setRetainCardNumber] = useState(false);
  const [policeAbstractRef, setPoliceAbstractRef] = useState('');

  // PIN Management
  const [pinCard, setPinCard] = useState('');
  const [pinAction, setPinAction] = useState('');
  const [pinDeliveryMethod, setPinDeliveryMethod] = useState('sms');

  // Card Limit
  const [limitCard, setLimitCard] = useState('');
  const [newPosLimit, setNewPosLimit] = useState('');
  const [newAtmLimit, setNewAtmLimit] = useState('');
  const [limitReason, setLimitReason] = useState('');
  const [enableEcommerce, setEnableEcommerce] = useState(true);

  const selectedReplacementReason = REPLACEMENT_REASONS.find(r => r.value === replacementReason);
  const selectedExistingCard = existingCards.find(c => c.last4 === selectedCard);
  const limitCardData = existingCards.find(c => c.last4 === limitCard);

  const validate = () => {
    const errs = {};

    if (!linkedAccount && serviceId === 'card-issuance') errs.linkedAccount = 'Please select an account';

    if (serviceId === 'card-issuance') {
      if (!cardType) errs.cardType = 'Please select a card type';
      if (!cardTier) errs.cardTier = 'Please select a card tier';
      if (!nameOnCard.trim()) errs.nameOnCard = 'Name on card is required';
      if (nameOnCard.length > 26) errs.nameOnCard = 'Max 26 characters allowed on card';
      if (!deliveryMethod) errs.deliveryMethod = 'Please select a delivery method';
      if (deliveryMethod === 'branch-pickup' && !deliveryBranch) errs.deliveryBranch = 'Please select a branch';
    }

    if (serviceId === 'card-replacement') {
      if (!selectedCard) errs.selectedCard = 'Please select a card';
      if (!replacementReason) errs.replacementReason = 'Please select a reason';
      if (selectedReplacementReason?.requiresPolice && !policeAbstractRef.trim()) {
        errs.policeAbstractRef = 'Police abstract reference is required for lost/stolen cards';
      }
    }

    if (serviceId === 'pin-management') {
      if (!pinCard) errs.pinCard = 'Please select a card';
      if (!pinAction) errs.pinAction = 'Please select an action';
    }

    if (serviceId === 'card-limit') {
      if (!limitCard) errs.limitCard = 'Please select a card';
      if (!newPosLimit && !newAtmLimit) errs.newPosLimit = 'Please set at least one limit';
      if (newPosLimit && (isNaN(Number(newPosLimit)) || Number(newPosLimit) <= 0)) errs.newPosLimit = 'Invalid POS limit';
      if (newAtmLimit && (isNaN(Number(newAtmLimit)) || Number(newAtmLimit) <= 0)) errs.newAtmLimit = 'Invalid ATM limit';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const base = { serviceType: serviceId, linkedAccount };

    if (serviceId === 'card-issuance') {
      onSubmit({
        ...base,
        cardType,
        cardTypeLabel: CARD_TYPES.find(c => c.value === cardType)?.label || '',
        cardTier,
        cardTierLabel: CARD_TIERS.find(t => t.value === cardTier)?.label || '',
        nameOnCard,
        deliveryMethod,
        deliveryMethodLabel: DELIVERY_METHODS.find(d => d.value === deliveryMethod)?.label || '',
        deliveryBranch,
        enableContactless,
        enableInternational,
        dailyPosLimit,
        dailyAtmLimit,
        emailNotifications,
        smsAlerts,
      });
    } else if (serviceId === 'card-replacement') {
      onSubmit({
        ...base,
        linkedAccount: selectedExistingCard?.account || linkedAccount,
        existingCardLast4: selectedCard,
        replacementReason,
        replacementReasonLabel: REPLACEMENT_REASONS.find(r => r.value === replacementReason)?.label || '',
        retainCardNumber,
        policeAbstractRef,
        deliveryMethod: deliveryMethod || 'branch-pickup',
        deliveryMethodLabel: DELIVERY_METHODS.find(d => d.value === (deliveryMethod || 'branch-pickup'))?.label || '',
        deliveryBranch,
      });
    } else if (serviceId === 'pin-management') {
      onSubmit({
        ...base,
        linkedAccount: existingCards.find(c => c.last4 === pinCard)?.account || linkedAccount,
        existingCardLast4: pinCard,
        pinAction,
        pinActionLabel: PIN_ACTIONS.find(a => a.value === pinAction)?.label || '',
        pinDeliveryMethod,
      });
    } else if (serviceId === 'card-limit') {
      onSubmit({
        ...base,
        linkedAccount: limitCardData?.account || linkedAccount,
        existingCardLast4: limitCard,
        currentPosLimit: String(limitCardData?.posLimit || 0),
        currentAtmLimit: String(limitCardData?.atmLimit || 0),
        newPosLimit: newPosLimit || String(limitCardData?.posLimit || 0),
        newAtmLimit: newAtmLimit || String(limitCardData?.atmLimit || 0),
        limitChangeReason: limitReason,
        enableEcommerce,
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

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

      {/* ============== CARD ISSUANCE ============== */}
      {serviceId === 'card-issuance' && (
        <div className="space-y-5">
          {/* Account */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Link to Account *</Label>
            <Select value={linkedAccount} onValueChange={setLinkedAccount}>
              <SelectTrigger className={`touch-target ${errors.linkedAccount ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleAccounts.map(acc => (
                  <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                    {acc.accountNumber} • {ACCOUNT_TYPE_LABELS[acc.type]} • {acc.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.linkedAccount && <p className="text-xs text-destructive">{errors.linkedAccount}</p>}
          </div>

          {/* Card Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Card Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {CARD_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => { setCardType(ct.value); setErrors(e => ({ ...e, cardType: '' })); }}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all touch-target ${
                    cardType === ct.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="text-lg">{ct.icon}</span>
                  <span className="text-sm font-medium">{ct.label}</span>
                </button>
              ))}
            </div>
            {errors.cardType && <p className="text-xs text-destructive">{errors.cardType}</p>}
          </div>

          {/* Card Tier */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Card Tier *</Label>
            <div className="space-y-2">
              {CARD_TIERS.map(tier => (
                <button
                  key={tier.value}
                  onClick={() => { setCardTier(tier.value); setErrors(e => ({ ...e, cardTier: '' })); }}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all touch-target ${
                    cardTier === tier.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{tier.label}</span>
                      <span className="text-xs text-muted-foreground">({tier.fee}/yr)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                  </div>
                  {cardTier === tier.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
            {errors.cardTier && <p className="text-xs text-destructive">{errors.cardTier}</p>}
          </div>

          {/* Name on Card */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Name on Card * <span className="text-muted-foreground font-normal">(max 26 chars)</span></Label>
            <Input
              value={nameOnCard}
              onChange={e => setNameOnCard(e.target.value.toUpperCase())}
              maxLength={26}
              className={`touch-target font-mono tracking-wider ${errors.nameOnCard ? 'border-destructive' : ''}`}
            />
            <p className="text-xs text-muted-foreground">{nameOnCard.length}/26 characters</p>
            {errors.nameOnCard && <p className="text-xs text-destructive">{errors.nameOnCard}</p>}
          </div>

          {/* Card Features */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" /> Card Features
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Contactless Payments</p>
                  <p className="text-xs text-muted-foreground">Tap-to-pay at POS terminals</p>
                </div>
                <Switch checked={enableContactless} onCheckedChange={setEnableContactless} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">International Transactions</p>
                  <p className="text-xs text-muted-foreground">Enable usage outside Kenya</p>
                </div>
                <Switch checked={enableInternational} onCheckedChange={setEnableInternational} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Transaction alerts via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">SMS Alerts</p>
                  <p className="text-xs text-muted-foreground">Instant SMS for every transaction</p>
                </div>
                <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
              </div>
            </div>
          </div>

          {/* Daily Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Daily POS Limit (KES)</Label>
              <Input type="number" value={dailyPosLimit} onChange={e => setDailyPosLimit(e.target.value)} className="touch-target" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Daily ATM Limit (KES)</Label>
              <Input type="number" value={dailyAtmLimit} onChange={e => setDailyAtmLimit(e.target.value)} className="touch-target" />
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Card Delivery *</Label>
            <div className="space-y-2">
              {DELIVERY_METHODS.map(dm => {
                const Icon = dm.icon;
                return (
                  <button
                    key={dm.value}
                    onClick={() => setDeliveryMethod(dm.value)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all touch-target ${
                      deliveryMethod === dm.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{dm.label}</span>
                      <p className="text-xs text-muted-foreground">{dm.eta}</p>
                    </div>
                    {deliveryMethod === dm.value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            {errors.deliveryMethod && <p className="text-xs text-destructive">{errors.deliveryMethod}</p>}
          </div>

          {deliveryMethod === 'branch-pickup' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pickup Branch *</Label>
              <Select value={deliveryBranch} onValueChange={setDeliveryBranch}>
                <SelectTrigger className={`touch-target ${errors.deliveryBranch ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.deliveryBranch && <p className="text-xs text-destructive">{errors.deliveryBranch}</p>}
            </div>
          )}
        </div>
      )}

      {/* ============== CARD REPLACEMENT ============== */}
      {serviceId === 'card-replacement' && (
        <div className="space-y-5">
          {/* Select existing card */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Card to Replace *</Label>
            {existingCards.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">No active cards found for this customer.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingCards.map(card => (
                  <button
                    key={card.last4}
                    onClick={() => { setSelectedCard(card.last4); setErrors(e => ({ ...e, selectedCard: '' })); }}
                    className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all touch-target ${
                      selectedCard === card.last4
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">•••• {card.last4}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{card.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{card.tier}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Linked to {card.account}</p>
                    </div>
                    {selectedCard === card.last4 && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
            {errors.selectedCard && <p className="text-xs text-destructive">{errors.selectedCard}</p>}
          </div>

          {/* Replacement Reason */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason for Replacement *</Label>
            <div className="space-y-2">
              {REPLACEMENT_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => { setReplacementReason(r.value); setErrors(e => ({ ...e, replacementReason: '' })); }}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all touch-target ${
                    replacementReason === r.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="text-sm font-medium flex-1">{r.label}</span>
                  {r.requiresPolice && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">Police ref. required</span>}
                  {replacementReason === r.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            {errors.replacementReason && <p className="text-xs text-destructive">{errors.replacementReason}</p>}
          </div>

          {/* Police Abstract */}
          {selectedReplacementReason?.requiresPolice && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Police Abstract / OB Reference *</Label>
              <Input
                value={policeAbstractRef}
                onChange={e => setPoliceAbstractRef(e.target.value)}
                placeholder="e.g. OB/2024/12345"
                className={`touch-target ${errors.policeAbstractRef ? 'border-destructive' : ''}`}
              />
              {errors.policeAbstractRef && <p className="text-xs text-destructive">{errors.policeAbstractRef}</p>}
              <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">
                  The existing card ending •••• {selectedCard} will be immediately blocked upon submission to prevent unauthorized use.
                </p>
              </div>
            </div>
          )}

          {/* Retain card number */}
          {replacementReason && !['lost', 'stolen'].includes(replacementReason) && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Retain Card Number</p>
                <p className="text-xs text-muted-foreground">Keep the same card number on the replacement</p>
              </div>  <Switch checked={retainCardNumber} onCheckedChange={setRetainCardNumber} />
            </div>
          )}

          {/* Delivery */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Replacement Card Delivery</Label>
            <div className="space-y-2">
              {DELIVERY_METHODS.map(dm => {
                const Icon = dm.icon;
                return (
                  <button
                    key={dm.value}
                    onClick={() => setDeliveryMethod(dm.value)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all touch-target ${
                      deliveryMethod === dm.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{dm.label}</span>
                      <p className="text-xs text-muted-foreground">{dm.eta}</p>
                    </div>
                    {deliveryMethod === dm.value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {deliveryMethod === 'branch-pickup' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pickup Branch</Label>
              <Select value={deliveryBranch} onValueChange={setDeliveryBranch}>
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* ============== PIN MANAGEMENT ============== */}
      {serviceId === 'pin-management' && (
        <div className="space-y-5">
          {/* Select card */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Card *</Label>
            {existingCards.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">No active cards found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingCards.map(card => (
                  <button
                    key={card.last4}
                    onClick={() => { setPinCard(card.last4); setErrors(e => ({ ...e, pinCard: '' })); }}
                    className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all touch-target ${
                      pinCard === card.last4
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">•••• {card.last4}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{card.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Linked to {card.account}</p>
                    </div>
                    {pinCard === card.last4 && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
            {errors.pinCard && <p className="text-xs text-destructive">{errors.pinCard}</p>}
          </div>

          {/* PIN Action */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">PIN Action *</Label>
            <div className="space-y-2">
              {PIN_ACTIONS.map(action => (
                <button
                  key={action.value}
                  onClick={() => { setPinAction(action.value); setErrors(e => ({ ...e, pinAction: '' })); }}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all touch-target ${
                    pinAction === action.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold">{action.label}</span>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  {pinAction === action.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
            {errors.pinAction && <p className="text-xs text-destructive">{errors.pinAction}</p>}
          </div>

          {/* PIN Delivery */}
          {pinAction && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">PIN Delivery Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'sms', label: 'SMS OTP', icon: Smartphone, desc: 'Encrypted PIN via SMS' },
                  { value: 'branch', label: 'Branch PIN Mailer', icon: Building2, desc: 'Sealed PIN envelope' },
                ].map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.value}
                      onClick={() => setPinDeliveryMethod(pm.value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all touch-target ${
                        pinDeliveryMethod === pm.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">{pm.label}</span>
                      <p className="text-[10px] text-muted-foreground">{pm.desc}</p>
                    </button>
                  );
                })}
              </div>

              {pinAction === 'unblock' && (
                <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3 mt-2">
                  <AlertCircle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-info">
                    PIN unblock requires customer identity verification at the branch. The card will be unblocked and a new PIN issued.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============== CARD LIMIT ============== */}
      {serviceId === 'card-limit' && (
        <div className="space-y-5">
          {/* Select card */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Card *</Label>
            {existingCards.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">No active cards found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingCards.map(card => (
                  <button
                    key={card.last4}
                    onClick={() => {
                      setLimitCard(card.last4);
                      setNewPosLimit(String(card.posLimit));
                      setNewAtmLimit(String(card.atmLimit));
                      setErrors(e => ({ ...e, limitCard: '' }));
                    }}
                    className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all touch-target ${
                      limitCard === card.last4
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">•••• {card.last4}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{card.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        POS: KES {card.posLimit.toLocaleString()} • ATM: KES {card.atmLimit.toLocaleString()}
                      </p>
                    </div>
                    {limitCard === card.last4 && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
            {errors.limitCard && <p className="text-xs text-destructive">{errors.limitCard}</p>}
          </div>

          {/* Current & New Limits */}
          {limitCardData && (
            <>
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Current Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Daily POS</p>
                    <p className="text-sm font-semibold">KES {limitCardData.posLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Daily ATM</p>
                    <p className="text-sm font-semibold">KES {limitCardData.atmLimit.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New POS Limit (KES)</Label>
                  <Input
                    type="number"
                    value={newPosLimit}
                    onChange={e => setNewPosLimit(e.target.value)}
                    className={`touch-target ${errors.newPosLimit ? 'border-destructive' : ''}`}
                  />
                  {errors.newPosLimit && <p className="text-xs text-destructive">{errors.newPosLimit}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New ATM Limit (KES)</Label>
                  <Input
                    type="number"
                    value={newAtmLimit}
                    onChange={e => setNewAtmLimit(e.target.value)}
                    className={`touch-target ${errors.newAtmLimit ? 'border-destructive' : ''}`}
                  />
                  {errors.newAtmLimit && <p className="text-xs text-destructive">{errors.newAtmLimit}</p>}
                </div>
              </div>

              {/* Limit change indicators */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'POS Change', current: limitCardData.posLimit, newVal: Number(newPosLimit) || 0 },
                  { label: 'ATM Change', current: limitCardData.atmLimit, newVal: Number(newAtmLimit) || 0 },
                ].map(item => {
                  const diff = item.newVal - item.current;
                  const pct = item.current > 0 ? ((diff / item.current) * 100).toFixed(0) : '0';
                  return (
                    <div key={item.label} className={`rounded-lg p-3 text-center ${
                      diff > 0 ? 'bg-success/10' : diff < 0 ? 'bg-warning/10' : 'bg-muted/30'
                    }`}>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-bold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {diff > 0 ? '+' : ''}{pct}%
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* E-commerce toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">E-Commerce Transactions</p>
                  <p className="text-xs text-muted-foreground">Allow online/card-not-present purchases</p>
                </div>
                <Switch checked={enableEcommerce} onCheckedChange={setEnableEcommerce} />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for Change (optional)</Label>
                <Textarea
                  value={limitReason}
                  onChange={e => setLimitReason(e.target.value)}
                  placeholder="e.g. Travel, increased spending needs..."
                  className="touch-target"
                  rows={2}
                />
              </div>

              {/* High limit warning */}
              {(Number(newPosLimit) > 500000 || Number(newAtmLimit) > 200000) && (
                <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    Limits above KES 500,000 (POS) or KES 200,000 (ATM) require supervisor authorization.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={serviceId === 'card-replacement' && existingCards.length === 0}
        className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow mt-4"
      >
        Submit for Validation
      </Button>
    </div>
  );
}