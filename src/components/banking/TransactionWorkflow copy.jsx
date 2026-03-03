import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle, Shield, Eye, ThumbsUp, Star, Gift, ChevronRight, Receipt, Info, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { AccountOpeningInput } from './AccountOpeningInput';
import { KycUpdateInput } from './KycUpdateInput';
import { AccountModificationInput } from './AccountModificationInput';
import { DenominationExchangeInput, getRateCorridor } from './DenominationExchangeInput';
import { FundsTransferInput } from './FundsTransferInput';
import { BillPaymentInput } from './BillPaymentInput';
import  StandingOrderInput from './StandingOrderInput';
import { CardServicesInput } from './CardServicesInput';
import ServiceRequestInput  from './ServiceRequestInput';
import { RECURRENCE_LABELS, addCustomBiller } from '@/data/billers';
import { getCountryName } from '@/data/swiftDirectory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import  WorkflowStepper from './WorkflowStepper';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';
import { computeCharges, inferSegment, SEGMENT_LABELS } from '@/data/serviceCharges';
import { Slider } from '@/components/ui/slider';

const CROSS_SELL_OFFERS = [
    { title: 'Premium Savings Account', description: 'Earn up to 8.5% p.a. on your savings', icon: '💰' },
    { title: 'Mobile Banking', description: 'Bank anytime, anywhere with our app', icon: '📱' },
    { title: 'Insurance Cover', description: 'Protect what matters most to you', icon: '🛡️' },
];

/** Extra fields per service (beyond auto-populated account & name) */
const extraFieldsByService = {
    'cash-deposit': [
        { label: 'Amount', key: 'amount', type: 'number', placeholder: 'Enter deposit amount' },
        { label: 'Reference / Narration', key: 'reference', placeholder: 'Enter reference' },
    ],
    'cash-withdrawal': [
        { label: 'Amount', key: 'amount', type: 'number', placeholder: 'Enter withdrawal amount' },
        { label: 'Reference / Narration', key: 'reference', placeholder: 'Enter reference' },
    ],
    'funds-transfer': [],
    'bill-payment': [],
    'standing-order': [],
    default: [
        { label: 'Amount', key: 'amount', type: 'number', placeholder: 'Enter amount' },
        { label: 'Reference / Narration', key: 'reference', placeholder: 'Enter reference' },
    ],
};

const NO_AMOUNT_SERVICES = ['card-issuance', 'card-replacement', 'pin-management', 'cheque-book', 'statement-request', 'account-opening', 'kyc-update', 'account-modification', 'denomination-exchange', 'funds-transfer', 'bill-payment', 'standing-order'];
const SERVICE_REQUEST_IDS = ['cheque-book', 'statement-request'];

/** Small helper that auto-advances after a delay */
function ProcessingAutoAdvance({ onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 2000);
        return () => clearTimeout(t);
    }, [onDone]);
    return null;
}

