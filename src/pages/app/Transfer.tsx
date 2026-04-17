import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFxQuoteMutation, useTransferMutation, useWalletsQuery } from '@/store/api/walletApi';
import { Loader2, Check, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/format';

const COUNTRIES = [
  { code: 'EUR', name: 'France 🇫🇷', delivery: 'instant' },
  { code: 'GBP', name: 'United Kingdom 🇬🇧', delivery: 'instant' },
  { code: 'NGN', name: 'Nigeria 🇳🇬', delivery: '2h' },
  { code: 'GHS', name: 'Ghana 🇬🇭', delivery: '2h' },
  { code: 'XOF', name: 'Senegal 🇸🇳', delivery: '4h' },
  { code: 'KES', name: 'Kenya 🇰🇪', delivery: '4h' },
  { code: 'JPY', name: 'Japan 🇯🇵', delivery: '24h' },
];

const Transfer = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { data: wallets } = useWalletsQuery();
  const [kind, setKind] = useState<'internal' | 'international'>(params.get('intl') ? 'international' : 'internal');
  const [recipient, setRecipient] = useState('@marie.d');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('250');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [getQuote, { data: quote, isLoading: quoting }] = useFxQuoteMutation();
  const [transfer, { isLoading }] = useTransferMutation();

  useEffect(() => {
    const amt = parseFloat(amount);
    if (kind === 'international' && amt > 0) {
      const id = setTimeout(() => { getQuote({ from: fromCurrency, to: toCurrency, amount: amt }); }, 250);
      return () => clearTimeout(id);
    }
  }, [amount, fromCurrency, toCurrency, kind, getQuote]);

  const fee = kind === 'international' ? (quote?.fee ?? 0) : 0;
  const receive = kind === 'international' ? (quote?.receive ?? 0) : (parseFloat(amount) || 0);
  const country = COUNTRIES.find(c => c.code === toCurrency);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (!recipient) { toast.error('Recipient required'); return; }
    try {
      await transfer({ kind, recipient, amount: amt, fromCurrency, toCurrency: kind === 'international' ? toCurrency : fromCurrency, note }).unwrap();
      toast.success(t('transfer.success'));
      setDone(true);
    } catch (e: any) { toast.error(e?.data?.detail || t('common.error')); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto">
      <Card className="text-center p-10 shadow-elegant">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4"><Check className="h-8 w-8"/></div>
        <h2 className="font-display text-2xl font-bold">{t('transfer.success')}</h2>
        <p className="text-muted-foreground mt-2">{formatMoney(parseFloat(amount), fromCurrency)} sent to {recipient}.</p>
        <Button asChild className="mt-6 bg-gradient-brand"><a href="/app">Back to dashboard</a></Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('transfer.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('transfer.subtitle')}</p>
      </div>

      <Tabs value={kind} onValueChange={(v: any) => setKind(v)}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="internal">{t('transfer.internal')}</TabsTrigger>
          <TabsTrigger value="international">{t('transfer.international')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label>{t('transfer.recipient')}</Label>
              <Input placeholder={t('transfer.recipientEmail')} value={recipient} onChange={e => setRecipient(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('transfer.fromCurrency')}</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="text-2xl font-display font-bold h-14 tabular" />
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-32 h-14"><SelectValue /></SelectTrigger>
                  <SelectContent>{(wallets || []).map(w => <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {kind === 'international' && (
              <>
                <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>
                <div className="space-y-2">
                  <Label>{t('transfer.toCurrency')}</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={quoting ? '…' : receive.toFixed(2)} className="text-2xl font-display font-bold h-14 tabular text-success" />
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-44 h-14"><SelectValue /></SelectTrigger>
                      <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>{t('transfer.note')}</Label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} maxLength={140} placeholder="What's it for?" />
            </div>

            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              {kind === 'international' && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('transfer.rate')}</span><span className="tabular">1 {fromCurrency} = {quote?.rate ?? '—'} {toCurrency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('transfer.deliveryTime')}</span><span>{country?.delivery === 'instant' ? t('transfer.instant') : country?.delivery}</span></div>
                </>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">{t('transfer.fee')}</span><span className="tabular">{formatMoney(fee, fromCurrency)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>{t('transfer.totalCost')}</span><span className="tabular text-primary">{formatMoney((parseFloat(amount) || 0) + fee, fromCurrency)}</span></div>
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-brand shadow-brand text-base" disabled={isLoading || quoting}>
              {(isLoading || quoting) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {t('transfer.confirm')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transfer;
