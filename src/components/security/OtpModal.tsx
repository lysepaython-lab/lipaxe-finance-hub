import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (otp: string) => Promise<void> | void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export const OtpModal = ({ open, onOpenChange, onSubmit, title, description, loading }: OtpModalProps) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setTimeout(() => refs.current[0]?.focus(), 50);
    }
  }, [open]);

  const setAt = (i: number, v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[i] = cleaned;
      return next;
    });
    if (cleaned && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'Enter') void submit();
  };

  const submit = async () => {
    const otp = digits.join('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Code à 6 chiffres requis');
      return;
    }
    try {
      await onSubmit(otp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display">{title || 'Code de vérification'}</DialogTitle>
          <DialogDescription className="text-center">
            {description || 'Saisissez le code à 6 chiffres reçu (123456 en démo).'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="h-12 w-10 rounded-lg border-2 border-input bg-background text-center text-xl font-bold tabular-nums focus:border-primary focus:outline-none"
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <Button onClick={submit} disabled={loading} className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl mt-2">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Valider
        </Button>
      </DialogContent>
    </Dialog>
  );
};
