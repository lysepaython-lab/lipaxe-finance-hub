import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://web.lipaxe.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/lipaxe-logo-dark.png`;

type SeoRoute = {
  title: string;
  description: string;
  indexable: boolean;
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

const APP_ROUTES: Record<string, Omit<SeoRoute, 'indexable'>> = {
  '/app': {
    title: 'Tableau de bord | Lipaxe',
    description: 'Consultez vos wallets, opérations récentes et actions disponibles dans votre espace Lipaxe.',
  },
  '/app/transactions': {
    title: 'Mes transactions | Lipaxe',
    description: 'Consultez l’historique sécurisé de vos transactions Lipaxe.',
  },
  '/app/profile': {
    title: 'Mon profil | Lipaxe',
    description: 'Gérez les informations de votre profil Lipaxe.',
  },
  '/app/settings': {
    title: 'Paramètres | Lipaxe',
    description: 'Gérez les paramètres et la sécurité de votre compte Lipaxe.',
  },
};

const getRouteSeo = (pathname: string): SeoRoute => {
  if (pathname === '/') {
    return {
      title: 'Ouverture de Lipaxe',
      description: 'Ouverture sécurisée de votre espace Lipaxe.',
      indexable: false,
    };
  }
  if (AUTH_ROUTES[pathname]) return { ...AUTH_ROUTES[pathname], indexable: false };
  if (APP_ROUTES[pathname]) return { ...APP_ROUTES[pathname], indexable: false };
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

/** Centralized Helmet metadata. This host is the private application, not the marketing site. */
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
    </Helmet>
  );
};
