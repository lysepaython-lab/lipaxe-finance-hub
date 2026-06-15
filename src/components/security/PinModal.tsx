import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useVerifyPinMutation } from '@/store/api/platformApi';
import { Throttle, PIN_REGEX } from '@/lib/security';
import { toast } from 'sonner';

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (pin: string) => void;
  title?: string;
  description?: string;
}

const throttle = new Throttle(5, 60_000); // 5 attempts / minute

export const PinModal = ({ open, onOpenChange, onSuccess, title, description }: PinModalProps) => {
  const [verify, { isLoading }] = useVerifyPinMutation();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '', '']);
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
    if (cleaned && i < 4) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'Enter') void submit();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (text.length === 5) {
      e.preventDefault();
      setDigits(text.split(''));
      refs.current[4]?.focus();
    }
  };

  const submit = async () => {
    const pin = digits.join('');
    if (!PIN_REGEX.test(pin)) {
      setError('PIN à 5 chiffres requis');
      return;
    }
    if (!throttle.tryAcquire()) {
      setError('Trop de tentatives. Réessayez dans une minute.');
      return;
    }
    try {
      await verify({ pin }).unwrap();
      throttle.reset();
      onOpenChange(false);
      onSuccess(pin);
    } catch (e) {
      const detail = (e as { data?: { detail?: string } })?.data?.detail || 'PIN incorrect';
      setError(detail);
      setDigits(['', '', '', '', '']);
      refs.current[0]?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display">{title || 'Confirmez votre PIN'}</DialogTitle>
          <DialogDescription className="text-center">
            {description || 'Saisissez votre PIN à 5 chiffres pour autoriser cette action.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              inputMode="numeric"
              autoComplete="off"
              type="password"
              maxLength={1}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="h-14 w-12 rounded-xl border-2 border-input bg-background text-center text-2xl font-bold tabular-nums focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 transition-colors"
              aria-label={`PIN digit ${i + 1}`}
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

        <Button onClick={submit} disabled={isLoading} className="w-full bg-gradient-brand shadow-brand h-11 rounded-xl mt-2">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
          Confirmer
        </Button>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Hook helper: open PIN modal then run an action only if PIN was validated.
 */
export const usePinGate = () => {
  const [pending, setPending] = useState<null | ((pin: string) => void)>(null);
  const [open, setOpen] = useState(false);

  const guard = (action: (pin?: string) => void, _reason?: string) => {
    setPending(() => action);
    setOpen(true);
  };

  const onSuccess = (pin: string) => {
    pending?.(pin);
    setPending(null);
    toast.success('PIN vérifié');
  };

  return { open, setOpen, guard, onSuccess };
};
