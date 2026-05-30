import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bitcoin,
  Check,
  Copy,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PageHeader } from '@/components/PageHeader';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { WalletSelector } from '@/components/security/WalletSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  useCryptoAssetsQuery,
  useCryptoDepositAddressMutation,
  useCryptoNetworksQuery,
  useCryptoQuoteMutation,
  useCryptoTradeExecuteMutation,
  useCryptoWithdrawMutation,
  type CryptoQuote,
} from '@/store/api/businessApi';

type CryptoMode = 'buy' | 'sell' | 'deposit' | 'withdraw';

const CRYPTO_CURRENCIES = ['USDT', 'USDC', 'BTC'];

const modeTitle = (mode: CryptoMode, symbol: string) => {
  if (mode === 'buy') return `Acheter ${symbol}`;
  if (mode === 'sell') return `Vendre ${symbol}`;
  if (mode === 'deposit') return `Recevoir ${symbol}`;
  return `Envoyer ${symbol}`;
};

const Cryptos = () => {
  const { t } = useTranslation();
  const { data: assets, isLoading } = useCryptoAssetsQuery();
  const { data: networks } = useCryptoNetworksQuery('USDT');
  const [depositAddr, { isLoading: addrLoading }] = useCryptoDepositAddressMutation();
  const [withdraw, { isLoading: wdLoading }] = useCryptoWithdrawMutation();
  const [quoteCrypto, { isLoading: quoteLoading }] = useCryptoQuoteMutation();
  const [executeTrade, { isLoading: executeLoading }] = useCryptoTradeExecuteMutation();
  const pin = usePinGate();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CryptoMode>('buy');
  const [symbol, setSymbol] = useState('USDT');
  const [network, setNetwork] = useState('trc20');
  const [walletId, setWalletId] = useState<string>();
  const [fiatWalletId, setFiatWalletId] = useState<string>();
  const [cryptoWalletId, setCryptoWalletId] = useState<string>();
  const [amount, setAmount] = useState('100');
  const [address, setAddress] = useState('');
  const [generated, setGenerated] = useState<{ address: string; qr_payload: string } | null>(null);
  const [quote, setQuote] = useState<CryptoQuote | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: symbolNetworks } = useCryptoNetworksQuery(symbol, { skip: !symbol });
  const activeNetworks = symbolNetworks || networks || [];

  const openMode = (nextMode: CryptoMode, nextSymbol: string) => {
    setMode(nextMode);
    setSymbol(nextSymbol);
    setNetwork('');
    setWalletId(undefined);
    setFiatWalletId(undefined);
    setCryptoWalletId(undefined);
    setGenerated(null);
    setQuote(null);
    setAddress('');
    setAmount(nextMode === 'sell' ? '10' : '100');
    setOpen(true);
  };

  const handleQuote = async () => {
    if (!fiatWalletId || !cryptoWalletId) {
      toast.error('Selectionnez les portefeuilles.');
      return;
    }

    try {
      const response = await quoteCrypto({
        symbol,
        side: mode === 'sell' ? 'sell' : 'buy',
        network: network || undefined,
        fiat_wallet_id: fiatWalletId,
        crypto_wallet_id: cryptoWalletId,
        ...(mode === 'sell' ? { crypto_amount: Number(amount) } : { fiat_amount: Number(amount) }),
      }).unwrap();
      setQuote(response);
    } catch (error) {
      toast.error((error as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  const handleExecuteTrade = () => {
    if (!quote?.id) {
      toast.error('Demandez un prix avant de confirmer.');
      return;
    }

    pin.guard(async () => {
      try {
        await executeTrade({ quote_id: quote.id }).unwrap();
        toast.success(mode === 'sell' ? 'Vente crypto executee.' : 'Achat crypto execute.');
        setOpen(false);
      } catch (error) {
        toast.error((error as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const handleGenerate = async () => {
    if (!network || !walletId) {
      toast.error('Selectionnez le reseau et le portefeuille.');
      return;
    }

    try {
      const response = await depositAddr({ symbol, network, wallet_id: walletId }).unwrap();
      setGenerated({ address: response.address, qr_payload: response.qr_payload });
    } catch (error) {
      toast.error((error as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  const handleWithdraw = () => {
    if (!network || !walletId || !address) {
      toast.error('Tous les champs sont requis.');
      return;
    }

    pin.guard(async () => {
      try {
        await withdraw({ symbol, network, address, amount: Number(amount), wallet_id: walletId }).unwrap();
        toast.success('Retrait crypto envoye pour revue.');
        setOpen(false);
      } catch (error) {
        toast.error((error as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Adresse copiee.');
  };

  return (
    <div>
      <PageHeader title={t('nav.lipaxeCryptos')} subtitle={t('strone.cryptoSubtitle')} icon={<Bitcoin className="h-6 w-6" />} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(assets || []).map((asset, index) => (
            <motion.div key={asset.symbol} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-primary">
                      {asset.symbol.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display font-bold tabular-nums">{formatMoney(asset.price_usd, 'USD')}</div>
                    <div className={`flex items-center justify-end gap-1 text-xs ${asset.change_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {asset.change_24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {asset.change_24h >= 0 ? '+' : ''}{asset.change_24h}%
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <div>Marche: {asset.market_rate || String(asset.price_usd)}</div>
                      <div>Achat: {asset.buy_rate || '-'}</div>
                      <div>Vente: {asset.sell_rate || '-'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-gradient-brand shadow-brand" onClick={() => openMode('buy', asset.symbol)}>Acheter</Button>
                    <Button size="sm" variant="outline" onClick={() => openMode('sell', asset.symbol)}>Vendre</Button>
                    <Button size="sm" variant="secondary" onClick={() => openMode('deposit', asset.symbol)}>
                      <ArrowDownToLine className="mr-1 h-4 w-4" /> Depot
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openMode('withdraw', asset.symbol)}>
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
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <Bitcoin className="h-6 w-6" /> {modeTitle(mode, symbol)}
            </DialogTitle>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="max-h-[calc(92vh-148px)] overflow-y-auto p-7">
            <Tabs value={mode} onValueChange={(value) => { setMode(value as CryptoMode); setQuote(null); setGenerated(null); }}>
              <TabsList className="grid w-full grid-cols-4 rounded-2xl">
                <TabsTrigger value="buy" className="rounded-xl">Achat</TabsTrigger>
                <TabsTrigger value="sell" className="rounded-xl">Vente</TabsTrigger>
                <TabsTrigger value="deposit" className="rounded-xl">Depot</TabsTrigger>
                <TabsTrigger value="withdraw" className="rounded-xl">Retrait</TabsTrigger>
              </TabsList>

              <div className="space-y-4 py-5">
              {(mode === 'buy' || mode === 'sell') ? (
                <>
                  <WalletSelector
                    label={mode === 'buy' ? 'Wallet a debiter' : 'Wallet a crediter'}
                    value={fiatWalletId}
                    onChange={(id) => setFiatWalletId(id)}
                    excludeCurrencies={CRYPTO_CURRENCIES}
                  />
                  <WalletSelector
                    label={`Wallet ${symbol}`}
                    value={cryptoWalletId}
                    onChange={(id) => setCryptoWalletId(id)}
                    filterCurrency={symbol}
                  />
                </>
              ) : (
                <WalletSelector
                  label={`Wallet ${symbol}`}
                  value={walletId}
                  onChange={(id) => setWalletId(id)}
                  filterCurrency={symbol}
                />
              )}

              <div className="space-y-2">
                <Label>Reseau</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {activeNetworks.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNetwork(item.id)}
                      className={cn(
                        'rounded-lg border-2 p-2 text-xs font-semibold transition-colors',
                        network === item.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{mode === 'buy' ? 'Montant fiat' : `Montant ${symbol}`}</Label>
                <Input type="number" min={0} value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); }} className="tabular-nums" />
              </div>

              {(mode === 'buy' || mode === 'sell') && (
                <div className="space-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
                  {quote ? (
                    <>
                      <div className="flex justify-between"><span>Fiat</span><strong>{quote.fiat_amount} {quote.fiat_currency}</strong></div>
                      <div className="flex justify-between"><span>Crypto</span><strong>{quote.crypto_amount} {symbol}</strong></div>
                      <div className="flex justify-between"><span>Taux</span><strong>{quote.executed_rate}</strong></div>
                      <div className="flex justify-between"><span>Marge Lipaxe</span><strong>{quote.spread_amount}</strong></div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Demandez un prix ferme, puis confirmez avec votre PIN.</p>
                  )}
                </div>
              )}

              <TabsContent value="deposit" className="m-0">
                {!generated ? (
                  <Button onClick={handleGenerate} disabled={addrLoading} className="w-full bg-gradient-brand shadow-brand">
                    {addrLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generer l'adresse de depot
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-xl bg-muted/40 p-4 text-center">
                    <div className="inline-block rounded-xl bg-white p-3">
                      <QRCodeSVG value={generated.qr_payload} size={160} level="H" />
                    </div>
                    <div className="break-all font-mono text-xs">{generated.address}</div>
                    <Button variant="outline" size="sm" onClick={() => copy(generated.address)}>
                      {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                      Copier
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="withdraw" className="m-0 space-y-2">
                <Label>Adresse de destination</Label>
                <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="TR... ou 0x..." className="font-mono text-sm" />
                <p className="text-xs text-warning">Verifiez deux fois: les transactions crypto sont irreversibles.</p>
              </TabsContent>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="border-t border-border bg-background px-7 py-5">
            <Button variant="outline" onClick={() => setOpen(false)} className="min-w-32 rounded-2xl">Fermer</Button>
            {(mode === 'buy' || mode === 'sell') && (
              <>
                <Button variant="outline" onClick={handleQuote} disabled={quoteLoading} className="rounded-2xl">
                  {quoteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Obtenir le prix
                </Button>
                <Button onClick={handleExecuteTrade} disabled={executeLoading || !quote} className="rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
                  {executeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer
                </Button>
              </>
            )}
            {mode === 'withdraw' && (
              <Button onClick={handleWithdraw} disabled={wdLoading} className="rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
                {wdLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer
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
