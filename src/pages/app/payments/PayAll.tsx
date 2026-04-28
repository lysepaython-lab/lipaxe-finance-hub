import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users2, Send, Zap, Droplets, Wifi, Tv, Loader2, Ticket, Search, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useBillProvidersQuery,
  usePayBillMutation,
  useEbilletSearchMutation,
  useEbilletReserveMutation,
  useEbilletConfirmMutation,
  type EbilletOffer,
} from '@/store/api/businessApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_URL } from '@/store/api/baseApi';

const CATEGORIES = [
  { id: 'electricity', name: 'Electricite', icon: Zap },
  { id: 'water', name: 'Eau', icon: Droplets },
  { id: 'internet', name: 'Internet', icon: Wifi },
  { id: 'tv', name: 'TV', icon: Tv },
  { id: 'ebillet', name: 'E-billet', icon: Ticket },
] as const;

const makePassengers = (count: number, transportType: string, customerName: string) =>
  Array.from({ length: Math.max(count, 1) }, (_, index) => ({
    type: index === 0 ? 'Lead' : 'Passenger',
    transport_type: transportType,
    name: customerName || `Passenger ${index + 1}`,
  }));

const PayAll = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id']>('electricity');
  const { data: providers, isLoading } = useBillProvidersQuery(category);
  const [payBill, { isLoading: paying }] = usePayBillMutation();
  const [searchEbillet, { isLoading: searching }] = useEbilletSearchMutation();
  const [reserveEbillet, { isLoading: reserving }] = useEbilletReserveMutation();
  const [confirmEbillet, { isLoading: confirming }] = useEbilletConfirmMutation();
  const pin = usePinGate();

  const [providerId, setProviderId] = useState('');
  const [reference, setReference] = useState('');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [ebilletCode, setEbilletCode] = useState('');
  const [ebilletType, setEbilletType] = useState('');
  const [ebilletIssuer, setEbilletIssuer] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [transportType, setTransportType] = useState<'flight' | 'bus' | 'ferry' | 'train' | 'other'>('flight');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [returnAt, setReturnAt] = useState('');
  const [passengerCount, setPassengerCount] = useState('1');
  const [amount, setAmount] = useState('25');
  const [walletId, setWalletId] = useState<string>();
  const [otp, setOtp] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>();
  const [offers, setOffers] = useState<EbilletOffer[]>([]);
  const [selectedOfferRef, setSelectedOfferRef] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');

  const selectedProvider = (providers || []).find((p) => p.id === providerId);
  const isEbillet = category === 'ebillet';
  const selectedOffer = useMemo(() => offers.find((offer) => offer.reference === selectedOfferRef), [offers, selectedOfferRef]);
  const passengerList = useMemo(
    () => makePassengers(Number(passengerCount) || 1, transportType, customerName),
    [passengerCount, transportType, customerName],
  );

  const resetTransportFlow = () => {
    setOffers([]);
    setSelectedOfferRef('');
    setBookingId('');
    setTicketNumber('');
    setTicketUrl('');
    setReceiptUrl(undefined);
  };

  const submitBill = () => {
    if (!providerId || !reference || !walletId) {
      toast.error('Tous les champs sont requis');
      return;
    }
    pin.guard(async () => {
      try {
        setReceiptUrl(undefined);
        const r = await payBill({
          provider_id: providerId,
          reference,
          amount: Number(amount),
          wallet_id: walletId,
          customer_identifier: customerIdentifier,
          customer_name: customerName,
          ebillet_code: isEbillet ? ebilletCode : undefined,
          ebillet_type: isEbillet ? ebilletType : undefined,
          ticket_type: isEbillet ? ebilletType || transportType : undefined,
          ebillet_issuer: isEbillet ? ebilletIssuer : undefined,
          qr_payload: isEbillet ? qrPayload : undefined,
          otp,
          auto_pay: false,
        }).unwrap();
        toast.success(`Operation prise en charge - ${r.reference}`);
        setReference('');
        setOtp('');
        setEbilletCode('');
        setEbilletType('');
        setEbilletIssuer('');
        setQrPayload('');
        setReceiptUrl(r.receipt_url ? `${API_URL}${r.receipt_url}` : undefined);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const searchTransport = () => {
    if (!providerId || !origin || !destination || !departureAt || !walletId) {
      toast.error('Le voyage, le wallet et les dates sont requis');
      return;
    }
    pin.guard(async () => {
      try {
        resetTransportFlow();
        const response = await searchEbillet({
          provider_id: providerId,
          transport_type: transportType,
          origin,
          destination,
          departure_at: departureAt,
          return_at: returnAt || undefined,
          passengers: passengerList,
          currency: 'USD',
        }).unwrap();
        setOffers(response.offers || []);
        if ((response.offers || []).length === 0) {
          toast.info('Aucune offre disponible');
        } else {
          toast.success(`${response.offers.length} offre(s) trouvée(s)`);
        }
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const reserveTransport = () => {
    if (!providerId || !selectedOffer || !walletId) {
      toast.error('Sélectionnez une offre et un portefeuille');
      return;
    }
    pin.guard(async () => {
      try {
        const reservation = await reserveEbillet({
          provider_id: providerId,
          offer_reference: selectedOffer.reference,
          wallet_id: walletId,
          transport_type: transportType,
          origin,
          destination,
          departure_at: departureAt,
          return_at: returnAt || undefined,
          passengers: passengerList,
          seat_map: selectedOffer.seat_map,
          booking_reference: reference || undefined,
          ticket_number: ticketNumber || undefined,
          ticket_url: ticketUrl || undefined,
          amount: selectedOffer.total_amount,
          fee_amount: selectedOffer.fee_amount,
          customer_name: customerName,
          customer_identifier: customerIdentifier,
          ebillet_code: ebilletCode || selectedOffer.reference,
          ebillet_type: ebilletType || transportType,
          ticket_type: ebilletType || transportType,
          ebillet_issuer: ebilletIssuer || selectedProvider?.name,
          qr_payload: qrPayload || JSON.stringify(selectedOffer.reference),
          journey_payload: { offer: selectedOffer, origin, destination, transportType, passengers: passengerList },
        }).unwrap();
        setBookingId(reservation.booking_id);
        toast.success(`Réservation préparée - ${reservation.booking_reference}`);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const confirmTransport = () => {
    if (!bookingId || !walletId) {
      toast.error('Réservation introuvable');
      return;
    }
    pin.guard(async () => {
      try {
        const result = await confirmEbillet({
          booking_id: bookingId,
          wallet_id: walletId,
          ticket_number: ticketNumber || undefined,
          ticket_url: ticketUrl || undefined,
        }).unwrap();
        toast.success(`Billet confirmé - ${result.booking_reference}`);
        setReceiptUrl(result.ticket_url ? `${API_URL}${result.ticket_url}` : undefined);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  return (
    <div>
      <PageHeader title={t('nav.payAll')} subtitle={t('payments.payAllSubtitle')} icon={<Users2 className="h-6 w-6" />} />

      <Tabs
        value={category}
        onValueChange={(v) => {
          setCategory(v as typeof CATEGORIES[number]['id']);
          setProviderId('');
          resetTransportFlow();
        }}
      >
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
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(providers || []).map((p) => (
                      <motion.button
                        key={p.id}
                        type="button"
                        whileHover={{ x: 2 }}
                        onClick={() => setProviderId(p.id)}
                        className={cn(
                          'w-full rounded-xl border-2 p-3 text-left transition-colors flex items-center justify-between',
                          providerId === p.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                        )}
                      >
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.country} · {p.supports_otp ? 'OTP' : 'No OTP'}
                        </span>
                      </motion.button>
                    ))}
                    {(providers || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun fournisseur</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-5 space-y-4">
                {isEbillet ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type transport</Label>
                        <select className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={transportType} onChange={(e) => setTransportType(e.target.value as typeof transportType)}>
                          <option value="flight">Avion</option>
                          <option value="bus">Bus</option>
                          <option value="ferry">Bateau</option>
                          <option value="train">Train</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Voyageurs</Label>
                        <Input type="number" min="1" value={passengerCount} onChange={(e) => setPassengerCount(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Origine</Label>
                        <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="BKO, CDG, MAT..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Destination</Label>
                        <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="DLA, JFK, VIE..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Départ</Label>
                        <Input type="datetime-local" value={departureAt} onChange={(e) => setDepartureAt(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Retour</Label>
                        <Input type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Réservation client</Label>
                        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PNR / booking ref" />
                      </div>
                      <div className="space-y-2">
                        <Label>Code e-billet</Label>
                        <Input value={ebilletCode} onChange={(e) => setEbilletCode(e.target.value)} placeholder="Code billet, QR ou voucher" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type billet</Label>
                      <Input value={ebilletType} onChange={(e) => setEbilletType(e.target.value)} placeholder="ticket, boarding pass..." />
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                      <div className="font-semibold text-foreground">Contrat transport</div>
                      <div>Le fournisseur peut accepter n'importe quel format si `accept_any_ebillet` est activé.</div>
                      <div>Sinon, le type envoyé doit correspondre à la liste `accepted_formats` du backoffice.</div>
                    </div>
                    <div className="space-y-2">
                      <Label>Émetteur</Label>
                      <Input value={ebilletIssuer} onChange={(e) => setEbilletIssuer(e.target.value)} placeholder="Compagnie / opérateur" />
                    </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payload QR</Label>
                      <Input value={qrPayload} onChange={(e) => setQrPayload(e.target.value)} placeholder="JSON, URL ou token QR" />
                    </div>
                    <WalletSelector label="Payer depuis" value={walletId} onChange={(id) => setWalletId(id)} />
                    <Button onClick={searchTransport} disabled={searching || !providerId} className="w-full">
                      {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Rechercher les billets
                    </Button>
                    <div className="space-y-2">
                      {offers.length > 0 ? offers.map((offer) => (
                        <button
                          key={offer.reference}
                          type="button"
                          onClick={() => setSelectedOfferRef(offer.reference)}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left',
                            selectedOfferRef === offer.reference ? 'border-primary bg-primary/5' : 'border-border',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{offer.reference}</div>
                            <div className="text-sm font-bold">{formatMoney(offer.total_amount, offer.currency)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {offer.origin} → {offer.destination} · {offer.transport_type} · exp. {offer.expires_in_minutes} min
                          </div>
                        </button>
                      )) : (
                        <p className="text-sm text-muted-foreground">Lancez une recherche pour afficher les offres.</p>
                      )}
                    </div>
                    <Button onClick={reserveTransport} disabled={reserving || !selectedOfferRef || !walletId} className="w-full bg-gradient-brand shadow-brand">
                      {reserving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookmarkCheck className="mr-2 h-4 w-4" />}
                      Réserver
                    </Button>
                    <Button onClick={confirmTransport} disabled={confirming || !bookingId || !walletId} variant="outline" className="w-full">
                      {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Confirmer et émettre
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Référence client</Label>
                      <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° compteur ou abonné" maxLength={80} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Identifiant client</Label>
                        <Input value={customerIdentifier} onChange={(e) => setCustomerIdentifier(e.target.value)} placeholder={selectedProvider?.customer_identifier_label || 'customer_identifier'} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom client</Label>
                        <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nom du titulaire" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Montant</Label>
                      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-xl font-display font-bold tabular h-12" />
                    </div>
                    <WalletSelector label="Payer depuis" value={walletId} onChange={(id) => setWalletId(id)} />
                    {selectedProvider && (
                      <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                        <div>Frais fixe: {selectedProvider.fixed_fee ?? 0}</div>
                        <div>Commission: {selectedProvider.commission_percent ?? 0}%</div>
                        <div>Plafond: {selectedProvider.min_amount ?? 0} - {selectedProvider.max_amount ?? 'infini'}</div>
                        <div>OTP requis: {selectedProvider.supports_otp ? 'Oui' : 'Non'}</div>
                      </div>
                    )}
                    {selectedProvider?.supports_otp && (
                      <div className="space-y-2">
                        <Label>OTP</Label>
                        <Input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={12} placeholder="Code OTP" />
                      </div>
                    )}
                    <div className="rounded-xl bg-background/60 p-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-display font-bold tabular">{formatMoney(Number(amount) || 0, 'USD')}</span>
                    </div>
                    <Button onClick={submitBill} disabled={paying || !providerId} className="w-full bg-gradient-brand shadow-brand h-11">
                      {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Payer la facture
                    </Button>
                  </>
                )}

                {receiptUrl && (
                  <Button variant="outline" onClick={() => window.open(receiptUrl, '_blank', 'noopener,noreferrer')} className="w-full">
                    Voir le reçu PDF
                  </Button>
                )}
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
