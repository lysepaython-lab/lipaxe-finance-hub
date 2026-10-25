import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CreditCard, Gift, Sprout, UserRound, UsersRound } from 'lucide-react';
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
    art: 'tontine',
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
  if (offer.art === 'card') {
    return (
      <div className="relative h-[145px] w-[218px] transition-transform duration-500 group-hover:scale-[1.03] sm:h-[170px] sm:w-[255px]">
        <img
          src="/brand/promotions/lipaxe-visa-starter.png"
          alt=""
          className="h-full w-full rounded-2xl object-contain shadow-2xl"
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }

  if (offer.art === 'tontine') {
    return (
      <div className="relative flex h-40 w-full max-w-[270px] items-center justify-center sm:h-48 sm:max-w-[320px]">
        <div className="absolute h-36 w-36 rounded-full bg-emerald-200/20 blur-2xl sm:h-44 sm:w-44" />
        <div className="absolute inset-x-6 inset-y-3 rounded-[2rem] border border-white/20 bg-white/[0.08] shadow-xl backdrop-blur-sm" />
        <img
          src="/brand/promotions/tontine.webp"
          alt=""
          className="relative h-full w-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.2)]"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute bottom-2 right-1 grid h-10 w-10 place-items-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md sm:bottom-3 sm:right-2">
          <UsersRound className="h-5 w-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-40 w-full max-w-[270px] sm:h-48 sm:max-w-[320px]" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-px w-[72%] -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-px w-[72%] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <div className="absolute left-1/2 top-1/2 grid h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.6rem] border border-white/35 bg-white/20 text-white shadow-2xl backdrop-blur-md sm:h-20 sm:w-20">
        <Sprout className="h-8 w-8 sm:h-9 sm:w-9" />
      </div>
      <div className="absolute left-[7%] top-[12%] grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md sm:h-14 sm:w-14">
        <UserRound className="h-6 w-6" />
      </div>
      <div className="absolute right-[8%] top-[8%] grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md sm:h-14 sm:w-14">
        <UserRound className="h-6 w-6" />
      </div>
      <div className="absolute bottom-[8%] left-[25%] grid h-11 w-11 place-items-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md sm:h-12 sm:w-12">
        <UserRound className="h-5 w-5" />
      </div>
      <div className="absolute bottom-[7%] right-[17%] flex items-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-3 py-2 text-white shadow-lg backdrop-blur-md">
        <Gift className="h-4 w-4" />
        <BadgeCheck className="h-4 w-4 text-emerald-200" />
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
      <div className="flex min-h-[300px] flex-col justify-between gap-3 pb-12 sm:gap-5 md:min-h-[235px] md:flex-row md:items-center md:pb-0">
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
        <div className="flex min-h-[145px] w-full items-center justify-center md:min-h-[220px] md:flex-1">
          <PromotionArtwork offer={offer} />
        </div>
      </div>

    </section>
  );
};
