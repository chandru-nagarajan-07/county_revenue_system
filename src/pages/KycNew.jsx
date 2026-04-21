import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Check, Loader2,
  CheckCircle, XCircle, Upload, Trash2, AlertCircle, Plus,
  Fingerprint, Camera
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
  { id: 2, name: "Identity Docs" },
  { id: 3, name: "Contact & Address" },
  { id: 4, name: "Employment & Financial" },
  { id: 5, name: "Account Details" },
  { id: 6, name: "Next of Kin" },
  { id: 7, name: "Tax & Compliance" },
  { id: 8, name: "Declarations" },
  { id: 9, name: "Preview & Submit" },
];

// ========== MOCK UNIQUENESS CHECKS ==========
const checkUniqueNationalId = async (id) => {
  const existing = ['12345678', '87654321'];
  await new Promise(r => setTimeout(r, 500));
  return !existing.includes(id);
};
const checkUniqueKraPin = async (pin) => {
  const existing = ['A001234567Z', 'B002345678Y'];
  await new Promise(r => setTimeout(r, 500));
  return !existing.includes(pin);
};

// ========== ID GENERATORS ==========
const generateCustomerId = () => `CUST${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
const generateCustomershipNumber = () => `CS${Date.now().toString().slice(-8)}`;
const generateCifNumber = () => `CIF${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;

// ========== INITIAL FORM DATA ==========
const INITIAL_DATA = {
  // Section 1
  title: '', firstName: '', middleName: '', lastName: '', otherNames: '', formerName: '',
  dateOfBirth: '', placeOfBirth: '', gender: '', maritalStatus: '', nationality: 'Kenyan',
  dualNationality: false, secondNationality: '', countryOfBirth: '', countryOfResidence: 'Kenya',
  religion: '', pep: false, pepRoleDescription: '', disability: false, disabilityType: '',
  // Section 2
  idType: '', nationalIdNumber: '', passportNumber: '', passportIssueDate: '', passportExpiryDate: '',
  passportIssuingCountry: '', alienIdNumber: '', alienIdExpiryDate: '', refugeeIdNumber: '',
  serviceNumber: '', idIssueDate: '', idPlaceOfIssue: '', idFrontImage: null, idBackImage: null,
  kraPinNumber: '', kraPinCertCopy: null, nhifNumber: '', nssfNumber: '', workPermitNumber: '',
  workPermitClass: '', workPermitExpiryDate: '', birthCertificateNumber: '', studentProof: null,
  biometricCaptured: false, livePhotoCaptured: false, signatureImage: null,
  // Section 3
  plotHouseNumber: '', streetRoad: '', nearestLandmark: '', estateVillage: '', subLocation: '',
  location: '', division: '', subCounty: '', county: '', chiefsArea: '', countryAddress: 'Kenya',
  gpsLatitude: '', gpsLongitude: '', durationAtAddressYears: '', durationAtAddressMonths: '',
  proofOfResidence: null, poBox: '', postalCode: '', townCity: '',
  primaryMobile: '', primaryMobileVerified: false, primaryMobileOtp: '', secondaryMobile: '',
  homeTelephone: '', workTelephone: '', workExtension: '', whatsappNumber: '', mobileNetworkProvider: '',
  primaryEmail: '', primaryEmailVerified: false, primaryEmailOtp: '', secondaryEmail: '',
  preferredCommunicationChannel: '', preferredLanguage: '',
  // Section 4
  employmentStatus: '', occupation: '', industry: '', employerName: '', employerAddress: '',
  employerTelephone: '', yearsWithEmployer: '', natureOfBusiness: '', businessRegNumber: '',
  kraBusinessPin: '', yearsInBusiness: '', monthlyNetIncome: '', otherIncomeSources: [],
  expectedMonthlyCreditTurnover: '', expectedMaxSingleDeposit: '', expectedMaxSingleWithdrawal: '',
  primarySourceOfFunds: '', sourceOfWealth: '', sourceOfWealthDocument: null, annualIncome: '',
  netWorthEstimate: '', existingLoans: false, existingLoansAmount: '',
  // Section 5
  accountOwnershipType: '', accountProductType: '', accountPurpose: '', accountCurrency: 'KES',
  branchPreference: '', accountOperatingMode: '', mandateHolderFullName: '', mandateHolderIdNumber: '',
  relationshipToMandateHolder: '', chequeBookRequired: false, chequeBookPickupMethod: '',
  debitCardRequired: false, cardType: '', cardCollectionMode: '', atmDailyLimit: '',
  posDailyLimit: '', onlineTransferDailyLimit: '', standingOrderRequired: false,
  standingOrderDetails: '', directDebitAuthority: false, eStatementPreferred: false,
  statementFrequency: '', statementDeliveryMode: '', openingDepositAmount: '', openingDepositMethod: '',
  referralCode: '', referringCustomerAccount: '',
  fdDepositAmount: '', fdTenor: '', fdInterestRate: '', fdInterestPaymentFrequency: '',
  fdInterestCreditedTo: '', fdRolloverInstruction: '',
  // Section 6
  nextOfKinList: [], secondaryNextOfKinList: [],
  minorGuardian: { name: '', nationalId: '', kraPin: '', relationship: '', mobile: '', courtOrderDoc: null },
  // Section 7
  taxResidentInKenya: true, taxResidencyCountry: '', foreignTaxId: '', vatRegistrationNumber: '',
  usPersonDeclaration: false, usSsn: '', usAddress: '', w9w8benSubmitted: false, w9w8benDoc: null,
  crsAdditionalCountries: [], foreignTinPerCountry: [], crsSelfCertificationSigned: false,
  customerRiskRating: '', enhancedDueDiligenceRequired: false, sanctionsScreeningCleared: false,
  adverseMediaCheckCompleted: false, iprsVerificationStatus: '', crbCheckStatus: '', crbReferenceNumber: '',
  // Section 10
  infoAccuracyDecl: false, amlDeclaration: false, pepSelfDeclaration: false,
  fatcaCrsSelfCertSigned: false, taxComplianceDecl: false, termsAccepted: false,
  dataProtectionConsent: false, creditBureauConsent: false, regulatorDataConsent: false,
  marketingConsent: false, customerSignature: null, signatureDate: '', customerThumbPrint: null,
  witnessFullName: '', witnessIdNumber: '', witnessSignature: null, powerOfAttorneyDoc: null,
  openingOfficerName: '', officerStaffId: '', officerBranchCode: '', relationshipManagerName: '',
  rmEmployeeId: '', documentsVerifiedChecklist: false, applicationReceivedDateTime: '',
  applicationApprovedDate: '', approvalAuthorityLevel: '', accountNumberAssigned: '',
  sortCodeBranchCode: '', swiftBicCode: '', iban: '', customerCifNumber: '', welcomeLetterIssued: false,
  welcomePackDeliveryChannel: '', coreBankingEntryDateTime: '',
  status: 'Draft', kycStatus: 'Pending'
};

// Helper component for file upload
const FileUpload = ({ label, field, data, onChange, required, accept = "image/*,.pdf" }) => {
  const inputRef = useRef(null);
  return (
    <div className="space-y-2">
      <Label>{label} {required && '*'}</Label>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()} type="button">
          <Upload className="h-4 w-4 mr-2" />
          {data[field] ? (data[field]?.name || 'File selected') : 'Choose'}
        </Button>
        {data[field] && (
          <Button variant="ghost" size="sm" onClick={() => onChange(field, null)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input type="file" ref={inputRef} onChange={e => onChange(field, e.target.files?.[0] || null)} className="hidden" accept={accept} />
    </div>
  );
};

// ========== STEP COMPONENTS ==========
const PersonalInfoStep = ({ data, onChange, errors, setErrors }) => {
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [checkingNationalId, setCheckingNationalId] = useState(false);
  const [checkingKraPin, setCheckingKraPin] = useState(false);
  const [nationalIdValid, setNationalIdValid] = useState(null);
  const [kraPinValid, setKraPinValid] = useState(null);

  const sendEmailOtp = async () => {
    if (!data.primaryEmail || !data.primaryEmail.includes('@')) {
      setErrors({ ...errors, primaryEmail: 'Valid email required' });
      return;
    }
    setSendingEmailOtp(true);
    await new Promise(r => setTimeout(r, 1000));
    alert(`OTP sent to ${data.primaryEmail}: 123456`);
    setSendingEmailOtp(false);
  };
  const verifyEmailOtp = () => {
    if (data.primaryEmailOtp === '123456') {
      onChange('primaryEmailVerified', true);
      setErrors({ ...errors, primaryEmailOtp: '' });
    } else setErrors({ ...errors, primaryEmailOtp: 'Invalid OTP' });
  };
  const validateNationalId = async () => {
    if (!data.nationalIdNumber) return;
    setCheckingNationalId(true);
    const isValid = await checkUniqueNationalId(data.nationalIdNumber);
    setNationalIdValid(isValid);
    if (!isValid) setErrors({ ...errors, nationalIdNumber: 'National ID already exists' });
    else setErrors({ ...errors, nationalIdNumber: '' });
    setCheckingNationalId(false);
  };
  const validateKraPin = async () => {
    if (!data.kraPinNumber) return;
    setCheckingKraPin(true);
    const isValid = await checkUniqueKraPin(data.kraPinNumber);
    setKraPinValid(isValid);
    if (!isValid) setErrors({ ...errors, kraPinNumber: 'KRA PIN already exists' });
    else setErrors({ ...errors, kraPinNumber: '' });
    setCheckingKraPin(false);
  };
  const age = data.dateOfBirth ? new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : 0;
  const isAgeValid = age >= 18;
  useEffect(() => {
    if (data.dateOfBirth && !isAgeValid) setErrors({ ...errors, dateOfBirth: 'Must be 18 years or older' });
    else setErrors({ ...errors, dateOfBirth: '' });
  }, [data.dateOfBirth]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Title *</Label>
          <Select value={data.title} onValueChange={v => onChange('title', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Mr">Mr</SelectItem><SelectItem value="Mrs">Mrs</SelectItem>
              <SelectItem value="Ms">Ms</SelectItem><SelectItem value="Dr">Dr</SelectItem>
              <SelectItem value="Prof">Prof</SelectItem><SelectItem value="Rev">Rev</SelectItem>
              <SelectItem value="Hon">Hon</SelectItem>
            </SelectContent>
          </Select>
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div>
          <Label>First Name *</Label>
          <Input value={data.firstName} onChange={e => onChange('firstName', e.target.value)} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div>
          <Label>Middle Name</Label>
          <Input value={data.middleName} onChange={e => onChange('middleName', e.target.value)} />
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input value={data.lastName} onChange={e => onChange('lastName', e.target.value)} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
        </div>
        <div>
          <Label>Other Names / Aliases</Label>
          <Input value={data.otherNames} onChange={e => onChange('otherNames', e.target.value)} />
        </div>
        <div>
          <Label>Former Name (if changed)</Label>
          <Input value={data.formerName} onChange={e => onChange('formerName', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Date of Birth *</Label>
          <Input type="date" value={data.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)} />
          {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
          {data.dateOfBirth && isAgeValid && <p className="text-xs text-success">Age: {age}</p>}
        </div>
        <div>
          <Label>Place of Birth *</Label>
          <Input value={data.placeOfBirth} onChange={e => onChange('placeOfBirth', e.target.value)} />
          {errors.placeOfBirth && <p className="text-xs text-destructive">{errors.placeOfBirth}</p>}
        </div>
        <div>
          <Label>Gender *</Label>
          <Select value={data.gender} onValueChange={v => onChange('gender', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
          </Select>
          {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
        </div>
        <div>
          <Label>Marital Status *</Label>
          <Select value={data.maritalStatus} onValueChange={v => onChange('maritalStatus', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem>
              <SelectItem value="Separated">Separated</SelectItem>
            </SelectContent>
          </Select>
          {errors.maritalStatus && <p className="text-xs text-destructive">{errors.maritalStatus}</p>}
        </div>
        <div>
          <Label>Nationality *</Label>
          <Input value={data.nationality} onChange={e => onChange('nationality', e.target.value)} />
          {errors.nationality && <p className="text-xs text-destructive">{errors.nationality}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={data.dualNationality} onCheckedChange={c => onChange('dualNationality', c)} />
          <Label>Dual Nationality?</Label>
          {data.dualNationality && <Input placeholder="Second nationality" value={data.secondNationality} onChange={e => onChange('secondNationality', e.target.value)} className="ml-2" />}
        </div>
        <div>
          <Label>Country of Birth *</Label>
          <Input value={data.countryOfBirth} onChange={e => onChange('countryOfBirth', e.target.value)} />
          {errors.countryOfBirth && <p className="text-xs text-destructive">{errors.countryOfBirth}</p>}
        </div>
        <div>
          <Label>Country of Residence *</Label>
          <Input value={data.countryOfResidence} onChange={e => onChange('countryOfResidence', e.target.value)} />
          {errors.countryOfResidence && <p className="text-xs text-destructive">{errors.countryOfResidence}</p>}
        </div>
        <div>
          <Label>Religion</Label>
          <Input value={data.religion} onChange={e => onChange('religion', e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={data.pep} onCheckedChange={c => onChange('pep', c)} />
          <Label>Politically Exposed Person (PEP) *</Label>
          {data.pep && <Input placeholder="Role description" value={data.pepRoleDescription} onChange={e => onChange('pepRoleDescription', e.target.value)} className="ml-2" />}
          {errors.pep && <p className="text-xs text-destructive">{errors.pep}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={data.disability} onCheckedChange={c => onChange('disability', c)} />
          <Label>Disability?</Label>
          {data.disability && (
            <Select value={data.disabilityType} onValueChange={v => onChange('disabilityType', v)}>
              <SelectTrigger className="ml-2"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent><SelectItem value="Visual">Visual</SelectItem><SelectItem value="Hearing">Hearing</SelectItem><SelectItem value="Physical">Physical</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Phone and Email with OTP - FIXED JSX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Primary Mobile Number *</Label>
          <Input value={data.primaryMobile} onChange={e => onChange('primaryMobile', e.target.value)} />
          {errors.primaryMobile && <p className="text-xs text-destructive">{errors.primaryMobile}</p>}
        </div>
        <div>
          <div>
            <Label>Primary Email Address *</Label>
            <div className="flex gap-2">
              <Input value={data.primaryEmail} onChange={e => onChange('primaryEmail', e.target.value)} disabled={data.primaryEmailVerified} className="flex-1" />
              {!data.primaryEmailVerified ? (
                <Button variant="outline" onClick={sendEmailOtp} disabled={sendingEmailOtp}>
                  {sendingEmailOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                </Button>
              ) : <Badge><Check /> Verified</Badge>}
            </div>
            {!data.primaryEmailVerified && data.primaryEmail && (
              <div className="flex gap-2 mt-2">
                <Input placeholder="OTP" value={data.primaryEmailOtp} onChange={e => onChange('primaryEmailOtp', e.target.value)} />
                <Button variant="secondary" onClick={verifyEmailOtp}>Verify</Button>
              </div>
            )}
            {errors.primaryEmail && <p className="text-xs text-destructive">{errors.primaryEmail}</p>}
            {errors.primaryEmailOtp && <p className="text-xs text-destructive">{errors.primaryEmailOtp}</p>}
          </div>
        </div>
      </div>

      {/* National ID and KRA PIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>National ID Number *</Label>
          <div className="relative">
            <Input value={data.nationalIdNumber} onChange={e => onChange('nationalIdNumber', e.target.value)} onBlur={validateNationalId} />
            {checkingNationalId && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            {nationalIdValid === true && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}
            {nationalIdValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
          </div>
          {errors.nationalIdNumber && <p className="text-xs text-destructive">{errors.nationalIdNumber}</p>}
        </div>
        <div>
          <Label>KRA PIN *</Label>
          <div className="relative">
            <Input value={data.kraPinNumber} onChange={e => onChange('kraPinNumber', e.target.value.toUpperCase())} onBlur={validateKraPin} className="uppercase" />
            {checkingKraPin && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            {kraPinValid === true && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}
            {kraPinValid === false && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
          </div>
          {errors.kraPinNumber && <p className="text-xs text-destructive">{errors.kraPinNumber}</p>}
        </div>
      </div>
    </div>
  );
};

// ========== REMAINING STEP COMPONENTS (unchanged from original) ==========
const IdentityDocsStep = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>ID Type *</Label><Select value={data.idType} onValueChange={v => onChange('idType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="National ID">National ID</SelectItem><SelectItem value="Kenyan Passport">Kenyan Passport</SelectItem><SelectItem value="Alien ID">Alien ID</SelectItem><SelectItem value="Refugee ID">Refugee ID</SelectItem><SelectItem value="Service ID">Service ID (Military/Police)</SelectItem></SelectContent></Select></div>
        {data.idType === 'National ID' && <div><Label>National ID Number *</Label><div className="relative"><Input value={data.nationalIdNumber} onChange={e => onChange('nationalIdNumber', e.target.value)} onBlur={async () => { if (data.nationalIdNumber) { const valid = await checkUniqueNationalId(data.nationalIdNumber); if (!valid) errors.nationalIdNumber = 'ID exists'; else delete errors.nationalIdNumber; } }} />{errors.nationalIdNumber && <p className="text-xs text-destructive">{errors.nationalIdNumber}</p>}</div></div>}
        {data.idType === 'Kenyan Passport' && <><div><Label>Passport Number *</Label><Input value={data.passportNumber} onChange={e => onChange('passportNumber', e.target.value)} /></div><div><Label>Passport Issue Date</Label><Input type="date" value={data.passportIssueDate} onChange={e => onChange('passportIssueDate', e.target.value)} /></div><div><Label>Passport Expiry Date *</Label><Input type="date" value={data.passportExpiryDate} onChange={e => onChange('passportExpiryDate', e.target.value)} /></div><div><Label>Passport Issuing Country</Label><Input value={data.passportIssuingCountry} onChange={e => onChange('passportIssuingCountry', e.target.value)} /></div></>}
        {data.idType === 'Alien ID' && <><div><Label>Alien ID Number</Label><Input value={data.alienIdNumber} onChange={e => onChange('alienIdNumber', e.target.value)} /></div><div><Label>Alien ID Expiry Date</Label><Input type="date" value={data.alienIdExpiryDate} onChange={e => onChange('alienIdExpiryDate', e.target.value)} /></div></>}
        {data.idType === 'Refugee ID' && <div><Label>Refugee ID Number</Label><Input value={data.refugeeIdNumber} onChange={e => onChange('refugeeIdNumber', e.target.value)} /></div>}
        {data.idType === 'Service ID' && <div><Label>Service Number</Label><Input value={data.serviceNumber} onChange={e => onChange('serviceNumber', e.target.value)} /></div>}
        <div><Label>ID Issue Date *</Label><Input type="date" value={data.idIssueDate} onChange={e => onChange('idIssueDate', e.target.value)} /></div>
        <div><Label>ID Place of Issue *</Label><Input value={data.idPlaceOfIssue} onChange={e => onChange('idPlaceOfIssue', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUpload label="Copy of ID – Front" field="idFrontImage" data={data} onChange={onChange} required accept="image/*" />
        <FileUpload label="Copy of ID – Back" field="idBackImage" data={data} onChange={onChange} required={data.idType !== 'Kenyan Passport'} accept="image/*" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>KRA PIN *</Label><div className="relative"><Input value={data.kraPinNumber} onChange={e => onChange('kraPinNumber', e.target.value.toUpperCase())} onBlur={async () => { if (data.kraPinNumber) { const valid = await checkUniqueKraPin(data.kraPinNumber); if (!valid) errors.kraPinNumber = 'KRA PIN exists'; else delete errors.kraPinNumber; } }} className="uppercase" />{errors.kraPinNumber && <p className="text-xs text-destructive">{errors.kraPinNumber}</p>}</div></div>
        <FileUpload label="KRA PIN Certificate" field="kraPinCertCopy" data={data} onChange={onChange} required accept=".pdf,.jpg" />
        <div><Label>NHIF Number</Label><Input value={data.nhifNumber} onChange={e => onChange('nhifNumber', e.target.value)} /></div>
        <div><Label>NSSF Number</Label><Input value={data.nssfNumber} onChange={e => onChange('nssfNumber', e.target.value)} /></div>
        <div><Label>Work Permit Number</Label><Input value={data.workPermitNumber} onChange={e => onChange('workPermitNumber', e.target.value)} /></div>
        <div><Label>Work Permit Class</Label><Select value={data.workPermitClass} onValueChange={v => onChange('workPermitClass', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Class G">Class G</SelectItem><SelectItem value="Class I">Class I</SelectItem><SelectItem value="Class M">Class M</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
        <div><Label>Work Permit Expiry Date</Label><Input type="date" value={data.workPermitExpiryDate} onChange={e => onChange('workPermitExpiryDate', e.target.value)} /></div>
        <div><Label>Birth Certificate Number</Label><Input value={data.birthCertificateNumber} onChange={e => onChange('birthCertificateNumber', e.target.value)} /></div>
        <FileUpload label="Student Enrollment Proof" field="studentProof" data={data} onChange={onChange} required={false} accept=".pdf,.jpg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2"><Checkbox checked={data.biometricCaptured} onCheckedChange={c => onChange('biometricCaptured', c)} /><Label>Biometric Data Captured *</Label></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.livePhotoCaptured} onCheckedChange={c => onChange('livePhotoCaptured', c)} /><Label>Live Photo Taken *</Label></div>
        <FileUpload label="Signature Specimen" field="signatureImage" data={data} onChange={onChange} required accept="image/*" />
      </div>
    </div>
  );
};

const ContactAddressStep = ({ data, onChange, errors, setErrors }) => {
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const sendMobileOtp = async () => {
    if (!data.primaryMobile || data.primaryMobile.length < 10) { setErrors({ ...errors, primaryMobile: 'Valid phone required' }); return; }
    setSendingMobileOtp(true); await new Promise(r => setTimeout(r, 1000)); alert(`OTP to ${data.primaryMobile}: 123456`); setSendingMobileOtp(false);
  };
  const verifyMobileOtp = () => { if (data.primaryMobileOtp === '123456') { onChange('primaryMobileVerified', true); setErrors({ ...errors, primaryMobileOtp: '' }); } else setErrors({ ...errors, primaryMobileOtp: 'Invalid OTP' }); };
  const sendEmailOtpLocal = async () => {
    if (!data.primaryEmail || !data.primaryEmail.includes('@')) { setErrors({ ...errors, primaryEmail: 'Valid email required' }); return; }
    setSendingEmailOtp(true); await new Promise(r => setTimeout(r, 1000)); alert(`OTP to ${data.primaryEmail}: 123456`); setSendingEmailOtp(false);
  };
  const verifyEmailOtpLocal = () => { if (data.primaryEmailOtp === '123456') { onChange('primaryEmailVerified', true); setErrors({ ...errors, primaryEmailOtp: '' }); } else setErrors({ ...errors, primaryEmailOtp: 'Invalid OTP' }); };
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Physical / Residential Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Plot / House Number *</Label><Input value={data.plotHouseNumber} onChange={e => onChange('plotHouseNumber', e.target.value)} /></div>
        <div><Label>Street / Road Name *</Label><Input value={data.streetRoad} onChange={e => onChange('streetRoad', e.target.value)} /></div>
        <div><Label>Nearest Landmark *</Label><Input value={data.nearestLandmark} onChange={e => onChange('nearestLandmark', e.target.value)} /></div>
        <div><Label>Estate / Village Name</Label><Input value={data.estateVillage} onChange={e => onChange('estateVillage', e.target.value)} /></div>
        <div><Label>Sub-location *</Label><Input value={data.subLocation} onChange={e => onChange('subLocation', e.target.value)} /></div>
        <div><Label>Location *</Label><Input value={data.location} onChange={e => onChange('location', e.target.value)} /></div>
        <div><Label>Division</Label><Input value={data.division} onChange={e => onChange('division', e.target.value)} /></div>
        <div><Label>Sub-County *</Label><Input value={data.subCounty} onChange={e => onChange('subCounty', e.target.value)} /></div>
        <div><Label>County *</Label><Select value={data.county} onValueChange={v => onChange('county', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Nairobi','Mombasa','Kiambu','Nakuru','Kisumu','Machakos','Uasin Gishu','Kajiado','Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Chief's Area / Location</Label><Input value={data.chiefsArea} onChange={e => onChange('chiefsArea', e.target.value)} /></div>
        <div><Label>Country *</Label><Input value={data.countryAddress} onChange={e => onChange('countryAddress', e.target.value)} /></div>
        <div><Label>GPS Coordinates (Lat/Long)</Label><Input placeholder="Latitude" value={data.gpsLatitude} onChange={e => onChange('gpsLatitude', e.target.value)} /><Input placeholder="Longitude" className="mt-1" value={data.gpsLongitude} onChange={e => onChange('gpsLongitude', e.target.value)} /></div>
        <div><Label>Duration at Current Address *</Label><div className="flex gap-2"><Input type="number" placeholder="Years" value={data.durationAtAddressYears} onChange={e => onChange('durationAtAddressYears', e.target.value)} /><Input type="number" placeholder="Months" value={data.durationAtAddressMonths} onChange={e => onChange('durationAtAddressMonths', e.target.value)} /></div></div>
        <FileUpload label="Proof of Residence (less than 3 months)" field="proofOfResidence" data={data} onChange={onChange} required accept=".pdf,.jpg,.png" />
      </div>
      <h3 className="font-semibold">Postal Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>P.O. Box Number</Label><Input value={data.poBox} onChange={e => onChange('poBox', e.target.value)} /></div>
        <div><Label>Postal Code</Label><Input value={data.postalCode} onChange={e => onChange('postalCode', e.target.value)} /></div>
        <div><Label>Town / City</Label><Input value={data.townCity} onChange={e => onChange('townCity', e.target.value)} /></div>
      </div>
      <h3 className="font-semibold">Contact Numbers</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Primary Mobile Number *</Label><div className="flex gap-2"><Input value={data.primaryMobile} onChange={e => onChange('primaryMobile', e.target.value)} disabled={data.primaryMobileVerified} className="flex-1" />{!data.primaryMobileVerified ? <Button variant="outline" onClick={sendMobileOtp} disabled={sendingMobileOtp}>{sendingMobileOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}</Button> : <Badge><Check className="h-3 w-3" /> Verified</Badge>}</div>{!data.primaryMobileVerified && <div className="flex gap-2 mt-2"><Input placeholder="OTP" value={data.primaryMobileOtp} onChange={e => onChange('primaryMobileOtp', e.target.value)} /><Button variant="secondary" onClick={verifyMobileOtp}>Verify</Button></div>}{errors.primaryMobileOtp && <p className="text-xs text-destructive">{errors.primaryMobileOtp}</p>}</div>
        <div><Label>Secondary Mobile Number</Label><Input value={data.secondaryMobile} onChange={e => onChange('secondaryMobile', e.target.value)} /></div>
        <div><Label>Home Telephone</Label><Input value={data.homeTelephone} onChange={e => onChange('homeTelephone', e.target.value)} /></div>
        <div><Label>Work Telephone + Extension</Label><Input value={data.workTelephone} onChange={e => onChange('workTelephone', e.target.value)} /><Input placeholder="Ext" className="mt-1" value={data.workExtension} onChange={e => onChange('workExtension', e.target.value)} /></div>
        <div><Label>WhatsApp Number</Label><Input value={data.whatsappNumber} onChange={e => onChange('whatsappNumber', e.target.value)} /></div>
        <div><Label>Mobile Network Provider *</Label><Select value={data.mobileNetworkProvider} onValueChange={v => onChange('mobileNetworkProvider', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Safaricom">Safaricom</SelectItem><SelectItem value="Airtel">Airtel</SelectItem><SelectItem value="Telkom">Telkom</SelectItem><SelectItem value="Faiba">Faiba</SelectItem></SelectContent></Select></div>
      </div>
      <h3 className="font-semibold">Email & Digital Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Primary Email Address *</Label><div className="flex gap-2"><Input value={data.primaryEmail} onChange={e => onChange('primaryEmail', e.target.value)} disabled={data.primaryEmailVerified} className="flex-1" />{!data.primaryEmailVerified ? <Button variant="outline" onClick={sendEmailOtpLocal} disabled={sendingEmailOtp}>{sendingEmailOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}</Button> : <Badge><Check /> Verified</Badge>}</div>{!data.primaryEmailVerified && <div className="flex gap-2 mt-2"><Input placeholder="OTP" value={data.primaryEmailOtp} onChange={e => onChange('primaryEmailOtp', e.target.value)} /><Button variant="secondary" onClick={verifyEmailOtpLocal}>Verify</Button></div>}{errors.primaryEmailOtp && <p className="text-xs text-destructive">{errors.primaryEmailOtp}</p>}</div>
        <div><Label>Secondary Email Address</Label><Input value={data.secondaryEmail} onChange={e => onChange('secondaryEmail', e.target.value)} /></div>
        <div><Label>Preferred Communication Channel *</Label><Select value={data.preferredCommunicationChannel} onValueChange={v => onChange('preferredCommunicationChannel', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SMS">SMS</SelectItem><SelectItem value="Email">Email</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Push Notification">Push Notification</SelectItem><SelectItem value="All">All</SelectItem></SelectContent></Select></div>
        <div><Label>Preferred Language *</Label><Select value={data.preferredLanguage} onValueChange={v => onChange('preferredLanguage', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Kiswahili">Kiswahili</SelectItem></SelectContent></Select></div>
      </div>
    </div>
  );
};

const EmploymentFinancialStep = ({ data, onChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label>Employment Status *</Label><Select value={data.employmentStatus} onValueChange={v => onChange('employmentStatus', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Employed (Formal)">Employed (Formal)</SelectItem><SelectItem value="Self-Employed">Self-Employed</SelectItem><SelectItem value="Business Owner">Business Owner</SelectItem><SelectItem value="Unemployed">Unemployed</SelectItem><SelectItem value="Student">Student</SelectItem><SelectItem value="Retired">Retired</SelectItem><SelectItem value="Casual Worker">Casual Worker</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
      <div><Label>Occupation / Job Title *</Label><Input value={data.occupation} onChange={e => onChange('occupation', e.target.value)} /></div>
      <div><Label>Profession / Industry *</Label><Select value={data.industry} onValueChange={v => onChange('industry', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Agriculture">Agriculture</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Education">Education</SelectItem><SelectItem value="Healthcare">Healthcare</SelectItem><SelectItem value="Government">Government</SelectItem><SelectItem value="NGO">NGO</SelectItem><SelectItem value="ICT">ICT</SelectItem><SelectItem value="Real Estate">Real Estate</SelectItem><SelectItem value="Transport">Transport</SelectItem><SelectItem value="Retail">Retail</SelectItem><SelectItem value="Legal">Legal</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
      {(data.employmentStatus === 'Employed (Formal)' || data.employmentStatus === 'Business Owner') && <><div><Label>Employer Name / Business Name</Label><Input value={data.employerName} onChange={e => onChange('employerName', e.target.value)} /></div><div><Label>Employer / Business Address</Label><Input value={data.employerAddress} onChange={e => onChange('employerAddress', e.target.value)} /></div><div><Label>Employer Telephone</Label><Input value={data.employerTelephone} onChange={e => onChange('employerTelephone', e.target.value)} /></div><div><Label>Years with Current Employer</Label><Input type="number" value={data.yearsWithEmployer} onChange={e => onChange('yearsWithEmployer', e.target.value)} /></div></>}
      {data.employmentStatus === 'Business Owner' && <><div><Label>Nature of Business</Label><Input value={data.natureOfBusiness} onChange={e => onChange('natureOfBusiness', e.target.value)} /></div><div><Label>Business Registration Number</Label><Input value={data.businessRegNumber} onChange={e => onChange('businessRegNumber', e.target.value)} /></div><div><Label>KRA Business PIN</Label><Input value={data.kraBusinessPin} onChange={e => onChange('kraBusinessPin', e.target.value)} /></div><div><Label>Years in Business Operation</Label><Input type="number" value={data.yearsInBusiness} onChange={e => onChange('yearsInBusiness', e.target.value)} /></div></>}
    </div>
    <h3 className="font-semibold">Financial Profile</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label>Monthly Net Income (KES) *</Label><Select value={data.monthlyNetIncome} onValueChange={v => onChange('monthlyNetIncome', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Below 10K">Below 10K</SelectItem><SelectItem value="10K-30K">10K-30K</SelectItem><SelectItem value="30K-100K">30K-100K</SelectItem><SelectItem value="100K-500K">100K-500K</SelectItem><SelectItem value="500K-1M">500K-1M</SelectItem><SelectItem value="Above 1M">Above 1M</SelectItem></SelectContent></Select></div>
      <div><Label>Other Income Sources</Label><Select onValueChange={v => onChange('otherIncomeSources', [...data.otherIncomeSources, v])}><SelectTrigger><SelectValue placeholder="Add source" /></SelectTrigger><SelectContent><SelectItem value="Rental">Rental</SelectItem><SelectItem value="Remittances">Remittances</SelectItem><SelectItem value="Dividends">Dividends</SelectItem><SelectItem value="Pension">Pension</SelectItem><SelectItem value="Freelance">Freelance</SelectItem><SelectItem value="Farm Income">Farm Income</SelectItem></SelectContent></Select><div className="flex flex-wrap gap-1 mt-1">{data.otherIncomeSources.map(s => <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => onChange('otherIncomeSources', data.otherIncomeSources.filter(x => x !== s))}>{s} ✕</Badge>)}</div></div>
      <div><Label>Expected Monthly Credit Turnover (KES) *</Label><Input type="number" value={data.expectedMonthlyCreditTurnover} onChange={e => onChange('expectedMonthlyCreditTurnover', e.target.value)} /></div>
      <div><Label>Expected Max Single Deposit (KES) *</Label><Input type="number" value={data.expectedMaxSingleDeposit} onChange={e => onChange('expectedMaxSingleDeposit', e.target.value)} /></div>
      <div><Label>Expected Max Single Withdrawal (KES) *</Label><Input type="number" value={data.expectedMaxSingleWithdrawal} onChange={e => onChange('expectedMaxSingleWithdrawal', e.target.value)} /></div>
      <div><Label>Primary Source of Funds *</Label><Select value={data.primarySourceOfFunds} onValueChange={v => onChange('primarySourceOfFunds', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Salary">Salary</SelectItem><SelectItem value="Business Income">Business Income</SelectItem><SelectItem value="Inheritance">Inheritance</SelectItem><SelectItem value="Sale of Assets">Sale of Assets</SelectItem><SelectItem value="Investment Returns">Investment Returns</SelectItem><SelectItem value="Gifts">Gifts</SelectItem><SelectItem value="Remittances">Remittances</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
      <div><Label>Source of Wealth (if high-value)</Label><Input value={data.sourceOfWealth} onChange={e => onChange('sourceOfWealth', e.target.value)} /><FileUpload label="Supporting Document" field="sourceOfWealthDocument" data={data} onChange={onChange} required={false} /></div>
      <div><Label>Annual Income (KES)</Label><Input type="number" value={data.annualIncome} onChange={e => onChange('annualIncome', e.target.value)} /></div>
      <div><Label>Net Worth Estimate (KES)</Label><Select value={data.netWorthEstimate} onValueChange={v => onChange('netWorthEstimate', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Below 100K">Below 100K</SelectItem><SelectItem value="100K-500K">100K-500K</SelectItem><SelectItem value="500K-1M">500K-1M</SelectItem><SelectItem value="1M-5M">1M-5M</SelectItem><SelectItem value="Above 5M">Above 5M</SelectItem></SelectContent></Select></div>
      <div className="flex items-center space-x-2"><Checkbox checked={data.existingLoans} onCheckedChange={c => onChange('existingLoans', c)} /><Label>Existing Loans / Liabilities?</Label>{data.existingLoans && <Input placeholder="Amount (KES)" value={data.existingLoansAmount} onChange={e => onChange('existingLoansAmount', e.target.value)} />}</div>
    </div>
  </div>
);

const AccountDetailsStep = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Account Ownership Type *</Label><Select value={data.accountOwnershipType} onValueChange={v => onChange('accountOwnershipType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Individual">Individual</SelectItem><SelectItem value="Joint (Either to Sign)">Joint (Either to Sign)</SelectItem><SelectItem value="Joint (Both to Sign)">Joint (Both to Sign)</SelectItem><SelectItem value="Minor">Minor</SelectItem><SelectItem value="Corporate">Corporate</SelectItem><SelectItem value="Partnership">Partnership</SelectItem><SelectItem value="NGO">NGO</SelectItem><SelectItem value="Club">Club</SelectItem><SelectItem value="Chama">Chama</SelectItem><SelectItem value="Trust">Trust</SelectItem></SelectContent></Select></div>
        <div><Label>Account Product Type *</Label><Select value={data.accountProductType} onValueChange={v => onChange('accountProductType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Current">Current</SelectItem><SelectItem value="Savings">Savings</SelectItem><SelectItem value="Fixed Deposit">Fixed Deposit</SelectItem><SelectItem value="Call Deposit">Call Deposit</SelectItem><SelectItem value="Junior">Junior</SelectItem><SelectItem value="Youth">Youth</SelectItem><SelectItem value="Senior Citizen">Senior Citizen</SelectItem><SelectItem value="Diaspora">Diaspora</SelectItem><SelectItem value="Business">Business</SelectItem><SelectItem value="Salary Account">Salary Account</SelectItem></SelectContent></Select></div>
        <div><Label>Account Purpose *</Label><Select value={data.accountPurpose} onValueChange={v => onChange('accountPurpose', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Personal">Personal</SelectItem><SelectItem value="Business">Business</SelectItem><SelectItem value="Savings">Savings</SelectItem><SelectItem value="Salary">Salary</SelectItem><SelectItem value="Investment">Investment</SelectItem><SelectItem value="School Fees">School Fees</SelectItem><SelectItem value="Farming">Farming</SelectItem><SelectItem value="NGO">NGO</SelectItem><SelectItem value="Rental Collection">Rental Collection</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
        <div><Label>Account Currency *</Label><Select value={data.accountCurrency} onValueChange={v => onChange('accountCurrency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="KES">KES</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="UGX">UGX</SelectItem><SelectItem value="TZS">TZS</SelectItem><SelectItem value="ZAR">ZAR</SelectItem></SelectContent></Select></div>
        <div><Label>Branch Preference *</Label><Input value={data.branchPreference} onChange={e => onChange('branchPreference', e.target.value)} /></div>
        <div><Label>Account Operating Mode *</Label><Select value={data.accountOperatingMode} onValueChange={v => onChange('accountOperatingMode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Self">Self</SelectItem><SelectItem value="Third Party Mandate">Third Party Mandate</SelectItem><SelectItem value="Power of Attorney">Power of Attorney</SelectItem></SelectContent></Select></div>
        {(data.accountOperatingMode === 'Third Party Mandate' || data.accountOperatingMode === 'Power of Attorney') && <><div><Label>Mandate Holder Full Name</Label><Input value={data.mandateHolderFullName} onChange={e => onChange('mandateHolderFullName', e.target.value)} /></div><div><Label>Mandate Holder ID Number</Label><Input value={data.mandateHolderIdNumber} onChange={e => onChange('mandateHolderIdNumber', e.target.value)} /></div><div><Label>Relationship to Mandate Holder</Label><Input value={data.relationshipToMandateHolder} onChange={e => onChange('relationshipToMandateHolder', e.target.value)} /></div></>}
      </div>
      <h3 className="font-semibold">Account Features & Limits</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2"><Checkbox checked={data.chequeBookRequired} onCheckedChange={c => onChange('chequeBookRequired', c)} /><Label>Cheque Book Required *</Label></div>
        {data.chequeBookRequired && <div><Label>Cheque Book Pickup Method</Label><Select value={data.chequeBookPickupMethod} onValueChange={v => onChange('chequeBookPickupMethod', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Branch Pickup">Branch Pickup</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select></div>}
        <div className="flex items-center space-x-2"><Checkbox checked={data.debitCardRequired} onCheckedChange={c => onChange('debitCardRequired', c)} /><Label>Debit Card Required *</Label></div>
        {data.debitCardRequired && <><div><Label>Card Type</Label><Select value={data.cardType} onValueChange={v => onChange('cardType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Visa Classic">Visa Classic</SelectItem><SelectItem value="Visa Gold">Visa Gold</SelectItem><SelectItem value="Visa Platinum">Visa Platinum</SelectItem><SelectItem value="Mastercard">Mastercard</SelectItem><SelectItem value="American Express">American Express</SelectItem></SelectContent></Select></div><div><Label>Card Collection Mode</Label><Select value={data.cardCollectionMode} onValueChange={v => onChange('cardCollectionMode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Branch Pickup">Branch Pickup</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select></div></>}
        <div><Label>ATM Daily Withdrawal Limit (KES)</Label><Input type="number" value={data.atmDailyLimit} onChange={e => onChange('atmDailyLimit', e.target.value)} /></div>
        <div><Label>POS Daily Limit (KES)</Label><Input type="number" value={data.posDailyLimit} onChange={e => onChange('posDailyLimit', e.target.value)} /></div>
        <div><Label>Online Transfer Daily Limit (KES)</Label><Input type="number" value={data.onlineTransferDailyLimit} onChange={e => onChange('onlineTransferDailyLimit', e.target.value)} /></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.standingOrderRequired} onCheckedChange={c => onChange('standingOrderRequired', c)} /><Label>Standing Order Required</Label>{data.standingOrderRequired && <Input placeholder="Details" value={data.standingOrderDetails} onChange={e => onChange('standingOrderDetails', e.target.value)} />}</div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.directDebitAuthority} onCheckedChange={c => onChange('directDebitAuthority', c)} /><Label>Direct Debit Authority</Label></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.eStatementPreferred} onCheckedChange={c => onChange('eStatementPreferred', c)} /><Label>E-Statement Preferred *</Label></div>
        <div><Label>Statement Frequency *</Label><Select value={data.statementFrequency} onValueChange={v => onChange('statementFrequency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Half-Yearly">Half-Yearly</SelectItem><SelectItem value="Annually">Annually</SelectItem><SelectItem value="On Request">On Request</SelectItem></SelectContent></Select></div>
        <div><Label>Statement Delivery Mode *</Label><Select value={data.statementDeliveryMode} onValueChange={v => onChange('statementDeliveryMode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="Branch">Branch</SelectItem><SelectItem value="Postal">Postal</SelectItem><SelectItem value="Online Portal">Online Portal</SelectItem></SelectContent></Select></div>
        <div><Label>Opening Deposit Amount (KES) *</Label><Input type="number" value={data.openingDepositAmount} onChange={e => onChange('openingDepositAmount', e.target.value)} /></div>
        <div><Label>Opening Deposit Method *</Label><Select value={data.openingDepositMethod} onValueChange={v => onChange('openingDepositMethod', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="EFT">EFT</SelectItem><SelectItem value="RTGS">RTGS</SelectItem><SelectItem value="Internal Transfer">Internal Transfer</SelectItem></SelectContent></Select></div>
        <div><Label>Referral / Promo Code</Label><Input value={data.referralCode} onChange={e => onChange('referralCode', e.target.value)} /></div>
        <div><Label>Referring Customer Account No.</Label><Input value={data.referringCustomerAccount} onChange={e => onChange('referringCustomerAccount', e.target.value)} /></div>
      </div>
      {data.accountProductType === 'Fixed Deposit' && (
        <>
          <h3 className="font-semibold">Fixed Deposit Specific Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Deposit Amount (KES)</Label><Input type="number" value={data.fdDepositAmount} onChange={e => onChange('fdDepositAmount', e.target.value)} /></div>
            <div><Label>Tenor / Duration</Label><Select value={data.fdTenor} onValueChange={v => onChange('fdTenor', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 month</SelectItem><SelectItem value="3">3 months</SelectItem><SelectItem value="6">6 months</SelectItem><SelectItem value="12">12 months</SelectItem><SelectItem value="24">24 months</SelectItem><SelectItem value="36">36 months</SelectItem><SelectItem value="Custom">Custom</SelectItem></SelectContent></Select></div>
            <div><Label>Interest Rate (% p.a.)</Label><Input type="number" step="0.01" value={data.fdInterestRate} onChange={e => onChange('fdInterestRate', e.target.value)} /></div>
            <div><Label>Interest Payment Frequency</Label><Select value={data.fdInterestPaymentFrequency} onValueChange={v => onChange('fdInterestPaymentFrequency', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="At Maturity">At Maturity</SelectItem></SelectContent></Select></div>
            <div><Label>Interest Credited To</Label><Select value={data.fdInterestCreditedTo} onValueChange={v => onChange('fdInterestCreditedTo', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Same Account">Same Account</SelectItem><SelectItem value="Linked Savings">Linked Savings</SelectItem><SelectItem value="Linked Cheque">Linked Cheque</SelectItem></SelectContent></Select></div>
            <div><Label>Rollover Instruction at Maturity</Label><Select value={data.fdRolloverInstruction} onValueChange={v => onChange('fdRolloverInstruction', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Auto-Renew P+I">Auto-Renew P+I</SelectItem><SelectItem value="Renew Principal Only">Renew Principal Only</SelectItem><SelectItem value="Encash at Maturity">Encash at Maturity</SelectItem></SelectContent></Select></div>
          </div>
        </>
      )}
    </div>
  );
};

const NextOfKinStep = ({ data, onChange, errors, setErrors }) => {
  const [newNok, setNewNok] = useState({ name: '', dob: '', gender: '', relationship: '', idNumber: '', mobile: '', email: '', address: '', percentage: '' });
  const addNok = () => {
    if (!newNok.name || !newNok.relationship) { setErrors({ ...errors, nokMissing: 'Name and relationship required' }); return; }
    onChange('nextOfKinList', [...data.nextOfKinList, { ...newNok, id: Date.now().toString() }]);
    setNewNok({ name: '', dob: '', gender: '', relationship: '', idNumber: '', mobile: '', email: '', address: '', percentage: '' });
    setErrors({ ...errors, nokMissing: '' });
  };
  const removeNok = (id) => onChange('nextOfKinList', data.nextOfKinList.filter(n => n.id !== id));
  const [newSecNok, setNewSecNok] = useState({ name: '', dob: '', relationship: '', idNumber: '', mobile: '', address: '', percentage: '' });
  const addSecNok = () => {
    if (!newSecNok.name || !newSecNok.relationship) { setErrors({ ...errors, secNokMissing: 'Name and relationship required' }); return; }
    onChange('secondaryNextOfKinList', [...data.secondaryNextOfKinList, { ...newSecNok, id: Date.now().toString() }]);
    setNewSecNok({ name: '', dob: '', relationship: '', idNumber: '', mobile: '', address: '', percentage: '' });
    setErrors({ ...errors, secNokMissing: '' });
  };
  const removeSecNok = (id) => onChange('secondaryNextOfKinList', data.secondaryNextOfKinList.filter(n => n.id !== id));
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Primary Next of Kin (at least one)</h3>
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Full Name *" value={newNok.name} onChange={e => setNewNok({ ...newNok, name: e.target.value })} />
          <Input type="date" placeholder="Date of Birth" value={newNok.dob} onChange={e => setNewNok({ ...newNok, dob: e.target.value })} />
          <Select value={newNok.gender} onValueChange={v => setNewNok({ ...newNok, gender: v })}><SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select>
          <Input placeholder="Relationship *" value={newNok.relationship} onChange={e => setNewNok({ ...newNok, relationship: e.target.value })} />
          <Input placeholder="National ID / Passport Number" value={newNok.idNumber} onChange={e => setNewNok({ ...newNok, idNumber: e.target.value })} />
          <Input placeholder="Mobile Number" value={newNok.mobile} onChange={e => setNewNok({ ...newNok, mobile: e.target.value })} />
          <Input placeholder="Email" value={newNok.email} onChange={e => setNewNok({ ...newNok, email: e.target.value })} />
          <Input placeholder="Physical Address + County" value={newNok.address} onChange={e => setNewNok({ ...newNok, address: e.target.value })} />
          <Input type="number" placeholder="Percentage Share (%)" value={newNok.percentage} onChange={e => setNewNok({ ...newNok, percentage: e.target.value })} />
        </div>
        {errors.nokMissing && <p className="text-xs text-destructive">{errors.nokMissing}</p>}
        <Button variant="outline" onClick={addNok} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add Primary Next of Kin</Button>
      </div>
      {data.nextOfKinList.map(n => <div key={n.id} className="flex justify-between items-center border p-3 rounded"><div><p className="font-medium">{n.name} ({n.relationship})</p><p className="text-xs">{n.mobile} • {n.email} • Share: {n.percentage}%</p></div><Button variant="ghost" size="sm" onClick={() => removeNok(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}
      {data.nextOfKinList.length === 0 && <div className="text-center text-destructive text-sm border border-destructive/30 p-2 rounded"><AlertCircle className="inline h-4 w-4 mr-1" /> At least one primary next of kin required</div>}

      <h3 className="font-semibold">Secondary Next of Kin (Optional)</h3>
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Full Name" value={newSecNok.name} onChange={e => setNewSecNok({ ...newSecNok, name: e.target.value })} />
          <Input type="date" placeholder="Date of Birth" value={newSecNok.dob} onChange={e => setNewSecNok({ ...newSecNok, dob: e.target.value })} />
          <Input placeholder="Relationship" value={newSecNok.relationship} onChange={e => setNewSecNok({ ...newSecNok, relationship: e.target.value })} />
          <Input placeholder="National ID / Passport" value={newSecNok.idNumber} onChange={e => setNewSecNok({ ...newSecNok, idNumber: e.target.value })} />
          <Input placeholder="Mobile Number" value={newSecNok.mobile} onChange={e => setNewSecNok({ ...newSecNok, mobile: e.target.value })} />
          <Input placeholder="Physical Address + County" value={newSecNok.address} onChange={e => setNewSecNok({ ...newSecNok, address: e.target.value })} />
          <Input type="number" placeholder="Percentage Share (%)" value={newSecNok.percentage} onChange={e => setNewSecNok({ ...newSecNok, percentage: e.target.value })} />
        </div>
        <Button variant="outline" onClick={addSecNok} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add Secondary Next of Kin</Button>
      </div>
      {data.secondaryNextOfKinList.map(n => <div key={n.id} className="flex justify-between items-center border p-3 rounded"><div><p className="font-medium">{n.name} ({n.relationship})</p><p className="text-xs">{n.mobile} • Share: {n.percentage}%</p></div><Button variant="ghost" size="sm" onClick={() => removeSecNok(n.id)}><Trash2 className="h-4 w-4" /></Button></div>)}

      {data.accountOwnershipType === 'Minor' && (
        <>
          <h3 className="font-semibold">Minor Account – Guardian Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded">
            <Input placeholder="Guardian Full Name" value={data.minorGuardian.name} onChange={e => onChange('minorGuardian', { ...data.minorGuardian, name: e.target.value })} />
            <Input placeholder="Guardian National ID / Passport" value={data.minorGuardian.nationalId} onChange={e => onChange('minorGuardian', { ...data.minorGuardian, nationalId: e.target.value })} />
            <Input placeholder="Guardian KRA PIN" value={data.minorGuardian.kraPin} onChange={e => onChange('minorGuardian', { ...data.minorGuardian, kraPin: e.target.value })} />
            <Input placeholder="Relationship to Minor" value={data.minorGuardian.relationship} onChange={e => onChange('minorGuardian', { ...data.minorGuardian, relationship: e.target.value })} />
            <Input placeholder="Guardian Mobile Number" value={data.minorGuardian.mobile} onChange={e => onChange('minorGuardian', { ...data.minorGuardian, mobile: e.target.value })} />
            <FileUpload label="Court Order / Guardianship Document" field="courtOrderDoc" data={data.minorGuardian} onChange={(f, v) => onChange('minorGuardian', { ...data.minorGuardian, courtOrderDoc: v })} required={false} />
          </div>
        </>
      )}
    </div>
  );
};

const TaxComplianceStep = ({ data, onChange }) => {
  const addCrsCountry = (c) => { if (c && !data.crsAdditionalCountries.includes(c)) onChange('crsAdditionalCountries', [...data.crsAdditionalCountries, c]); };
  const removeCrsCountry = (c) => onChange('crsAdditionalCountries', data.crsAdditionalCountries.filter(x => x !== c));
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">KRA Tax Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>KRA Personal Identification Number (PIN) *</Label><Input value={data.kraPinNumber} onChange={e => onChange('kraPinNumber', e.target.value)} className="uppercase" /></div>
        <FileUpload label="KRA PIN Certificate Copy" field="kraPinCertCopy" data={data} onChange={onChange} required />
        <div className="flex items-center space-x-2"><Checkbox checked={data.taxResidentInKenya} onCheckedChange={c => onChange('taxResidentInKenya', c)} /><Label>Tax Resident in Kenya *</Label></div>
        {!data.taxResidentInKenya && <div><Label>Tax Residency Country</Label><Input value={data.taxResidencyCountry} onChange={e => onChange('taxResidencyCountry', e.target.value)} /></div>}
        <div><Label>Foreign Tax Identification Number (FTIN)</Label><Input value={data.foreignTaxId} onChange={e => onChange('foreignTaxId', e.target.value)} /></div>
        <div><Label>VAT Registration Number</Label><Input value={data.vatRegistrationNumber} onChange={e => onChange('vatRegistrationNumber', e.target.value)} /></div>
      </div>
      <h3 className="font-semibold">FATCA / CRS Compliance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2"><Checkbox checked={data.usPersonDeclaration} onCheckedChange={c => onChange('usPersonDeclaration', c)} /><Label>US Person Declaration *</Label></div>
        {data.usPersonDeclaration && <><div><Label>US Social Security Number (SSN)</Label><Input value={data.usSsn} onChange={e => onChange('usSsn', e.target.value)} /></div><div><Label>US Address</Label><Input value={data.usAddress} onChange={e => onChange('usAddress', e.target.value)} /></div><div className="flex items-center space-x-2"><Checkbox checked={data.w9w8benSubmitted} onCheckedChange={c => onChange('w9w8benSubmitted', c)} /><Label>W-9 / W-8BEN Form Submitted</Label></div><FileUpload label="Form Document" field="w9w8benDoc" data={data} onChange={onChange} required={false} /></>}
        <div><Label>CRS – Additional Tax Residency Countries</Label><Select onValueChange={addCrsCountry}><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent><SelectItem value="USA">USA</SelectItem><SelectItem value="UK">UK</SelectItem><SelectItem value="Germany">Germany</SelectItem><SelectItem value="China">China</SelectItem></SelectContent></Select><div className="flex flex-wrap gap-1 mt-1">{data.crsAdditionalCountries.map(c => <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => removeCrsCountry(c)}>{c} ✕</Badge>)}</div></div>
        <div><Label>Foreign TIN per Additional Country</Label><Input placeholder="Country: TIN" value={data.foreignTinPerCountry.join(', ')} onChange={e => onChange('foreignTinPerCountry', e.target.value.split(',').map(s => s.trim()))} /></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.crsSelfCertificationSigned} onCheckedChange={c => onChange('crsSelfCertificationSigned', c)} /><Label>CRS Self-Certification Form Signed *</Label></div>
      </div>
      <h3 className="font-semibold">CBK / AML Regulatory Checks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Customer Risk Rating *</Label><Select value={data.customerRiskRating} onValueChange={v => onChange('customerRiskRating', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.enhancedDueDiligenceRequired} onCheckedChange={c => onChange('enhancedDueDiligenceRequired', c)} /><Label>Enhanced Due Diligence (EDD) Required *</Label></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.sanctionsScreeningCleared} onCheckedChange={c => onChange('sanctionsScreeningCleared', c)} /><Label>Sanctions Screening Cleared *</Label></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.adverseMediaCheckCompleted} onCheckedChange={c => onChange('adverseMediaCheckCompleted', c)} /><Label>Adverse Media Check Completed *</Label></div>
        <div><Label>IPRS Verification Status *</Label><Select value={data.iprsVerificationStatus} onValueChange={v => onChange('iprsVerificationStatus', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Verified">Verified</SelectItem><SelectItem value="Unverified">Unverified</SelectItem><SelectItem value="Mismatch">Mismatch</SelectItem></SelectContent></Select></div>
        <div><Label>CRB Credit Bureau Check</Label><Select value={data.crbCheckStatus} onValueChange={v => onChange('crbCheckStatus', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cleared">Cleared</SelectItem><SelectItem value="Negatively Listed">Negatively Listed</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent></Select></div>
        <div><Label>CRB Reference Number</Label><Input value={data.crbReferenceNumber} onChange={e => onChange('crbReferenceNumber', e.target.value)} /></div>
      </div>
    </div>
  );
};

const DeclarationsStep = ({ data, onChange }) => {
  const signatureDate = data.signatureDate || new Date().toISOString().split('T')[0];
  useEffect(() => { if (!data.signatureDate) onChange('signatureDate', signatureDate); }, []);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-start space-x-2"><Checkbox checked={data.infoAccuracyDecl} onCheckedChange={c => onChange('infoAccuracyDecl', c)} /><Label>I confirm all information provided is accurate and true to the best of my knowledge. *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.amlDeclaration} onCheckedChange={c => onChange('amlDeclaration', c)} /><Label>Funds deposited are from legitimate sources. *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.pepSelfDeclaration} onCheckedChange={c => onChange('pepSelfDeclaration', c)} /><Label>PEP Self-Declaration *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.fatcaCrsSelfCertSigned} onCheckedChange={c => onChange('fatcaCrsSelfCertSigned', c)} /><Label>FATCA / CRS Self-Certification Signed *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.taxComplianceDecl} onCheckedChange={c => onChange('taxComplianceDecl', c)} /><Label>Tax Compliance Declaration *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.termsAccepted} onCheckedChange={c => onChange('termsAccepted', c)} /><Label>Terms & Conditions Accepted *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.dataProtectionConsent} onCheckedChange={c => onChange('dataProtectionConsent', c)} /><Label>Data Protection Act 2019 Consent *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.creditBureauConsent} onCheckedChange={c => onChange('creditBureauConsent', c)} /><Label>Consent to Credit Bureau Checks *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.regulatorDataConsent} onCheckedChange={c => onChange('regulatorDataConsent', c)} /><Label>Consent to Share Data with Regulators (CBK / KRA / FRC) *</Label></div>
        <div className="flex items-start space-x-2"><Checkbox checked={data.marketingConsent} onCheckedChange={c => onChange('marketingConsent', c)} /><Label>Marketing Consent (Optional)</Label></div>
      </div>
      <h3 className="font-semibold">Customer Mandate / Signature</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUpload label="Customer Signature (Wet or eSignature)" field="customerSignature" data={data} onChange={onChange} required accept="image/*" />
        <div><Label>Date of Signature *</Label><Input type="date" value={data.signatureDate} onChange={e => onChange('signatureDate', e.target.value)} /></div>
        <FileUpload label="Customer Thumb Print (Ink / Biometric)" field="customerThumbPrint" data={data} onChange={onChange} required={false} />
        <div><Label>Witness Full Name</Label><Input value={data.witnessFullName} onChange={e => onChange('witnessFullName', e.target.value)} /></div>
        <div><Label>Witness ID Number</Label><Input value={data.witnessIdNumber} onChange={e => onChange('witnessIdNumber', e.target.value)} /></div>
        <FileUpload label="Witness Signature" field="witnessSignature" data={data} onChange={onChange} required={false} />
        <FileUpload label="Power of Attorney Form (if applicable)" field="powerOfAttorneyDoc" data={data} onChange={onChange} required={false} />
      </div>
      <h3 className="font-semibold">Bank Officer / Verification Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Account Opening Officer Name *</Label><Input value={data.openingOfficerName} onChange={e => onChange('openingOfficerName', e.target.value)} /></div>
        <div><Label>Officer Staff ID / Employee No. *</Label><Input value={data.officerStaffId} onChange={e => onChange('officerStaffId', e.target.value)} /></div>
        <div><Label>Officer Branch Code *</Label><Input value={data.officerBranchCode} onChange={e => onChange('officerBranchCode', e.target.value)} /></div>
        <div><Label>Relationship Manager (RM) Name</Label><Input value={data.relationshipManagerName} onChange={e => onChange('relationshipManagerName', e.target.value)} /></div>
        <div><Label>RM Employee ID</Label><Input value={data.rmEmployeeId} onChange={e => onChange('rmEmployeeId', e.target.value)} /></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.documentsVerifiedChecklist} onCheckedChange={c => onChange('documentsVerifiedChecklist', c)} /><Label>Documents Verified Checklist Completed *</Label></div>
        <div><Label>Application Received Date + Time *</Label><Input type="datetime-local" value={data.applicationReceivedDateTime} onChange={e => onChange('applicationReceivedDateTime', e.target.value)} /></div>
        <div><Label>Application Approved Date *</Label><Input type="date" value={data.applicationApprovedDate} onChange={e => onChange('applicationApprovedDate', e.target.value)} /></div>
        <div><Label>Approval Authority Level *</Label><Select value={data.approvalAuthorityLevel} onValueChange={v => onChange('approvalAuthorityLevel', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Operations Officer">Operations Officer</SelectItem><SelectItem value="Branch Manager">Branch Manager</SelectItem><SelectItem value="Head Office">Head Office</SelectItem></SelectContent></Select></div>
        <div><Label>Account Number Assigned (system generated)</Label><Input value={data.accountNumberAssigned} onChange={e => onChange('accountNumberAssigned', e.target.value)} /></div>
        <div><Label>Sort Code / Branch Code</Label><Input value={data.sortCodeBranchCode} onChange={e => onChange('sortCodeBranchCode', e.target.value)} /></div>
        <div><Label>SWIFT BIC Code</Label><Input value={data.swiftBicCode} onChange={e => onChange('swiftBicCode', e.target.value)} /></div>
        <div><Label>IBAN (if applicable)</Label><Input value={data.iban} onChange={e => onChange('iban', e.target.value)} /></div>
        <div><Label>Customer CIF Number *</Label><Input value={data.customerCifNumber} onChange={e => onChange('customerCifNumber', e.target.value)} /></div>
        <div className="flex items-center space-x-2"><Checkbox checked={data.welcomeLetterIssued} onCheckedChange={c => onChange('welcomeLetterIssued', c)} /><Label>Welcome Letter Issued *</Label></div>
        <div><Label>Welcome Pack Delivery Channel *</Label><Select value={data.welcomePackDeliveryChannel} onValueChange={v => onChange('welcomePackDeliveryChannel', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Physical Handover">Physical Handover</SelectItem><SelectItem value="Email">Email</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="Courier">Courier</SelectItem></SelectContent></Select></div>
        <div><Label>Core Banking System Entry Date + Time *</Label><Input type="datetime-local" value={data.coreBankingEntryDateTime} onChange={e => onChange('coreBankingEntryDateTime', e.target.value)} /></div>
      </div>
    </div>
  );
};

const PreviewStep = ({ data }) => (
  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
    <Card><CardHeader><CardTitle>Personal Information</CardTitle></CardHeader><CardContent className="text-sm"><div>Name: {data.title} {data.firstName} {data.lastName}</div><div>DOB: {data.dateOfBirth}</div><div>National ID: {data.nationalIdNumber}</div><div>KRA PIN: {data.kraPinNumber}</div><div>PEP: {data.pep ? 'Yes' : 'No'}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Account & Address</CardTitle></CardHeader><CardContent><div>Account Type: {data.accountProductType}</div><div>Address: {data.plotHouseNumber}, {data.streetRoad}, {data.county}</div><div>Phone: {data.primaryMobile} | Email: {data.primaryEmail}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Employment & Next of Kin</CardTitle></CardHeader><CardContent><div>Employer: {data.employerName}</div><div>Monthly Income: {data.monthlyNetIncome}</div><div>Next of Kin: {data.nextOfKinList.length} persons</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Declarations & Signatures</CardTitle></CardHeader><CardContent><div>Terms Accepted: {data.termsAccepted ? 'Yes' : 'No'}</div><div>Data Protection Consent: {data.dataProtectionConsent ? 'Yes' : 'No'}</div><div>Signature Date: {data.signatureDate}</div></CardContent></Card>
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

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.title) newErrors.title = 'Required';
      if (!formData.firstName) newErrors.firstName = 'Required';
      if (!formData.lastName) newErrors.lastName = 'Required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
      else if (new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() < 18) newErrors.dateOfBirth = 'Age ≥18 required';
      if (!formData.gender) newErrors.gender = 'Required';
      if (!formData.maritalStatus) newErrors.maritalStatus = 'Required';
      if (!formData.nationality) newErrors.nationality = 'Required';
      if (!formData.placeOfBirth) newErrors.placeOfBirth = 'Required';
      if (!formData.countryOfBirth) newErrors.countryOfBirth = 'Required';
      if (!formData.countryOfResidence) newErrors.countryOfResidence = 'Required';
      if (formData.pep === undefined) newErrors.pep = 'Required';
      if (!formData.primaryMobile) newErrors.primaryMobile = 'Required';
      if (!formData.primaryEmail) newErrors.primaryEmail = 'Required';
      if (!formData.primaryEmailVerified) newErrors.primaryEmailOtp = 'Verify email OTP';
      if (!formData.nationalIdNumber) newErrors.nationalIdNumber = 'Required';
      if (!formData.kraPinNumber) newErrors.kraPinNumber = 'Required';
    } else if (step === 2) {
      if (!formData.idType) newErrors.idType = 'Required';
      if (!formData.idFrontImage) newErrors.idFrontImage = 'Required';
      if (!formData.kraPinCertCopy) newErrors.kraPinCertCopy = 'Required';
    } else if (step === 3) {
      if (!formData.plotHouseNumber) newErrors.plotHouseNumber = 'Required';
      if (!formData.nearestLandmark) newErrors.nearestLandmark = 'Required';
      if (!formData.subLocation) newErrors.subLocation = 'Required';
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.proofOfResidence) newErrors.proofOfResidence = 'Required';
      if (!formData.primaryEmailVerified) newErrors.primaryEmailOtp = 'Verify email OTP';
    } else if (step === 4) {
      if (!formData.employmentStatus) newErrors.employmentStatus = 'Required';
      if (!formData.occupation) newErrors.occupation = 'Required';
      if (!formData.monthlyNetIncome) newErrors.monthlyNetIncome = 'Required';
      if (!formData.expectedMonthlyCreditTurnover) newErrors.expectedMonthlyCreditTurnover = 'Required';
      if (!formData.primarySourceOfFunds) newErrors.primarySourceOfFunds = 'Required';
    } else if (step === 5) {
      if (!formData.accountOwnershipType) newErrors.accountOwnershipType = 'Required';
      if (!formData.accountProductType) newErrors.accountProductType = 'Required';
      if (!formData.accountPurpose) newErrors.accountPurpose = 'Required';
      if (!formData.branchPreference) newErrors.branchPreference = 'Required';
      if (!formData.openingDepositAmount) newErrors.openingDepositAmount = 'Required';
    } else if (step === 6) {
      if (formData.nextOfKinList.length === 0) newErrors.nextOfKin = 'At least one primary next of kin required';
    } else if (step === 7) {
      if (!formData.kraPinNumber) newErrors.kraPinNumber = 'Required';
      if (!formData.customerRiskRating) newErrors.customerRiskRating = 'Required';
    } else if (step === 8) {
      if (!formData.infoAccuracyDecl) newErrors.infoAccuracyDecl = 'Required';
      if (!formData.amlDeclaration) newErrors.amlDeclaration = 'Required';
      if (!formData.termsAccepted) newErrors.termsAccepted = 'Required';
      if (!formData.dataProtectionConsent) newErrors.dataProtectionConsent = 'Required';
      if (!formData.customerSignature) newErrors.customerSignature = 'Required';
      if (!formData.openingOfficerName) newErrors.openingOfficerName = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      alert("Please fill all required fields correctly before proceeding.");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(8)) {
      alert("Please complete all required fields in the Declarations step.");
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    const ids = { customerId: generateCustomerId(), customershipNumber: generateCustomershipNumber(), cifNumber: generateCifNumber() };
    setGeneratedIds(ids);
    console.log('Submitted:', { ...formData, ...ids, status: 'Draft', kycStatus: 'Pending' });
    setSubmitting(false);
    setSubmitSuccess(true);
  };

  const renderStepContent = () => {
    const props = { data: formData, onChange: updateField, errors, setErrors };
    switch (currentStep) {
      case 1: return <PersonalInfoStep {...props} />;
      case 2: return <IdentityDocsStep {...props} />;
      case 3: return <ContactAddressStep {...props} />;
      case 4: return <EmploymentFinancialStep {...props} />;
      case 5: return <AccountDetailsStep {...props} />;
      case 6: return <NextOfKinStep {...props} />;
      case 7: return <TaxComplianceStep {...props} />;
      case 8: return <DeclarationsStep {...props} />;
      case 9: return <PreviewStep data={formData} />;
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