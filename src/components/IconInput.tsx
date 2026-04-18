import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string | null;
  rightSlot?: React.ReactNode;
}

export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, label, error, rightSlot, className, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;
    const [focused, setFocused] = React.useState(false);

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <motion.div
          animate={{
            boxShadow: focused
              ? '0 0 0 4px hsl(var(--ring) / 0.15)'
              : '0 0 0 0px hsl(var(--ring) / 0)',
          }}
          transition={{ duration: 0.18 }}
          className={cn(
            'relative flex items-center rounded-xl border bg-background transition-colors',
            error
              ? 'border-destructive'
              : focused
              ? 'border-primary'
              : 'border-input',
          )}
        >
          {icon && (
            <span className="pl-3.5 pr-2 text-muted-foreground flex items-center">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              'peer flex-1 bg-transparent py-2.5 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              !icon && 'pl-3.5',
              rightSlot && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightSlot && <span className="absolute right-2.5">{rightSlot}</span>}
        </motion.div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
IconInput.displayName = 'IconInput';
