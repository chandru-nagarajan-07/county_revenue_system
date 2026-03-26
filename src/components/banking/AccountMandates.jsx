import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

export function AccountMandates({ onComplete }) {
  const [formData, setFormData] = useState({
    mandateType: '',
    primarySignatory: '',
    secondarySignatory: '',
    applicableAccounts: [],
    signatureCard: null
  });
  
  const [signatureCardName, setSignatureCardName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const accounts = [
    { number: '0011-2345-6789', currency: 'KES' },
    { number: '0011-2345-6790', currency: 'KES' },
    { number: '0011-2345-6791', currency: 'USD' },
    { number: '0011-2345-6792', currency: 'KES' }
  ];

  const mandateTypes = [
    'Single Signatory',
    'Joint Signatories',
    'Either to Sign',
    'Multiple Signatories'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAccountToggle = (accountNumber) => {
    setFormData(prev => {
      const current = [...prev.applicableAccounts];
      const index = current.indexOf(accountNumber);
      
      if (index === -1) {
        current.push(accountNumber);
      } else {
        current.splice(index, 1);
      }
      
      return {
        ...prev,
        applicableAccounts: current
      };
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        signatureCard: file
      }));
      setSignatureCardName(file.name);
      
      // Clear error for signature card if it exists
      if (errors.signatureCard) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.signatureCard;
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.mandateType) {
      newErrors.mandateType = 'Please select a mandate type';
    }
    
    if (!formData.primarySignatory?.trim()) {
      newErrors.primarySignatory = 'Primary signatory name is required';
    }
    
    if (formData.applicableAccounts.length === 0) {
      newErrors.applicableAccounts = 'Please select at least one account';
    }
    
    if (!formData.signatureCard) {
      newErrors.signatureCard = 'Please upload a signature card';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitMandates = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('update_type', 'ACCOUNT_MANDATES');
      formDataToSend.append('mandate_type', formData.mandateType);
      formDataToSend.append('primary_signatory', formData.primarySignatory);
      formDataToSend.append('secondary_signatory', formData.secondarySignatory);
      formDataToSend.append('applicable_accounts', JSON.stringify(formData.applicableAccounts));
      formDataToSend.append('signature_card', formData.signatureCard);

      const res = await fetch('https://snapsterbe.techykarthikbms.com/kyc-update-requests/', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await res.json();
      console.log('SUCCESS:', data);
      
      onComplete?.(data);
      
    } catch (err) {
      console.error('API ERROR:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h4 className="text-sm font-semibold">Account Mandates</h4>
      </div>

      {/* Mandate Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Mandate Type</Label>
        <select
          value={formData.mandateType}
          onChange={(e) => handleInputChange('mandateType', e.target.value)}
          className={`w-full p-2 border rounded-md bg-background ${
            errors.mandateType ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select mandate type...</option>
          {mandateTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.mandateType && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.mandateType}
          </p>
        )}
      </div>

      {/* Primary Signatory */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Primary Signatory</Label>
        <Input
          value={formData.primarySignatory}
          onChange={(e) => handleInputChange('primarySignatory', e.target.value)}
          placeholder="Primary signatory name"
          className={errors.primarySignatory ? 'border-red-500' : ''}
        />
        {errors.primarySignatory && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.primarySignatory}
          </p>
        )}
      </div>

      {/* Secondary Signatory */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Secondary Signatory</Label>
        <Input
          value={formData.secondarySignatory}
          onChange={(e) => handleInputChange('secondarySignatory', e.target.value)}
          placeholder="Enter name (if applicable)"
        />
      </div>

      {/* Applicable Accounts */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Applicable Accounts</Label>
        <div className={`border rounded-md p-3 space-y-2 ${
          errors.applicableAccounts ? 'border-red-500' : ''
        }`}>
          {accounts.map((account) => (
            <div
              key={account.number}
              className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md transition-colors"
            >
              <Checkbox
                id={account.number}
                checked={formData.applicableAccounts.includes(account.number)}
                onCheckedChange={() => handleAccountToggle(account.number)}
              />
              <label
                htmlFor={account.number}
                className="flex-1 flex items-center justify-between cursor-pointer"
              >
                <span className="font-mono text-sm">{account.number}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  account.currency === 'USD' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {account.currency}
                </span>
              </label>
            </div>
          ))}
        </div>
        {errors.applicableAccounts && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.applicableAccounts}
          </p>
        )}
      </div>

      {/* Signature Card Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Signature Card Scan</Label>
        <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
          errors.signatureCard ? 'border-red-500' : 'border-gray-300'
        }`}>
          <input
            type="file"
            id="signature-card"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
          />
          
          {!formData.signatureCard ? (
            <label
              htmlFor="signature-card"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium">Upload Signature Card</span>
              <span className="text-xs text-gray-500">
                PDF, JPG or PNG (max 5MB)
              </span>
            </label>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm truncate max-w-[200px]">
                  {signatureCardName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({ ...prev, signatureCard: null }));
                  setSignatureCardName('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {errors.signatureCard && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.signatureCard}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.history.back?.()}
        >
          Cancel
        </Button>
        
        <Button
          className="flex-1"
          onClick={submitMandates}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit & Continue'
          )}
        </Button>
      </div>
    </div>
  );
}