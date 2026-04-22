import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { Loader2, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().trim().email('Email invalide').max(255),
});

interface Props {
  open: boolean;
  currentEmail: string;
  onClose: () => void;
  onSubmit: (newEmail: string) => Promise<void> | void;
}

/**
 * Lets a user fix a wrong email *before* their account is verified.
 * Backend must (a) ensure the new email isn't already taken, (b) invalidate
 * any pending OTPs for the old address, and (c) issue a fresh OTP.
 */
export const EditEmailModal = ({ open, currentEmail, onClose, onSubmit }: Props) => {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      setError('La nouvelle adresse doit être différente.');
      return;
    }
    setError(null);
    setBusy(true);
    try { await onSubmit(email.trim()); } catch (e: any) { setError(e?.data?.detail || e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground shadow-brand mb-2">
            <Mail className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Corriger votre email</DialogTitle>
          <DialogDescription className="text-center">
            Si vous n'avez pas reçu le code à <span className="font-medium text-foreground">{currentEmail}</span>,
            vous pouvez utiliser une autre adresse. Un nouveau code sera envoyé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-email">Nouvelle adresse email</Label>
          <Input
            id="new-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="vous@exemple.com"
            disabled={busy}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button onClick={submit} disabled={busy} className="bg-gradient-brand shadow-brand">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre à jour & renvoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
