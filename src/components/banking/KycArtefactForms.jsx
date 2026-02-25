import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, ChevronRight, ChevronLeft, ShieldCheck, Fingerprint, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KycBiometricScanner } from './KycBiometricScanner';

const ARTEFACT_META = {
  'legal-id': { label: 'Legal ID', icon: <FileText className="h-5 w-5" /> },
  'biometric': { label: 'Biometric', icon: <Fingerprint className="h-5 w-5" /> },
  'kra-pin': { label: 'KRA PIN', icon: <ShieldCheck className="h-5 w-5" /> },
  'account-mandates': { label: 'Account Mandates', icon: <Users className="h-5 w-5" /> },
};

const ID_TYPES = ['National ID', 'Passport', 'Alien ID', 'Military ID'];
const MANDATE_TYPES = ['Single', 'Joint – Any to Sign', 'Joint – All to Sign'];

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
      <ImageUpload label="KRA PIN Certificate" images={images} onAdd={onAddImage} onRemove={onRemoveImage} />
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
          {customer.accounts.filter(a => a.status === 'active').map(a => (
            <div key={a.accountNumber} className="flex justify-between">
              <span>{a.accountNumber}</span>
              <span className="text-muted-foreground">{a.currency}</span>
            </div>
          ))}
        </div>
      </div>
      <ImageUpload label="Signature Card Scan" images={images} onAdd={onAddImage} onRemove={onRemoveImage} />
    </div>
  );
}

export function KycArtefactForms({ customer, selectedActions, onBack, onSubmit }) {
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

  const isLast = currentIndex === selectedActions.length - 1;

  const handleNext = () => {
    if (isLast) {
      const result = selectedActions.map(sa => ({
        artefactId: sa.artefactId,
        action: sa.action,
        fields: formDataMap[sa.artefactId].fields,
        images: formDataMap[sa.artefactId].images,
        biometricData: formDataMap[sa.artefactId].biometricData,
      }));
      onSubmit(result);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <button onClick={currentIndex > 0 ? () => setCurrentIndex(i => i - 1) : onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          {currentIndex > 0 ? 'Previous' : 'Back to Selection'}
        </button>
        <span className="text-xs text-muted-foreground font-medium">
          {currentIndex + 1} of {selectedActions.length}
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {selectedActions.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      {/* Artefact header */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="text-xs text-muted-foreground capitalize">{current.action} artefact • {customer.fullName}</p>
        </div>
      </div>

      {/* Form */}
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

      {/* Next/Submit */}
      <Button onClick={handleNext} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold">
        {isLast ? 'Submit for Verification' : 'Next Artefact'}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
