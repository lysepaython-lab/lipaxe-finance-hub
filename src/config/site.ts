export const APP_HOST = import.meta.env.VITE_APP_HOST || 'web.lipaxe.com';

export const getCurrentHost = () => window.location.hostname.toLowerCase();

export const getAppOrigin = () => `${window.location.protocol}//${APP_HOST}`;

export const buildAppUrl = (path = '/') => `${getAppOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
