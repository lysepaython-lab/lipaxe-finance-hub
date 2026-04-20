import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, XCircle, Loader2, Eye, ArrowLeftRight, Smile, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useLivenessMutation, type LivenessResult } from '@/store/api/kycApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 'idle' | 'look' | 'blink' | 'turn' | 'smile' | 'capture' | 'processing' | 'success' | 'failed';

interface LivenessCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: LivenessResult) => void;
}

const STEPS: { key: Step; label: string; instruction: string; icon: React.ReactNode; durationMs: number }[] = [
  { key: 'look', label: 'Centrez votre visage', instruction: 'Regardez droit la caméra', icon: <Camera className="h-5 w-5" />, durationMs: 2500 },
  { key: 'blink', label: 'Clignez 2 fois', instruction: 'Clignez des yeux deux fois', icon: <Eye className="h-5 w-5" />, durationMs: 3500 },
  { key: 'turn', label: 'Tournez la tête', instruction: 'Tournez doucement à gauche puis à droite', icon: <ArrowLeftRight className="h-5 w-5" />, durationMs: 4000 },
  { key: 'smile', label: 'Souriez', instruction: 'Faites un grand sourire', icon: <Smile className="h-5 w-5" />, durationMs: 2500 },
];

const MAX_ATTEMPTS = 3;

export const LivenessCapture = ({ open, onOpenChange, onSuccess }: LivenessCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<Blob[]>([]);
  const captureIntervalRef = useRef<number | null>(null);

  const [step, setStep] = useState<Step>('idle');
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [submit, { isLoading }] = useLivenessMutation();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, []);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setStep('idle');
      setStepIdx(0);
      setProgress(0);
      setErrors([]);
      framesRef.current = [];
    }
  }, [open, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      framesRef.current = [];
      // Capture a frame every 400ms during the guided flow
      captureIntervalRef.current = window.setInterval(() => {
        captureFrame();
      }, 400);
      runSequence();
    } catch (err) {
      const msg = (err as Error)?.message || 'Camera access denied';
      toast.error(`Caméra: ${msg}`);
      setStep('failed');
      setErrors(['Accès caméra refusé. Autorisez l’accès dans le navigateur.']);
    }
  };

  const captureFrame = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => { if (blob) framesRef.current.push(blob); }, 'image/jpeg', 0.7);
  };

  const runSequence = async () => {
    for (let i = 0; i < STEPS.length; i++) {
      setStepIdx(i);
      setStep(STEPS[i].key);
      const start = Date.now();
      const dur = STEPS[i].durationMs;
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          const p = Math.min(100, ((Date.now() - start) / dur) * 100);
          setProgress(p);
          if (p >= 100) { clearInterval(id); resolve(); }
        }, 50);
      });
    }
    setStep('capture');
    await new Promise((r) => setTimeout(r, 300));
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    await sendForVerification();
  };

  const sendForVerification = async () => {
    setStep('processing');
    setErrors([]);
    const fd = new FormData();
    // Take last 8 representative frames to keep payload reasonable
    const frames = framesRef.current.slice(-8);
    if (frames.length === 0) {
      setErrors(['Aucune image capturée. Réessayez.']);
      setStep('failed');
      return;
    }
    frames.forEach((blob, i) => fd.append('frames', blob, `frame_${i}.jpg`));
    try {
      const res = await submit(fd).unwrap();
      const errs: string[] = [];
      if (!res.is_live) errs.push('Présence non détectée');
      if (res.blink_valid === false) errs.push('Clignements insuffisants');
      if (!res.head_movement) errs.push('Mouvement de tête insuffisant');
      if (!res.smile_detected) errs.push('Sourire non détecté');
      if (errs.length === 0 && res.is_live) {
        setStep('success');
        stopCamera();
        setTimeout(() => { onSuccess(res); onOpenChange(false); }, 900);
      } else {
        setErrors(errs.length ? errs : [res.error || 'Vérification échouée']);
        setStep('failed');
        stopCamera();
        setAttempts((a) => a + 1);
      }
    } catch (e) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail || 'Erreur de vérification';
      setErrors([detail]);
      setStep('failed');
      stopCamera();
      setAttempts((a) => a + 1);
    }
  };

  const retry = () => {
    if (attempts >= MAX_ATTEMPTS) {
      toast.error('Nombre maximum de tentatives atteint.');
      onOpenChange(false);
      return;
    }
    setStep('idle');
    setStepIdx(0);
    setProgress(0);
    setErrors([]);
    framesRef.current = [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-display text-xl">Vérification de présence</DialogTitle>
          <DialogDescription>
            Pour votre sécurité, nous vérifions que c'est bien vous via la caméra.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Steps stepper */}
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1 flex items-center gap-1.5">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0',
                  i < stepIdx || step === 'success' ? 'bg-success text-success-foreground border-success' :
                  i === stepIdx && step !== 'idle' ? 'border-primary text-primary bg-primary/10' :
                  'border-input text-muted-foreground',
                )}>
                  {i < stepIdx || step === 'success' ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 rounded-full', i < stepIdx ? 'bg-success' : 'bg-input')} />
                )}
              </div>
            ))}
          </div>

          {/* Camera preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-border">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
              aria-label="Camera preview"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay states */}
            <AnimatePresence>
              {step === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <Camera className="h-12 w-12 text-primary mb-3" />
                  <p className="font-display font-semibold">Prêt à commencer ?</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs px-4">
                    Placez votre visage dans le cadre et suivez les instructions.
                  </p>
                  <Button onClick={startCamera} className="bg-gradient-brand shadow-brand">
                    <Camera className="mr-2 h-4 w-4" /> Démarrer
                  </Button>
                </motion.div>
              )}

              {(step === 'processing' || isLoading) && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm"
                >
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="font-medium">Analyse en cours…</p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-success/15 backdrop-blur-sm"
                >
                  <CheckCircle2 className="h-16 w-16 text-success mb-2" />
                  <p className="font-display text-lg font-bold text-success">Vérifié</p>
                </motion.div>
              )}

              {step === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 backdrop-blur-sm p-4"
                >
                  <XCircle className="h-12 w-12 text-destructive mb-2" />
                  <p className="font-semibold text-destructive mb-2">Vérification échouée</p>
                  <ul className="text-sm text-center space-y-0.5 mb-3">
                    {errors.map((e, i) => <li key={i} className="text-muted-foreground">• {e}</li>)}
                  </ul>
                  {attempts < MAX_ATTEMPTS ? (
                    <Button onClick={retry} variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-3.5 w-3.5" /> Réessayer ({MAX_ATTEMPTS - attempts} restantes)
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tentatives épuisées. Réessayez plus tard.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active instruction overlay */}
            {(['look', 'blink', 'turn', 'smile', 'capture'] as Step[]).includes(step) && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 left-3 right-3 rounded-xl bg-background/85 backdrop-blur px-4 py-2.5 flex items-center gap-3 border border-border shadow-lg"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {STEPS[stepIdx]?.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{STEPS[stepIdx]?.label}</p>
                  <p className="text-xs text-muted-foreground">{STEPS[stepIdx]?.instruction}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Step progress */}
          {(['look', 'blink', 'turn', 'smile'] as Step[]).includes(step) && (
            <Progress value={progress} className="h-1.5" />
          )}

          <p className="text-[11px] text-center text-muted-foreground">
            🔒 Aucune image n'est stockée localement. Seul le résultat de la vérification est conservé.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
