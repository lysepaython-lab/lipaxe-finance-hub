import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCreditCard, FaWifi, FaMobileAlt, FaLock } from 'react-icons/fa';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AnimatedBackground } from './AnimatedBackground';

const features = [
  { Icon: FaLock, title: 'Paiements Sécurisés', desc: 'Protection maximale de vos transactions' },
  { Icon: FaCreditCard, title: 'Multi-Cartes', desc: 'Compatible avec toutes vos cartes' },
  { Icon: FaWifi, title: 'Sans Contact', desc: 'Paiements rapides et pratiques' },
  { Icon: FaMobileAlt, title: 'Mobile First', desc: 'Gérez tout depuis votre mobile' },
];

export const AuthLayout = ({ children, side }: { children: React.ReactNode; side: { title: string; subtitle: string } }) => (
  <div className="min-h-screen lg:grid lg:grid-cols-2 bg-background">
    {/* Illustration panel */}
    <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-hero  overflow-hidden">
      <AnimatedBackground />

      {/* Floating mini-cards */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-24 right-10 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-md px-4 py-3 shadow-lg"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <FaWifi className="h-4 w-4" /> NFC actif
        </div>
      </motion.div>
      

      <Logo className="relative z-10" />

      <div className="relative z-10 space-y-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <h2 className="font-display text-4xl font-bold leading-tight">{side.title}</h2>
          {/* <p className="text-lg text-primary-foreground/85 leading-relaxed">{side.subtitle}</p> */}
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {features.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur p-4"
            >
              <div className="h-9 w-9 rounded-lg bg-primary-foreground/15 flex items-center justify-center mb-2">
                <Icon className="h-4 w-4" />
              </div>
              <div className="font-display text-sm font-semibold">{title}</div>
              <div className="text-xs text-primary-foreground/70 mt-0.5">{desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="relative z-10 text-xs text-primary-foreground/60">© {new Date().getFullYear()} Lipaxe - security.</p>
    </div>

    {/* Form panel */}
    <div className="relative flex min-h-screen flex-col">
      <AnimatedBackground className="lg:hidden opacity-60" />
      <div className="relative flex items-center justify-between p-4 lg:p-6">
        <Link to="/" className="lg:hidden"><Logo /></Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  </div>
);
