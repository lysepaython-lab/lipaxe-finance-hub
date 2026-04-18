import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { QrCode, Camera, Send, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store/hooks';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const TransferQr = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [scanned, setScanned] = useState<{ recipient: string; amount: number } | null>(null);

  const payload = JSON.stringify({
    type: 'lipaxe.pay',
    to: user?.username || 'demo.user',
    amount: amount || 0,
    note,
    ts: Date.now(),
  });

  const simulateScan = () => {
    setScanned({ recipient: '@marie.d', amount: 42 });
    toast.success(t('transfer.qrScanned'));
  };

  const confirm = () => {
    if (!scanned) return;
    toast.success(t('transfer.success'));
    setScanned(null);
  };

  return (
    <div>
      <PageHeader title={t('nav.transferQr')} subtitle={t('transfer.qrSubtitle')} icon={<QrCode className="h-6 w-6" />} />

      <Tabs defaultValue="receive">
        <TabsList className="rounded-xl">
          <TabsTrigger value="receive" className="rounded-lg">{t('transfer.qrReceive')}</TabsTrigger>
          <TabsTrigger value="pay" className="rounded-lg">{t('transfer.qrPay')}</TabsTrigger>
        </TabsList>

        <TabsContent value="receive">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gradient-card">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>{t('common.amount')}</Label>
                  <Input type="number" min={0} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('transfer.note')}</Label>
                  <Input placeholder="Coffee ☕" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">{t('transfer.qrShareHint')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-2xl bg-white p-4 shadow-elegant"
                >
                  <QRCode value={payload} size={220} level="H" />
                </motion.div>
                <div className="text-center">
                  <div className="font-semibold">@{user?.username || 'demo.user'}</div>
                  {amount !== '' && <div className="text-sm text-muted-foreground tabular">{formatMoney(Number(amount), 'USD')}</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pay">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[280px] gap-4">
                <motion.div
                  animate={{ borderColor: ['hsl(var(--primary)/0.3)', 'hsl(var(--primary))', 'hsl(var(--primary)/0.3)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-44 w-44 rounded-2xl border-4 border-dashed flex items-center justify-center text-muted-foreground"
                >
                  <Camera className="h-12 w-12" />
                </motion.div>
                <Button onClick={simulateScan} variant="outline">{t('transfer.simulateScan')}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                {!scanned ? (
                  <p className="text-muted-foreground text-sm text-center py-12">{t('transfer.qrPointHint')}</p>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="text-sm text-muted-foreground">{t('transfer.recipient')}</div>
                      <div className="font-display text-xl font-bold">{scanned.recipient}</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="text-sm text-muted-foreground">{t('common.amount')}</div>
                      <div className="font-display text-2xl font-bold tabular">{formatMoney(scanned.amount, 'USD')}</div>
                    </div>
                    <Button onClick={confirm} className="w-full bg-gradient-brand shadow-brand h-11">
                      <Send className="mr-2 h-4 w-4" /> {t('transfer.confirm')}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransferQr;
