import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWalletsQuery, useWithdrawMutation } from '@/store/api/walletApi';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';

const Withdraw = () => {
  const { t } = useTranslation();
  const { data: wallets } = useWalletsQuery();
  const [withdraw, { isLoading }] = useWithdrawMutation();
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('200');
  const [destination, setDestination] = useState('Chase **** 8821');
  const [done, setDone] = useState(false);

  const wallet = wallets?.find(w => w.currency === currency);
  const fee = useMemo(() => Math.max(0.5, (parseFloat(amount) || 0) * 0.005), [amount]);
  const total = (parseFloat(amount) || 0) + fee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (wallet && total > wallet.available) { toast.error('Insufficient balance'); return; }
    try {
      await withdraw({ amount: amt, currency, destination }).unwrap();
      toast.success(t('withdraw.success'));
      setDone(true);
    } catch (e: any) { toast.error(e?.data?.detail || t('common.error')); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4"><Check className="h-8 w-8"/></div>
        <h2 className="font-display text-2xl font-bold">{t('withdraw.success')}</h2>
        <p className="text-muted-foreground mt-2">{formatMoney(parseFloat(amount), currency)} on its way to {destination}.</p>
        <Button asChild className="mt-6 bg-gradient-brand"><a href="/app">Back to dashboard</a></Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('withdraw.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('withdraw.subtitle')}</p>
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label>{t('withdraw.amount')}</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="text-2xl font-display font-bold h-14 tabular" />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-32 h-14"><SelectValue /></SelectTrigger>
                  <SelectContent>{(wallets || []).map(w => <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {wallet && <p className="text-xs text-muted-foreground">{t('withdraw.available')}: <span className="tabular font-medium text-foreground">{formatMoney(wallet.available, wallet.currency)}</span></p>}
            </div>

            <div className="space-y-2">
              <Label>{t('withdraw.destination')}</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chase **** 8821">🏦 Chase Bank •••• 8821</SelectItem>
                  <SelectItem value="HSBC **** 1102">🏦 HSBC •••• 1102</SelectItem>
                  <SelectItem value="MTN MoMo +233...">📱 MTN Mobile Money</SelectItem>
                  <SelectItem value="Wave +221...">📱 Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('withdraw.amount')}</span><span className="tabular">{formatMoney(parseFloat(amount) || 0, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('withdraw.fee')}</span><span className="tabular">{formatMoney(fee, currency)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>{t('withdraw.totalDebit')}</span><span className="tabular text-primary">{formatMoney(total, currency)}</span></div>
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-brand shadow-brand text-base" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('withdraw.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdraw;
