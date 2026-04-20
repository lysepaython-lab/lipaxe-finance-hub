import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Camera, Send, Copy, Check, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransferQrLinkMutation, useValidateQrMutation, useQrInfoQuery } from '@/store/api/walletApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { OtpModal } from '@/components/security/OtpModal';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const TransferQr = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const incomingToken = params.get('token');

  const [generate, { isLoading: generating }] = useTransferQrLinkMutation();
  const [validate, { isLoading: validating }] = useValidateQrMutation();
  const pin = usePinGate();

  // Receive (sender generates QR)
  const [walletId, setWalletId] = useState<string>();
  const [amount, setAmount] = useState('');
  const [generated, setGenerated] = useState<{ token: string; url?: string; amount: number; currency: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Pay (receiver scans/opens link)
  const [scanToken, setScanToken] = useState<string | null>(incomingToken);
  const [payWallet, setPayWallet] = useState<string>();
  const [otpOpen, setOtpOpen] = useState(false);
  const { data: qrInfo, error: qrError } = useQrInfoQuery(scanToken!, { skip: !scanToken });

  useEffect(() => {
    if (incomingToken) setScanToken(incomingToken);
  }, [incomingToken]);

  const handleGenerate = () => {
    if (!walletId || !amount) { toast.error('Portefeuille et montant requis'); return; }
    pin.guard(async () => {
      try {
        const r = await generate({ amount: Number(amount), wallet_id: walletId, currency: 'USD' }).unwrap();
        setGenerated({ token: r.token, url: r.url, amount: r.amount, currency: r.currency });
        toast.success('QR généré');
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const finalizeValidate = async (otp?: string) => {
    if (!scanToken || !payWallet) return;
    pin.guard(async () => {
      try {
        await validate({ token: scanToken, wallet_id: payWallet, otp }).unwrap();
        toast.success('Paiement validé');
        setScanToken(null);
        params.delete('token');
        setParams(params, { replace: true });
      } catch (e) {
        const msg = (e as { data?: { detail?: string } })?.data?.detail || t('common.error');
        if (msg.toLowerCase().includes('otp')) { setOtpOpen(true); return; }
        toast.error(msg);
      }
    });
  };

  const handleValidate = () => {
    if (!payWallet) { toast.error('Sélectionnez un portefeuille'); return; }
    if (qrInfo && qrInfo.amount > 100) { setOtpOpen(true); return; }
    finalizeValidate();
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader title={t('nav.transferQr')} subtitle={t('transfer.qrSubtitle')} icon={<QrCode className="h-6 w-6" />} />

      <Tabs defaultValue={incomingToken ? 'pay' : 'receive'}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="receive" className="rounded-lg">Recevoir</TabsTrigger>
          <TabsTrigger value="pay" className="rounded-lg">Payer</TabsTrigger>
        </TabsList>

        <TabsContent value="receive">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gradient-card">
              <CardContent className="p-6 space-y-4">
                <WalletSelector label="Recevoir vers" value={walletId} onChange={(id) => setWalletId(id)} />
                <div className="space-y-2">
                  <Label>Montant</Label>
                  <Input type="number" min={0} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-xl tabular h-12" />
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="w-full bg-gradient-brand shadow-brand">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  Générer le QR
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center gap-4">
                {!generated ? (
                  <div className="text-center text-muted-foreground py-12">
                    <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Le QR apparaîtra ici</p>
                  </div>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
                    <div className="rounded-2xl bg-white p-4 shadow-elegant">
                      <QRCodeSVG value={generated.url || generated.token} size={200} level="H" />
                    </div>
                    <div className="font-display text-xl font-bold tabular">{formatMoney(generated.amount, generated.currency)}</div>
                    {generated.url && (
                      <Button variant="outline" size="sm" onClick={() => copy(generated.url!)}>
                        {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />} Copier le lien
                      </Button>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pay">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Label>Coller un token QR ou un lien</Label>
                <Input
                  value={scanToken || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const m = v.match(/token=([^&]+)/);
                    setScanToken(m ? m[1] : v.trim());
                  }}
                  placeholder="qr_xxxxxx ou /app/transfer/qr?token=…"
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-center py-4">
                  <motion.div animate={{ borderColor: ['hsl(var(--primary)/0.3)', 'hsl(var(--primary))', 'hsl(var(--primary)/0.3)'] }} transition={{ duration: 2, repeat: Infinity }} className="h-32 w-32 rounded-2xl border-4 border-dashed flex items-center justify-center text-muted-foreground">
                    <Camera className="h-8 w-8" />
                  </motion.div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Scanner caméra: bientôt — collez le lien pour l'instant</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                {!scanToken ? (
                  <p className="text-muted-foreground text-sm text-center py-12">Collez un token pour voir les détails</p>
                ) : qrError ? (
                  <p className="text-destructive text-sm text-center py-12">QR invalide ou expiré</p>
                ) : !qrInfo ? (
                  <Skeleton className="h-32" />
                ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="text-sm text-muted-foreground">De</div>
                      <div className="font-display text-lg font-bold">{qrInfo.sender}</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <div className="text-sm text-muted-foreground">Montant</div>
                      <div className="font-display text-2xl font-bold tabular">{formatMoney(qrInfo.amount, qrInfo.currency)}</div>
                      {qrInfo.amount > 100 && <p className="text-[10px] text-warning mt-1">OTP requis pour montant {'>'}100</p>}
                    </div>
                    <WalletSelector label="Recevoir vers" value={payWallet} onChange={(id) => setPayWallet(id)} />
                    <Button onClick={handleValidate} disabled={validating} className="w-full bg-gradient-brand shadow-brand h-11">
                      {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Valider le paiement
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
      <OtpModal
        open={otpOpen}
        onOpenChange={setOtpOpen}
        onSubmit={async (otp) => { setOtpOpen(false); await finalizeValidate(otp); }}
        loading={validating}
        title="Code de confirmation"
        description="Saisissez le code à 6 chiffres pour valider ce paiement (123456 en démo)."
      />
    </div>
  );
};

export default TransferQr;
