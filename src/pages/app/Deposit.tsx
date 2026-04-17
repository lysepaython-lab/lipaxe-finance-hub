import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDepositMutation, useWalletsQuery } from '@/store/api/walletApi';
import { CreditCard, Building2, Smartphone, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Deposit = () => {
  const { t } = useTranslation();
  const { data: wallets } = useWalletsQuery();
  const [deposit, { isLoading }] = useDepositMutation();
  const [amount, setAmount] = useState('500');
  const [currency, setCurrency] = useState('USD');
  const [method, setMethod] = useState<'card' | 'bank' | 'mobile'>('card');
  const [done, setDone] = useState(false);

  const methods = [
    { id: 'card' as const, icon: CreditCard, label: t('deposit.card'), fee: '1.5%' },
    { id: 'bank' as const, icon: Building2, label: t('deposit.bank'), fee: 'Free' },
    { id: 'mobile' as const, icon: Smartphone, label: t('deposit.mobile'), fee: '1%' },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await deposit({ amount: amt, currency, method }).unwrap();
      toast.success(t('deposit.success'));
      setDone(true);
    } catch (e: any) { toast.error(e?.data?.detail || t('common.error')); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">{t('deposit.success')}</h2>
        <p className="text-muted-foreground mt-2">Your deposit of {formatMoney(parseFloat(amount), currency)} is being processed.</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" onClick={() => { setDone(false); setAmount('500'); }}>New deposit</Button>
          <Button asChild className="bg-gradient-brand"><a href="/app">Back to dashboard</a></Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('deposit.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('deposit.subtitle')}</p>
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6 space-y-6">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label>{t('deposit.amount')}</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="text-2xl font-display font-bold h-14 tabular" />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-32 h-14"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(wallets || []).map(w => <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('deposit.method')}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {methods.map(m => (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-smooth ${method === m.id ? 'border-primary bg-brand-50 dark:bg-brand-900/30' : 'border-border hover:border-primary/40'}`}>
                    <m.icon className="h-6 w-6 mb-2 text-primary" />
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Fee {m.fee}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('deposit.amount')}</span><span className="tabular">{formatMoney(parseFloat(amount) || 0, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('deposit.fee')}</span><span className="tabular">{formatMoney(0, currency)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>{t('deposit.youReceive')}</span><span className="tabular text-primary">{formatMoney(parseFloat(amount) || 0, currency)}</span></div>
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-brand shadow-brand text-base" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('deposit.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deposit;
