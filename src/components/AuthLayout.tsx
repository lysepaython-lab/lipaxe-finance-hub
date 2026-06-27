import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCreditCard, FaWifi, FaMobileAlt, FaLock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AnimatedBackground } from './AnimatedBackground';

const features = [
  { Icon: FaLock, title: 'auth.authFeatureSecureTitle', desc: 'auth.authFeatureSecureDesc' },
  { Icon: FaCreditCard, title: 'auth.authFeatureCardsTitle', desc: 'auth.authFeatureCardsDesc' },
  { Icon: FaWifi, title: 'auth.authFeatureContactlessTitle', desc: 'auth.authFeatureContactlessDesc' },
  { Icon: FaMobileAlt, title: 'auth.authFeatureMobileTitle', desc: 'auth.authFeatureMobileDesc' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const AuthLayout = ({
  children,
  side,
}: {
  children: React.ReactNode;
  side: { title: string; subtitle: string };
}) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-hero p-12 lg:flex">
        <AnimatedBackground />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3"
          >
            {features.map(({ Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 backdrop-blur-sm transition-colors hover:bg-primary-foreground/10"
              >
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15 transition-colors group-hover:bg-primary-foreground/25">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-display text-sm font-semibold">{t(title)}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-primary-foreground/70">
                  {t(desc)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-primary-foreground/60">
            &copy; {new Date().getFullYear()} Lipaxe. {t('auth.authFooter')}
          </p>
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col">
        <AnimatedBackground className="opacity-40 lg:hidden" />

        <header className="relative flex items-center justify-between p-4 sm:p-6">
          <Link
            to="/"
            className="transition-opacity hover:opacity-80 lg:hidden"
            aria-label={t('auth.backHome')}
          >
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="relative flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
