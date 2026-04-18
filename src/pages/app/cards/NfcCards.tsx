import { useState } from 'react';
import { motion } from 'framer-motion';
import { Nfc, Plus, Radio, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const initial = [
  { id: 'n1', label: 'Daily card', uid: '04:A2:9F:7C:1B:80', enabled: true, dailyLimit: 200 },
  { id: 'n2', label: 'Travel card', uid: '04:18:CE:11:22:FF', enabled: false, dailyLimit: 1000 },
];

const NfcCards = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState(initial);
  const [scanning, setScanning] = useState(false);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const id = 'n' + Date.now();
      setCards((c) => [{ id, label: t('cards.newNfc'), uid: '04:' + Array.from({ length: 5 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'), enabled: true, dailyLimit: 200 }, ...c]);
      toast.success(t('cards.nfcPaired'));
    }, 2200);
  };

  return (
    <div>
      <PageHeader
        title={t('nav.nfcCards')}
        subtitle={t('cards.nfcSubtitle')}
        icon={<Nfc className="h-6 w-6" />}
        actions={<Button onClick={startScan} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4"/>{t('cards.pairNew')}</Button>}
      />

      {scanning && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
        >
          <div className="relative mx-auto h-20 w-20">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.7 }}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-brand text-primary-foreground">
              <Radio className="h-8 w-8" />
            </div>
          </div>
          <p className="mt-4 font-medium">{t('cards.holdNear')}</p>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Nfc className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{c.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">{c.uid}</div>
                    </div>
                  </div>
                  <Badge variant={c.enabled ? 'default' : 'secondary'}>{c.enabled ? t('cards.active') : t('cards.disabled')}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    {t('cards.tapToPay')}
                  </div>
                  <Switch
                    checked={c.enabled}
                    onCheckedChange={(v) => setCards((cs) => cs.map((x) => x.id === c.id ? { ...x, enabled: v } : x))}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NfcCards;
