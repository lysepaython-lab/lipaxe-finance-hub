import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { PageHeader } from './PageHeader';
import { Card, CardContent } from './ui/card';

interface ComingSoonProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  features?: string[];
  children?: ReactNode;
}

export const ComingSoonPage = ({ title, subtitle, icon, features, children }: ComingSoonProps) => (
  <div>
    <PageHeader title={title} subtitle={subtitle} icon={icon} />
    {children ?? (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(features ?? []).map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="h-full bg-gradient-card border-border/60 hover:shadow-elegant transition-smooth">
              <CardContent className="p-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 font-display font-bold">
                  {i + 1}
                </div>
                <p className="font-medium leading-snug">{f}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);
