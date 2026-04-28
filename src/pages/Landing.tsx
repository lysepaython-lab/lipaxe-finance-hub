import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck, Globe2, Zap, Wallet, Check } from 'lucide-react';

const Landing = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Globe2, title: t('landing.feature1Title'), body: t('landing.feature1Body') },
    { icon: Zap, title: t('landing.feature2Title'), body: t('landing.feature2Body') },
    { icon: Wallet, title: t('landing.feature3Title'), body: t('landing.feature3Body') },
    { icon: ShieldCheck, title: t('landing.feature4Title'), body: t('landing.feature4Body') },
  ];

  const stats = [
    { v: '$8B+', k: t('landing.statsTransacted') },
    { v: '1M+', k: t('landing.statsCustomers') },
    { v: '180+', k: t('landing.statsCountries') },
    { v: '99.99%', k: t('landing.statsUptime') },
  ];

  const heroActions = [t('landing.heroActionSend'), t('landing.heroActionAdd'), t('landing.heroActionSwap')];
  const mockTransactions = [
    { d: 'Marie Dubois', a: '+EUR 480.00', c: 'text-success' },
    { d: t('transfer.international'), a: '-USD 1,500.00', c: 'text-foreground' },
    { d: t('deposit.title'), a: '+USD 1,250.00', c: 'text-success' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.62))]">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-smooth hover:text-foreground">{t('nav.features')}</a>
            <a href="#security" className="transition-smooth hover:text-foreground">{t('nav.security')}</a>
            <a href="#pricing" className="transition-smooth hover:text-foreground">{t('nav.pricing')}</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
            <Link to="/register"><Button size="sm" className="bg-gradient-brand shadow-brand">{t('nav.getStarted')}</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-32">
          <div className="animate-slide-up space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" /> {t('landing.heroEyebrow')}
            </span>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight lg:text-7xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-brand text-base shadow-brand">
                  {t('landing.ctaPrimary')} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border/70 bg-card/70 text-base backdrop-blur-sm">
                {t('landing.ctaSecondary')}
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" /> {t('landing.trust')}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -inset-8 bg-gradient-brand opacity-20 blur-3xl" />
            <div className="relative space-y-4 rounded-3xl border border-border bg-gradient-card p-6 shadow-elegant">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('dashboard.totalBalance')}</span>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">+4.2%</span>
              </div>
              <div className="font-display tabular text-4xl font-bold">$12,480.55</div>
              <div className="grid grid-cols-3 gap-2">
                {heroActions.map((action, i) => (
                  <button
                    key={action}
                    className={`rounded-xl p-3 text-sm font-semibold transition-smooth ${i === 0 ? 'bg-gradient-brand text-primary-foreground shadow-brand' : 'bg-muted/85 hover:bg-accent'}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
              <div className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4">
                {mockTransactions.map((row) => (
                  <div key={`${row.d}-${row.a}`} className="flex items-center justify-between text-sm">
                    <span className="truncate text-muted-foreground">{row.d}</span>
                    <span className={`tabular font-semibold ${row.c}`}>{row.a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 flex items-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur animate-float">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold">{t('landing.heroTransferReceived')}</div>
                <div className="text-muted-foreground">EUR 480 · {t('landing.heroTransferJustNow')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k} className="text-center">
              <div className="font-display tabular text-3xl font-bold text-primary lg:text-4xl">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="container py-24">
        <div className="mx-auto mb-16 max-w-2xl space-y-3 text-center">
          <h2 className="font-display text-4xl font-bold lg:text-5xl">{t('landing.featureSectionTitle')}</h2>
          <p className="text-lg text-muted-foreground">{t('landing.featureSectionBody')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border/60 bg-card/85 p-6 transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-primary-foreground lg:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-4">
            <h2 className="font-display text-3xl font-bold lg:text-5xl">{t('landing.ctaTitle')}</h2>
            <p className="text-lg text-primary-foreground/85">{t('landing.ctaBody')}</p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-base font-semibold">
                {t('landing.ctaPrimary')} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Lipaxe. {t('landing.footerRights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
