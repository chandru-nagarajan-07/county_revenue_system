import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Camera, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KycBiometricScanner({ onComplete }) {
  const [step, setStep] = useState('idle');
  const [progress, setProgress] = useState(0);

  const [fingerprintData, setFingerprintData] = useState(null);
  const [photo, setPhoto] = useState(null);

  const simulateScan = useCallback((type) => {
    setStep(type === 'fingerprint' ? 'scanning-fingerprint' : 'scanning-photo');
    setProgress(0);
  }, []);

  useEffect(() => {
    if (step !== 'scanning-fingerprint' && step !== 'scanning-photo') return;

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);

          if (step === 'scanning-fingerprint') {
            setFingerprintData("fingerprint_sample_data_123"); // replace later
            setStep('fingerprint-done');
          } else {
            setPhoto("photo_base64_sample_123"); // replace later
            setStep('photo-done');
          }

          return 100;
        }
        return p + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [step]);

  const isScanning =
    step === 'scanning-fingerprint' || step === 'scanning-photo';

  const fingerprintDone =
    step === 'fingerprint-done' ||
    step === 'scanning-photo' ||
    step === 'photo-done' ||
    step === 'complete';

  const photoDone = step === 'photo-done' || step === 'complete';

  // 🔥 API CALL FUNCTION
  const submitBiometric = async () => {
    try {
      const formData = new FormData();

      // 🔥 required fields
      formData.append("update_type", "BIOMETRIC");

      // 🔥 send files (backend expects this)
      formData.append("fingerprint_data", fingerprintData);
      formData.append("photo_data", photo);

      const res = await fetch("https://snapsterbe.techykarthikbms.com/kyc-update-requests/", {
        method: "POST",
        body: formData, // ❗ no headers needed
      });

      const data = await res.json();
      console.log("SUCCESS:", data);

      setStep("complete");
      onComplete?.(data);

    } catch (err) {
      console.error("API ERROR:", err);
    }
  };
  return (
    <div className="space-y-6">

      <div className="text-center space-y-1">
        <h4 className="text-sm font-semibold">Biometric Capture</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Fingerprint */}
        <div className={`border p-6 rounded-xl text-center`}>
          {step === 'scanning-fingerprint' ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : fingerprintDone ? (
            <Check className="text-green-500 mx-auto" />
          ) : (
            <Fingerprint className="mx-auto" />
          )}

          <p>Fingerprint</p>

          {!fingerprintDone && (
            <Button onClick={() => simulateScan('fingerprint')}>
              Start Scan
            </Button>
          )}
        </div>

        {/* Photo */}
        <div className={`border p-6 rounded-xl text-center`}>
          {step === 'scanning-photo' ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : photoDone ? (
            <Check className="text-green-500 mx-auto" />
          ) : (
            <Camera className="mx-auto" />
          )}

          <p>Photo</p>

          {!photoDone && fingerprintDone && (
            <Button onClick={() => simulateScan('photo')}>
              Capture Photo
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {photoDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={submitBiometric} className="w-full">
              Confirm & Submit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}