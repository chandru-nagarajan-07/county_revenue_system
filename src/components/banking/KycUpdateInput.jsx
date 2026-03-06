import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Fingerprint,
  FileText,
  Users,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { KycArtefactForms } from './KycArtefactForms';
import KycValidationScreen from './KycValidationScreen';

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
            remediation:
              'Request customer to present renewed ID or Passport.'
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
            remediation:
              'Capture fingerprint and photo using scanner.'
          }
        : undefined
    },

    {
      id: 'kra-pin',
      label: 'KRA PIN',
      icon: <ShieldCheck className="h-5 w-5" />,
      status: isJames ? 'current' : (isAmina ? 'missing' : 'current'),
      detail: isAmina
        ? 'Not on file'
        : `KRA PIN – A00${idNumber.slice(0,7)}`,
      exception: isAmina
        ? {
            message: 'KRA PIN missing',
            remediation:
              'Request customer to provide KRA PIN certificate.'
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
      exception:
        isJames && accounts.length > 3
          ? {
              message: 'Mandate card requires renewal',
              remediation:
                'Print new mandate card and capture signatures.'
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

export function KycUpdateInput({ customer, onSubmit }) {

  if (!customer) return null;

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

    onSubmit({
      actions: selectedActions,
      artefactLabels: labels,
      verificationResults: results
    });
  };

  /* FORMS SCREEN */
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

  /* VALIDATION SCREEN */
  if (phase === 'validation') {
    return (
      <KycValidationScreen
        formData={formData}
        onBack={() => setPhase('forms')}
        onComplete={handleValidationComplete}
      />
    );
  }

  /* MAIN UI */
  return (
    <div className="space-y-6 max-w-lg mx-auto">

      {/* CUSTOMER INFO */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {customer.fullName?.split(' ')
            .map(n => n[0])
            .join('')
            .slice(0,2)}
        </div>

        <div>
          <p className="text-sm font-semibold">
            {customer.fullName}
          </p>
          <p className="text-xs text-muted-foreground">
            {customer.customerId} • {customer.phone}
          </p>
        </div>
      </div>

      {/* EXCEPTIONS */}
      {exceptions.length > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 space-y-3">

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning"/>
            <h4 className="text-sm font-semibold text-warning">
              {exceptions.length} KYC Exception
            </h4>
          </div>

          {exceptions.map(ex => (
            <div key={ex.id} className="ml-7">
              <p className="text-sm font-medium">
                {ex.exception.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {ex.exception.remediation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ARTEFACTS */}
      <div className="space-y-3">

        {artefacts.map(art => {

          const selected = getSelectedAction(art.id);
          const badge = STATUS_BADGE[art.status];

          return (
            <motion.div
              key={art.id}
              layout
              className={`rounded-xl border p-4 ${STATUS_STYLES[art.status]}`}
            >

              <div className="flex items-center gap-3">

                <div className="h-10 w-10 rounded-lg flex items-center justify-center">
                  {art.icon}
                </div>

                <div className="flex-1">

                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-semibold">
                      {art.label}
                    </h5>

                    <Badge variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {art.detail}
                  </p>

                </div>

              </div>

            </motion.div>
          );

        })}
      </div>

      <Button
        onClick={handleProceedToForms}
        disabled={selectedActions.length === 0}
        className="w-full"
      >
        Continue
        <ChevronRight className="h-4 w-4 ml-1"/>
      </Button>

    </div>
  );
}