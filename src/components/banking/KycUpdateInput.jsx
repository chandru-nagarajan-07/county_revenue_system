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
  Check,
  Shield,
  Eye,
  ThumbsUp,
  Zap,
  Star,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import KycArtefactForms from './KycArtefactForms';
import KycValidationScreen from './KycValidationScreen';

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const ACTION_META = {
  add: {
    label: 'Add',
    icon: <Plus className="h-3.5 w-3.5" />,
    color: 'bg-success/10 text-success border-success/30'
  },
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

/* SAFE BUILD FUNCTION */
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
  
  const handleFinalComplete = async () => {
    setLoading(true);
    
    const labels = selectedActions.map(s => {
      const art = artefacts.find(a => a.id === s.artefactId);
      return `${ACTION_META[s.action].label} ${art?.label}`;
    });

    // Simulate processing
    await new Promise(r => setTimeout(r, 1000));
    
    onSubmit({
      actions: selectedActions,
      artefactLabels: labels,
      verificationResults: formData
    });
    
    setLoading(false);
    if(onBack) onBack();
  };

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">

          {/* ========== STEP 1: INPUT (Selection or Forms) ========== */}
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
                            {['add', 'update', 'delete'].map(action => (
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

                  <Button onClick={handleProceedToForms} disabled={selectedActions.length === 0} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold">
                    Continue <ChevronRight className="h-4 w-4 ml-1"/>
                  </Button>
                </>
              )}

              {internalPhase === 'forms' && (
                <KycArtefactForms
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
              
              {/* We render the actual validation screen logic here, or auto-advance */}
              <div className="hidden">
                 <KycValidationScreen
                  formData={formData}
                  onBack={() => setWorkflowStep(1)}
                  onComplete={(results) => {
                    // Auto advance after logic completes
                    setTimeout(() => setWorkflowStep(3), 1500);
                  }}
                />
              </div>
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

                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer consent verified</span>
                </div>
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