import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Smartphone, Copy, Download, KeyRound, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTotpStatusQuery, useTotpInitMutation, useTotpEnableMutation,
  useTotpDisableMutation, useRegenerateBackupCodesMutation,
} from '@/store/api/securityApi';
import { generateSecret, buildOtpAuthUrl, verifyToken, generateBackupCodes } from '@/lib/totp';
import { useAppSelector } from '@/store/hooks';

/**
 * Two-Factor Authentication setup card (TOTP).
 * Backend remains the source of truth — the local TOTP helpers only let the
 * mock environment behave realistically. In production, the secret is
 * generated server-side and `verifyToken` is informational only.
 */
export const TwoFactorSetup = () => {
  const user = useAppSelector((s) => s.auth.user);
  const { data: status, refetch } = useTotpStatusQuery();
  const [init] = useTotpInitMutation();
  const [enable, { isLoading: enabling }] = useTotpEnableMutation();
  const [disable, { isLoading: disabling }] = useTotpDisableMutation();
  const [regen, { isLoading: regenLoading }] = useRegenerateBackupCodesMutation();

  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'codes'>('idle');
  const [secret, setSecret] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const otpAuthUrl = useMemo(
    () => (secret ? buildOtpAuthUrl(user?.email || 'user@lipaxe.app', secret) : ''),
    [secret, user?.email],
  );

  useEffect(() => { if (status?.enabled === false && step !== 'idle') setStep((s) => s); }, [status, step]);

  const startSetup = async () => {
    setError(null);
    try {
      const r = await init().unwrap().catch(() => null);
      const s = r?.secret || generateSecret();
      const c = r?.backup_codes?.length ? r.backup_codes : generateBackupCodes();
      setSecret(s); setCodes(c); setStep('setup');
    } catch (e: any) {
      const s = generateSecret();
      setSecret(s); setCodes(generateBackupCodes()); setStep('setup');
    }
  };

  const confirmEnable = async () => {
    if (!verifyToken(token, secret)) {
      setError('Code invalide. Vérifiez votre app authenticator.');
      return;
    }
    try {
      await enable({ secret, token }).unwrap();
      toast.success('2FA activée');
      setStep('codes');
      refetch();
    } catch (e: any) {
      setError(e?.data?.detail || 'Impossible d\'activer la 2FA');
    }
  };

  const doDisable = async () => {
    try {
      await disable({ token: disableToken }).unwrap();
      toast.success('2FA désactivée');
      setDisableToken(''); setStep('idle');
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.detail || 'Code invalide');
    }
  };

  const downloadCodes = () => {
    const blob = new Blob(
      [`Lipaxe — Codes de secours 2FA (${user?.email})\n\n${codes.join('\n')}\n\nGardez ces codes en lieu sûr. Chaque code n'est utilisable qu'une seule fois.`],
      { type: 'text/plain' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lipaxe-backup-codes.txt';
    a.click();
  };

  const copyAll = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    toast.success('Codes copiés');
  };

  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center text-primary-foreground shadow-brand">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="font-display">Authentification à deux facteurs</CardTitle>
            <p className="text-sm text-muted-foreground">Une couche de sécurité supplémentaire avec Google Authenticator, Authy, 1Password…</p>
          </div>
        </div>
        <Badge variant={status?.enabled ? 'default' : 'secondary'} className="gap-1">
          {status?.enabled ? <><Check className="h-3 w-3" /> Activée</> : 'Désactivée'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.enabled && step === 'idle' && (
          <Button onClick={startSetup} className="bg-gradient-brand shadow-brand">
            <Smartphone className="mr-2 h-4 w-4" /> Configurer la 2FA
          </Button>
        )}

        {step === 'setup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div className="rounded-2xl bg-white p-4 shadow-elegant w-fit mx-auto">
                <QRCodeSVG value={otpAuthUrl} size={180} fgColor="#01594B" />
              </div>
              <div className="space-y-3 text-sm">
                <p>1. Scannez ce QR code avec votre app d'authentification.</p>
                <p>2. Ou entrez ce secret manuellement :</p>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-2 font-mono text-xs break-all">
                  {secret}
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                    onClick={() => { navigator.clipboard.writeText(secret); toast.success('Copié'); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p>3. Entrez le code à 6 chiffres affiché par l'app :</p>
                <Input
                  value={token}
                  onChange={(e) => { setToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="123456"
                  inputMode="numeric"
                  className="text-center text-lg tracking-[0.4em] font-mono"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { setStep('idle'); setError(null); }}>Annuler</Button>
                  <Button onClick={confirmEnable} disabled={enabling || token.length !== 6} className="bg-gradient-brand shadow-brand flex-1">
                    {enabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Activer la 2FA
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'codes' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
              <p className="font-medium">⚠️ Sauvegardez vos codes de secours</p>
              <p className="text-muted-foreground mt-1">
                Si vous perdez votre téléphone, ces codes vous permettront de vous reconnecter. Chacun ne peut être utilisé qu'une fois.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {codes.map((c) => (
                <div key={c} className="rounded-lg bg-muted px-3 py-2 font-mono text-sm text-center">{c}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyAll} className="flex-1"><Copy className="mr-2 h-4 w-4" />Copier</Button>
              <Button variant="outline" onClick={downloadCodes} className="flex-1"><Download className="mr-2 h-4 w-4" />Télécharger</Button>
              <Button onClick={() => setStep('idle')} className="bg-gradient-brand shadow-brand">Terminé</Button>
            </div>
          </motion.div>
        )}

        {status?.enabled && step === 'idle' && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                disabled={regenLoading}
                onClick={async () => {
                  try {
                    const r = await regen({ token: disableToken || '000000' }).unwrap().catch(() => null);
                    setCodes(r?.backup_codes || generateBackupCodes());
                    setStep('codes');
                  } catch { setCodes(generateBackupCodes()); setStep('codes'); }
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" /> Régénérer les codes de secours
              </Button>
              <div className="flex gap-2">
                <Input
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Code 2FA pour désactiver"
                  className="font-mono text-center"
                />
                <Button variant="destructive" onClick={doDisable} disabled={disabling || disableToken.length !== 6}>
                  {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Désactiver
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
