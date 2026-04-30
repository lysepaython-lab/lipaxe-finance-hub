import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCreditCard, FaWifi, FaMobileAlt, FaLock } from 'react-icons/fa';
import { ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AnimatedBackground } from './AnimatedBackground';

const features = [
  { Icon: FaLock, title: 'Paiements securises', desc: 'Protection maximale sur chaque session et chaque transaction.' },
  { Icon: FaCreditCard, title: 'Multi-cartes', desc: 'Une meme console pour piloter wallets, cartes et flux de paiement.' },
  { Icon: FaWifi, title: 'Instant settlement', desc: 'Suivi rapide des mouvements, des incidents et des validations.' },
  { Icon: FaMobileAlt, title: 'Mobile control', desc: 'Une interface nette qui reste lisible sur telephone comme sur desktop.' },
];

export const AuthLayout = ({ children, side }: { children: React.ReactNode; side: { title: string; subtitle: string } }) => (
  <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,hsl(var(--brand-100))_0%,hsl(var(--background))_42%,hsl(var(--background))_100%)] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
    <div className="relative hidden overflow-hidden border-r border-white/8 bg-[linear-gradient(145deg,hsl(var(--brand-700))_0%,hsl(var(--brand-900))_52%,hsl(176_76%_4%)_100%)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(107,255,209,0.16),transparent_24%),radial-gradient(circle_at_60%_75%,rgba(0,0,0,0.28),transparent_30%)]" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute right-10 top-20 rounded-3xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          <FaWifi className="h-4 w-4" /> secure routing active
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="absolute bottom-20 right-10 w-72 rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-2xl shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/55">Treasury pulse</div>
            <div className="mt-1 text-2xl font-semibold">24.8M XAF</div>
          </div>
          <div className="rounded-2xl bg-emerald-300/15 p-3 text-emerald-100">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[74%] rounded-full bg-[linear-gradient(90deg,#8ff8d4,#36c690)]" />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-white/70">
          <span>Settlement flow</span>
          <span>74% healthy</span>
        </div>
      </motion.div>

      <Logo className="relative z-10" />

      <div className="relative z-10 max-w-xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" />
            Lipaxe finance console
          </div>
          <h2 className="max-w-lg font-display text-5xl font-bold leading-[1.02] text-balance">
            {side.title}
          </h2>
          <p className="max-w-lg text-base leading-7 text-white/72">{side.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {features.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12">
                <Icon className="h-4 w-4" />
              </div>
              <div className="font-display text-sm font-semibold text-white">{title}</div>
              <div className="mt-1 text-xs leading-5 text-white/65">{desc}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-[2rem] border border-white/10 bg-white/7 p-5 backdrop-blur-xl">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Uptime</div>
            <div className="mt-2 text-2xl font-semibold">99.98%</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">KYC queue</div>
            <div className="mt-2 text-2xl font-semibold">Live</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Security</div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Locked
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-xs uppercase tracking-[0.24em] text-white/45">
        © {new Date().getFullYear()} Lipaxe · secure finance infrastructure
      </p>
    </div>

    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground className="opacity-60 lg:hidden" />
      <div className="relative flex items-center justify-between p-4 lg:p-6">
        <Link to="/" className="lg:hidden">
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-12 pt-4 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="overflow-hidden rounded-[2rem] border border-white/55 bg-white/82 shadow-[0_32px_90px_rgba(2,34,28,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-card/90 dark:shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
            <div className="border-b border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(247,252,250,0.58))] px-6 py-4 dark:bg-[linear-gradient(180deg,rgba(12,24,21,0.92),rgba(12,24,21,0.68))]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="px-6 py-8 sm:px-8 sm:py-10">{children}</div>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
