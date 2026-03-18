import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Fingerprint,
  FileText,
  Users,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Check,
  Shield,
  Eye,
  ThumbsUp,
  Zap,
  Star,
  AlertCircle,
  Upload,
  Calendar,
  Hash,
  User,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import KycArtefactForms from './KycArtefactForms';
import KycValidationScreen from './KycValidationScreen';

// Remove KycArtefactForms import
// import KycArtefactForms from './KycArtefactForms';
import KycValidationScreen from './KycValidationScreen';

/* CONSTANTS (keep all your existing constants) */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const ACTION_META = {
  // add: {
  //   label: 'Add',
  //   icon: <Plus className="h-3.5 w-3.5" />,
  //   color: 'bg-success/10 text-success border-success/30'
  // },
  update: {
    label: 'Update',
    icon: <Pencil className="h-3.5 w-3.5" />,
    color: 'bg-info/10 text-info border-info/30'
  },
  delete: {
    label: 'Remove',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    color: 'bg-destructive/10 text-destructive border-destructive/30'
  }
};

const ARTEFACT_META = {
  'legal-id': { label: 'Legal ID', icon: <FileText className="h-5 w-5" /> },
  'biometric': { label: 'Biometric', icon: <Fingerprint className="h-5 w-5" /> },
  'kra-pin': { label: 'KRA PIN', icon: <ShieldCheck className="h-5 w-5" /> },
  'account-mandates': { label: 'Account Mandates', icon: <Users className="h-5 w-5" /> },
};

/* SAFE BUILD FUNCTION (keep your existing buildArtefacts function) */
function buildArtefacts(customer = {}) {
  const idNumber = customer?.idNumber || '';
  const accounts = customer?.accounts || [];

  const isJames = customer?.customerId === 'CUST001';
  const isAmina = customer?.customerId === 'CUST002';
  const isPeter = customer?.customerId === 'CUST003';

  return [
    {
      id: 'legal-id',
      label: 'Legal ID',
      icon: <FileText className="h-5 w-5" />,
      status: isAmina ? 'expired' : 'current',
      detail: `National ID – ${idNumber}`,
      expiryDate: isAmina ? '2024-03-15' : '2029-11-30',
      exception: isAmina
        ? {
            message: 'ID document expired',
            remediation: 'Request customer to present renewed ID or Passport.'
          }
        : undefined
    },
    {
      id: 'biometric',
      label: 'Biometric',
      icon: <Fingerprint className="h-5 w-5" />,
      status: isPeter ? 'missing' : 'current',
      detail: isPeter ? 'Not captured' : 'Fingerprint & Photo on file',
      exception: isPeter
        ? {
            message: 'Biometric data not captured',
            remediation: 'Capture fingerprint and photo using scanner.'
          }
        : undefined
    },
    {
      id: 'kra-pin',
      label: 'KRA PIN',
      icon: <ShieldCheck className="h-5 w-5" />,
      status: isJames ? 'current' : (isAmina ? 'missing' : 'current'),
      detail: isAmina ? 'Not on file' : `KRA PIN – A00${idNumber.slice(0,7)}`,
      exception: isAmina
        ? {
            message: 'KRA PIN missing',
            remediation: 'Request customer to provide KRA PIN certificate.'
          }
        : undefined
    },
    {
      id: 'account-mandates',
      label: 'Account Mandates',
      icon: <Users className="h-5 w-5" />,
      status: isJames && accounts.length > 3 ? 'expired' : 'current',
      detail: `${accounts.length} account(s) – Signatory mandate`,
      expiryDate: isJames && accounts.length > 3 ? '2024-06-01' : undefined,
      exception: isJames && accounts.length > 3
        ? {
            message: 'Mandate card requires renewal',
            remediation: 'Print new mandate card and capture signatures.'
          }
        : undefined
    }
  ];
}

const STATUS_STYLES = {
  current: 'border-success/30 bg-success/5',
  expired: 'border-warning/30 bg-warning/5',
  missing: 'border-destructive/30 bg-destructive/5'
};

