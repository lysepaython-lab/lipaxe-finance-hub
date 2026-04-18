import { motion } from 'framer-motion';

/**
 * Premium fintech animated background:
 * - Soft brand gradient blobs that drift
 * - Subtle grid overlay
 * - Use as an absolutely-positioned layer behind content
 */
export const AnimatedBackground = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Drifting blobs */}
      <motion.div
        className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
        animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary-glow/25 blur-3xl"
        animate={{ x: [0, -50, 30, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-brand-300/30 blur-3xl"
        animate={{ x: [0, 40, -30, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-gradient-glow" />
    </div>
  );
};

export default AnimatedBackground;
