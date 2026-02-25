import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Fingerprint, FileText, Users, AlertTriangle, Check, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KycArtefactForms } from './KycArtefactForms';
import  KycValidationScreen  from './KycValidationScreen';

const ACTION_META = {
  add: { label: 'Add', icon: <Plus className="h-3.5 w-3.5" />, color: 'bg-success/10 text-success border-success/30' },
  update: { label: 'Update', icon: <Pencil className="h-3.5 w-3.5" />, color: 'bg-info/10 text-info border-info/30' },
  delete: { label: 'Remove', icon: <Trash2 className="h-3.5 w-3.5" />, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

function buildArtefacts(customer) {
  const isJames = customer.customerId === 'CUST001';
  const isAmina = customer.customerId === 'CUST002';
  const isPeter = customer.customerId === 'CUST003';

  return [
    {
      id: 'legal-id',
      label: 'Legal ID',
      icon: <FileText className="h-5 w-5" />,
      status: isAmina ? 'expired' : 'current',
      detail: `National ID – ${customer.idNumber}`,
      expiryDate: isAmina ? '2024-03-15' : '2029-11-30',
      exception: isAmina
        ? { message: 'ID document expired', remediation: 'Request customer to present a renewed National ID or valid Passport for re-verification.' }
        : undefined,
    },
    {
      id: 'biometric',
      label: 'Biometric',
      icon: <Fingerprint className="h-5 w-5" />,
      status: isPeter ? 'missing' : 'current',
      detail: isPeter ? 'Not captured' : 'Fingerprint & Photo on file',
      exception: isPeter
        ? { message: 'Biometric data not captured', remediation: 'Capture fingerprint and photo using the biometric scanner at the teller station.' }
        : undefined,
    },
    {
      id: 'kra-pin',
      label: 'KRA PIN',
      icon: <ShieldCheck className="h-5 w-5" />,
      status: isJames ? 'current' : (isAmina ? 'missing' : 'current'),
      detail: isAmina ? 'Not on file' : `KRA PIN – A00${customer.idNumber.slice(0, 7)}`,
      exception: isAmina
        ? { message: 'KRA PIN not on file', remediation: 'Request customer to provide their KRA PIN certificate for tax compliance.' }
        : undefined,
    },
    {
      id: 'account-mandates',
      label: 'Account Mandates',
      icon: <Users className="h-5 w-5" />,
      status: isJames && customer.accounts.length > 3 ? 'expired' : 'current',
      detail: `${customer.accounts.length} account(s) – Signatory mandate on file`,
      expiryDate: isJames && customer.accounts.length > 3 ? '2024-06-01' : undefined,
      exception: isJames && customer.accounts.length > 3
        ? { message: 'Mandate card requires renewal', remediation: 'Print new mandate card for customer signature. Ensure all joint signatories are present.' }
        : undefined,
    },
  ];
}

const STATUS_STYLES = {
  current: 'border-success/30 bg-success/5',
  expired: 'border-warning/30 bg-warning/5',
  missing: 'border-destructive/30 bg-destructive/5',
};

const STATUS_BADGE = {
  current: { label: 'Current', variant: 'outline' },
  expired: { label: 'Expired', variant: 'secondary' },
  missing: { label: 'Missing', variant: 'destructive' },
};

export function KycUpdateInput({ customer, onSubmit }) {
  const artefacts = buildArtefacts(customer);
  const exceptions = artefacts.filter(a => a.exception);
  const [selectedActions, setSelectedActions] = useState([]);
  const [phase, setPhase] = useState('selection');
  const [formData, setFormData] = useState([]);

  const toggleAction = (artefactId, action) => {
    setSelectedActions(prev => {
      const existing = prev.find(s => s.artefactId === artefactId);
      if (existing?.action === action) {
        return prev.filter(s => s.artefactId !== artefactId);
      }
      return [...prev.filter(s => s.artefactId !== artefactId), { artefactId, action }];
    });
  };

  const getSelectedAction = (artefactId) =>
    selectedActions.find(s => s.artefactId === artefactId)?.action || null;

  const handleProceedToForms = () => {
    if (selectedActions.length === 0) return;
    setPhase('forms');
  };

  const handleFormsSubmit = (data) => {
    setFormData(data);
    setPhase('validation');
  };

  const handleValidationComplete = (results) => {
    const labels = selectedActions.map(s => {
      const art = artefacts.find(a => a.id === s.artefactId);
      return `${ACTION_META[s.action].label} ${art?.label}`;
    });
    onSubmit({ actions: selectedActions, artefactLabels: labels, verificationResults: results });
  };

  // Phase: Detail forms
  if (phase === 'forms') {
    return (
      <KycArtefactForms
        customer={customer}
        selectedActions={selectedActions}
        onBack={() => setPhase('selection')}
        onSubmit={handleFormsSubmit}
      />
    );
  }

  // Phase: Validation
  if (phase === 'validation') {
    return (
      <KycValidationScreen
        formData={formData}
        onBack={() => setPhase('forms')}
        onComplete={handleValidationComplete}
      />
    );
  }

  // Phase: Selection (original UI)
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

      {/* KYC Exceptions alert */}
      {exceptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-warning/40 bg-warning/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <h4 className="text-sm font-semibold text-warning">
              {exceptions.length} KYC Exception{exceptions.length > 1 ? 's' : ''} Require Attention
            </h4>
          </div>
          {exceptions.map(ex => (
            <div key={ex.id} className="ml-7 space-y-1">
              <p className="text-sm font-medium text-foreground">{ex.exception.message}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-warning">Action required:</span> {ex.exception.remediation}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Current KYC Artefacts */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">KYC Artefacts</h4>
        <p className="text-xs text-muted-foreground">Select artefacts to add, update, or remove.</p>
      </div>

      <div className="space-y-3">
        {artefacts.map((art) => {
          const selected = getSelectedAction(art.id);
          const badge = STATUS_BADGE[art.status];
          return (
            <motion.div
              key={art.id}
              layout
              className={`rounded-xl border p-4 transition-all ${selected ? 'border-primary/40 bg-primary/5 shadow-sm' : STATUS_STYLES[art.status]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${art.status === 'current' ? 'bg-success/10 text-success' : art.status === 'expired' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                  {art.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-semibold text-foreground">{art.label}</h5>
                    <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{art.detail}</p>
                  {art.expiryDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {art.status === 'expired' ? 'Expired' : 'Expires'}: {art.expiryDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3 ml-[52px]">
                {(art.status === 'missing'
                  ? ['add']
                  : ['update', 'delete']
                ).map(action => {
                  const meta = ACTION_META[action];
                  const isActive = selected === action;
                  return (
                    <button
                      key={action}
                      onClick={() => toggleAction(art.id, action)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${isActive ? meta.color + ' ring-1 ring-offset-1 ring-offset-background' : 'border-border bg-background text-muted-foreground hover:bg-muted/50'}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selection summary */}
      {selectedActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2"
        >
          <h4 className="text-sm font-semibold text-foreground">Selected Actions ({selectedActions.length})</h4>
          {selectedActions.map(s => {
            const art = artefacts.find(a => a.id === s.artefactId);
            const meta = ACTION_META[s.action];
            return (
              <div key={s.artefactId} className="flex items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${meta.color}`}>
                  {meta.icon} {meta.label}
                </span>
                <span className="text-foreground font-medium">{art.label}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      <Button
        onClick={handleProceedToForms}
        disabled={selectedActions.length === 0}
        className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow"
      >
        {selectedActions.length === 0 ? 'Select artefacts to continue' : `Continue to ${selectedActions.length} Artefact Form${selectedActions.length > 1 ? 's' : ''}`}
        {selectedActions.length > 0 && <ChevronRight className="h-4 w-4 ml-1" />}
      </Button>
    </div>
  );
}
