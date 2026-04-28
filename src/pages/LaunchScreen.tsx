import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

const LaunchScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/app', { replace: true });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.74))] px-6">
      <div className="absolute inset-0 bg-gradient-glow opacity-80" />
      <div className="absolute h-72 w-72 rounded-full bg-primary/12 blur-3xl" />

      <motion.div
        initial={{ opacity: 0.2, scale: 0.92 }}
        animate={{ opacity: 1, scale: [1, 1.06, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex flex-col items-center gap-5 rounded-[32px] border border-border/70 bg-card/86 px-10 py-12 shadow-elegant backdrop-blur-md"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 hsla(169, 98%, 18%, 0.18)',
              '0 0 0 18px hsla(169, 98%, 18%, 0.04)',
              '0 0 0 0 hsla(169, 98%, 18%, 0.18)',
            ],
          }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-[28px]"
        >
          <Logo to="/app" size={72} />
        </motion.div>
        <div className="space-y-2 text-center">
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground">Lipaxe</p>
          <p className="text-sm text-muted-foreground">Preparation de votre espace securise...</p>
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-brand"
            initial={{ x: '-100%' }}
            animate={{ x: ['-100%', '0%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default LaunchScreen;
