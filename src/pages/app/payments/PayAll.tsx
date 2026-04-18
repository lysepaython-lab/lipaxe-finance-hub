import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users2, Plus, Trash2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

interface Row { id: string; recipient: string; amount: number; }

const PayAll = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([
    { id: '1', recipient: '@marie.d', amount: 50 },
    { id: '2', recipient: '@john.k', amount: 75 },
  ]);

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div>
      <PageHeader title={t('nav.payAll')} subtitle={t('payments.payAllSubtitle')} icon={<Users2 className="h-6 w-6" />} />
      <Card className="bg-gradient-card">
        <CardContent className="p-6 space-y-3">
          {rows.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-7" placeholder="@username" value={r.recipient} onChange={(e) => update(r.id, { recipient: e.target.value })} />
              <Input className="col-span-4 text-right tabular" type="number" min={0} placeholder="0.00" value={r.amount} onChange={(e) => update(r.id, { amount: Number(e.target.value) })} />
              <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </motion.div>
          ))}
          <Button variant="outline" onClick={() => setRows((rs) => [...rs, { id: String(Date.now()), recipient: '', amount: 0 }])}>
            <Plus className="mr-2 h-4 w-4" /> {t('payments.addRecipient')}
          </Button>
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t('payments.total')}</div>
              <div className="font-display text-2xl font-bold tabular">{formatMoney(total, 'USD')}</div>
            </div>
            <Button onClick={() => toast.success(t('payments.payAllSent'))} className="bg-gradient-brand shadow-brand h-11">
              <Send className="mr-2 h-4 w-4" /> {t('payments.payAllSend')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayAll;
