import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export const AuthLayout = ({ children, side }: { children: React.ReactNode; side: { title: string; subtitle: string } }) => (
  <div className="min-h-screen lg:grid lg:grid-cols-2 bg-background">
    <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
      <Logo className="relative" />

      <div className="relative space-y-6 max-w-md">
        <h2 className="font-display text-4xl font-bold leading-tight">{side.title}</h2>
        <p className="text-lg text-primary-foreground/85 leading-relaxed">{side.subtitle}</p>

        <div className="grid grid-cols-3 gap-4 pt-8">
          {[{ k: '$8B+', v: 'Transacted' }, { k: '180+', v: 'Countries' }, { k: '99.99%', v: 'Uptime' }].map((s) => (
            <div key={s.k} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 backdrop-blur">
              <div className="font-display text-xl font-bold tabular">{s.k}</div>
              <div className="text-xs text-primary-foreground/70">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} Lipaxe. Bank-grade security.</p>
    </div>

    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-4 lg:p-6">
        <Link to="/" className="lg:hidden"><Logo /></Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  </div>
);
