import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Camera, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KycBiometricScanner({ onComplete }) {
  const [step, setStep] = useState('idle');
  const [progress, setProgress] = useState(0);

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
          setStep(step === 'scanning-fingerprint' ? 'fingerprint-done' : 'photo-done');
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [step]);

  const isScanning = step === 'scanning-fingerprint' || step === 'scanning-photo';
  const fingerprintDone = step === 'fingerprint-done' || step === 'scanning-photo' || step === 'photo-done' || step === 'complete';
  const photoDone = step === 'photo-done' || step === 'complete';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h4 className="text-sm font-semibold text-foreground">Biometric Capture Station</h4>
        <p className="text-xs text-muted-foreground">Simulate fingerprint and photo capture</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fingerprint */}
        <div className={`rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-colors ${fingerprintDone ? 'border-success/40 bg-success/5' : isScanning && step === 'scanning-fingerprint' ? 'border-info/40 bg-info/5' : 'border-border bg-muted/20'}`}>
          <div className="relative h-20 w-20">
            <div className={`absolute inset-0 rounded-full flex items-center justify-center ${fingerprintDone ? 'bg-success/10' : 'bg-muted/30'}`}>
              {step === 'scanning-fingerprint' ? (
                <Loader2 className="h-10 w-10 text-info animate-spin" />
              ) : fingerprintDone ? (
                <Check className="h-10 w-10 text-success" />
              ) : (
                <Fingerprint className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {step === 'scanning-fingerprint' && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-info"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
          <span className="text-xs font-medium text-foreground">Fingerprint</span>
          {step === 'scanning-fingerprint' && (
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <motion.div className="h-full bg-info rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
          {fingerprintDone && <span className="text-[10px] text-success font-medium">Captured ✓</span>}
          {!fingerprintDone && step !== 'scanning-fingerprint' && (
            <Button size="sm" variant="outline" onClick={() => simulateScan('fingerprint')} className="text-xs h-7">
              Start Scan
            </Button>
          )}
        </div>

        {/* Photo */}
        <div className={`rounded-xl border-2 p-6 flex flex-col items-center gap-3 transition-colors ${photoDone ? 'border-success/40 bg-success/5' : isScanning && step === 'scanning-photo' ? 'border-info/40 bg-info/5' : 'border-border bg-muted/20'}`}>
          <div className="relative h-20 w-20">
            <div className={`absolute inset-0 rounded-full flex items-center justify-center ${photoDone ? 'bg-success/10' : 'bg-muted/30'}`}>
              {step === 'scanning-photo' ? (
                <Loader2 className="h-10 w-10 text-info animate-spin" />
              ) : photoDone ? (
                <Check className="h-10 w-10 text-success" />
              ) : (
                <Camera className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            {step === 'scanning-photo' && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-info"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
          <span className="text-xs font-medium text-foreground">Photo</span>
          {step === 'scanning-photo' && (
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <motion.div className="h-full bg-info rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
          {photoDone && <span className="text-[10px] text-success font-medium">Captured ✓</span>}
          {!photoDone && step !== 'scanning-photo' && fingerprintDone && (
            <Button size="sm" variant="outline" onClick={() => simulateScan('photo')} className="text-xs h-7">
              Capture Photo
            </Button>
          )}
          {!fingerprintDone && step !== 'scanning-fingerprint' && (
            <span className="text-[10px] text-muted-foreground">Complete fingerprint first</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {photoDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              onClick={() => {
                setStep('complete');
                onComplete({ fingerprintCaptured: true, photoCaptured: true });
              }}
              className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
            >
              Confirm Biometric Data
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
