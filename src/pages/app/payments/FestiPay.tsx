import { useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, Ticket, Calendar, Users, Loader2, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFestiEventsQuery, useBookTicketMutation, type FestiTicket } from '@/store/api/businessApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const FestiPay = () => {
  const { t } = useTranslation();
  const { data: events, isLoading } = useFestiEventsQuery();
  const [book, { isLoading: booking }] = useBookTicketMutation();
  const pin = usePinGate();

  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string>();
  const [ticket, setTicket] = useState<FestiTicket | null>(null);

  const event = events?.find((e) => e.id === eventId);

  const submit = () => {
    if (!eventId || !walletId) { toast.error('Sélectionnez un portefeuille'); return; }
    pin.guard(async () => {
      try {
        const tk = await book({ event_id: eventId, wallet_id: walletId }).unwrap();
        setTicket(tk);
        toast.success(t('payments.ticketBooked'));
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  return (
    <div>
      <PageHeader title={t('nav.festiPay')} subtitle={t('payments.festiSubtitle')} icon={<PartyPopper className="h-6 w-6" />} />

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-72" /><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(events || []).map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden border-border/60">
                <div className={`aspect-[1.7/1] bg-gradient-to-br ${e.cover} p-5 text-primary-foreground flex flex-col justify-between`}>
                  <Badge className="self-start bg-primary-foreground/20 backdrop-blur text-primary-foreground border-0">
                    <Calendar className="mr-1 h-3 w-3" /> {new Date(e.date).toLocaleDateString()}
                  </Badge>
                  <div className="font-display text-xl font-bold leading-tight">{e.name}</div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {e.attendees}</span>
                    <span className="font-display font-bold tabular">{formatMoney(e.price, e.currency)}</span>
                  </div>
                  <Button onClick={() => { setEventId(e.id); setTicket(null); setOpen(true); }} className="w-full bg-gradient-brand shadow-brand">
                    <Ticket className="mr-2 h-4 w-4" /> {t('payments.bookTicket')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ticket ? 'Votre billet' : event?.name}</DialogTitle>
          </DialogHeader>
          {!ticket ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/40 p-3 flex justify-between text-sm">
                <span>{event?.name}</span>
                <span className="font-display font-bold tabular">{formatMoney(event?.price || 0, event?.currency || 'USD')}</span>
              </div>
              <WalletSelector label="Portefeuille" value={walletId} onChange={(id) => setWalletId(id)} />
              <Button onClick={submit} disabled={booking} className="w-full bg-gradient-brand shadow-brand h-11">
                {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                Confirmer
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3 py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <p className="font-semibold">{event?.name}</p>
              <div className="bg-white p-4 rounded-xl inline-block">
                <QRCodeSVG value={ticket.qr_token} size={180} level="H" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">{ticket.qr_token}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default FestiPay;
