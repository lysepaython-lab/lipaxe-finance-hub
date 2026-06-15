import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Nfc, Radio, Send, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const TransferNfc = () => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number | ''>('');
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'detected' | 'sent'>('idle');
  const [target, setTarget] = useState<string>('');
  const isMobileDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900;
  }, []);

  const start = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t('transfer.amountRequired'));
      return;
    }
    setPhase('scanning');
    setTimeout(() => {
      setTarget('@adaeze.o');
      setPhase('detected');
    }, 2000);
  };

  const send = () => {
    setPhase('sent');
    toast.success(t('transfer.success'));
    setTimeout(() => {
      setPhase('idle');
      setAmount('');
      setTarget('');
    }, 1800);
  };

  return (
    <div>
      <PageHeader title={t('nav.transferNfc')} subtitle={t('transfer.nfcSubtitle')} icon={<Nfc className="h-6 w-6" />} />

      {!isMobileDevice ? (
        <Card className="mx-auto max-w-2xl overflow-hidden border-border/60 bg-gradient-card shadow-elegant">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Smartphone className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">NFC disponible sur mobile</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pour proteger la transaction, le transfert NFC utilise le materiel du telephone et la validation PIN/biometrie dans l'app Lipaxe.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4 font-semibold">App Store</div>
              <div className="rounded-2xl border border-border bg-background p-4 font-semibold">Google Play</div>
            </div>
          </CardContent>
        </Card>
      ) : (

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-card">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input type="number" min={0} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <Button onClick={start} disabled={phase !== 'idle'} className="w-full bg-gradient-brand shadow-brand h-11">
              <Radio className="mr-2 h-4 w-4" /> {t('transfer.nfcStart')}
            </Button>
            <p className="text-xs text-muted-foreground text-center">{t('transfer.nfcHint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[320px]">
            {phase === 'idle' && (
              <div className="text-center text-muted-foreground space-y-2">
                <Nfc className="h-12 w-12 mx-auto opacity-40" />
                <p>{t('transfer.nfcReady')}</p>
              </div>
            )}
            {phase === 'scanning' && (
              <div className="relative">
                {[0, 0.5, 1].map((d) => (
                  <motion.div
                    key={d}
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: d }}
                    style={{ top: '50%', left: '50%', width: 80, height: 80, marginTop: -40, marginLeft: -40 }}
                  />
                ))}
                <div className="h-32 w-32 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground shadow-brand">
                  <Nfc className="h-12 w-12" />
                </div>
                <p className="mt-6 text-center font-medium">{t('transfer.nfcSearching')}</p>
              </div>
            )}
            {phase === 'detected' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xs space-y-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">{t('transfer.nfcDetected')}</div>
                  <div className="font-display text-2xl font-bold mt-1">{target}</div>
                  <div className="text-3xl font-display font-bold tabular mt-2">{formatMoney(Number(amount), 'USD')}</div>
                </div>
                <Button onClick={send} className="w-full bg-gradient-brand shadow-brand h-11">
                  <Send className="mr-2 h-4 w-4" /> {t('transfer.confirm')}
                </Button>
              </motion.div>
            )}
            {phase === 'sent' && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-24 w-24 rounded-full bg-success text-success-foreground flex items-center justify-center text-4xl"
              >
                ✓
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
};

export default TransferNfc;
