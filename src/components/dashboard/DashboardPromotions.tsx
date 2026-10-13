import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, CreditCard, Sprout, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const offers = [
  {
    id: 'virtualCards',
    href: '/app/cards/virtual',
    icon: CreditCard,
    theme: 'from-[#073d32] via-[#075a48] to-[#08725b]',
    accent: 'bg-emerald-300',
    orb: 'bg-emerald-300/15',
    art: 'card',
  },
  {
    id: 'tontines',
    href: '/app/strone/business',
    icon: UsersRound,
    theme: 'from-[#06433a] via-[#08705c] to-[#11a77b]',
    accent: 'bg-lime-300',
    orb: 'bg-lime-200/15',
    art: 'community',
  },
  {
    id: 'affiliation',
    href: '/app/affiliation',
    icon: Sprout,
    theme: 'from-[#06372f] via-[#075b4c] to-[#0b8064]',
    accent: 'bg-teal-200',
    orb: 'bg-teal-200/15',
    art: 'growth',
  },
] as const;

const PromotionArtwork = ({ offer }: { offer: (typeof offers)[number] }) => {
  const Icon = offer.icon;

  if (offer.art === 'card') {
    return (
      <div className="relative h-36 w-56 rotate-[-8deg] rounded-2xl border border-white/25 bg-gradient-to-br from-white/20 to-white/5 p-4 shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105 sm:h-40 sm:w-64">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15"><Icon className="h-4 w-4" /></span><span>Lipaxe</span></div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Virtual</span>
        </div>
        <div className="absolute bottom-5 left-4 flex items-center gap-2 text-sm tracking-[0.22em] text-white/85"><span className="h-5 w-7 rounded border border-white/50 bg-white/15" />•••• •••• •••• 2048</div>
        <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full border border-white/10" />
      </div>
    );
  }

  const nodes = offer.art === 'community'
    ? [{ x: 'left-2 top-8', delay: 0 }, { x: 'right-1 top-2', delay: 0.12 }, { x: 'right-8 bottom-1', delay: 0.24 }, { x: 'left-12 bottom-0', delay: 0.36 }]
    : [{ x: 'left-1 bottom-3', delay: 0 }, { x: 'left-16 top-2', delay: 0.12 }, { x: 'right-10 top-0', delay: 0.24 }, { x: 'right-0 bottom-8', delay: 0.36 }];

  return (
    <div className="relative h-40 w-64">
      <div className="absolute left-1/2 top-1/2 h-px w-44 -translate-x-1/2 -translate-y-1/2 rotate-[-22deg] bg-white/35" />
      <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 -translate-y-1/2 rotate-[30deg] bg-white/25" />
      {nodes.map((node, index) => (
        <motion.div
          key={node.x}
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: node.delay, duration: 0.3 }}
          className={cn('absolute grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/12 text-white shadow-lg backdrop-blur-sm', node.x)}
        >
          {index === 0 ? <Icon className="h-5 w-5" /> : <span className="text-lg font-semibold">{index + 1}</span>}
        </motion.div>
      ))}
      <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.35rem] border border-white/30 bg-white/20 text-white shadow-xl backdrop-blur-md">
        {offer.art === 'community' ? <UsersRound className="h-7 w-7" /> : <ArrowUpRight className="h-7 w-7" />}
      </div>
    </div>
  );
};

export const DashboardPromotions = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const offer = offers[active];
  const Icon = offer.icon;

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % offers.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label={t('dashboard.promotions')}
      className={cn('group relative isolate overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-elegant sm:p-7 md:min-h-[280px]', offer.theme)}
    >
      <div className={cn('absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full blur-3xl', offer.orb)} />
      <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="flex min-h-[300px] flex-col justify-between gap-6 pb-12 md:min-h-[235px] md:flex-row md:items-center md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className="flex flex-1 flex-col items-start md:max-w-[54%]"
          >
            <div className={cn('mb-4 grid h-11 w-11 place-items-center rounded-2xl text-[#063d32]', offer.accent)}><Icon className="h-5 w-5" /></div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">{t('dashboard.promoEyebrow')}</p>
            <h2 className="mt-2 max-w-lg font-display text-2xl font-bold leading-tight sm:text-3xl">{t(`dashboard.promo.${offer.id}.title`)}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/75">{t(`dashboard.promo.${offer.id}.body`)}</p>
            <Link to={offer.href} draggable={false} className="mt-5">
              <Button className="rounded-xl bg-white px-4 font-semibold text-[#06483b] shadow-lg hover:bg-white/90">
                {t(`dashboard.promo.${offer.id}.cta`)} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </AnimatePresence>
        <div className="hidden flex-1 items-center justify-center md:flex">
          <PromotionArtwork offer={offer} />
        </div>
      </div>

    </section>
  );
};
