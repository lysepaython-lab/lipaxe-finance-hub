import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Copy, Check, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import {
  useCryptoAssetsQuery, useCryptoNetworksQuery,
  useCryptoDepositAddressMutation, useCryptoWithdrawMutation,
} from '@/store/api/businessApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { cn } from '@/lib/utils';

const Cryptos = () => {
  const { t } = useTranslation();
  const { data: assets, isLoading } = useCryptoAssetsQuery();
  const [depositAddr, { isLoading: addrLoading }] = useCryptoDepositAddressMutation();
  const [withdraw, { isLoading: wdLoading }] = useCryptoWithdrawMutation();
  const pin = usePinGate();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [symbol, setSymbol] = useState<string>('USDT');
  const [network, setNetwork] = useState<string>('TRC20');
  const [walletId, setWalletId] = useState<string>();
  const [amount, setAmount] = useState('100');
  const [address, setAddress] = useState('');
  const [generated, setGenerated] = useState<{ address: string; qr_payload: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: networks } = useCryptoNetworksQuery(symbol, { skip: !symbol });

  const openMode = (m: 'buy' | 'sell', sym: string) => {
    setMode(m);
    setSymbol(sym);
    setNetwork('');
    setGenerated(null);
    setAddress('');
    setAmount('100');
    setOpen(true);
  };

  const handleGenerate = async () => {
    if (!network || !walletId) { toast.error('Sélectionnez réseau et portefeuille'); return; }
    try {
      const r = await depositAddr({ symbol, network, amount: Number(amount), wallet_id: walletId }).unwrap();
      setGenerated({ address: r.address, qr_payload: r.qr_payload });
    } catch (e) {
      toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  const handleWithdraw = () => {
    if (!network || !walletId || !address) { toast.error('Tous les champs sont requis'); return; }
    pin.guard(async () => {
      try {
        await withdraw({ symbol, network, address, amount: Number(amount), wallet_id: walletId }).unwrap();
        toast.success('Retrait crypto envoyé');
        setOpen(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Adresse copiée');
  };

  return (
    <div>
      <PageHeader title={t('nav.lipaxeCryptos')} subtitle={t('strone.cryptoSubtitle')} icon={<Bitcoin className="h-6 w-6" />} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(assets || []).map((c, i) => (
            <motion.div key={c.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold">
                      {c.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold tabular">{formatMoney(c.price_usd, 'USD')}</div>
                    <div className={`text-xs flex items-center justify-end gap-1 ${c.change_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {c.change_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {c.change_24h >= 0 ? '+' : ''}{c.change_24h}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-gradient-brand shadow-brand" onClick={() => openMode('buy', c.symbol)}>
                      <ArrowDownToLine className="mr-1 h-4 w-4" /> Dépôt
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openMode('sell', c.symbol)}>
                      <ArrowUpFromLine className="mr-1 h-4 w-4" /> Retrait
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'buy' ? `Recevoir ${symbol}` : `Envoyer ${symbol}`}</DialogTitle>
          </DialogHeader>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'buy' | 'sell')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="buy">Dépôt</TabsTrigger>
              <TabsTrigger value="sell">Retrait</TabsTrigger>
            </TabsList>

            <div className="py-4 space-y-4">
              <WalletSelector label="Portefeuille" value={walletId} onChange={(id) => setWalletId(id)} />

              <div className="space-y-2">
                <Label>Réseau</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(networks || []).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setNetwork(n.id)}
                      className={cn(
                        'rounded-lg border-2 p-2 text-xs font-semibold transition-colors',
                        network === n.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                      )}
                    >
                      {n.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Montant ({symbol})</Label>
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular" />
              </div>

              <TabsContent value="sell" className="m-0 space-y-2">
                <Label>Adresse de destination</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="TR... ou 0x..." className="font-mono text-sm" />
                <p className="text-xs text-warning">⚠ Vérifiez l'adresse — irréversible.</p>
              </TabsContent>

              <TabsContent value="buy" className="m-0">
                {!generated ? (
                  <Button onClick={handleGenerate} disabled={addrLoading} className="w-full bg-gradient-brand shadow-brand">
                    {addrLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Générer l'adresse de dépôt
                  </Button>
                ) : (
                  <div className="rounded-xl bg-muted/40 p-4 space-y-3 text-center">
                    <div className="bg-white p-3 rounded-xl inline-block">
                      <QRCodeSVG value={generated.qr_payload} size={160} level="H" />
                    </div>
                    <div className="font-mono text-xs break-all">{generated.address}</div>
                    <Button variant="outline" size="sm" onClick={() => copy(generated.address)}>
                      {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />} Copier l'adresse
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
            {mode === 'sell' && (
              <Button onClick={handleWithdraw} disabled={wdLoading} className="bg-gradient-brand shadow-brand">
                {wdLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Envoyer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default Cryptos;
