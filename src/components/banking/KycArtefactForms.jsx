import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, FileImage, ChevronRight, ChevronLeft, ShieldCheck, Fingerprint, FileText, Users,
  ArrowLeft, Check, AlertCircle, Shield, Eye, ThumbsUp, Zap, Star
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KycBiometricScanner } from './KycBiometricScanner';

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const ARTEFACT_META = {
  'legal-id': { label: 'Legal ID', icon: <FileText className="h-5 w-5" /> },
  'biometric': { label: 'Biometric', icon: <Fingerprint className="h-5 w-5" /> },
  'kra-pin': { label: 'KRA PIN', icon: <ShieldCheck className="h-5 w-5" /> },
  'account-mandates': { label: 'Account Mandates', icon: <Users className="h-5 w-5" /> },
};

const ID_TYPES = ['National ID', 'Passport', 'Alien ID', 'Military ID'];
const MANDATE_TYPES = ['Single', 'Joint – Any to Sign', 'Joint – All to Sign'];

/* SUB-COMPONENTS */

function ImageUpload({ label, images, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAdd({ name: file.name, dataUrl: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative group rounded-lg border border-border overflow-hidden h-20 w-20">
            <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
            <button onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span className="text-[10px]">Upload</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function LegalIdForm({ data, onChange, images, onAddImage, onRemoveImage }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">ID Document Type *</Label>
        <Select value={data.idType || ''} onValueChange={v => onChange('idType', v)}>
          <SelectTrigger><SelectValue placeholder="Select document type..." /></SelectTrigger>
          <SelectContent>
            {ID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">ID Number *</Label>
        <Input value={data.idNumber || ''} onChange={e => onChange('idNumber', e.target.value)} placeholder="Enter ID number" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Full Name (as on document) *</Label>
        <Input value={data.fullName || ''} onChange={e => onChange('fullName', e.target.value)} placeholder="Enter full name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date of Birth *</Label>
          <Input type="date" value={data.dob || ''} onChange={e => onChange('dob', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Issue Date</Label>
          <Input type="date" value={data.issueDate || ''} onChange={e => onChange('issueDate', e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Expiry Date *</Label>
        <Input type="date" value={data.expiryDate || ''} onChange={e => onChange('expiryDate', e.target.value)} />
      </div>
      <ImageUpload label="Document Image (front & back)" images={images} onAdd={onAddImage} onRemove={onRemoveImage} />
    </div>
  );
}

function KraPinForm({ data, onChange, images, onAddImage, onRemoveImage }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">KRA PIN *</Label>
        <Input value={data.kraPin || ''} onChange={e => onChange('kraPin', e.target.value)} placeholder="e.g. A001234567Z" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Full Name on Certificate *</Label>
        <Input value={data.fullName || ''} onChange={e => onChange('fullName', e.target.value)} placeholder="Enter name as on certificate" />
      </div>
      <ImageUpload label="KRA PIN Certificate" images={images} onAdd={onAddImage} onRemoveImage={onRemoveImage} />
    </div>
  );
}

function MandateForm({ data, onChange, images, onAddImage, onRemoveImage, customer }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Mandate Type *</Label>
        <Select value={data.mandateType || ''} onValueChange={v => onChange('mandateType', v)}>
          <SelectTrigger><SelectValue placeholder="Select mandate type..." /></SelectTrigger>
          <SelectContent>
            {MANDATE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Primary Signatory *</Label>
        <Input value={data.primarySignatory || customer.fullName} onChange={e => onChange('primarySignatory', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Secondary Signatory</Label>
        <Input value={data.secondarySignatory || ''} onChange={e => onChange('secondarySignatory', e.target.value)} placeholder="Enter name (if applicable)" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Applicable Accounts</Label>
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-1">
          {customer.accounts.filter(a => a.status === 'ACTIVE' || a.status === 'active').map(a => (
            <div key={a.accountNumber || a.account_number} className="flex justify-between">
              <span>{a.accountNumber || a.account_number}</span>
              <span className="text-muted-foreground">{a.currency}</span>
            </div>
          ))}
        </div>
      </div>
      <ImageUpload label="Signature Card Scan" images={images} onAdd={onAddImage} onRemoveImage={onRemoveImage} />
    </div>
  );
}

/* MAIN COMPONENT */
export default function KycArtefactWorkflow({ customer, selectedActions, onBack, onSubmit }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }

  /* WORKFLOW STATE */
  const [workflowStep, setWorkflowStep] = useState(1); // 1 to 6
  const [loading, setLoading] = useState(false);
  const [officerNotes, setOfficerNotes] = useState("");

  /* INPUT STATE (Step 1 Internal) */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formDataMap, setFormDataMap] = useState(() => {
    const init = {};
    selectedActions.forEach(sa => {
      init[sa.artefactId] = { fields: {}, images: [] };
    });
    return init;
  });

  const current = selectedActions[currentIndex];
  const meta = ARTEFACT_META[current.artefactId];
  const currentData = formDataMap[current.artefactId];

  /* INPUT HANDLERS */
  const updateField = (key, val) => {
    setFormDataMap(prev => ({
      ...prev,
      [current.artefactId]: { ...prev[current.artefactId], fields: { ...prev[current.artefactId].fields, [key]: val } },
    }));
  };

  const addImage = (f) => {
    setFormDataMap(prev => ({
      ...prev,
      [current.artefactId]: { ...prev[current.artefactId], images: [...prev[current.artefactId].images, f] },
    }));
  };

  const removeImage = (i) => {
    setFormDataMap(prev => ({
      ...prev,
      [current.artefactId]: { ...prev[current.artefactId], images: prev[current.artefactId].images.filter((_, idx) => idx !== i) },
    }));
  };

  const handleBiometricComplete = (data) => {
    setFormDataMap(prev => ({
      ...prev,
      [current.artefactId]: { ...prev[current.artefactId], biometricData: data },
    }));
  };

  /* WORKFLOW HANDLERS */
  // Auto-advance Step 2 -> 3
  useEffect(() => {
    if (workflowStep === 2) {
      const timer = setTimeout(() => setWorkflowStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [workflowStep]);

  const handleInputNext = () => {
    const isLast = currentIndex === selectedActions.length - 1;
    if (isLast) {
      // Done with input, go to Workflow Step 2
      setWorkflowStep(2);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleInputPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    const result = selectedActions.map(sa => ({
      artefactId: sa.artefactId,
      action: sa.action,
      fields: formDataMap[sa.artefactId].fields,
      images: formDataMap[sa.artefactId].images,
      biometricData: formDataMap[sa.artefactId].biometricData,
    }));
    
    // Simulate final processing
    await new Promise(r => setTimeout(r, 1000));
    
    onSubmit(result);
    setLoading(false);
    alert("KYC Update Successful");
    if (onBack) onBack();
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!customer && !sessionUser) return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">KYC Artefact Update</h1>
            <p className="text-xs text-gray-500">
              Step {workflowStep} of 6: {STEPS[workflowStep - 1].name}
              {workflowStep === 1 && ` (Artefact ${currentIndex + 1}/${selectedActions.length})`}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < workflowStep;
            const isCurrent = s.id === workflowStep;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted ? "bg-primary border-primary text-primary-foreground" :
                  isCurrent ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" :
                  "bg-white border-gray-200 text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                </div>
                {index < STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">

          {/* STEP 1: INPUT (Multi-part) */}
          {workflowStep === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              
              {/* Customer Banner */}
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || sessionUser?.first_name || "C").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{customer?.customerId || sessionUser?.user_id}</p>
                </div>
              </div>

              {/* Internal Progress for Artefacts */}
              <div className="flex gap-1">
                {selectedActions.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentIndex ? 'bg-primary' : 'bg-gray-200'}`} />
                ))}
              </div>

              {/* Artefact Header */}
              <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-accent">
                  {meta.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{current.action} artefact</p>
                </div>
              </div>

              {/* Dynamic Form */}
              <AnimatePresence mode="wait">
                <motion.div key={current.artefactId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  {current.artefactId === 'legal-id' && (
                    <LegalIdForm data={currentData.fields} onChange={updateField} images={currentData.images} onAddImage={addImage} onRemoveImage={removeImage} />
                  )}
                  {current.artefactId === 'biometric' && (
                    <KycBiometricScanner onComplete={handleBiometricComplete} />
                  )}
                  {current.artefactId === 'kra-pin' && (
                    <KraPinForm data={currentData.fields} onChange={updateField} images={currentData.images} onAddImage={addImage} onRemoveImage={removeImage} />
                  )}
                  {current.artefactId === 'account-mandates' && (
                    <MandateForm data={currentData.fields} onChange={updateField} images={currentData.images} onAddImage={addImage} onRemoveImage={removeImage} customer={customer} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {currentIndex > 0 && (
                  <Button variant="outline" onClick={handleInputPrev} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                )}
                <Button 
                  onClick={handleInputNext} 
                  className={`${currentIndex > 0 ? 'flex-1' : 'w-full'} gold-gradient text-accent-foreground font-semibold shadow-gold`}
                >
                  {currentIndex === selectedActions.length - 1 ? "Submit for Validation" : "Next Artefact"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
          {workflowStep === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Validating Artefacts...</h3>
              <p className="text-sm text-muted-foreground">Checking document authenticity</p>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {workflowStep === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" /> <span className="text-sm font-medium">Validation Passed</span>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted Artefacts</h4>
                <div className="space-y-0">
                  {selectedActions.map((sa) => {
                    const data = formDataMap[sa.artefactId];
                    return (
                      <div key={sa.artefactId} className="flex justify-between py-2 border-b border-dashed last:border-0">
                        <span className="text-sm text-gray-500">{ARTEFACT_META[sa.artefactId].label}</span>
                        <span className="text-sm font-medium text-gray-800">
                          {data.images?.length > 0 ? `${data.images.length} file(s)` : data.fields?.idNumber || data.fields?.kraPin || 'Captured'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWorkflowStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setWorkflowStep(4)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Proceed</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PROCESSING */}
          {workflowStep === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg mb-2">
                <Zap className="h-5 w-5" /> <span className="text-sm font-medium">Officer Review</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Notes</Label>
                <Textarea placeholder="Optional notes..." value={officerNotes} onChange={e => setOfficerNotes(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWorkflowStep(3)} className="flex-1">Back</Button>
                <Button onClick={() => setWorkflowStep(5)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: VERIFICATION */}
          {workflowStep === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Eye className="h-5 w-5" /> <span className="text-sm font-medium">Customer Verification</span>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                 <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer consent verified</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWorkflowStep(4)} className="flex-1">Back</Button>
                <Button onClick={() => setWorkflowStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Verify</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: AUTHORIZATION */}
          {workflowStep === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto text-center py-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <ThumbsUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Authorization Complete</h3>
              <Button onClick={handleFinalComplete} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" disabled={loading}>
                {loading ? "Processing..." : "Finish"}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}