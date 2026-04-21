import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight, Loader2, AlertOctagon, Wallet } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQrInfoQuery } from '@/store/api/walletApi';
import { useAppSelector } from '@/store/hooks';
import { formatMoney } from '@/lib/format';

const PublicQrLanding = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const isAuthed = useAppSelector((s) => !!s.auth.accessToken);
  const { data: info, isLoading, error } = useQrInfoQuery(token, { skip: !token });

  // Persist token so the user lands on the validation page after auth.
  useEffect(() => {
    if (token) sessionStorage.setItem('lipaxe_qr_pending', token);
  }, [token]);

  // If already authenticated, jump directly to the in-app validation flow.
  useEffect(() => {
    if (isAuthed && token) navigate(`/app/transfer/qr?token=${token}`, { replace: true });
  }, [isAuthed, token, navigate]);

  const continueWith = (path: 'login' | 'register') => {
    const next = `/app/transfer/qr?token=${token}`;
    const ref = `LIPAXE-QR-${token.slice(0, 6).toUpperCase()}`;
    const qs = new URLSearchParams({ redirect: next });
    if (path === 'register') qs.set('reference', ref);
    navigate(`/${path}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen relative bg-background">
      <AnimatedBackground />
      <header className="relative flex items-center justify-between p-4 lg:p-6">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex items-center justify-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-5"
        >
          <Card className="shadow-elegant overflow-hidden border-border/60">
            <div className="bg-gradient-hero p-6 text-primary-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
                <ShieldCheck className="h-4 w-4" /> Demande de paiement Lipaxe
              </div>
              <h1 className="font-display text-2xl font-bold mt-2">
                Vous avez reçu une demande
              </h1>
            </div>
            <CardContent className="p-6 space-y-5">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ) : error || !info ? (
                <div className="text-center space-y-2 py-4">
                  <AlertOctagon className="h-10 w-10 mx-auto text-destructive" />
                  <p className="font-semibold">QR introuvable, expiré ou déjà utilisé.</p>
                  <p className="text-sm text-muted-foreground">Demandez un nouveau lien à l'expéditeur.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">De</p>
                    <p className="font-display text-lg font-semibold">{info.sender}</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <p className="text-xs text-muted-foreground">Montant à recevoir</p>
                    <p className="font-display text-3xl font-bold tabular-nums text-primary mt-1">
                      {formatMoney(info.amount, info.currency)}
                    </p>
                    {info.amount > 100 && (
                      <p className="text-[11px] text-warning mt-2 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> OTP requis pour montant {'>'}100
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-border p-4 text-center space-y-1">
                    <Wallet className="h-6 w-6 mx-auto text-primary" />
                    <p className="text-sm font-semibold">Connectez-vous pour récupérer ces fonds</p>
                    <p className="text-xs text-muted-foreground">
                      Pas encore de compte ? Créez-le en 30 secondes — c'est gratuit.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      onClick={() => continueWith('register')}
                      className="bg-gradient-brand shadow-brand h-11 rounded-xl"
                    >
                      Créer un compte et recevoir <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => continueWith('login')}
                      className="h-11 rounded-xl"
                    >
                      J'ai déjà un compte
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            <Lock className="inline h-3 w-3 mr-1" />
            Paiement chiffré et vérifié par Lipaxe.
            {!isLoading && info && (
              <> Expire le {new Date(info.expires_at || Date.now()).toLocaleString()}.</>
            )}
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default PublicQrLanding;
