import { motion } from 'framer-motion';
import { PartyPopper, Ticket, Calendar, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const events = [
  { id: 'e1', name: 'Lipaxe Summit 2025', date: 'Mar 14', price: 49, attendees: 312, bg: 'from-violet-500 to-fuchsia-600' },
  { id: 'e2', name: 'Afro Fintech Night', date: 'Apr 02', price: 25, attendees: 145, bg: 'from-amber-500 to-rose-600' },
  { id: 'e3', name: 'Web3 & Money', date: 'May 10', price: 79, attendees: 580, bg: 'from-sky-500 to-emerald-600' },
];

const FestiPay = () => {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t('nav.festiPay')} subtitle={t('payments.festiSubtitle')} icon={<PartyPopper className="h-6 w-6" />} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden border-border/60">
              <div className={`aspect-[1.7/1] bg-gradient-to-br ${e.bg} p-5 text-white flex flex-col justify-between`}>
                <Badge className="self-start bg-white/20 backdrop-blur text-white border-0"><Calendar className="mr-1 h-3 w-3" /> {e.date}</Badge>
                <div className="font-display text-xl font-bold leading-tight">{e.name}</div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {e.attendees}</span>
                  <span className="font-display font-bold tabular">{formatMoney(e.price, 'USD')}</span>
                </div>
                <Button onClick={() => toast.success(t('payments.ticketBooked'))} className="w-full bg-gradient-brand shadow-brand">
                  <Ticket className="mr-2 h-4 w-4" /> {t('payments.bookTicket')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FestiPay;
