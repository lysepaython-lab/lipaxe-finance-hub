import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, Loader2, LockKeyhole, Store, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import { useMerchantPaymentIntentQuery, usePayMerchantIntentMutation } from '@/store/api/merchantPaymentsApi';
import type { WalletV2 } from '@/store/api/platformApi';

const createIdempotencyKey = () => crypto.randomUUID?.() || `merchant-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const MerchantPayment = () => {
  const [params] = useSearchParams();
  const paymentIntentId = params.get('intent') || '';
  const intentQuery = useMerchantPaymentIntentQuery(paymentIntentId, { skip: !paymentIntentId });
  const [pay, { isLoading: isPaying, data: completed }] = usePayMerchantIntentMutation();
  const [wallet, setWallet] = useState<WalletV2>();
  const pin = usePinGate();
  const keyRef = useRef(createIdempotencyKey());
  const intent = intentQuery.data;

  const confirm = () => {
    if (!intent || !wallet) {
      toast.error('Sélectionnez un wallet dans la devise demandée.');
      return;
    }
    pin.guard(async (enteredPin) => {
      try {
        await pay({
          payment_intent_id: intent.id,
          customer_wallet_id: wallet.id,
          pin: enteredPin || '',
          idempotency_key: keyRef.current,
        }).unwrap();
        toast.success('Paiement confirmé.');
      } catch (error) {
        const message = (error as { data?: { detail?: string } })?.data?.detail || 'Le paiement n’a pas pu être confirmé.';
        toast.error(message);
      }
    }, 'Paiement marchand');
  };

  if (!paymentIntentId) return <section className="mx-auto max-w-xl py-10"><Card><CardContent className="p-8 text-center"><CircleAlert className="mx-auto mb-3 h-8 w-8 text-destructive" /><h1 className="font-display text-xl font-bold">Lien de paiement incomplet</h1><p className="mt-2 text-sm text-muted-foreground">Ouvrez à nouveau le lien envoyé par le marchand.</p></CardContent></Card></section>;
  if (intentQuery.isLoading) return <section className="grid min-h-[50vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></section>;
  if (!intent) return <section className="mx-auto max-w-xl py-10"><Card><CardContent className="p-8 text-center"><CircleAlert className="mx-auto mb-3 h-8 w-8 text-destructive" /><h1 className="font-display text-xl font-bold">Paiement indisponible</h1><p className="mt-2 text-sm text-muted-foreground">Cette demande a expiré, a déjà été réglée ou n’existe plus.</p><Button asChild variant="outline" className="mt-5"><Link to="/app">Retour au tableau de bord</Link></Button></CardContent></Card></section>;
  if (completed) return <section className="mx-auto max-w-xl py-10"><Card className="overflow-hidden"><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" /><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Paiement confirmé</p><h1 className="mt-2 font-display text-2xl font-bold">Merci, votre paiement est terminé.</h1><p className="mt-3 text-sm text-muted-foreground">Référence LIPAXE : {completed.transaction.reference}</p><div className="mt-6 flex flex-wrap justify-center gap-3">{completed.return_url ? <Button onClick={() => window.location.assign(completed.return_url!)}>Retourner chez le marchand</Button> : null}<Button asChild variant="outline"><Link to="/app/transactions">Voir mes transactions</Link></Button></div></CardContent></Card></section>;

  return <section className="mx-auto max-w-2xl space-y-5 py-4 sm:py-8"><div className="flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4 text-primary" />Paiement sécurisé par LIPAXE</div><Card className="overflow-hidden border-primary/15"><CardHeader className="bg-gradient-to-br from-primary/10 via-background to-background"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Vous payez</p><CardTitle className="mt-2 font-display text-2xl">{intent.merchant.name}</CardTitle><CardDescription className="mt-2">{intent.description || 'Paiement marchand'}</CardDescription></div><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Store className="h-5 w-5" /></span></div><p className="mt-6 font-display text-4xl font-bold tabular-nums">{formatMoney(Number(intent.amount), intent.currency)}</p></CardHeader><CardContent className="space-y-6 p-6"><div className="rounded-xl border border-border bg-muted/30 p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Référence</span><strong>{intent.reference}</strong></div><div className="mt-2 flex justify-between gap-4"><span className="text-muted-foreground">Expire</span><strong>{new Date(intent.expires_at).toLocaleString('fr-FR')}</strong></div></div><div><div className="mb-3 flex items-center gap-2"><WalletCards className="h-4 w-4 text-primary" /><h2 className="font-semibold">Choisissez le wallet à débiter</h2></div><WalletSelector value={wallet?.id} onChange={(_walletId, selectedWallet) => setWallet(selectedWallet)} filterCurrency={intent.currency} /></div><Button className="h-12 w-full bg-gradient-brand shadow-brand" disabled={!wallet || isPaying} onClick={confirm}>{isPaying ? <Loader2 className="animate-spin" /> : <LockKeyhole />}Confirmer avec mon PIN</Button><p className="text-center text-xs leading-relaxed text-muted-foreground">Le marchand n’a jamais accès à votre PIN, votre session ou vos informations de wallet.</p></CardContent></Card><PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} title="Confirmez ce paiement" description={`Saisissez votre PIN à 5 chiffres pour payer ${formatMoney(Number(intent.amount), intent.currency)} à ${intent.merchant.name}.`} /></section>;
};

export default MerchantPayment;