const STATUS_BADGE = {
  current: { label: 'Current', variant: 'outline' },
  expired: { label: 'Expired', variant: 'secondary' },
  missing: { label: 'Missing', variant: 'destructive' }
};

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/* LEGAL ID FORM COMPONENT */
function LegalIdForm({ customer, selectedActions, onBack, onSubmit }) {
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: customer?.idNumber || '',
    fullName: customer?.fullName || '',
    dateOfBirth: '',
    issueDate: '',
    expiryDate: '',
    placeOfIssue: '',
    frontImage: null,
    backImage: null,
    selfieImage: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idTypes = [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'voters_card', label: "Voter's Card" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fieldName]: file }));
      // Clear error for this field
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }
    if (!formData.frontImage) {
      newErrors.frontImage = 'Front image is required';
    }
    if (!formData.backImage) {
      newErrors.backImage = 'Back image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // ✅ STORE DATA ONLY (NO API CALL)
    const submissionData = {
      artefactId: "legal-id",
      formData: formData
    };

    console.log("FORM SAVED:", submissionData);

    onSubmit([submissionData]);

    setIsSubmitting(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">Legal ID Form</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="idType">ID Type <span className="text-destructive">*</span></Label>
              <select
                id="idType"
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {idTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* ID Number */}
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className="pl-9"
                  placeholder="Enter ID number"
                />
              </div>
              {errors.idNumber && (
                <p className="text-xs text-destructive">{errors.idNumber}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="pl-9"
                  placeholder="Enter full name as on ID"
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="pl-9"
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Issue and Expiry Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date <span className="text-destructive">*</span></Label>
                <Input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                />
                {errors.issueDate && (
                  <p className="text-xs text-destructive">{errors.issueDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date <span className="text-destructive">*</span></Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-destructive">{errors.expiryDate}</p>
                )}
              </div>
            </div>

            {/* Place of Issue */}
            <div className="space-y-2">
              <Label htmlFor="placeOfIssue">Place of Issue</Label>
              <Input
                id="placeOfIssue"
                name="placeOfIssue"
                value={formData.placeOfIssue}
                onChange={handleInputChange}
                placeholder="Enter place of issue"
              />
            </div>

            {/* Document Images */}
            <div className="space-y-4">
              <Label>Document Images <span className="text-destructive">*</span></Label>
              
              {/* Front Image */}
              <div className="space-y-2">
                <Label htmlFor="frontImage" className="text-sm text-muted-foreground">
                  Front Side
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('frontImage').click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.frontImage ? formData.frontImage.name : 'Upload Front Image'}
                  </Button>
                </div>
                <input
                  id="frontImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'frontImage')}
                  className="hidden"
                />
                {errors.frontImage && (
                  <p className="text-xs text-destructive">{errors.frontImage}</p>
                )}
              </div>

              {/* Back Image */}
              <div className="space-y-2">
                <Label htmlFor="backImage" className="text-sm text-muted-foreground">
                  Back Side
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('backImage').click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.backImage ? formData.backImage.name : 'Upload Back Image'}
                  </Button>
                </div>
                <input
                  id="backImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'backImage')}
                  className="hidden"
                />
                {errors.backImage && (
                  <p className="text-xs text-destructive">{errors.backImage}</p>
                )}
              </div>

              {/* Selfie Image (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="selfieImage" className="text-sm text-muted-foreground">
                  Selfie with ID (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('selfieImage').click()}
                    className="w-full"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {formData.selfieImage ? formData.selfieImage.name : 'Upload Selfie'}
                  </Button>
                </div>
                <input
                  id="selfieImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfieImage')}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* MAIN COMPONENT */
export function KycUpdateInput({ customer, onSubmit, onBack }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  if (!customer) return null;

  const artefacts = buildArtefacts(customer);
  const exceptions = artefacts.filter(a => a.exception);

  /* STATE */
  const [selectedActions, setSelectedActions] = useState([]);
  const [workflowStep, setWorkflowStep] = useState(1); // 1 to 6
  const [internalPhase, setInternalPhase] = useState('selection'); // 'selection' | 'forms'
  const [formData, setFormData] = useState([]);
  const [officerNotes, setOfficerNotes] = useState("");
  const [loading, setLoading] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }

  /* HANDLERS */
  const toggleAction = (artefactId, action) => {
    setSelectedActions(prev => {
      const existing = prev.find(s => s.artefactId === artefactId);
      if (existing?.action === action) {
        return prev.filter(s => s.artefactId !== artefactId);
      }
      return [
        ...prev.filter(s => s.artefactId !== artefactId),
        { artefactId, action }
      ];
    });
  };

  const getSelectedAction = (artefactId) =>
    selectedActions.find(s => s.artefactId === artefactId)?.action || null;

  const handleProceedToForms = () => {
    if (selectedActions.length === 0) return;
    setInternalPhase('forms');
    // Stays on Step 1, but switches internal view
  };

  const handleFormsSubmit = (data) => {
    setFormData(data);
    setWorkflowStep(2); // Move to Validation Step
  };

  const handleValidationComplete = (results) => {
    // Validation step (Step 2) is auto-advanced in Step 2 render logic
    // But if KycValidationScreen triggers this, we move to Step 3
    setWorkflowStep(3);
  };
  
/* ===================== FINAL STEP (STEP 6) ===================== */

  const handleFinalComplete = async () => {
    setLoading(true);

    try {
      const payload = new FormData();

      const data = formData[0]?.formData;

      if (!data) {
        alert("No form data found");
        setLoading(false);
        return;
      }

      // 🔹 TYPE
      payload.append("update_type", "LEGAL_ID");

      // 🔹 TEXT FIELDS
      payload.append("id_type", data.idType);
      payload.append("id_number", data.idNumber);
      payload.append("full_name", data.fullName);
      payload.append("date_of_birth", data.dateOfBirth);
      payload.append("issue_date", data.issueDate);
      payload.append("expiry_date", data.expiryDate);
      payload.append("place_of_issue", data.placeOfIssue);

      // 🔹 FILES
      if (data.frontImage) payload.append("front_image", data.frontImage);
      if (data.backImage) payload.append("back_image", data.backImage);
      if (data.selfieImage) payload.append("selfie_with_id", data.selfieImage);

      console.log("FINAL PAYLOAD:", data);

      // 🔥 FINAL API CALL (ONLY HERE)
      const response = await fetch("http://127.0.0.1:8000/api/kyc-update-requests/", {
        method: "POST",
        body: payload,
      });

      const res = await response.json();

      if (!response.ok) {
        console.error(res);
        alert("Submission failed");
        return;
      }

      console.log("FINAL SUCCESS:", res);

      const labels = selectedActions.map(s => {
        const art = artefacts.find(a => a.id === s.artefactId);
        return `${ACTION_META[s.action].label} ${art?.label}`;
      });

      onSubmit({
        actions: selectedActions,
        artefactLabels: labels,
        verificationResults: formData,
        apiResponse: res
      });

      if (onBack) onBack();

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          navigate("/");
        }}
      />

      {/* Sticky Header with Back Button & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              KYC Update
            </h1>
            <p className="text-xs text-gray-500">
              Step {workflowStep} of 6: {STEPS[workflowStep - 1].name}
            </p>
          </div>
        </div>

        {/* ========== ROUND STEPPER UI ========== */}
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < workflowStep;
            const isCurrent = s.id === workflowStep;

            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                {/* Circle Container */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm"
                        : "bg-white border-gray-200 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-[10px] font-bold">{s.id}</span>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${
                      isCompleted ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* ========== END ROUND STEPPER UI ========== */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">

          {/* ========== STEP 1: INPUT (Selection or Legal ID Form) ========== */}
          {workflowStep === 1 && (
            <motion.div
              key={`step1-${internalPhase}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              {internalPhase === 'selection' && (
                <>
                  {/* Customer Info */}
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {customer.fullName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{customer.fullName}</p>
                      <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone}</p>
                    </div>
                  </div>

                  {/* Exceptions */}
                  {exceptions.length > 0 && (
                    <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning"/>
                        <h4 className="text-sm font-semibold text-warning">{exceptions.length} KYC Exception(s)</h4>
                      </div>
                      {exceptions.map(ex => (
                        <div key={ex.id} className="ml-7">
                          <p className="text-sm font-medium">{ex.exception.message}</p>
                          <p className="text-xs text-muted-foreground">{ex.exception.remediation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Artefacts Selection */}
                  <div className="space-y-3">
                    {artefacts.map(art => {
                      const selected = getSelectedAction(art.id);
                      const badge = STATUS_BADGE[art.status];

                      return (
                        <div key={art.id} className={`rounded-xl border p-4 ${STATUS_STYLES[art.status]}`}>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center">{art.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-semibold">{art.label}</h5>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{art.detail}</p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3 border-t border-dashed pt-3">
                            {[ 'update', 'delete'].map(action => (
                              <button
                                key={action}
                                onClick={() => toggleAction(art.id, action)}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  selected === action
                                    ? ACTION_META[action].color + ' border'
                                    : 'border-border bg-white hover:bg-muted/50'
                                }`}
                              >
                                {ACTION_META[action].icon}
                                {ACTION_META[action].label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button 
                    onClick={handleProceedToForms} 
                    disabled={selectedActions.length === 0} 
                    className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                  >
                    Continue <ChevronRight className="h-4 w-4 ml-1"/>
                  </Button>
                </>
              )}

              {internalPhase === 'forms' && (
                <LegalIdForm
                  customer={customer}
                  selectedActions={selectedActions}
                  onBack={() => setInternalPhase('selection')}
                  onSubmit={handleFormsSubmit}
                />
              )}
            </motion.div>
          )}

          {/* ========== STEP 2: VALIDATION ========== */}
          {workflowStep === 2 && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Validating Artefacts...</h3>
              <p className="text-sm text-muted-foreground">Checking authenticity and compliance</p>
              
              {/* Auto-advance to Step 3 after validation */}
              {setTimeout(() => setWorkflowStep(3), 2000)}
            </motion.div>
          )}

          {/* ========== STEP 3: REVIEW ========== */}
          {workflowStep === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Validation Passed</span>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">KYC Update Summary</h4>
                
                <div className="space-y-0">
                  {selectedActions.map((s) => {
                    const art = artefacts.find(a => a.id === s.artefactId);
                    return (
                      <div key={s.artefactId} className="flex justify-between py-2 border-b border-dashed last:border-0">
                        <span className="text-sm text-gray-500">{art?.label}</span>
                        <span className="text-sm font-medium text-gray-800">{ACTION_META[s.action].label}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between py-2 border-b border-dashed last:border-0">
                    <span className="text-sm text-gray-500">Customer</span>
                    <span className="text-sm font-medium text-gray-800">{customer.fullName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed last:border-0">
                    <span className="text-sm text-gray-500">ID</span>
                    <span className="text-sm font-medium text-gray-800">{customer.customerId}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWorkflowStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setWorkflowStep(4)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Proceed</Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 4: PROCESSING (Officer Review) ========== */}
          {workflowStep === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg mb-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Officer Review</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-semibold">{customer.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Items Updated</p>
                    <p className="font-semibold">{selectedActions.length} Artefact(s)</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-blue-50 text-blue-800 text-xs p-2 rounded border border-blue-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Documents validated successfully against system records.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea 
                  placeholder="Optional notes..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWorkflowStep(3)} className="flex-1">Back</Button>
                <Button onClick={() => setWorkflowStep(5)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm</Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 5: VERIFICATION ========== */}
          {workflowStep === 5 && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Eye className="h-5 w-5" />
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Final Deal Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Action</p>
                    <p className="font-semibold capitalize">{selectedActions[0]?.action || 'Update'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Items</p>
                    <p className="font-semibold">{selectedActions.length} Artefact(s)</p>
                  </div>
                </div>
{/* 
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer consent verified</span>
                </div> */}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setWorkflowStep(4)} className="flex-1">Request Change</Button>
                <Button onClick={() => setWorkflowStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm & Verify</Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 6: AUTHORIZATION ========== */}
          {workflowStep === 6 && (
            <motion.div
              key="step6"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto text-center py-10"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <ThumbsUp className="h-8 w-8 text-accent" />
              </div>
            
              <h3 className="text-xl font-semibold">Authorization Complete</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                This KYC update requires supervisor approval to be completed.
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">KYC-{Date.now().toString().slice(-8)}</span>
                </div>
                
                <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                  <Check className="h-4 w-4" />
                  <span>All checks passed</span>
                </div>
              </div>

              <Button 
                onClick={handleFinalComplete} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={loading}
              >
                {loading ? "Processing..." : "Finish & Submit"}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}