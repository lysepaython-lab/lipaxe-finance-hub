import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://web.lipaxe.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/lipaxe-logo-dark.png`;

type SeoRoute = {
  title: string;
  description: string;
  indexable: boolean;
};

const PUBLIC_SEO: SeoRoute = {
  title: 'Lipaxe | Paiements, wallets et services financiers',
  description: 'Lipaxe aide les particuliers et les entreprises à gérer leurs paiements, wallets et services financiers avec des frais transparents et des contrôles de sécurité.',
  indexable: true,
};

const PRIVATE_SEO: SeoRoute = {
  title: 'Espace sécurisé | Lipaxe',
  description: 'Accédez à votre espace Lipaxe sécurisé.',
  indexable: false,
};

const AUTH_ROUTES: Record<string, Omit<SeoRoute, 'indexable'>> = {
  '/login': {
    title: 'Connexion sécurisée | Lipaxe',
    description: 'Connectez-vous en toute sécurité à votre espace Lipaxe.',
  },
  '/register': {
    title: 'Créer votre compte | Lipaxe',
    description: 'Créez votre compte Lipaxe pour accéder à vos services financiers.',
  },
  '/verify-email': {
    title: 'Vérifier votre e-mail | Lipaxe',
    description: 'Confirmez votre adresse e-mail pour sécuriser votre compte Lipaxe.',
  },
  '/forgot-password': {
    title: 'Réinitialiser votre mot de passe | Lipaxe',
    description: 'Recevez un code sécurisé pour réinitialiser votre mot de passe Lipaxe.',
  },
  '/reset-password': {
    title: 'Nouveau mot de passe | Lipaxe',
    description: 'Finalisez la réinitialisation sécurisée de votre mot de passe Lipaxe.',
  },
};

const getRouteSeo = (pathname: string): SeoRoute => {
  if (pathname === '/') return PUBLIC_SEO;
  if (AUTH_ROUTES[pathname]) return { ...AUTH_ROUTES[pathname], indexable: false };
  if (pathname.startsWith('/pay/')) {
    return {
      title: 'Paiement sécurisé | Lipaxe',
      description: 'Finalisez votre paiement de manière sécurisée avec Lipaxe.',
      indexable: false,
    };
  }
  if (pathname === '/launch') {
    return {
      title: 'Ouverture de Lipaxe',
      description: 'Ouverture sécurisée de votre espace Lipaxe.',
      indexable: false,
    };
  }
  return PRIVATE_SEO;
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Lipaxe',
      url: SITE_URL,
      logo: DEFAULT_IMAGE,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Lipaxe',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['fr', 'en'],
    },
    {
      '@type': 'FinancialService',
      name: 'Lipaxe',
      url: SITE_URL,
      description: PUBLIC_SEO.description,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: ['BI', 'RW', 'CD'],
      availableLanguage: ['fr', 'en'],
    },
  ],
};

/** Centralized Helmet metadata. Private financial routes are deliberately noindex. */
export const Seo = () => {
  const { pathname } = useLocation();
  const seo = getRouteSeo(pathname);
  const language = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
  const robots = seo.indexable
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow, noarchive';

  return (
    <Helmet htmlAttributes={{ lang: language }}>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={robots} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Lipaxe" />
      <meta property="og:locale" content={language === 'fr' ? 'fr_FR' : 'en_US'} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
      {seo.indexable && <link rel="canonical" href={canonical} />}
      {seo.indexable && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  );
};
