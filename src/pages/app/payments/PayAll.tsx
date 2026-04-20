import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users2, Send, Zap, Droplets, Wifi, Tv, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillProvidersQuery, usePayBillMutation } from '@/store/api/businessApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'electricity', name: 'Électricité', icon: Zap },
  { id: 'water', name: 'Eau', icon: Droplets },
  { id: 'internet', name: 'Internet', icon: Wifi },
  { id: 'tv', name: 'TV', icon: Tv },
] as const;

const PayAll = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id']>('electricity');
  const { data: providers, isLoading } = useBillProvidersQuery(category);
  const [payBill, { isLoading: paying }] = usePayBillMutation();
  const pin = usePinGate();

  const [providerId, setProviderId] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('25');
  const [walletId, setWalletId] = useState<string>();

  const submit = () => {
    if (!providerId || !reference || !walletId) { toast.error('Tous les champs sont requis'); return; }
    pin.guard(async () => {
      try {
        const r = await payBill({ provider_id: providerId, reference, amount: Number(amount), wallet_id: walletId }).unwrap();
        toast.success(`Facture payée — ${r.reference}`);
        setReference('');
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  return (
    <div>
      <PageHeader title={t('nav.payAll')} subtitle={t('payments.payAllSubtitle')} icon={<Users2 className="h-6 w-6" />} />

      <Tabs value={category} onValueChange={(v) => { setCategory(v as typeof CATEGORIES[number]['id']); setProviderId(''); }}>
        <TabsList className="rounded-xl">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="rounded-lg gap-1.5">
              <c.icon className="h-4 w-4" /> {c.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category} className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-5 space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fournisseur</Label>
                {isLoading ? (
                  <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
                ) : (
                  <div className="space-y-2">
                    {(providers || []).map((p) => (
                      <motion.button
                        key={p.id} type="button"
                        whileHover={{ x: 2 }}
                        onClick={() => setProviderId(p.id)}
                        className={cn(
                          'w-full rounded-xl border-2 p-3 text-left transition-colors flex items-center justify-between',
                          providerId === p.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                        )}
                      >
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.country}</span>
                      </motion.button>
                    ))}
                    {(providers || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun fournisseur</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Référence client</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° compteur ou abonné" maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label>Montant</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-xl font-display font-bold tabular h-12" />
                </div>
                <WalletSelector label="Payer depuis" value={walletId} onChange={(id) => setWalletId(id)} />
                <div className="rounded-xl bg-background/60 p-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display font-bold tabular">{formatMoney(Number(amount) || 0, 'USD')}</span>
                </div>
                <Button onClick={submit} disabled={paying || !providerId} className="w-full bg-gradient-brand shadow-brand h-11">
                  {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Payer la facture
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default PayAll;
