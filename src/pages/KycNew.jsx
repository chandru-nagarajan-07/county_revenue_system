import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  Trash2,
  AlertCircle,
  Plus,
  Fingerprint,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ========== STEP DEFINITIONS ==========
const STEPS = [
  { id: 1, name: "Personal Info" },
  { id: 2, name: "Account Details" },
  { id: 3, name: "Address" },
  { id: 4, name: "Employment" },
  { id: 5, name: "Next of Kin" },
  { id: 6, name: "KYC Documents" },
  { id: 7, name: "Consent" },
  { id: 8, name: "Preview & Submit" },
];

// ========== MOCK UNIQUENESS CHECKS (plain JS) ==========
const checkUniqueNationalId = async (nationalId) => {
  const existingIds = ['12345678', '87654321', '11223344'];
  await new Promise(resolve => setTimeout(resolve, 500));
  return !existingIds.includes(nationalId);
};

const checkUniqueKraPin = async (kraPin) => {
  const existingPins = ['A001234567Z', 'B002345678Y', 'C003456789X'];
  await new Promise(resolve => setTimeout(resolve, 500));
  return !existingPins.includes(kraPin);
};

// ========== ID GENERATORS ==========
const generateCustomerId = () => `CUST${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
const generateCustomershipNumber = () => `CS${Date.now().toString().slice(-8)}`;
const generateCifNumber = () => `CIF${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;

// ========== INITIAL FORM DATA ==========
const INITIAL_DATA = {
  // Step 1.1
  title: '', firstName: '', lastName: '', dateOfBirth: '', gender: '',
  phoneNumber: '', phoneOtpVerified: false, phoneOtpCode: '',
  email: '', emailOtpVerified: false, emailOtpCode: '',
  nationalId: '', kraPin: '', maritalStatus: '', nationality: 'Kenyan',
  placeOfBirth: '', countryOfResidence: 'Kenya', pep: 'No', disability: '',
  // Step 1.2
  accountType: '', accountPurpose: '', accountOwnership: 'individual', currency: 'KES',
  // Step 1.3
  street: '', city: '', district: '', country: 'Kenya', postalCode: '',
  nearestLandmark: '', county: '', durationAtAddress: '', proofOfResidence: null,
  // Step 1.4
  employerName: '', employmentType: '', monthlyIncome: '', occupation: '',
  expectedMonthlyTransactions: '', maxDepositWithdrawal: '', sourceOfFunds: '', otherIncomeSources: '',
  // Step 1.5
  nextOfKinList: [],
  // Step 1.6
  nationalIdFront: null, nationalIdBack: null, passportPhoto: null, signatureImage: null,
  addressProofDoc: null, kraPinCertificate: null, signedCustomershipForm: null,
  idIssueDate: '', idPlaceOfIssue: '', biometricCaptured: false, livePhotoCaptured: false,
  // Step 1.7
  acceptTerms: false, dataUsageConsent: false, consentDate: '',
  // System
  customerId: '', customershipNumber: '', cifNumber: '', status: 'Draft', kycStatus: 'Pending'
};

// ========== STEP COMPONENTS ==========
const PersonalInfoStep = ({ data, onChange, errors, setErrors }) => {
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [checkingNationalId, setCheckingNationalId] = useState(false);
  const [checkingKraPin, setCheckingKraPin] = useState(false);
  const [nationalIdValid, setNationalIdValid] = useState(null);
  const [kraPinValid, setKraPinValid] = useState(null);

  const sendPhoneOtp = async () => {
    if (!data.phoneNumber || data.phoneNumber.length < 10) {
      setErrors({ ...errors, phoneNumber: 'Valid phone number required' });
      return;
    }
    setSendingPhoneOtp(true);
    await new Promise(r => setTimeout(r, 1000));
    alert(`OTP sent to ${data.phoneNumber}: 123456`);
    setSendingPhoneOtp(false);
  };

  const verifyPhoneOtp = () => {
    if (data.phoneOtpCode === '123456') {
      onChange('phoneOtpVerified', true);
      setErrors({ ...errors, phoneOtp: '' });
    } else {
      setErrors({ ...errors, phoneOtp: 'Invalid OTP' });
    }
  };

  const sendEmailOtp = async () => {
    if (!data.email || !data.email.includes('@')) {
      setErrors({ ...errors, email: 'Valid email required' });
      return;
    }
    setSendingEmailOtp(true);
    await new Promise(r => setTimeout(r, 1000));
    alert(`OTP sent to ${data.email}: 123456`);
    setSendingEmailOtp(false);
  };

  const verifyEmailOtp = () => {
    if (data.emailOtpCode === '123456') {
      onChange('emailOtpVerified', true);
      setErrors({ ...errors, emailOtp: '' });
    } else {
      setErrors({ ...errors, emailOtp: 'Invalid OTP' });
    }
  };

  const validateNationalId = async () => {
    if (!data.nationalId) return;
    setCheckingNationalId(true);
    const isValid = await checkUniqueNationalId(data.nationalId);
    setNationalIdValid(isValid);
    if (!isValid) setErrors({ ...errors, nationalId: 'National ID already exists' });
    else setErrors({ ...errors, nationalId: '' });
    setCheckingNationalId(false);
  };

  const validateKraPin = async () => {
    if (!data.kraPin) return;
    setCheckingKraPin(true);
    const isValid = await checkUniqueKraPin(data.kraPin);
    setKraPinValid(isValid);
    if (!isValid) setErrors({ ...errors, kraPin: 'KRA PIN already exists' });
    else setErrors({ ...errors, kraPin: '' });
    setCheckingKraPin(false);
  };

  const age = data.dateOfBirth
    ? new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear()
    : 0;
  const isAgeValid = age >= 18;

  useEffect(() => {
    if (data.dateOfBirth && !isAgeValid) setErrors({ ...errors, dateOfBirth: 'Must be 18 years or older' });
    else setErrors({ ...errors, dateOfBirth: '' });
  }, [data.dateOfBirth]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Title <span className="text-destructive">*</span></Label>
          <Select value={data.title} onValueChange={(v) => onChange('title', v)}>
            <SelectTrigger><SelectValue placeholder="Mr/Ms/Dr" /></SelectTrigger>
            <SelectContent><SelectItem value="Mr">Mr</SelectItem><SelectItem value="Mrs">Mrs</SelectItem><SelectItem value="Ms">Ms</SelectItem><SelectItem value="Dr">Dr</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>First Name *</Label><Input value={data.firstName} onChange={e => onChange('firstName', e.target.value)} /></div>
        <div className="space-y-2"><Label>Last Name *</Label><Input value={data.lastName} onChange={e => onChange('lastName', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Date of Birth *</Label><Input type="date" value={data.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)} />
          {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
          {data.dateOfBirth && isAgeValid && <p className="text-xs text-success">Age: {age} years</p>}
        </div>
        <div className="space-y-2"><Label>Gender *</Label><Select value={data.gender} onValueChange={v => onChange('gender', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
      </div>

      <div className="space-y-2"><Label>Phone Number *</Label>
        <div className="flex gap-2"><Input value={data.phoneNumber} onChange={e => onChange('phoneNumber', e.target.value)} disabled={data.phoneOtpVerified} className="flex-1" />
          {!data.phoneOtpVerified ? <Button variant="outline" onClick={sendPhoneOtp} disabled={sendingPhoneOtp}>{sendingPhoneOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}</Button> : <Badge className="bg-success/20"><Check className="h-3 w-3 mr-1" /> Verified</Badge>}
        </div>
        {!data.phoneOtpVerified && data.phoneNumber && <div className="flex gap-2 mt-2"><Input placeholder="Enter OTP" value={data.phoneOtpCode} onChange={e => onChange('phoneOtpCode', e.target.value)} /><Button variant="secondary" onClick={verifyPhoneOtp}>Verify</Button></div>}
        {errors.phoneOtp && <p className="text-xs text-destructive">{errors.phoneOtp}</p>}
      </div>

      <div className="space-y-2"><Label>Email *</Label>
        <div className="flex gap-2"><Input value={data.email} onChange={e => onChange('email', e.target.value)} disabled={data.emailOtpVerified} className="flex-1" />
          {!data.emailOtpVerified ? <Button variant="outline" onClick={sendEmailOtp} disabled={sendingEmailOtp}>{sendingEmailOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}</Button> : <Badge className="bg-success/20"><Check className="h-3 w-3 mr-1" /> Verified</Badge>}
        </div>
        {!data.emailOtpVerified && data.email && <div className="flex gap-2 mt-2"><Input placeholder="Enter OTP" value={data.emailOtpCode} onChange={e => onChange('emailOtpCode', e.target.value)} /><Button variant="secondary" onClick={verifyEmailOtp}>Verify</Button></div>}
        {errors.emailOtp && <p className="text-xs text-destructive">{errors.emailOtp}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>National ID *</Label><div className="relative"><Input value={data.nationalId} onChange={e => onChange('nationalId', e.target.value)} onBlur={validateNationalId} />{checkingNationalId && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}{nationalIdValid === true && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}{nationalIdValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}</div>{errors.nationalId && <p className="text-xs text-destructive">{errors.nationalId}</p>}</div>
        <div className="space-y-2"><Label>KRA PIN *</Label><div className="relative"><Input value={data.kraPin} onChange={e => onChange('kraPin', e.target.value.toUpperCase())} onBlur={validateKraPin} className="uppercase" />{checkingKraPin && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}{kraPinValid === true && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}{kraPinValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}</div>{errors.kraPin && <p className="text-xs text-destructive">{errors.kraPin}</p>}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Marital Status *</Label><Select value={data.maritalStatus} onValueChange={v => onChange('maritalStatus', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem><SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Nationality *</Label><Input value={data.nationality} onChange={e => onChange('nationality', e.target.value)} /></div>
        <div className="space-y-2"><Label>Place of Birth *</Label><Input value={data.placeOfBirth} onChange={e => onChange('placeOfBirth', e.target.value)} /></div>
        <div className="space-y-2"><Label>Country of Residence *</Label><Input value={data.countryOfResidence} onChange={e => onChange('countryOfResidence', e.target.value)} /></div>
        <div className="space-y-2"><Label>Politically Exposed Person (PEP) *</Label><Select value={data.pep} onValueChange={v => onChange('pep', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Disability (Optional)</Label><Input value={data.disability} onChange={e => onChange('disability', e.target.value)} placeholder="If any" /></div>
      </div>
    </div>
  );
};

const AccountDetailsStep = ({ data, onChange }) => {
  const getInitialDeposit = () => {
    switch (data.accountType) {
      case 'Savings': return 'KES 1,000';
      case 'Current': return 'KES 5,000';
      case 'Salary': return 'KES 0 (Employer arrangement)';
      case 'Fixed': return 'KES 10,000 minimum';
      default: return '—';
    }
  };
  const getAccountRules = () => {
    switch (data.accountType) {
      case 'Savings': return 'Min balance KES 500, 3 free withdrawals/month';
      case 'Current': return 'No interest, unlimited transactions, monthly fee KES 300';
      case 'Salary': return 'No monthly fee, salary must be credited monthly';
      case 'Fixed': return 'Lock-in 6–12 months, penalty for early withdrawal';
      default: return '—';
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Account Type *</Label><Select value={data.accountType} onValueChange={v => onChange('accountType', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Savings">Savings</SelectItem><SelectItem value="Current">Current</SelectItem><SelectItem value="Salary">Salary</SelectItem><SelectItem value="Fixed">Fixed Deposit</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Account Purpose *</Label><Select value={data.accountPurpose} onValueChange={v => onChange('accountPurpose', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="salary">Salary Receipt</SelectItem><SelectItem value="business">Business Transactions</SelectItem><SelectItem value="savings">Personal Savings</SelectItem><SelectItem value="investment">Investment</SelectItem><SelectItem value="remittances">Remittances</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Account Ownership *</Label><Select value={data.accountOwnership} onValueChange={v => onChange('accountOwnership', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="joint">Joint</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Currency</Label><Select value={data.currency} onValueChange={v => onChange('currency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="KES">KES</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select></div>
      </div>
      {data.accountType && (
        <Card className="bg-muted/30"><CardContent className="pt-4 space-y-2"><div className="flex justify-between"><span className="text-sm font-medium">Initial deposit:</span><span>{getInitialDeposit()}</span></div><div className="flex justify-between"><span className="text-sm font-medium">Account rules:</span><span>{getAccountRules()}</span></div></CardContent></Card>
      )}
    </div>
  );
};

const AddressStep = ({ data, onChange }) => {
  const fileRef = useRef(null);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Street *</Label><Input value={data.street} onChange={e => onChange('street', e.target.value)} /></div>
        <div className="space-y-2"><Label>City *</Label><Input value={data.city} onChange={e => onChange('city', e.target.value)} /></div>
        <div className="space-y-2"><Label>District *</Label><Input value={data.district} onChange={e => onChange('district', e.target.value)} /></div>
        <div className="space-y-2"><Label>Country *</Label><Input value={data.country} onChange={e => onChange('country', e.target.value)} /></div>
        <div className="space-y-2"><Label>Postal Code</Label><Input value={data.postalCode} onChange={e => onChange('postalCode', e.target.value)} /></div>
        <div className="space-y-2"><Label>Nearest Landmark *</Label><Input value={data.nearestLandmark} onChange={e => onChange('nearestLandmark', e.target.value)} placeholder="e.g., Near Kencom Bus Stop" /></div>
        <div className="space-y-2"><Label>County (Kenya) *</Label><Select value={data.county} onValueChange={v => onChange('county', v)}><SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger><SelectContent>{['Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Uasin Gishu','Kajiado','Machakos'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Duration at address (years) *</Label><Input type="number" value={data.durationAtAddress} onChange={e => onChange('durationAtAddress', e.target.value)} placeholder="e.g., 3" /></div>
      </div>
      <div className="space-y-2"><Label>Proof of residence * (less than 3 months old)</Label><div className="flex gap-2"><Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-2" />{data.proofOfResidence ? 'Change File' : 'Upload'}</Button>{data.proofOfResidence && <span className="text-sm">{data.proofOfResidence.name}</span>}</div><input type="file" ref={fileRef} onChange={e => onChange('proofOfResidence', e.target.files?.[0] || null)} className="hidden" accept=".pdf,.jpg,.png" /></div>
    </div>
  );
};

const EmploymentStep = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Employer Name *</Label><Input value={data.employerName} onChange={e => onChange('employerName', e.target.value)} /></div>
        <div className="space-y-2"><Label>Employment Type *</Label><Select value={data.employmentType} onValueChange={v => onChange('employmentType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Employed">Employed (Full-time)</SelectItem><SelectItem value="Self-employed">Self-employed</SelectItem><SelectItem value="Business Owner">Business Owner</SelectItem><SelectItem value="Unemployed">Unemployed</SelectItem><SelectItem value="Retired">Retired</SelectItem><SelectItem value="Student">Student</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Monthly Income (KES) *</Label><Input type="number" value={data.monthlyIncome} onChange={e => onChange('monthlyIncome', e.target.value)} /></div>
        <div className="space-y-2"><Label>Occupation / Industry *</Label><Input value={data.occupation} onChange={e => onChange('occupation', e.target.value)} placeholder="e.g., IT, Finance" /></div>
        <div className="space-y-2"><Label>Expected monthly transactions *</Label><Select value={data.expectedMonthlyTransactions} onValueChange={v => onChange('expectedMonthlyTransactions', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0-10">0-10</SelectItem><SelectItem value="11-30">11-30</SelectItem><SelectItem value="31-50">31-50</SelectItem><SelectItem value="50+">50+</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Max deposit / withdrawal (KES) *</Label><Select value={data.maxDepositWithdrawal} onValueChange={v => onChange('maxDepositWithdrawal', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="<100k">&lt;100,000</SelectItem><SelectItem value="100k-500k">100k–500k</SelectItem><SelectItem value="500k-1M">500k–1M</SelectItem><SelectItem value=">1M">&gt;1M</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Source of funds *</Label><Select value={data.sourceOfFunds} onValueChange={v => onChange('sourceOfFunds', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Salary">Salary / Wages</SelectItem><SelectItem value="Business">Business Income</SelectItem><SelectItem value="Investments">Investments</SelectItem><SelectItem value="Inheritance">Inheritance</SelectItem><SelectItem value="Remittances">Remittances</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Other income sources</Label><Input value={data.otherIncomeSources} onChange={e => onChange('otherIncomeSources', e.target.value)} placeholder="e.g., Rental income" /></div>
      </div>
    </div>
  );
};

const NextOfKinStep = ({ data, onChange, errors, setErrors }) => {
  const [newNok, setNewNok] = useState({ name: '', relationship: '', phone: '', email: '' });
  const add = () => {
    if (!newNok.name || !newNok.relationship) {
      setErrors({ ...errors, nokIncomplete: 'Name and relationship are required' });
      return;
    }
    onChange('nextOfKinList', [...data.nextOfKinList, { ...newNok, id: Date.now().toString() }]);
    setNewNok({ name: '', relationship: '', phone: '', email: '' });
    setErrors({ ...errors, nokIncomplete: '' });
  };
  const remove = (id) => onChange('nextOfKinList', data.nextOfKinList.filter(n => n.id !== id));
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <h4 className="font-medium">Add Next of Kin</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Full Name *" value={newNok.name} onChange={e => setNewNok({ ...newNok, name: e.target.value })} />
          <Input placeholder="Relationship *" value={newNok.relationship} onChange={e => setNewNok({ ...newNok, relationship: e.target.value })} />
          <Input placeholder="Phone" value={newNok.phone} onChange={e => setNewNok({ ...newNok, phone: e.target.value })} />
          <Input placeholder="Email" value={newNok.email} onChange={e => setNewNok({ ...newNok, email: e.target.value })} />
        </div>
        {errors.nokIncomplete && <p className="text-xs text-destructive">{errors.nokIncomplete}</p>}
        <Button variant="outline" onClick={add} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>
      {data.nextOfKinList.length === 0 && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive"><AlertCircle className="h-4 w-4 inline mr-2" /> At least one Next of Kin required</div>}
      {data.nextOfKinList.map(n => <div key={n.id} className="flex justify-between items-center rounded-lg border p-3"><div><p className="font-medium">{n.name}</p><p className="text-xs text-muted-foreground">{n.relationship} • {n.phone} • {n.email}</p></div><Button variant="ghost" size="sm" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}
    </div>
  );
};

const KycDocumentsStep = ({ data, onChange }) => {
  const fileRefs = {
    nationalIdFront: useRef(null), nationalIdBack: useRef(null),
    passportPhoto: useRef(null), signatureImage: useRef(null),
    addressProofDoc: useRef(null), kraPinCertificate: useRef(null),
    signedCustomershipForm: useRef(null),
  };
  const uploadButton = (label, field, required) => (
    <div className="space-y-2"><Label>{label} {required && '*'}</Label><div className="flex gap-2"><Button variant="outline" onClick={() => fileRefs[field]?.current?.click()}><Upload className="h-4 w-4 mr-2" />{data[field] ? data[field].name : 'Choose'}</Button>{data[field] && <Button variant="ghost" size="sm" onClick={() => onChange(field, null)}><Trash2 className="h-4 w-4" /></Button>}</div><input type="file" ref={fileRefs[field]} onChange={e => onChange(field, e.target.files?.[0] || null)} className="hidden" accept="image/*,.pdf" /></div>
  );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>ID Issue Date *</Label><Input type="date" value={data.idIssueDate} onChange={e => onChange('idIssueDate', e.target.value)} /></div>
        <div className="space-y-2"><Label>ID Place of Issue *</Label><Input value={data.idPlaceOfIssue} onChange={e => onChange('idPlaceOfIssue', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uploadButton('National ID Front', 'nationalIdFront', true)}
        {uploadButton('National ID Back', 'nationalIdBack', true)}
        {uploadButton('Passport Photo', 'passportPhoto', true)}
        {uploadButton('Signature Image', 'signatureImage', true)}
        {uploadButton('Proof of Residence (Optional)', 'addressProofDoc', false)}
        {uploadButton('KRA PIN Certificate (Optional)', 'kraPinCertificate', false)}
        {uploadButton('Signed Customership Form (Optional)', 'signedCustomershipForm', false)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3 rounded-lg border p-3"><Checkbox checked={data.biometricCaptured} onCheckedChange={c => onChange('biometricCaptured', !!c)} id="bio" /><Label htmlFor="bio" className="cursor-pointer flex items-center gap-2"><Fingerprint className="h-4 w-4" /> Biometric captured</Label></div>
        <div className="flex items-center space-x-3 rounded-lg border p-3"><Checkbox checked={data.livePhotoCaptured} onCheckedChange={c => onChange('livePhotoCaptured', !!c)} id="live" /><Label htmlFor="live" className="cursor-pointer flex items-center gap-2"><Camera className="h-4 w-4" /> Live photo captured</Label></div>
      </div>
    </div>
  );
};

const ConsentStep = ({ data, onChange }) => {
  useEffect(() => {
    if (data.acceptTerms && data.dataUsageConsent && !data.consentDate) {
      onChange('consentDate', new Date().toISOString());
    }
  }, [data.acceptTerms, data.dataUsageConsent]);
  return (
    <div className="space-y-6">
      <Card className="border-muted"><CardContent className="pt-6 space-y-4">
        <div className="flex items-start space-x-3"><Checkbox id="terms" checked={data.acceptTerms} onCheckedChange={c => onChange('acceptTerms', !!c)} /><Label htmlFor="terms" className="cursor-pointer text-sm">I accept the Terms & Conditions of the SACCO.</Label></div>
        <div className="flex items-start space-x-3"><Checkbox id="dataConsent" checked={data.dataUsageConsent} onCheckedChange={c => onChange('dataUsageConsent', !!c)} /><Label htmlFor="dataConsent" className="cursor-pointer text-sm">I consent to the collection, processing, and storage of my personal data for KYC, account management, and regulatory reporting.</Label></div>
        {data.consentDate && <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">Consent recorded on: {new Date(data.consentDate).toLocaleString()}</div>}
      </CardContent></Card>
    </div>
  );
};

const PreviewStep = ({ data }) => (
  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
    <Card><CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><div className="grid grid-cols-2"><span className="text-muted-foreground">Name:</span><span>{data.title} {data.firstName} {data.lastName}</span></div><div className="grid grid-cols-2"><span>DOB:</span><span>{data.dateOfBirth}</span></div><div className="grid grid-cols-2"><span>Gender:</span><span>{data.gender}</span></div><div className="grid grid-cols-2"><span>Phone:</span><span>{data.phoneNumber} {data.phoneOtpVerified && '✓'}</span></div><div className="grid grid-cols-2"><span>Email:</span><span>{data.email} {data.emailOtpVerified && '✓'}</span></div><div className="grid grid-cols-2"><span>National ID:</span><span>{data.nationalId}</span></div><div className="grid grid-cols-2"><span>KRA PIN:</span><span>{data.kraPin}</span></div><div className="grid grid-cols-2"><span>Marital Status:</span><span>{data.maritalStatus}</span></div><div className="grid grid-cols-2"><span>PEP:</span><span>{data.pep}</span></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Account & Address</CardTitle></CardHeader><CardContent className="text-sm"><div className="grid grid-cols-2"><span>Account Type:</span><span>{data.accountType}</span></div><div className="grid grid-cols-2"><span>Address:</span><span>{data.street}, {data.city}, {data.county}</span></div><div className="grid grid-cols-2"><span>Landmark:</span><span>{data.nearestLandmark}</span></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Employment & Next of Kin</CardTitle></CardHeader><CardContent className="text-sm"><div className="grid grid-cols-2"><span>Employer:</span><span>{data.employerName}</span></div><div className="grid grid-cols-2"><span>Monthly Income:</span><span>KES {data.monthlyIncome}</span></div><div className="grid grid-cols-2"><span>Next of Kin:</span><span>{data.nextOfKinList.length} person(s)</span></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Documents & Consent</CardTitle></CardHeader><CardContent className="text-sm"><div className="grid grid-cols-2"><span>ID Uploaded:</span><span>{data.nationalIdFront ? 'Yes' : 'No'}</span></div><div className="grid grid-cols-2"><span>Biometric:</span><span>{data.biometricCaptured ? 'Captured' : 'Not captured'}</span></div><div className="grid grid-cols-2"><span>Live Photo:</span><span>{data.livePhotoCaptured ? 'Captured' : 'Not captured'}</span></div><div className="grid grid-cols-2"><span>Consent:</span><span>{data.acceptTerms ? 'Accepted' : 'Pending'}</span></div></CardContent></Card>
  </div>
);

// ========== MAIN COMPONENT ==========
export function KycOnboardingFlow({ onBack = () => window.history.back() }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedIds, setGeneratedIds] = useState(null);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.title) newErrors.title = 'Required';
      if (!formData.firstName) newErrors.firstName = 'Required';
      if (!formData.lastName) newErrors.lastName = 'Required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
      else if (new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() < 18) newErrors.dateOfBirth = 'Age ≥18 required';
      if (!formData.gender) newErrors.gender = 'Required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Required';
      if (!formData.phoneOtpVerified) newErrors.phoneOtp = 'Verify phone OTP';
      if (!formData.email) newErrors.email = 'Required';
      if (!formData.emailOtpVerified) newErrors.emailOtp = 'Verify email OTP';
      if (!formData.nationalId) newErrors.nationalId = 'Required';
      if (!formData.kraPin) newErrors.kraPin = 'Required';
      if (!formData.maritalStatus) newErrors.maritalStatus = 'Required';
      if (!formData.nationality) newErrors.nationality = 'Required';
      if (!formData.placeOfBirth) newErrors.placeOfBirth = 'Required';
      if (!formData.countryOfResidence) newErrors.countryOfResidence = 'Required';
      if (!formData.pep) newErrors.pep = 'Required';
    } else if (step === 2) {
      if (!formData.accountType) newErrors.accountType = 'Required';
      if (!formData.accountPurpose) newErrors.accountPurpose = 'Required';
      if (!formData.accountOwnership) newErrors.accountOwnership = 'Required';
    } else if (step === 3) {
      if (!formData.street) newErrors.street = 'Required';
      if (!formData.city) newErrors.city = 'Required';
      if (!formData.district) newErrors.district = 'Required';
      if (!formData.country) newErrors.country = 'Required';
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.nearestLandmark) newErrors.nearestLandmark = 'Required';
      if (!formData.durationAtAddress) newErrors.durationAtAddress = 'Required';
      if (!formData.proofOfResidence) newErrors.proofOfResidence = 'Proof of residence required';
    } else if (step === 4) {
      if (!formData.employerName) newErrors.employerName = 'Required';
      if (!formData.employmentType) newErrors.employmentType = 'Required';
      if (!formData.monthlyIncome) newErrors.monthlyIncome = 'Required';
      if (!formData.occupation) newErrors.occupation = 'Required';
      if (!formData.expectedMonthlyTransactions) newErrors.expectedMonthlyTransactions = 'Required';
      if (!formData.maxDepositWithdrawal) newErrors.maxDepositWithdrawal = 'Required';
      if (!formData.sourceOfFunds) newErrors.sourceOfFunds = 'Required';
    } else if (step === 5) {
      if (formData.nextOfKinList.length === 0) newErrors.nextOfKin = 'At least one Next of Kin required';
    } else if (step === 6) {
      if (!formData.nationalIdFront) newErrors.nationalIdFront = 'Required';
      if (!formData.nationalIdBack) newErrors.nationalIdBack = 'Required';
      if (!formData.passportPhoto) newErrors.passportPhoto = 'Required';
      if (!formData.signatureImage) newErrors.signatureImage = 'Required';
      if (!formData.idIssueDate) newErrors.idIssueDate = 'Required';
      if (!formData.idPlaceOfIssue) newErrors.idPlaceOfIssue = 'Required';
    } else if (step === 7) {
      if (!formData.acceptTerms) newErrors.acceptTerms = 'Must accept Terms';
      if (!formData.dataUsageConsent) newErrors.dataUsageConsent = 'Must consent to data usage';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    const ids = {
      customerId: generateCustomerId(),
      customershipNumber: generateCustomershipNumber(),
      cifNumber: generateCifNumber(),
    };
    setGeneratedIds(ids);
    // Here you would POST to backend: { ...formData, status: 'Draft', kycStatus: 'Pending', ...ids }
    console.log('Submitted:', { ...formData, ...ids, status: 'Draft', kycStatus: 'Pending' });
    setSubmitting(false);
    setSubmitSuccess(true);
  };

  const renderStepContent = () => {
    const props = { data: formData, onChange: updateField, errors, setErrors };
    switch (currentStep) {
      case 1: return <PersonalInfoStep {...props} />;
      case 2: return <AccountDetailsStep {...props} />;
      case 3: return <AddressStep {...props} />;
      case 4: return <EmploymentStep {...props} />;
      case 5: return <NextOfKinStep {...props} />;
      case 6: return <KycDocumentsStep {...props} />;
      case 7: return <ConsentStep {...props} />;
      case 8: return <PreviewStep data={formData} />;
      default: return null;
    }
  };

  if (submitSuccess && generatedIds) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader customerName="New Customer" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onLogout={() => navigate("/")} />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
            <div className="rounded-full bg-success/20 w-20 h-20 mx-auto flex items-center justify-center mb-6"><Check className="h-10 w-10 text-success" /></div>
            <h2 className="text-2xl font-bold mb-2">Customer Created Successfully!</h2>
            <p className="text-muted-foreground mb-6">Status: <Badge>Draft</Badge> &nbsp; KYC: <Badge variant="secondary">Pending</Badge></p>
            <Card className="text-left mb-6"><CardContent className="pt-6 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Customer ID:</span><span className="font-mono font-bold">{generatedIds.customerId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Customership Number:</span><span className="font-mono font-bold">{generatedIds.customershipNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CIF Number:</span><span className="font-mono font-bold">{generatedIds.cifNumber}</span></div>
            </CardContent></Card>
            <Button onClick={() => navigate('/dashboard')} className="gold-gradient w-full">Go to Dashboard</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader customerName="Customer Onboarding" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onLogout={() => navigate("/")} />
      <div className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-lg font-bold">Customer Onboarding (KYC)</h1><p className="text-xs text-gray-500">Step {currentStep} of {STEPS.length}: {STEPS[currentStep-1].name}</p></div>
        </div>
        <div className="flex items-center w-full">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${s.id < currentStep ? 'bg-primary border-primary text-white' : s.id === currentStep ? 'bg-accent border-accent scale-110 shadow' : 'bg-white border-gray-200'}`}>
                {s.id < currentStep ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
              </div>
              {idx < STEPS.length-1 && <div className={`flex-1 h-[2px] mx-1 ${s.id < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <Card><CardContent className="pt-6">{renderStepContent()}</CardContent></Card>
              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                {currentStep < STEPS.length ? (
                  <Button onClick={nextStep} className="gold-gradient">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="gold-gradient">{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}</Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
export default KycOnboardingFlow;