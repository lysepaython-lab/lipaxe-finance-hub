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

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-smooth">{t('nav.features')}</a>
            <a href="#security" className="hover:text-foreground transition-smooth">{t('nav.security')}</a>
            <a href="#pricing" className="hover:text-foreground transition-smooth">{t('nav.pricing')}</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
            <Link to="/register"><Button size="sm" className="bg-gradient-brand shadow-brand">{t('nav.getStarted')}</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="container relative grid lg:grid-cols-2 gap-12 py-20 lg:py-32 items-center">
          <div className="space-y-6 animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" /> {t('landing.heroEyebrow')}
            </span>
            <h1 className="font-display text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register"><Button size="lg" className="bg-gradient-brand shadow-brand text-base">
                {t('landing.ctaPrimary')} <ArrowRight className="ml-1 h-4 w-4" />
              </Button></Link>
              <Button size="lg" variant="outline" className="text-base">{t('landing.ctaSecondary')}</Button>
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" /> {t('landing.trust')}
            </div>
          </div>

          {/* Hero card mockup */}
          <div className="relative animate-fade-in">
            <div className="absolute -inset-8 bg-gradient-brand opacity-20 blur-3xl" />
            <div className="relative rounded-3xl bg-gradient-card border border-border shadow-elegant p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('dashboard.totalBalance')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">+4.2%</span>
              </div>
              <div className="font-display text-4xl font-bold tabular">$12,480.55</div>
              <div className="grid grid-cols-3 gap-2">
                {['Send','Add','Swap'].map((a,i) => (
                  <button key={a} className={`rounded-xl p-3 text-sm font-semibold transition-smooth ${i===0 ? 'bg-gradient-brand text-primary-foreground shadow-brand' : 'bg-muted hover:bg-accent'}`}>
                    {a}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-border/60 p-4 space-y-3 bg-card">
                {[
                  { d: 'From Marie Dubois', a: '+€480.00', c: 'text-success' },
                  { d: 'International transfer', a: '-$1,500.00', c: 'text-foreground' },
                  { d: 'Card top-up', a: '+$1,250.00', c: 'text-success' },
                ].map((r) => (
                  <div key={r.d} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{r.d}</span>
                    <span className={`font-semibold tabular ${r.c}`}>{r.a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-2xl border border-border bg-card p-3 shadow-elegant flex items-center gap-2 animate-float">
              <div className="h-8 w-8 rounded-full bg-success/10 text-success flex items-center justify-center"><Check className="h-4 w-4" /></div>
              <div className="text-xs">
                <div className="font-semibold">Transfer received</div>
                <div className="text-muted-foreground">€480 · just now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {stats.map((s) => (
            <div key={s.k} className="text-center">
              <div className="font-display text-3xl lg:text-4xl font-bold text-primary tabular">{s.v}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container py-24">
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
          <h2 className="font-display text-4xl lg:text-5xl font-bold">Built for the way you move money.</h2>
          <p className="text-muted-foreground text-lg">Every detail engineered to feel effortless.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border/60 bg-card p-6 transition-smooth hover:shadow-elegant hover:-translate-y-1 hover:border-primary/40">
              <div className="h-12 w-12 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center shadow-brand mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="security" className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 lg:p-16 text-primary-foreground">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-4">
            <h2 className="font-display text-3xl lg:text-5xl font-bold">{t('landing.ctaTitle')}</h2>
            <p className="text-primary-foreground/85 text-lg">{t('landing.ctaBody')}</p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-base font-semibold">
                {t('landing.ctaPrimary')} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Lipaxe. {t('landing.footerRights')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
