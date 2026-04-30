import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AnimatedBackground } from './AnimatedBackground';

export const AuthLayout = ({
  children,
  side,
}: {
  children: React.ReactNode;
  side: { title: string; subtitle: string };
}) => (
  <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,hsl(var(--brand-100))_0%,hsl(var(--background))_42%,hsl(var(--background))_100%)] lg:grid lg:grid-cols-[0.95fr_1.05fr]">
    <div className="relative hidden border-r border-border/40 bg-[linear-gradient(180deg,hsl(var(--brand-800))_0%,hsl(var(--brand-900))_100%)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
      <AnimatedBackground />
      <div className="relative z-10">
        <Logo className="text-white" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-white/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          Lipaxe
        </div>
        <h2 className="font-display text-5xl font-bold leading-tight">{side.title}</h2>
        <p className="text-base leading-7 text-white/72">{side.subtitle}</p>
      </motion.div>

      <p className="relative z-10 text-xs uppercase tracking-[0.22em] text-white/45">
        © {new Date().getFullYear()} Lipaxe
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg"
        >
          <div className="rounded-[1.75rem] border border-border/60 bg-card/92 px-6 py-8 shadow-[0_24px_70px_rgba(2,34,28,0.10)] backdrop-blur-xl sm:px-8 sm:py-10 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);