export function TransactionWorkflow({ service, customer, onBack, onComplete }) {
    const eligibleAccounts = useMemo(() => getEligibleAccounts(customer, service.id), [customer, service.id]);

    const [workflow, setWorkflow] = useState({
        stage: 'input',
        serviceId: service.id,
        serviceTitle: service.title,
        data: {
            fullName: customer.fullName,
            customerId: customer.customerId,
        },
        validationErrors: {},
        officerNotes: '',
        isApproved: null,
    });

    const [selectedAccount, setSelectedAccount] = useState(
        eligibleAccounts.length === 1 ? eligibleAccounts[0] : null
    );
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');

    // FX exchange state
    const [fxDynamicRate, setFxDynamicRate] = useState(null);
    const [fxRateCorridor, setFxRateCorridor] = useState(null);
    const [officerImprovedRate, setOfficerImprovedRate] = useState(null);
    const [rateImproved, setRateImproved] = useState(false);
    const [fxWireBeneficiary, setFxWireBeneficiary] = useState(null);

    // Fee account: default to main current account, else first eligible
    const currentAccounts = useMemo(() =>
        customer.accounts.filter(a => a.status === 'active' && (a.type === 'current' || a.type === 'savings')),
        [customer]
    );
    const defaultFeeAccount = useMemo(() =>
        currentAccounts.find(a => a.type === 'current') || currentAccounts[0] || null,
        [currentAccounts]
    );
    const [feeAccount, setFeeAccount] = useState(defaultFeeAccount);

    // Segment & charges
    const segment = useMemo(() => inferSegment(customer), [customer]);
    const charges = useMemo(() => {
        const amount = workflow.data.amount ? Number(workflow.data.amount) : undefined;
        return computeCharges(service.id, segment, amount);
    }, [service.id, segment, workflow.data.amount]);

    const extraFields = useMemo(() => {
        if (service.id === 'kyc-update' || service.id === 'account-modification' || service.id === 'denomination-exchange') return [];
        if (NO_AMOUNT_SERVICES.includes(service.id)) {
            return [{ label: 'Reference / Narration', key: 'reference', placeholder: 'Enter reference or reason' }];
        }
        return extraFieldsByService[service.id] || extraFieldsByService.default;
    }, [service.id]);

    const updateData = (key, value) => {
        setWorkflow(prev => ({
            ...prev,
            data: { ...prev.data, [key]: value },
            validationErrors: { ...prev.validationErrors, [key]: '' },
        }));
    };

    const handleAccountSelect = (accountNumber) => {
        const account = eligibleAccounts.find(a => a.accountNumber === accountNumber) || null;
        setSelectedAccount(account);
        if (account) {
            setWorkflow(prev => ({
                ...prev,
                data: {
                    ...prev.data,
                    accountNumber: account.accountNumber,
                    accountName: account.accountName,
                    accountType: ACCOUNT_TYPE_LABELS[account.type],
                    currency: account.currency,
                },
                validationErrors: { ...prev.validationErrors, accountNumber: '' },
            }));
        }
    };

    const goToStage = (stage) => {
        setWorkflow(prev => ({ ...prev, stage }));
    };

    const validate = () => {
        const errors = {};
        if (!selectedAccount) {
            errors.accountNumber = 'Please select an account';
        }
        extraFields.forEach(f => {
            if (!workflow.data[f.key]?.trim()) {
                errors[f.key] = `${f.label} is required`;
            }
        });
        if (workflow.data.amount && isNaN(Number(workflow.data.amount))) {
            errors.amount = 'Please enter a valid amount';
        }
        if (workflow.data.amount && Number(workflow.data.amount) <= 0) {
            errors.amount = 'Amount must be greater than zero';
        }
        setWorkflow(prev => ({ ...prev, validationErrors: errors }));
        return Object.keys(errors).length === 0;
    };

    const handleSubmitInput = () => {
        if (validate()) {
            goToStage('validation');
            setTimeout(() => goToStage('review'), 1500);
        }
    };

    const pageVariants = {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
    };

    // Summary fields for review/verification
    const summaryFields = [
        { label: 'Customer', value: customer.fullName },
        { label: 'Customer ID', value: customer.customerId },
        ...(service.id === 'account-opening'
            ? [
                { label: 'New Account(s)', value: workflow.data.accountTypes || '' },
                ...(workflow.data.crossSellProducts ? [{ label: 'Add-on Products', value: workflow.data.crossSellProducts }] : []),
            ]
            : service.id === 'kyc-update'
                ? [
                    { label: 'KYC Actions', value: workflow.data.kycActions || '' },
                    { label: 'Verification', value: workflow.data.kycVerified || 'Pending' },
                ]
                : service.id === 'account-modification'
                    ? [
                        { label: 'Modification', value: workflow.data.modificationAction || '' },
                        { label: 'Account', value: workflow.data.accountNumber || '' },
                        ...(workflow.data.limitType ? [{ label: 'Limit Type', value: workflow.data.limitType }] : []),
                        ...(workflow.data.limitAmount ? [{ label: 'Limit Amount', value: workflow.data.limitAmount }] : []),
                        ...(workflow.data.blockAction ? [{ label: 'Action', value: workflow.data.blockAction }] : []),
                        ...(workflow.data.blockTarget ? [{ label: 'Target', value: workflow.data.blockTarget }] : []),
                        ...(workflow.data.reason ? [{ label: 'Reason', value: workflow.data.reason }] : []),
                        ...(workflow.data.beneficiary ? [{ label: 'Beneficiary', value: workflow.data.beneficiary }] : []),
                        ...(workflow.data.amount ? [{ label: 'Amount', value: workflow.data.amount }] : []),
                        ...(workflow.data.frequency ? [{ label: 'Frequency', value: workflow.data.frequency }] : []),
                        ...(workflow.data.newCurrency ? [{ label: 'New Currency', value: workflow.data.newCurrency }] : []),
                        ...(workflow.data.statusAction ? [{ label: 'Status Change', value: workflow.data.statusAction }] : []),
                    ]
                    : service.id === 'denomination-exchange'
                        ? [
                            { label: 'Direction', value: workflow.data.fxDirection || '' },
                            { label: 'Currency', value: workflow.data.fxCurrencyLabel || '' },
                            { label: 'FCY Amount', value: `${workflow.data.fxCurrencyCode || ''} ${workflow.data.fxFcyAmount || ''}` },
                            { label: 'KES Equivalent', value: `KES ${Number(workflow.data.fxKesAmount || 0).toLocaleString()}` },
                            { label: 'Exchange Rate', value: rateImproved && officerImprovedRate ? `${officerImprovedRate.toFixed(4)} (improved)` : workflow.data.fxOfferedRate || '' },
                            { label: 'Spread', value: `${workflow.data.fxSpreadBps || ''} bps` },
                            { label: 'Source Account', value: workflow.data.fxSourceAccount || '' },
                            { label: 'Settlement Account', value: workflow.data.fxSettlementAccount || '' },
                            { label: 'Settlement Method', value: workflow.data.fxSettlementMethod === 'account-credit' ? 'Account Credit' : workflow.data.fxSettlementMethod === 'cash-collection' ? 'Cash Collection' : 'Wire Transfer (T+1)' },
                        ]
                        : service.id === 'funds-transfer'
                            ? [
                                { label: 'Source Account', value: workflow.data.ftSourceAccount || '' },
                                { label: 'Beneficiary', value: workflow.data.ftBeneficiaryName || '' },
                                { label: 'Beneficiary Account', value: workflow.data.ftBeneficiaryAccount || '' },
                                { label: 'Amount', value: `KES ${Number(workflow.data.amount || 0).toLocaleString()}` },
                                { label: 'Channel', value: workflow.data.ftChannelName || '' },
                                { label: 'Settlement', value: workflow.data.ftChannelSla || '' },
                                ...(Number(workflow.data.ftNetworkCost || 0) > 0 ? [{ label: 'Network Cost', value: `KES ${Number(workflow.data.ftNetworkCost).toLocaleString()}` }] : []),
                                ...(workflow.data.reference ? [{ label: 'Reference', value: workflow.data.reference }] : []),
                            ]
                            : service.id === 'bill-payment'
                                ? [
                                    { label: 'Source Account', value: workflow.data.bpSourceAccount || '' },
                                    { label: 'Biller', value: `${workflow.data.bpBillerName || ''} (${workflow.data.bpBillerCode || ''})` },
                                    { label: 'Reference', value: workflow.data.bpReferenceNumber || '' },
                                    { label: 'Amount', value: `KES ${Number(workflow.data.amount || 0).toLocaleString()}` },
                                    { label: 'Channel', value: workflow.data.bpChannelName || '' },
                                    { label: 'Settlement', value: workflow.data.bpChannelSla || '' },
                                    ...(Number(workflow.data.bpNetworkCost || 0) > 0 ? [{ label: 'Network Cost', value: `KES ${Number(workflow.data.bpNetworkCost).toLocaleString()}` }] : []),
                                    ...(workflow.data.bpUseOverdraft === 'Yes' ? [{ label: 'Overdraft', value: `KES ${Number(workflow.data.bpOverdraftAmount || 0).toLocaleString()} from OD facility` }] : []),
                                    ...(workflow.data.bpBillPeriod ? [{ label: 'Bill Period', value: workflow.data.bpBillPeriod }] : []),
                                    ...(workflow.data.bpBillDueDate ? [{ label: 'Due Date', value: workflow.data.bpBillDueDate }] : []),
                                    ...(workflow.data.bpEmailConfirmation === 'Yes' ? [{ label: 'Email Confirmation', value: workflow.data.bpEmailAddress || '' }] : []),
                                    ...(workflow.data.bpSaveBiller === 'Yes' ? [{ label: 'Save Biller', value: '✓ Will be saved for future' }] : []),
                                    ...(workflow.data.bpEnableRecurrence === 'Yes' ? [{ label: 'Recurrence', value: RECURRENCE_LABELS[workflow.data.bpRecurrenceFrequency] || workflow.data.bpRecurrenceFrequency }] : []),
                                ]
                                : service.id === 'standing-order'
                                    ? [
                                        { label: 'Source Account', value: workflow.data.soSourceAccount || '' },
                                        { label: 'Beneficiary Account', value: workflow.data.soBeneficiary || '' },
                                        ...(workflow.data.soBeneficiaryName ? [{ label: 'Beneficiary Name', value: workflow.data.soBeneficiaryName }] : []),
                                        { label: 'Amount', value: `KES ${Number(workflow.data.amount || 0).toLocaleString()}` },
                                        { label: 'Frequency', value: workflow.data.soFrequency || '' },
                                        { label: 'Start Date', value: workflow.data.soStartDate || '' },
                                        ...(workflow.data.soEndDate ? [{ label: 'End Date', value: workflow.data.soEndDate }] : []),
                                    ]
                                    : service.id === 'card-issuance'
                                        ? [
                                            { label: 'Linked Account', value: workflow.data.csLinkedAccount || '' },
                                            { label: 'Card Type', value: workflow.data.csCardType || '' },
                                            { label: 'Card Tier', value: workflow.data.csCardTier || '' },
                                            { label: 'Name on Card', value: workflow.data.csNameOnCard || '' },
                                            { label: 'Contactless', value: workflow.data.csContactless || '' },
                                            { label: 'International', value: workflow.data.csInternational || '' },
                                            { label: 'Daily POS Limit', value: `KES ${Number(workflow.data.csPosLimit || 0).toLocaleString()}` },
                                            { label: 'Daily ATM Limit', value: `KES ${Number(workflow.data.csAtmLimit || 0).toLocaleString()}` },
                                            { label: 'Delivery', value: `${workflow.data.csDeliveryMethod || ''}${workflow.data.csDeliveryBranch ? ` — ${workflow.data.csDeliveryBranch}` : ''}` },
                                            { label: 'Email Notifications', value: workflow.data.csEmailNotify || '' },
                                            { label: 'SMS Alerts', value: workflow.data.csSmsAlerts || '' },
                                        ]
                                        : service.id === 'card-replacement'
                                            ? [
                                                { label: 'Card', value: `•••• ${workflow.data.csCardLast4 || ''}` },
                                                { label: 'Reason', value: workflow.data.csReplacementReason || '' },
                                                ...(workflow.data.csPoliceRef ? [{ label: 'Police Reference', value: workflow.data.csPoliceRef }] : []),
                                                { label: 'Retain Card Number', value: workflow.data.csRetainNumber || 'No' },
                                                { label: 'Delivery', value: `${workflow.data.csDeliveryMethod || ''}${workflow.data.csDeliveryBranch ? ` — ${workflow.data.csDeliveryBranch}` : ''}` },
                                            ]
                                            : service.id === 'pin-management'
                                                ? [
                                                    { label: 'Card', value: `•••• ${workflow.data.csCardLast4 || ''}` },
                                                    { label: 'Action', value: workflow.data.csPinAction || '' },
                                                    { label: 'PIN Delivery', value: workflow.data.csPinDelivery || '' },
                                                ]
                                                : service.id === 'card-limit'
                                                    ? [
                                                        { label: 'Card', value: `•••• ${workflow.data.csCardLast4 || ''}` },
                                                        { label: 'Current POS Limit', value: `KES ${Number(workflow.data.csCurrentPosLimit || 0).toLocaleString()}` },
                                                        { label: 'New POS Limit', value: `KES ${Number(workflow.data.csNewPosLimit || 0).toLocaleString()}` },
                                                        { label: 'Current ATM Limit', value: `KES ${Number(workflow.data.csCurrentAtmLimit || 0).toLocaleString()}` },
                                                        { label: 'New ATM Limit', value: `KES ${Number(workflow.data.csNewAtmLimit || 0).toLocaleString()}` },
                                                        { label: 'E-Commerce', value: workflow.data.csEcommerce || '' },
                                                        ...(workflow.data.csLimitReason ? [{ label: 'Reason', value: workflow.data.csLimitReason }] : []),
                                                    ]
                                                    : service.id === 'cheque-book'
                                                        ? [
                                                            { label: 'Account', value: workflow.data.srAccount || '' },
                                                            { label: 'Account Name', value: workflow.data.srAccountName || '' },
                                                            { label: 'Cheque Leaves', value: workflow.data.srChequeLeaves || '' },
                                                            { label: 'Series', value: workflow.data.srSeriesPref || '' },
                                                            { label: 'Collection Branch', value: workflow.data.srBranch || '' },
                                                            { label: 'Contact Phone', value: workflow.data.srPhone || '' },
                                                            { label: 'SMS Notification', value: workflow.data.srSmsNotify || '' },
                                                            ...(workflow.data.srReason ? [{ label: 'Reason', value: workflow.data.srReason }] : []),
                                                        ]
                                                        : service.id === 'statement-request'
                                                            ? [
                                                                { label: 'Account', value: workflow.data.srAccount || '' },
                                                                { label: 'Account Name', value: workflow.data.srAccountName || '' },
                                                                { label: 'Statement Type', value: workflow.data.srStmtType || '' },
                                                                ...(workflow.data.srPeriodFrom !== 'N/A' ? [{ label: 'Period', value: `${workflow.data.srPeriodFrom} to ${workflow.data.srPeriodTo}` }] : []),
                                                                { label: 'Format', value: workflow.data.srFormat || '' },
                                                                { label: 'Delivery', value: `${workflow.data.srDelivery || ''}${workflow.data.srBranch ? ` — ${workflow.data.srBranch}` : ''}` },
                                                                ...(workflow.data.srDeliveryEmail ? [{ label: 'Email', value: workflow.data.srDeliveryEmail }] : []),
                                                                { label: 'Certified', value: workflow.data.srCertified || 'No' },
                                                                ...(workflow.data.srPurpose ? [{ label: 'Purpose', value: workflow.data.srPurpose }] : []),
                                                            ]
                                                            : [
                                                                { label: 'Account', value: selectedAccount?.accountNumber || '' },
                                                                { label: 'Account Type', value: selectedAccount ? ACCOUNT_TYPE_LABELS[selectedAccount.type] : '' },
                                                            ]
        ),
        ...extraFields.map(f => ({ label: f.label, value: workflow.data[f.key] || '' })),
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 touch-target">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="font-display text-xl font-semibold text-foreground">{service.title}</h2>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="px-6 py-4 bg-card border-b border-border">
                <WorkflowStepper currentStage={workflow.stage} />
            </div>

            {/* Stage content */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    {/* INPUT STAGE */}
                    {workflow.stage === 'input' && service.id === 'account-opening' && (
                        <motion.div key="input-account-opening" {...pageVariants}>
                            <AccountOpeningInput
                                customer={customer}
                                validationErrors={workflow.validationErrors}
                                onSubmit={({ accountTypes, crossSellProducts }) => {
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            accountTypes: accountTypes.join(', '),
                                            crossSellProducts: crossSellProducts.join(', '),
                                        },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id === 'kyc-update' && (
                        <motion.div key="input-kyc-update" {...pageVariants}>
                            <KycUpdateInput
                                customer={customer}
                                onSubmit={({ artefactLabels, verificationResults }) => {
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            kycActions: artefactLabels.join(', '),
                                            kycVerified: verificationResults ? 'AI Verified' : 'Pending',
                                        },
                                        validationErrors: {},
                                    }));
                                    // KYC already verified internally, skip to review
                                    goToStage('review');
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id === 'account-modification' && (
                        <motion.div key="input-account-modification" {...pageVariants}>
                            <AccountModificationInput
                                customer={customer}
                                onSubmit={({ actionLabel, details: modDetails }) => {
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            modificationAction: actionLabel,
                                            ...modDetails,
                                        },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id === 'denomination-exchange' && (
                        <motion.div key="input-denom-exchange" {...pageVariants}>
                            <DenominationExchangeInput
                                customer={customer}
                                onSubmit={(result) => {
                                    setFxDynamicRate(result.dynamicRate);
                                    setFxRateCorridor(result.rateCorridor);
                                    setOfficerImprovedRate(null);
                                    setRateImproved(false);
                                    setFxWireBeneficiary(result.wireBeneficiary || null);
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            fxDirection: result.direction,
                                            fxCurrencyCode: result.currencyCode,
                                            fxCurrencyLabel: result.currencyLabel,
                                            fxFcyAmount: result.fcyAmount,
                                            fxKesAmount: result.kesAmount,
                                            fxOfferedRate: result.offeredRate.toFixed(4),
                                            fxSpreadBps: result.spreadBps.toFixed(1),
                                            fxSourceAccount: result.sourceAccount,
                                            fxSettlementAccount: result.settlementAccount,
                                            fxSettlementMethod: result.settlementMethod,
                                        },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id === 'funds-transfer' && (
                        <motion.div key="input-funds-transfer" {...pageVariants}>
                            <FundsTransferInput
                                customer={customer}
                                onSubmit={(result) => {
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            ftSourceAccount: result.sourceAccount,
                                            ftBeneficiaryAccount: result.beneficiaryAccount,
                                            ftBeneficiaryName: result.beneficiaryName,
                                            amount: result.amount,
                                            reference: result.reference,
                                            ftChannelId: result.channelId,
                                            ftChannelName: result.channelName,
                                            ftChannelSla: result.channelSla,
                                            ftNetworkCost: String(result.networkCost),
                                            ftDestination: result.destination,
                                        },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id === 'bill-payment' && (
                        <motion.div key="input-bill-payment" {...pageVariants}>
                            <BillPaymentInput
                                customer={customer}
                                onSubmit={(result) => {
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            bpSourceAccount: result.sourceAccount,
                                            bpBillerName: result.billerName,
                                            bpBillerCode: result.billerCode,
                                            bpReferenceNumber: result.referenceNumber,
                                            amount: result.amount,
                                            bpChannelId: result.channelId,
                                            bpChannelName: result.channelName,
                                            bpChannelSla: result.channelSla,
                                            bpNetworkCost: String(result.networkCost),
                                            bpEmailConfirmation: result.emailConfirmation ? 'Yes' : 'No',
                                            bpEmailAddress: result.emailAddress,
                                            bpSaveBiller: result.saveBiller ? 'Yes' : 'No',
                                            bpEnableRecurrence: result.enableRecurrence ? 'Yes' : 'No',
                                            bpRecurrenceFrequency: result.recurrenceFrequency || '',
                                            bpUseOverdraft: result.useOverdraft ? 'Yes' : 'No',
                                            bpOverdraftAmount: String(result.overdraftAmount),
                                            bpIsManualEntry: result.isManualEntry ? 'Yes' : 'No',
                                            ...(result.presentment ? {
                                                bpBillPeriod: result.presentment.billPeriod,
                                                bpBillDueDate: result.presentment.dueDate,
                                                bpBillHolder: result.presentment.accountHolder,
                                            } : {}),
                                        },
                                        validationErrors: {},
                                    }));
                                    if (result.isManualEntry) {
                                        goToStage('validation');
                                        // Don't auto-advance — user must confirm save-biller choice
                                    } else {
                                        goToStage('validation');
                                        setTimeout(() => goToStage('review'), 1500);
                                    }
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id === 'standing-order' && (
                        <motion.div key="input-standing-order" {...pageVariants}>
                            <StandingOrderInput
                                customer={customer}
                                onSubmit={(result) => {
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: {
                                            ...prev.data,
                                            soSourceAccount: result.sourceAccount,
                                            soBeneficiary: result.beneficiary,
                                            soBeneficiaryName: result.beneficiaryName,
                                            amount: result.amount,
                                            soFrequency: result.frequency,
                                            soStartDate: result.startDate,
                                            soEndDate: result.endDate,
                                        },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && ['card-issuance', 'card-replacement', 'pin-management', 'card-limit'].includes(service.id) && (
                        <motion.div key="input-card-services" {...pageVariants}>
                            <CardServicesInput
                                serviceId={service.id}
                                customer={customer}
                                onSubmit={(result) => {
                                    const cardData = {
                                        csServiceType: result.serviceType,
                                        csLinkedAccount: result.linkedAccount,
                                    };
                                    if (result.cardTypeLabel) cardData.csCardType = result.cardTypeLabel;
                                    if (result.cardTierLabel) cardData.csCardTier = result.cardTierLabel;
                                    if (result.nameOnCard) cardData.csNameOnCard = result.nameOnCard;
                                    if (result.deliveryMethodLabel) cardData.csDeliveryMethod = result.deliveryMethodLabel;
                                    if (result.deliveryBranch) cardData.csDeliveryBranch = result.deliveryBranch;
                                    if (result.enableContactless !== undefined) cardData.csContactless = result.enableContactless ? 'Yes' : 'No';
                                    if (result.enableInternational !== undefined) cardData.csInternational = result.enableInternational ? 'Yes' : 'No';
                                    if (result.dailyPosLimit) cardData.csPosLimit = result.dailyPosLimit;
                                    if (result.dailyAtmLimit) cardData.csAtmLimit = result.dailyAtmLimit;
                                    if (result.emailNotifications !== undefined) cardData.csEmailNotify = result.emailNotifications ? 'Yes' : 'No';
                                    if (result.smsAlerts !== undefined) cardData.csSmsAlerts = result.smsAlerts ? 'Yes' : 'No';
                                    if (result.existingCardLast4) cardData.csCardLast4 = result.existingCardLast4;
                                    if (result.replacementReasonLabel) cardData.csReplacementReason = result.replacementReasonLabel;
                                    if (result.retainCardNumber !== undefined) cardData.csRetainNumber = result.retainCardNumber ? 'Yes' : 'No';
                                    if (result.policeAbstractRef) cardData.csPoliceRef = result.policeAbstractRef;
                                    if (result.pinActionLabel) cardData.csPinAction = result.pinActionLabel;
                                    if (result.pinDeliveryMethod) cardData.csPinDelivery = result.pinDeliveryMethod === 'sms' ? 'SMS OTP' : 'Branch PIN Mailer';
                                    if (result.currentPosLimit) cardData.csCurrentPosLimit = result.currentPosLimit;
                                    if (result.currentAtmLimit) cardData.csCurrentAtmLimit = result.currentAtmLimit;
                                    if (result.newPosLimit) cardData.csNewPosLimit = result.newPosLimit;
                                    if (result.newAtmLimit) cardData.csNewAtmLimit = result.newAtmLimit;
                                    if (result.limitChangeReason) cardData.csLimitReason = result.limitChangeReason;
                                    if (result.enableEcommerce !== undefined) cardData.csEcommerce = result.enableEcommerce ? 'Yes' : 'No';

                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: { ...prev.data, ...cardData },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && SERVICE_REQUEST_IDS.includes(service.id) && (
                        <motion.div key="input-service-request" {...pageVariants}>
                            <ServiceRequestInput
                                serviceId={service.id}
                                customer={customer}
                                onSubmit={(result) => {
                                    const srData = {
                                        srServiceType: result.serviceType,
                                        srAccount: result.accountNumber,
                                        srAccountName: result.accountName,
                                    };
                                    if (result.serviceType === 'cheque-book') {
                                        const r = result;
                                        srData.srChequeLeaves = r.chequeLeafLabel;
                                        srData.srSeriesPref = r.seriesLabel;
                                        srData.srDelivery = r.deliveryLabel;
                                        if (r.deliveryBranch) srData.srBranch = r.deliveryBranch;
                                        srData.srPhone = r.contactPhone;
                                        srData.srEmail = r.contactEmail;
                                        srData.srSmsNotify = r.smsNotify ? 'Yes' : 'No';
                                        if (r.reason) srData.srReason = r.reason;
                                    } else {
                                        const r = result;
                                        srData.srStmtType = r.statementTypeLabel;
                                        srData.srPeriodFrom = r.periodFrom;
                                        srData.srPeriodTo = r.periodTo;
                                        srData.srFormat = r.formatLabel;
                                        srData.srDelivery = r.deliveryLabel;
                                        if (r.deliveryBranch) srData.srBranch = r.deliveryBranch;
                                        if (r.deliveryEmail) srData.srDeliveryEmail = r.deliveryEmail;
                                        srData.srCertified = r.certified ? 'Yes' : 'No';
                                        if (r.purpose) srData.srPurpose = r.purpose;
                                    }
                                    setWorkflow(prev => ({
                                        ...prev,
                                        data: { ...prev.data, ...srData },
                                        validationErrors: {},
                                    }));
                                    goToStage('validation');
                                    setTimeout(() => goToStage('review'), 1500);
                                }}
                            />
                        </motion.div>
                    )}

                    {workflow.stage === 'input' && service.id !== 'account-opening' && service.id !== 'kyc-update' && service.id !== 'account-modification' && service.id !== 'denomination-exchange' && service.id !== 'funds-transfer' && service.id !== 'bill-payment' && service.id !== 'standing-order' && !['card-issuance', 'card-replacement', 'pin-management', 'card-limit'].includes(service.id) && !SERVICE_REQUEST_IDS.includes(service.id) && (
                        <motion.div key="input" {...pageVariants} className="space-y-5 max-w-lg mx-auto">
                            {/* Customer info banner */}
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {customer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{customer.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone}</p>
                                </div>
                            </div>

                            {/* Account selector */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Select Account *</Label>
                                {eligibleAccounts.length === 0 ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                        <p className="text-xs text-destructive">No eligible accounts for this service. This service requires a different account type.</p>
                                    </div>
                                ) : (
                                    <Select
                                        value={selectedAccount?.accountNumber || ''}
                                        onValueChange={handleAccountSelect}
                                    >
                                        <SelectTrigger className={`touch-target ${workflow.validationErrors.accountNumber ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="Choose an account..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleAccounts.map((acc) => (
                                                <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{acc.accountNumber}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground text-xs">{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-xs">{acc.currency}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {workflow.validationErrors.accountNumber && (
                                    <p className="text-xs text-destructive">{workflow.validationErrors.accountNumber}</p>
                                )}
                            </div>

                            {/* Extra fields */}
                            {extraFields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <Label htmlFor={field.key} className="text-sm font-medium">{field.label} *</Label>
                                    <Input
                                        id={field.key}
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder}
                                        value={workflow.data[field.key] || ''}
                                        onChange={(e) => updateData(field.key, e.target.value)}
                                        className={`touch-target ${workflow.validationErrors[field.key] ? 'border-destructive' : ''}`}
                                    />
                                    {workflow.validationErrors[field.key] && (
                                        <p className="text-xs text-destructive">{workflow.validationErrors[field.key]}</p>
                                    )}
                                </div>
                            ))}

                            <Button
                                onClick={handleSubmitInput}
                                disabled={eligibleAccounts.length === 0}
                                className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow mt-4"
                            >
                                Submit for Validation
                            </Button>
                        </motion.div>
                    )}

                    {/* VALIDATION STAGE */}
                    {workflow.stage === 'validation' && service.id === 'bill-payment' && workflow.data.bpIsManualEntry === 'Yes' && (
                        <motion.div key="validation-bp-manual" {...pageVariants} className="space-y-6 max-w-lg mx-auto py-8">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                                    <Check className="h-7 w-7 text-success" />
                                </div>
                                <h3 className="font-display text-lg font-semibold">Biller Validated Successfully</h3>
                                <p className="text-sm text-muted-foreground text-center">
                                    <span className="font-medium text-foreground">{workflow.data.bpBillerName}</span> (Paybill: {workflow.data.bpBillerCode}) has been verified.
                                </p>
                            </div>

                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold text-foreground">Save as Preset Biller?</h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Save this biller so it appears in the Preset Billers list for quick selection in future transactions.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="default"
                                        className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold"
                                        onClick={() => {
                                            const newBiller = {
                                                id: `custom-${workflow.data.bpBillerCode}-${Date.now()}`,
                                                name: workflow.data.bpBillerName || 'Custom Biller',
                                                shortName: workflow.data.bpBillerName || 'Custom',
                                                category: 'other',
                                                billerCode: workflow.data.bpBillerCode || '',
                                                supportsPresentment: false,
                                                referenceLabel: 'Reference Number',
                                                referencePlaceholder: 'Enter reference number',
                                                icon: 'Receipt',
                                                minAmount: 1,
                                                maxAmount: 10000000,
                                            };
                                            addCustomBiller(newBiller);
                                            setWorkflow(prev => ({
                                                ...prev,
                                                data: { ...prev.data, bpSaveBiller: 'Yes' },
                                            }));
                                            goToStage('review');
                                        }}
                                    >
                                        <Star className="h-4 w-4 mr-1.5" /> Save & Continue
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => goToStage('review')}
                                    >
                                        Skip & Continue
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {workflow.stage === 'validation' && !(service.id === 'bill-payment' && workflow.data.bpIsManualEntry === 'Yes') && (
                        <motion.div key="validation" {...pageVariants} className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="h-16 w-16 rounded-full bg-info/10 flex items-center justify-center animate-pulse">
                                <Shield className="h-8 w-8 text-info" />
                            </div>
                            <h3 className="font-display text-lg font-semibold">Validating against Bank Policy...</h3>
                            <p className="text-sm text-muted-foreground">Checking compliance and account status</p>
                        </motion.div>
                    )}

                    {/* REVIEW STAGE */}
                    {workflow.stage === 'review' && (
                        <motion.div key="review" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="h-5 w-5 text-success" />
                                <p className="text-sm font-medium text-success">Validation passed — Ready for officer review</p>
                            </div>
                            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Transaction Summary</h4>
                                {summaryFields.map((field) => (
                                    <div key={field.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                        <span className="text-sm text-muted-foreground">{field.label}</span>
                                        <span className="text-sm font-medium text-foreground">{field.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* SERVICE CHARGES */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-[hsl(var(--accent))]" />
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Service Charges</h4>
                                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                                        {SEGMENT_LABELS[segment]} rate
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-sm text-muted-foreground">Service Fee</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {charges.serviceFee === 0 ? <span className="text-success font-semibold">FREE</span> : `KES ${charges.serviceFee.toLocaleString()}`}
                                        </span>
                                    </div>
                                    {charges.exciseDuty > 0 && (
                                        <div className="flex justify-between items-center py-1.5">
                                            <span className="text-sm text-muted-foreground">Excise Duty (20%)</span>
                                            <span className="text-sm text-foreground">KES {charges.exciseDuty.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {charges.vat > 0 && (
                                        <div className="flex justify-between items-center py-1.5">
                                            <span className="text-sm text-muted-foreground">VAT (16%)</span>
                                            <span className="text-sm text-foreground">KES {charges.vat.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2 border-t border-border mt-1">
                                        <span className="text-sm font-semibold text-foreground">Total Charges</span>
                                        <span className="text-base font-bold text-foreground">
                                            {charges.totalCharges === 0 ? <span className="text-success">No Charge</span> : `KES ${charges.totalCharges.toLocaleString()}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Fee account selector */}
                                {charges.totalCharges > 0 && (
                                    <div className="pt-3 border-t border-border space-y-2">
                                        <Label className="text-sm font-medium">Debit Charges From</Label>
                                        <Select
                                            value={feeAccount?.accountNumber || ''}
                                            onValueChange={(val) => {
                                                const acc = currentAccounts.find(a => a.accountNumber === val) || null;
                                                setFeeAccount(acc);
                                            }}
                                        >
                                            <SelectTrigger className="touch-target">
                                                <SelectValue placeholder="Select fee account..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currentAccounts.map((acc) => (
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

                                        {/* Account balance info */}
                                        {feeAccount && (
                                            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                                                <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        Available Balance: <span className="font-semibold text-foreground">{feeAccount.currency} {feeAccount.balance.toLocaleString()}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Balance after charges: <span className={`font-semibold ${(feeAccount.balance - charges.totalCharges) < 0 ? 'text-destructive' : 'text-foreground'}`}>
                                                            {feeAccount.currency} {(feeAccount.balance - charges.totalCharges).toLocaleString()}
                                                        </span>
                                                    </p>
                                                    {(feeAccount.balance - charges.totalCharges) < 0 && (
                                                        <p className="text-xs text-destructive font-medium">⚠ Insufficient balance to cover charges</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {charges.totalCharges === 0 && (
                                    <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                                        <Check className="h-4 w-4 text-success" />
                                        <p className="text-xs text-success font-medium">This transaction is free for {SEGMENT_LABELS[segment]} customers</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Officer Notes (optional)</Label>
                                <Textarea
                                    placeholder="Add any processing notes..."
                                    value={workflow.officerNotes}
                                    onChange={(e) => setWorkflow(prev => ({ ...prev, officerNotes: e.target.value }))}
                                    className="touch-target"
                                />
                            </div>
                            <Button onClick={() => goToStage('processing')} className="w-full touch-target gold-gradient text-accent-foreground font-semibold shadow-gold">
                                Proceed to Processing
                            </Button>
                        </motion.div>
                    )}

                    {/* PROCESSING STAGE */}
                    {workflow.stage === 'processing' && service.id === 'denomination-exchange' && fxDynamicRate && fxRateCorridor && (
                        <motion.div key="processing-fx" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-5 w-5 text-accent" />
                                <p className="text-sm font-medium">Officer Rate Review — {workflow.data.fxDirection === 'BUY' ? 'Buy' : 'Sell'} {workflow.data.fxCurrencyLabel}</p>
                            </div>

                            {/* Rate card */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="rounded-lg bg-muted/50 p-3">
                                        <p className="text-[11px] text-muted-foreground uppercase">Mid-Market</p>
                                        <p className="text-base font-bold text-foreground">{fxDynamicRate.midRate.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-lg bg-accent/10 p-3">
                                        <p className="text-[11px] text-accent uppercase font-semibold">System Rate</p>
                                        <p className="text-base font-bold text-accent">{fxDynamicRate.offeredRate.toFixed(4)}</p>
                                    </div>
                                    <div className={`rounded-lg p-3 ${rateImproved ? 'bg-[hsl(var(--success))]/10' : 'bg-muted/50'}`}>
                                        <p className="text-[11px] text-muted-foreground uppercase">{rateImproved ? 'Improved' : 'Final'}</p>
                                        <p className={`text-base font-bold ${rateImproved ? 'text-[hsl(var(--success))]' : 'text-foreground'}`}>
                                            {(officerImprovedRate ?? fxDynamicRate.offeredRate).toFixed(4)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Adjust Rate (within corridor)</Label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{fxRateCorridor.minRate.toFixed(4)}</span>
                                        <Slider
                                            min={fxRateCorridor.minRate * 10000}
                                            max={fxRateCorridor.maxRate * 10000}
                                            step={1}
                                            value={[(officerImprovedRate ?? fxDynamicRate.offeredRate) * 10000]}
                                            onValueChange={([v]) => {
                                                const newRate = v / 10000;
                                                setOfficerImprovedRate(newRate);
                                                setRateImproved(Math.abs(newRate - fxDynamicRate.offeredRate) > 0.0001);
                                            }}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{fxRateCorridor.maxRate.toFixed(4)}</span>
                                    </div>
                                </div>

                                {rateImproved && (
                                    <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                                        <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                                        <p className="text-xs text-warning">
                                            Rate improved from {fxDynamicRate.offeredRate.toFixed(4)} to {officerImprovedRate?.toFixed(4)}.
                                            This transaction will require Supervisor Approval.
                                        </p>
                                    </div>
                                )}

                                <div className="border-t border-border pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{workflow.data.fxCurrencyCode} Amount</span>
                                        <span className="font-medium">{Number(workflow.data.fxFcyAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Final Rate</span>
                                        <span className={`font-bold ${rateImproved ? 'text-[hsl(var(--success))]' : 'text-accent'}`}>
                                            {(officerImprovedRate ?? fxDynamicRate.offeredRate).toFixed(4)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-base font-semibold">
                                        <span>KES {workflow.data.fxDirection === 'BUY' ? 'to Pay' : 'to Receive'}</span>
                                        <span>KES {(Number(workflow.data.fxFcyAmount) * (officerImprovedRate ?? fxDynamicRate.offeredRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Settlement Method-Specific Processing Details */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Settlement Processing — {workflow.data.fxSettlementMethod === 'account-credit' ? 'Account Credit' : workflow.data.fxSettlementMethod === 'cash-collection' ? 'Cash Collection' : 'Wire Transfer'}
                                    </h4>
                                </div>

                                {/* Account Credit */}
                                {workflow.data.fxSettlementMethod === 'account-credit' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Debit Account</span>
                                                <span className="font-medium">{workflow.data.fxSourceAccount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Credit Account</span>
                                                <span className="font-medium">{workflow.data.fxSettlementAccount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Settlement</span>
                                                <span className="font-medium text-[hsl(var(--success))]">Immediate — Real-time credit</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 rounded-lg bg-[hsl(var(--success))]/10 p-3">
                                            <Check className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-[hsl(var(--success))]">
                                                Both accounts verified and eligible. Funds will be credited instantly upon approval.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Cash Collection */}
                                {workflow.data.fxSettlementMethod === 'cash-collection' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Debit Account</span>
                                                <span className="font-medium">{workflow.data.fxSourceAccount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Collection Method</span>
                                                <span className="font-medium">Cash at Branch Counter</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Collection Currency</span>
                                                <span className="font-medium">{workflow.data.fxDirection === 'BUY' ? workflow.data.fxCurrencyCode : 'KES'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Collection Amount</span>
                                                <span className="font-medium">
                                                    {workflow.data.fxDirection === 'BUY'
                                                        ? `${workflow.data.fxCurrencyCode} ${Number(workflow.data.fxFcyAmount).toLocaleString()}`
                                                        : `KES ${(Number(workflow.data.fxFcyAmount) * (officerImprovedRate ?? fxDynamicRate.offeredRate)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                                            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[11px] text-warning font-semibold">Cash Collection Policy</p>
                                                <ul className="text-[11px] text-warning list-disc pl-4 space-y-0.5">
                                                    <li>Customer must present valid ID at the counter</li>
                                                    <li>Cash must be collected within 24 hours of approval</li>
                                                    <li>Denomination availability subject to branch vault stock</li>
                                                    <li>Amounts above KES 1,000,000 require advance notice (48 hrs)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Wire Transfer */}
                                {workflow.data.fxSettlementMethod === 'wire-transfer' && (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Debit Account</span>
                                                <span className="font-medium">{workflow.data.fxSourceAccount}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Payment Rail</span>
                                                <span className="font-semibold text-accent">{fxWireBeneficiary?.paymentRail || 'SWIFT'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Settlement Cycle</span>
                                                <span className="font-medium text-accent">
                                                    {fxWireBeneficiary?.paymentRail === 'SEPA' ? 'Same-day / T+1' : fxWireBeneficiary?.paymentRail === 'PAPSS' ? 'Real-time / T+0' : 'T+1 (Next Business Day)'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Value Date</span>
                                                <span className="font-medium">
                                                    {new Date(Date.now() + (fxWireBeneficiary?.paymentRail === 'PAPSS' ? 0 : 86400000)).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Wire Amount</span>
                                                <span className="font-medium">
                                                    {workflow.data.fxDirection === 'BUY'
                                                        ? `${workflow.data.fxCurrencyCode} ${Number(workflow.data.fxFcyAmount).toLocaleString()}`
                                                        : `KES ${(Number(workflow.data.fxFcyAmount) * (officerImprovedRate ?? fxDynamicRate.offeredRate)).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Beneficiary Details */}
                                        {fxWireBeneficiary && (
                                            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                                                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide mb-2">Beneficiary Information</p>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Beneficiary</span>
                                                    <span className="font-medium">{fxWireBeneficiary.beneficiaryName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{fxWireBeneficiary.paymentRail === 'SEPA' ? 'IBAN' : 'Account'}</span>
                                                    <span className="font-medium font-mono text-xs">{fxWireBeneficiary.beneficiaryAccount}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Bank</span>
                                                    <span className="font-medium">{fxWireBeneficiary.bankName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{fxWireBeneficiary.paymentRail === 'PAPSS' ? 'PAPSS Code' : 'BIC/SWIFT'}</span>
                                                    <span className="font-medium font-mono text-xs">{fxWireBeneficiary.bankCode}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Country</span>
                                                    <span className="font-medium">{fxWireBeneficiary.bankCountry}</span>
                                                </div>
                                                {fxWireBeneficiary.intermediaryBank && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Correspondent Bank</span>
                                                        <span className="font-medium">{fxWireBeneficiary.intermediaryBank}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Purpose</span>
                                                    <span className="font-medium capitalize">{fxWireBeneficiary.purpose.replace(/-/g, ' ')}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-2 rounded-lg bg-info/10 p-3">
                                            <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[11px] text-info font-semibold">{fxWireBeneficiary?.paymentRail || 'SWIFT'} Transfer Policy</p>
                                                <ul className="text-[11px] text-info list-disc pl-4 space-y-0.5">
                                                    {(fxWireBeneficiary?.paymentRail === 'SEPA') ? (
                                                        <>
                                                            <li>SEPA Credit Transfer confirmation sent to customer's email</li>
                                                            <li>Only EUR-denominated transfers within the EEA</li>
                                                            <li>No intermediary bank charges — shared cost (SHA)</li>
                                                            <li>Cut-off time: 15:00 CET for same-day settlement</li>
                                                        </>
                                                    ) : (fxWireBeneficiary?.paymentRail === 'PAPSS') ? (
                                                        <>
                                                            <li>PAPSS enables instant settlement in local African currencies</li>
                                                            <li>Pre-funded position required at the central hub</li>
                                                            <li>Regulatory compliance per destination country rules</li>
                                                            <li>Transaction limits per PAPSS participating bank policy</li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li>SWIFT MT103 confirmation sent to customer's registered email</li>
                                                            <li>Beneficiary bank charges (if any) borne by recipient (BEN)</li>
                                                            <li>Cut-off time: 14:00 EAT — submissions after cut-off settle T+2</li>
                                                            <li>Transactions above USD 10,000 require CBK reporting</li>
                                                            <li>Exchange rate locked at deal time; no adjustment on settlement date</li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        const finalRate = officerImprovedRate ?? fxDynamicRate.offeredRate;
                                        const finalKes = (Number(workflow.data.fxFcyAmount) * finalRate).toFixed(2);
                                        setWorkflow(prev => ({
                                            ...prev,
                                            data: { ...prev.data, fxKesAmount: finalKes, fxOfferedRate: finalRate.toFixed(4) },
                                        }));
                                        goToStage(rateImproved ? 'authorization' : 'verification');
                                    }}
                                    className="flex-1 touch-target gold-gradient text-accent-foreground font-semibold shadow-gold"
                                >
                                    {rateImproved ? 'Submit for Approval' : 'Proceed'}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {workflow.stage === 'processing' && service.id !== 'denomination-exchange' && (
                        <motion.div key="processing" {...pageVariants} className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
                                <Shield className="h-8 w-8 text-accent" />
                            </div>
                            <h3 className="font-display text-lg font-semibold">Processing Transaction...</h3>
                            <p className="text-sm text-muted-foreground">Applying changes and updating records</p>
                            {/* Auto-advance after 2s */}
                            <ProcessingAutoAdvance onDone={() => goToStage('verification')} />
                        </motion.div>
                    )}

                    {/* VERIFICATION STAGE */}
                    {workflow.stage === 'verification' && (
                        <motion.div key="verification" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="h-5 w-5 text-info" />
                                <p className="text-sm font-medium text-info">Customer verification required</p>
                            </div>

                            {service.id === 'denomination-exchange' ? (
                                <>
                                    {/* FX Deal Summary */}
                                    <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Zap className="h-3.5 w-3.5 text-accent" /> FX Deal Summary
                                        </h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                            {[
                                                { l: 'Direction', v: workflow.data.fxDirection === 'BUY' ? '🟢 Buy FCY' : '🔴 Sell FCY' },
                                                { l: 'Currency', v: workflow.data.fxCurrencyLabel },
                                                { l: `${workflow.data.fxCurrencyCode} Amount`, v: Number(workflow.data.fxFcyAmount || 0).toLocaleString() },
                                                { l: 'KES Equivalent', v: `KES ${Number(workflow.data.fxKesAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                                                { l: 'Exchange Rate', v: rateImproved && officerImprovedRate ? `${officerImprovedRate.toFixed(4)} ✦` : workflow.data.fxOfferedRate },
                                                { l: 'Spread', v: `${workflow.data.fxSpreadBps} bps` },
                                            ].map(({ l, v }) => (
                                                <div key={l} className="flex flex-col py-1.5 border-b border-border/50 last:border-0">
                                                    <span className="text-[11px] text-muted-foreground">{l}</span>
                                                    <span className="text-sm font-medium text-foreground">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {rateImproved && officerImprovedRate && (
                                            <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-2 mt-1">
                                                <Info className="h-3.5 w-3.5 text-accent shrink-0" />
                                                <p className="text-[11px] text-accent">Rate improved by officer — requires supervisor authorization</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Settlement Details */}
                                    <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Receipt className="h-3.5 w-3.5" /> Settlement Details
                                        </h4>
                                        {(() => {
                                            const method = workflow.data.fxSettlementMethod;
                                            const methodLabel = method === 'account-credit' ? 'Account Credit' : method === 'cash-collection' ? 'Cash Collection' : 'Wire Transfer';
                                            const rows = [
                                                { l: 'Settlement Method', v: methodLabel },
                                                { l: 'Source Account', v: workflow.data.fxSourceAccount },
                                            ];
                                            if (method === 'account-credit') {
                                                rows.push({ l: 'Settlement Account', v: workflow.data.fxSettlementAccount });
                                                rows.push({ l: 'Settlement Type', v: 'Immediate / Real-time' });
                                            } else if (method === 'cash-collection') {
                                                rows.push({ l: 'Collection', v: `${workflow.data.fxCurrencyCode} ${Number(workflow.data.fxFcyAmount || 0).toLocaleString()} cash at branch` });
                                                rows.push({ l: 'ID Required', v: 'Valid photo ID at collection' });
                                            } else if (method === 'wire-transfer' && fxWireBeneficiary) {
                                                rows.push({ l: 'Payment Rail', v: fxWireBeneficiary.paymentRail });
                                                rows.push({ l: 'Beneficiary', v: fxWireBeneficiary.beneficiaryName });
                                                rows.push({ l: fxWireBeneficiary.paymentRail === 'SEPA' ? 'IBAN' : 'Account', v: fxWireBeneficiary.beneficiaryAccount });
rows.push({
  l: 'Bank',
  v: `${fxWireBeneficiary.bankName} (${fxWireBeneficiary.bankCode})`
});
                                        rows.push({l: 'Country', v: fxWireBeneficiary.bankCountry.length === 2
                                        ? getCountryName(fxWireBeneficiary.bankCountry)
: fxWireBeneficiary.bankCountry });
                                        if (fxWireBeneficiary.intermediaryBank) rows.push({l: 'Intermediary Bank', v: fxWireBeneficiary.intermediaryBank });
                                        rows.push({l: 'Purpose', v: fxWireBeneficiary.purpose.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) });
                                        rows.push({l: 'Value Date', v: fxWireBeneficiary.paymentRail === 'PAPSS' ? 'Instant (T+0)' : fxWireBeneficiary.paymentRail === 'SEPA' ? 'Same day / T+1' : 'T+1 / T+2' });
}
                                        return (
                                        <div className="space-y-0">
                                            {rows.map(({ l, v }) => (
                                                <div key={l} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                                    <span className="text-xs text-muted-foreground">{l}</span>
                                                    <span className="text-sm font-medium text-foreground text-right max-w-[55%]">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                        );
})()}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Please Verify Details</h4>
                                    {summaryFields.map((field) => (
                                        <div key={field.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                            <span className="text-sm text-muted-foreground">{field.label}</span>
                                            <span className="text-sm font-medium text-foreground">{field.value}</span>
                                        </div>
                                    ))}
                                    {workflow.officerNotes && (
                                        <div className="pt-2">
                                            <span className="text-xs text-muted-foreground">Officer Notes:</span>
                                            <p className="text-sm mt-1">{workflow.officerNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button onClick={() => goToStage('input')} variant="outline" className="flex-1 touch-target">
                                    Request Changes
                                </Button>
                                <Button onClick={() => goToStage('authorization')} className="flex-1 touch-target gold-gradient text-accent-foreground font-semibold shadow-gold">
                                    Confirm & Verify
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* AUTHORIZATION STAGE */}
                    {workflow.stage === 'authorization' && (
                        <motion.div key="authorization" {...pageVariants} className="space-y-6 max-w-lg mx-auto text-center">
                            <div className="flex items-center gap-2 justify-center mb-2">
                                <ThumbsUp className="h-5 w-5 text-accent" />
                                <p className="text-sm font-medium">Awaiting supervisor authorization</p>
                            </div>
                            <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
                                <Shield className="h-12 w-12 text-accent mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground mb-4">Supervisor approval is required to complete this transaction</p>
                                <Button onClick={() => goToStage('cross-sell')} className="touch-target gold-gradient text-accent-foreground font-semibold shadow-gold">
                                    Authorize Transaction
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* CROSS-SELL STAGE */}
                    {workflow.stage === 'cross-sell' && (
                        <motion.div key="cross-sell" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
                            <div className="text-center mb-4">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-3">
                                    <Check className="h-7 w-7 text-success" />
                                </div>
                                <h3 className="font-display text-xl font-semibold">Transaction Successful!</h3>
                                <p className="text-sm text-muted-foreground mt-1">Your transaction has been processed and authorized.</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Gift className="h-5 w-5 text-accent" />
                                    <h4 className="font-semibold text-base">You might also be interested in</h4>
                                </div>
                                {CROSS_SELL_OFFERS.map((offer) => (
                                    <button
                                        key={offer.title}
                                        className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:shadow-card transition-shadow touch-target group"
                                    >
                                        <span className="text-2xl">{offer.icon}</span>
                                        <div className="flex-1">
                                            <h5 className="font-semibold text-sm">{offer.title}</h5>
                                            <p className="text-xs text-muted-foreground">{offer.description}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>

                            <Button onClick={() => goToStage('feedback')} className="w-full touch-target gold-gradient text-accent-foreground font-semibold shadow-gold mt-2">
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* FEEDBACK STAGE */}
                    {workflow.stage === 'feedback' && (
                        <motion.div key="feedback" {...pageVariants} className="space-y-6 max-w-lg mx-auto text-center">
                            <h3 className="font-display text-xl font-semibold">How was your experience?</h3>
                            <p className="text-sm text-muted-foreground">Your feedback helps us improve our services</p>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setFeedbackRating(star)}
                                        className="touch-target p-1"
                                    >
                                        <Star className={`h-10 w-10 transition-colors ${star <= feedbackRating ? 'text-accent fill-accent' : 'text-border'}`} />
                                    </button>
                                ))}
                            </div>

                            <Textarea
                                placeholder="Any additional comments or service requests? (optional)"
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                className="touch-target"
                                rows={3}
                            />

                            <div className="flex gap-3">
                                <Button onClick={onComplete} variant="outline" className="flex-1 touch-target">
                                    Skip
                                </Button>
                                <Button onClick={onComplete} className="flex-1 touch-target gold-gradient text-accent-foreground font-semibold shadow-gold">
                                    Submit Feedback
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}