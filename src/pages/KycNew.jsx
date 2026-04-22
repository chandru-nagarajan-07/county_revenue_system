import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Check, Loader2,
  CheckCircle, XCircle, Upload, Trash2, AlertCircle, Plus
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

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8001';
const API_URL = `${API_BASE_URL}/customer/customers/`;

// Master API URLs
const MASTER_APIS = {
  accountTypes: `${API_BASE_URL}/master/account_types/`,
  currencies: `${API_BASE_URL}/master/currencies/`,
  relationships: `${API_BASE_URL}/master/relationships/`,
  employmentTypes: `${API_BASE_URL}/master/employment_types/`,
};  

// ========== STEP DEFINITIONS WITH NAMES ==========
const STEPS = [
  { id: 1, name: "Personal Information", description: "Basic personal details" },
  { id: 2, name: "Account Details", description: "Account type and preferences" },
  { id: 3, name: "Address Information", description: "Physical and postal address" },
  { id: 4, name: "Employment Details", description: "Employment and income information" },
  { id: 5, name: "Next of Kin", description: "Emergency contact details" },
  { id: 6, name: "KYC Documents", description: "Upload required documents" },
  { id: 7, name: "Consent & Review", description: "Terms and final review" },
];

// ========== INITIAL FORM DATA ==========
const INITIAL_DATA = {
  // Personal Info (Step 1)
  title: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  phone_number: '',
  email: '',
  national_id: '',
  kra_pin: '',
  marital_status: '',
  nationality: '',
  place_of_birth: '',
  country_of_residence: '',
  pep: false,
  disability: '',
  
  // Account Details (Step 2)
  account_type: '',
  account_purpose: '',
  account_ownership: '',
  currency: '',
  initial_deposit: 0,
  
  // Address (Step 3)
  street: '',
  city: '',
  district: '',
  county: '',
  country: '',
  postal_code: '',
  landmark: '',
  duration_at_address: '',
  proof_of_residence: null,
  
  // Employment (Step 4)
  employer_name: '',
  employment_type: '',
  monthly_income: '',
  occupation: '',
  industry: '',
  expected_monthly_transactions: '',
  max_deposit: '',
  max_withdrawal: '',
  source_of_funds: '',
  other_income_sources: '',
  
  // Next of Kin (Step 5)
  nok_name: '',
  nok_relationship: '',
  nok_phone: '',
  nok_email: '',
  
  // KYC Documents (Step 6)
  id_document: null,
  photo: null,
  signature: null,
  address_proof_doc: null,
  kra_pin_certificate: null,
  customership_form: null,
  id_issue_date: '',
  id_place_of_issue: '',
  biometric_captured: false,
  live_photo_captured: false,
  
  // Consent (Step 7)
  terms_accepted: false,
  data_usage_consent: false,
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
      <input 
        type="file" 
        ref={inputRef} 
        onChange={e => onChange(field, e.target.files?.[0] || null)} 
        className="hidden" 
        accept={accept} 
      />
    </div>
  );
};

// ========== STEP 1: PERSONAL INFO ==========
const PersonalInfoStep = ({ data, onChange, errors, setErrors }) => {
  const age = data.date_of_birth ? new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() : 0;
  const isAgeValid = age >= 18;

  useEffect(() => {
    if (data.date_of_birth && !isAgeValid) {
      setErrors({ ...errors, date_of_birth: 'Must be 18 years or older' });
    } else {
      setErrors({ ...errors, date_of_birth: '' });
    }
  }, [data.date_of_birth]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Title</Label>
          <Select value={data.title} onValueChange={v => onChange('title', v)}>
            <SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MR">Mr.</SelectItem>
              <SelectItem value="MRS">Mrs.</SelectItem>
              <SelectItem value="MS">Ms.</SelectItem>
              <SelectItem value="DR">Dr.</SelectItem>
              <SelectItem value="PROF">Prof.</SelectItem>
              <SelectItem value="REV">Rev.</SelectItem>
              <SelectItem value="HON">Hon.</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>First Name *</Label>
          <Input value={data.first_name} onChange={e => onChange('first_name', e.target.value)} />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input value={data.last_name} onChange={e => onChange('last_name', e.target.value)} />
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Date of Birth *</Label>
          <Input type="date" value={data.date_of_birth} onChange={e => onChange('date_of_birth', e.target.value)} />
          {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth}</p>}
          {data.date_of_birth && isAgeValid && <p className="text-xs text-green-600">Age: {age} years</p>}
        </div>
        <div>
          <Label>Gender *</Label>
          <Select value={data.gender} onValueChange={v => onChange('gender', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Male</SelectItem>
              <SelectItem value="F">Female</SelectItem>
              <SelectItem value="O">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input value={data.phone_number} onChange={e => onChange('phone_number', e.target.value)} />
          {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number}</p>}
        </div>
        <div>
          <Label>Email *</Label>
          <Input type="email" value={data.email} onChange={e => onChange('email', e.target.value)} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div>
          <Label>National ID *</Label>
          <Input value={data.national_id} onChange={e => onChange('national_id', e.target.value)} />
          {errors.national_id && <p className="text-xs text-destructive">{errors.national_id}</p>}
        </div>
        <div>
          <Label>KRA PIN *</Label>
          <Input value={data.kra_pin} onChange={e => onChange('kra_pin', e.target.value.toUpperCase())} className="uppercase" />
          {errors.kra_pin && <p className="text-xs text-destructive">{errors.kra_pin}</p>}
        </div>
        <div>
          <Label>Marital Status *</Label>
          <Select value={data.marital_status} onValueChange={v => onChange('marital_status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single</SelectItem>
              <SelectItem value="MARRIED">Married</SelectItem>
              <SelectItem value="DIVORCED">Divorced</SelectItem>
              <SelectItem value="WIDOWED">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nationality *</Label>
          <Input value={data.nationality} onChange={e => onChange('nationality', e.target.value)} />
        </div>
        <div>
          <Label>Place of Birth *</Label>
          <Input value={data.place_of_birth} onChange={e => onChange('place_of_birth', e.target.value)} />
        </div>
        <div>
          <Label>Country of Residence *</Label>
          <Input value={data.country_of_residence} onChange={e => onChange('country_of_residence', e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={data.pep} onCheckedChange={c => onChange('pep', c)} />
          <Label>Politically Exposed Person (PEP)</Label>
        </div>
        <div>
          <Label>Disability (if any)</Label>
          <Input value={data.disability} onChange={e => onChange('disability', e.target.value)} placeholder="Specify disability" />
        </div>
      </div>
    </div>
  );
};

// ========== STEP 2: ACCOUNT DETAILS ==========
const AccountDetailsStep = ({ data, onChange, errors }) => {
  const [accountTypes, setAccountTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [typesRes, currenciesRes] = await Promise.all([
          fetch(MASTER_APIS.accountTypes),
          fetch(MASTER_APIS.currencies)
        ]);
        
        const typesData = await typesRes.json();
        const currenciesData = await currenciesRes.json();
        
        setAccountTypes(typesData);
        setCurrencies(currenciesData);
      } catch (error) {
        console.error('Error fetching master data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMasterData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading account details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Account Type *</Label>
          <Select value={data.account_type} onValueChange={v => onChange('account_type', v)}>
            <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
            <SelectContent>
              {accountTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.account_type && <p className="text-xs text-destructive">{errors.account_type}</p>}
        </div>
        <div>
          <Label>Account Purpose *</Label>
          <Input value={data.account_purpose} onChange={e => onChange('account_purpose', e.target.value)} placeholder="e.g., Savings, Business, Salary" />
          {errors.account_purpose && <p className="text-xs text-destructive">{errors.account_purpose}</p>}
        </div>
        <div>
          <Label>Account Ownership *</Label>
          <Select value={data.account_ownership} onValueChange={v => onChange('account_ownership', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Individual">Individual</SelectItem>
              <SelectItem value="Joint">Joint</SelectItem>
              <SelectItem value="Corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>
          {errors.account_ownership && <p className="text-xs text-destructive">{errors.account_ownership}</p>}
        </div>
        <div>
          <Label>Currency *</Label>
          <Select value={data.currency} onValueChange={v => onChange('currency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map(curr => (
                <SelectItem key={curr.id} value={curr.id}>{curr.symbol} - {curr.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
        </div>
        <div>
          <Label>Initial Deposit (KES)</Label>
          <Input 
            type="number" 
            value={data.initial_deposit} 
            onChange={e => onChange('initial_deposit', parseFloat(e.target.value) || 0)} 
          />
          <p className="text-xs text-muted-foreground mt-1">Minimum deposit: KES 100 for Savings, KES 500 for Current</p>
        </div>
      </div>
    </div>
  );
};

// ========== STEP 3: ADDRESS ==========
const AddressStep = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Street *</Label>
          <Input value={data.street} onChange={e => onChange('street', e.target.value)} />
          {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
        </div>
        <div>
          <Label>City *</Label>
          <Input value={data.city} onChange={e => onChange('city', e.target.value)} />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
        <div>
          <Label>District *</Label>
          <Input value={data.district} onChange={e => onChange('district', e.target.value)} />
          {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
        </div>
        <div>
          <Label>County *</Label>
          <Input value={data.county} onChange={e => onChange('county', e.target.value)} />
          {errors.county && <p className="text-xs text-destructive">{errors.county}</p>}
        </div>
        <div>
          <Label>Country *</Label>
          <Input value={data.country} onChange={e => onChange('country', e.target.value)} />
          {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
        </div>
        <div>
          <Label>Postal Code</Label>
          <Input value={data.postal_code} onChange={e => onChange('postal_code', e.target.value)} />
        </div>
        <div>
          <Label>Landmark *</Label>
          <Input value={data.landmark} onChange={e => onChange('landmark', e.target.value)} />
          {errors.landmark && <p className="text-xs text-destructive">{errors.landmark}</p>}
        </div>
        <div>
          <Label>Duration at Address *</Label>
          <Input value={data.duration_at_address} onChange={e => onChange('duration_at_address', e.target.value)} placeholder="e.g., 5 years, 2 months" />
          {errors.duration_at_address && <p className="text-xs text-destructive">{errors.duration_at_address}</p>}
        </div>
        <div className="col-span-2">
          <FileUpload 
            label="Proof of Residence *" 
            field="proof_of_residence" 
            data={data} 
            onChange={onChange} 
            required 
            accept=".pdf,.jpg,.png"
          />
          {errors.proof_of_residence && <p className="text-xs text-destructive">{errors.proof_of_residence}</p>}
        </div>
      </div>
    </div>
  );
};

// ========== STEP 4: EMPLOYMENT ==========
const EmploymentStep = ({ data, onChange, errors }) => {
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmploymentTypes = async () => {
      setLoading(true);
      try {
        const response = await fetch(MASTER_APIS.employmentTypes);
        const data = await response.json();
        setEmploymentTypes(data);
      } catch (error) {
        console.error('Error fetching employment types:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmploymentTypes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading employment details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Employer Name *</Label>
          <Input value={data.employer_name} onChange={e => onChange('employer_name', e.target.value)} />
          {errors.employer_name && <p className="text-xs text-destructive">{errors.employer_name}</p>}
        </div>
        <div>
          <Label>Employment Type *</Label>
          <Select value={data.employment_type} onValueChange={v => onChange('employment_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {employmentTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employment_type && <p className="text-xs text-destructive">{errors.employment_type}</p>}
        </div>
        <div>
          <Label>Monthly Income (KES) *</Label>
          <Input type="number" value={data.monthly_income} onChange={e => onChange('monthly_income', parseFloat(e.target.value) || 0)} />
          {errors.monthly_income && <p className="text-xs text-destructive">{errors.monthly_income}</p>}
        </div>
        <div>
          <Label>Occupation *</Label>
          <Input value={data.occupation} onChange={e => onChange('occupation', e.target.value)} />
          {errors.occupation && <p className="text-xs text-destructive">{errors.occupation}</p>}
        </div>
        <div>
          <Label>Industry *</Label>
          <Input value={data.industry} onChange={e => onChange('industry', e.target.value)} />
          {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
        </div>
        <div>
          <Label>Expected Monthly Transactions (KES) *</Label>
          <Input type="number" value={data.expected_monthly_transactions} onChange={e => onChange('expected_monthly_transactions', parseFloat(e.target.value) || 0)} />
          {errors.expected_monthly_transactions && <p className="text-xs text-destructive">{errors.expected_monthly_transactions}</p>}
        </div>
        <div>
          <Label>Maximum Deposit (KES) *</Label>
          <Input type="number" value={data.max_deposit} onChange={e => onChange('max_deposit', parseFloat(e.target.value) || 0)} />
          {errors.max_deposit && <p className="text-xs text-destructive">{errors.max_deposit}</p>}
        </div>
        <div>
          <Label>Maximum Withdrawal (KES) *</Label>
          <Input type="number" value={data.max_withdrawal} onChange={e => onChange('max_withdrawal', parseFloat(e.target.value) || 0)} />
          {errors.max_withdrawal && <p className="text-xs text-destructive">{errors.max_withdrawal}</p>}
        </div>
        <div className="col-span-2">
          <Label>Source of Funds *</Label>
          <Input value={data.source_of_funds} onChange={e => onChange('source_of_funds', e.target.value)} placeholder="e.g., Salary, Business, Investments" />
          {errors.source_of_funds && <p className="text-xs text-destructive">{errors.source_of_funds}</p>}
        </div>
        <div className="col-span-2">
          <Label>Other Income Sources</Label>
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={data.other_income_sources} 
            onChange={e => onChange('other_income_sources', e.target.value)} 
            placeholder="List any other sources of income"
          />
        </div>
      </div>
    </div>
  );
};

// ========== STEP 5: NEXT OF KIN ==========
const NextOfKinStep = ({ data, onChange, errors }) => {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelationships = async () => {
      setLoading(true);
      try {
        const response = await fetch(MASTER_APIS.relationships);
        const data = await response.json();
        setRelationships(data);
      } catch (error) {
        console.error('Error fetching relationships:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelationships();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading relationship types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Next of Kin Full Name *</Label>
          <Input value={data.nok_name} onChange={e => onChange('nok_name', e.target.value)} />
          {errors.nok_name && <p className="text-xs text-destructive">{errors.nok_name}</p>}
        </div>
        <div>
          <Label>Relationship *</Label>
          <Select value={data.nok_relationship} onValueChange={v => onChange('nok_relationship', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {relationships.map(rel => (
                <SelectItem key={rel.id} value={rel.id}>{rel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.nok_relationship && <p className="text-xs text-destructive">{errors.nok_relationship}</p>}
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input value={data.nok_phone} onChange={e => onChange('nok_phone', e.target.value)} />
          {errors.nok_phone && <p className="text-xs text-destructive">{errors.nok_phone}</p>}
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={data.nok_email} onChange={e => onChange('nok_email', e.target.value)} />
        </div>
      </div>
    </div>
  );
};

// ========== STEP 6: KYC DOCUMENTS ==========
const KYCDocumentsStep = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUpload label="ID Document *" field="id_document" data={data} onChange={onChange} required accept=".pdf,.jpg,.png" />
        <FileUpload label="Passport Photo *" field="photo" data={data} onChange={onChange} required accept="image/*" />
        <FileUpload label="Signature *" field="signature" data={data} onChange={onChange} required accept="image/*" />
        <FileUpload label="Address Proof" field="address_proof_doc" data={data} onChange={onChange} required={false} accept=".pdf,.jpg,.png" />
        <FileUpload label="KRA PIN Certificate" field="kra_pin_certificate" data={data} onChange={onChange} required={false} accept=".pdf,.jpg" />
        <FileUpload label="Customership Form" field="customership_form" data={data} onChange={onChange} required={false} accept=".pdf" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>ID Issue Date</Label>
          <Input type="date" value={data.id_issue_date} onChange={e => onChange('id_issue_date', e.target.value)} />
        </div>
        <div>
          <Label>ID Place of Issue</Label>
          <Input value={data.id_place_of_issue} onChange={e => onChange('id_place_of_issue', e.target.value)} />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox checked={data.biometric_captured} onCheckedChange={c => onChange('biometric_captured', c)} />
          <Label>Biometric Captured</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={data.live_photo_captured} onCheckedChange={c => onChange('live_photo_captured', c)} />
          <Label>Live Photo Captured</Label>
        </div>
      </div>
      
      {errors.id_document && <p className="text-xs text-destructive">{errors.id_document}</p>}
      {errors.photo && <p className="text-xs text-destructive">{errors.photo}</p>}
      {errors.signature && <p className="text-xs text-destructive">{errors.signature}</p>}
    </div>
  );
};

// ========== STEP 7: CONSENT ==========
const ConsentStep = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox checked={data.terms_accepted} onCheckedChange={c => onChange('terms_accepted', c)} />
          <Label>I accept the Terms and Conditions *</Label>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox checked={data.data_usage_consent} onCheckedChange={c => onChange('data_usage_consent', c)} />
          <Label>I consent to the use of my data as per the privacy policy *</Label>
        </div>
      </div>
      {errors.terms_accepted && <p className="text-xs text-destructive">You must accept the terms and conditions</p>}
      {errors.data_usage_consent && <p className="text-xs text-destructive">You must consent to data usage</p>}
    </div>
  );
};

// ========== PREVIEW STEP ==========
const PreviewStep = ({ data }) => (
  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
    <Card>
      <CardHeader><CardTitle>📋 Personal Information</CardTitle></CardHeader>
      <CardContent className="text-sm">
        <div><strong>Name:</strong> {data.title} {data.first_name} {data.last_name}</div>
        <div><strong>DOB:</strong> {data.date_of_birth}</div>
        <div><strong>Gender:</strong> {data.gender === 'M' ? 'Male' : data.gender === 'F' ? 'Female' : 'Other'}</div>
        <div><strong>Phone:</strong> {data.phone_number}</div>
        <div><strong>Email:</strong> {data.email}</div>
        <div><strong>National ID:</strong> {data.national_id}</div>
        <div><strong>KRA PIN:</strong> {data.kra_pin}</div>
        <div><strong>Marital Status:</strong> {data.marital_status}</div>
        <div><strong>Nationality:</strong> {data.nationality}</div>
        <div><strong>PEP:</strong> {data.pep ? 'Yes' : 'No'}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader><CardTitle>💰 Account Details</CardTitle></CardHeader>
      <CardContent className="text-sm">
        <div><strong>Account Type:</strong> {data.account_type}</div>
        <div><strong>Account Purpose:</strong> {data.account_purpose}</div>
        <div><strong>Ownership:</strong> {data.account_ownership}</div>
        <div><strong>Currency:</strong> {data.currency}</div>
        <div><strong>Initial Deposit:</strong> KES {data.initial_deposit?.toLocaleString()}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader><CardTitle>🏠 Address</CardTitle></CardHeader>
      <CardContent className="text-sm">
        <div><strong>Street:</strong> {data.street}</div>
        <div><strong>City:</strong> {data.city}</div>
        <div><strong>County:</strong> {data.county}</div>
        <div><strong>Country:</strong> {data.country}</div>
        <div><strong>Landmark:</strong> {data.landmark}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader><CardTitle>💼 Employment</CardTitle></CardHeader>
      <CardContent className="text-sm">
        <div><strong>Employer:</strong> {data.employer_name}</div>
        <div><strong>Employment Type:</strong> {data.employment_type}</div>
        <div><strong>Occupation:</strong> {data.occupation}</div>
        <div><strong>Monthly Income:</strong> KES {data.monthly_income?.toLocaleString()}</div>
        <div><strong>Source of Funds:</strong> {data.source_of_funds}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader><CardTitle>👨‍👩‍👧 Next of Kin</CardTitle></CardHeader>
      <CardContent className="text-sm">
        <div><strong>Name:</strong> {data.nok_name}</div>
        <div><strong>Relationship:</strong> {data.nok_relationship}</div>
        <div><strong>Phone:</strong> {data.nok_phone}</div>
        <div><strong>Email:</strong> {data.nok_email || 'Not provided'}</div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader><CardTitle>✅ Consent</CardTitle></CardHeader>
      <CardContent className="text-sm">
        <div><strong>Terms Accepted:</strong> {data.terms_accepted ? '✓ Yes' : '✗ No'}</div>
        <div><strong>Data Consent:</strong> {data.data_usage_consent ? '✓ Yes' : '✗ No'}</div>
      </CardContent>
    </Card>
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
  const [submittedData, setSubmittedData] = useState(null);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.first_name) newErrors.first_name = 'Required';
      if (!formData.last_name) newErrors.last_name = 'Required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Required';
      else if (new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear() < 18) {
        newErrors.date_of_birth = 'Must be 18 years or older';
      }
      if (!formData.gender) newErrors.gender = 'Required';
      if (!formData.phone_number) newErrors.phone_number = 'Required';
      if (!formData.email) newErrors.email = 'Required';
      if (!formData.national_id) newErrors.national_id = 'Required';
      if (!formData.kra_pin) newErrors.kra_pin = 'Required';
      if (!formData.marital_status) newErrors.marital_status = 'Required';
      if (!formData.nationality) newErrors.nationality = 'Required';
      if (!formData.place_of_birth) newErrors.place_of_birth = 'Required';
      if (!formData.country_of_residence) newErrors.country_of_residence = 'Required';
    } else if (step === 2) {
      if (!formData.account_type) newErrors.account_type = 'Required';
      if (!formData.account_purpose) newErrors.account_purpose = 'Required';
      if (!formData.account_ownership) newErrors.account_ownership = 'Required';
      if (!formData.currency) newErrors.currency = 'Required';
    } else if (step === 3) {
      if (!formData.street) newErrors.street = 'Required';
      if (!formData.city) newErrors.city = 'Required';
      if (!formData.district) newErrors.district = 'Required';
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.country) newErrors.country = 'Required';
      if (!formData.landmark) newErrors.landmark = 'Required';
      if (!formData.duration_at_address) newErrors.duration_at_address = 'Required';
      if (!formData.proof_of_residence) newErrors.proof_of_residence = 'Required';
    } else if (step === 4) {
      if (!formData.employer_name) newErrors.employer_name = 'Required';
      if (!formData.employment_type) newErrors.employment_type = 'Required';
      if (!formData.monthly_income) newErrors.monthly_income = 'Required';
      if (!formData.occupation) newErrors.occupation = 'Required';
      if (!formData.industry) newErrors.industry = 'Required';
      if (!formData.expected_monthly_transactions) newErrors.expected_monthly_transactions = 'Required';
      if (!formData.max_deposit) newErrors.max_deposit = 'Required';
      if (!formData.max_withdrawal) newErrors.max_withdrawal = 'Required';
      if (!formData.source_of_funds) newErrors.source_of_funds = 'Required';
    } else if (step === 5) {
      if (!formData.nok_name) newErrors.nok_name = 'Required';
      if (!formData.nok_relationship) newErrors.nok_relationship = 'Required';
      if (!formData.nok_phone) newErrors.nok_phone = 'Required';
    } else if (step === 6) {
      if (!formData.id_document) newErrors.id_document = 'Required';
      if (!formData.photo) newErrors.photo = 'Required';
      if (!formData.signature) newErrors.signature = 'Required';
    } else if (step === 7) {
      if (!formData.terms_accepted) newErrors.terms_accepted = 'Required';
      if (!formData.data_usage_consent) newErrors.data_usage_consent = 'Required';
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

  const createFormData = () => {
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof File) {
          formDataToSend.append(key, value);
        } else if (typeof value === 'boolean') {
          formDataToSend.append(key, value);
        } else {
          formDataToSend.append(key, String(value));
        }
      }
    });
    
    return formDataToSend;
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) {
      alert("Please complete all required fields and accept the terms.");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formDataToSend = createFormData();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formDataToSend,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }
      
      setSubmittedData(data);
      setSubmitSuccess(true);
      console.log('Customer created successfully:', data);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const props = { data: formData, onChange: updateField, errors, setErrors };
    switch (currentStep) {
      case 1: return <PersonalInfoStep {...props} />;
      case 2: return <AccountDetailsStep {...props} />;
      case 3: return <AddressStep {...props} />;
      case 4: return <EmploymentStep {...props} />;
      case 5: return <NextOfKinStep {...props} />;
      case 6: return <KYCDocumentsStep {...props} />;
      case 7: return <ConsentStep {...props} />;
      case 8: return <PreviewStep data={formData} />;
      default: return null;
    }
  };

  if (submitSuccess && submittedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader customerName="New Customer" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onLogout={() => navigate("/")} />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
            <div className="rounded-full bg-green-500/20 w-20 h-20 mx-auto flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Customer Created Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Status: <Badge>{submittedData.status || 'DRAFT'}</Badge> &nbsp; 
              KYC: <Badge variant="secondary">{submittedData.kyc_status || 'PENDING'}</Badge>
            </p>
            <Card className="text-left mb-6">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer ID:</span>
                  <span className="font-mono font-bold">{submittedData.customer_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customership Number:</span>
                  <span className="font-mono font-bold">{submittedData.customership_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CIF Number:</span>
                  <span className="font-mono font-bold">{submittedData.cif_number}</span>
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => navigate('/dashboard')} className="w-full">Go to Dashboard</Button>
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
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Customer Onboarding</h1>
            <p className="text-xs text-gray-500">
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep-1].name}
            </p>
          </div>
        </div>
        
        {/* Step Progress Bar with Names */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex-1 text-center">
                <div className={`relative flex flex-col items-center ${idx !== STEPS.length - 1 ? 'after:content-[""] after:absolute after:top-4 after:left-1/2 after:w-full after:h-[2px] after:bg-gray-200 after:-z-10' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-white ${
                    step.id < currentStep ? 'bg-primary border-primary text-white' : 
                    step.id === currentStep ? 'border-primary bg-primary text-white scale-110 shadow-md' : 
                    'border-gray-300 text-gray-400'
                  }`}>
                    {step.id < currentStep ? <Check className="h-4 w-4" /> : <span className="text-sm font-bold">{step.id}</span>}
                  </div>
                  <div className="mt-2">
                    <p className={`text-xs font-medium ${step.id === currentStep ? 'text-primary' : step.id < currentStep ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.name}
                    </p>
                    <p className="text-[10px] text-gray-400 hidden lg:block">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-between mt-2">
          <div className="text-sm font-medium">
            Step {currentStep}: {STEPS[currentStep-1].name}
          </div>
          <div className="text-xs text-gray-500">
            {Math.round((currentStep / STEPS.length) * 100)}% Complete
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{STEPS[currentStep-1].name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{STEPS[currentStep-1].description}</p>
                </CardHeader>
                <CardContent className="pt-6">
                  {renderStepContent()}
                </CardContent>
              </Card>
              
              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {currentStep < STEPS.length ? (
                  <Button onClick={nextStep} className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Application'}
                  </Button>
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