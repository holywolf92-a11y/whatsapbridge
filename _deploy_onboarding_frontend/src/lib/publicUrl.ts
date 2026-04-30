export const CANONICAL_FRONTEND_URL = 'https://falishajobs.up.railway.app';

const LEGACY_FRONTEND_HOSTS = [
  'falishamanpower.up.railway.app',
  'recruitment-portal-frontend-production.up.railway.app',
  'exquisite-surprise-production.up.railway.app',
  'falishamanpower.com',
];

export function getFrontendBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  return CANONICAL_FRONTEND_URL;
}

export function normalizeFrontendUrl(url?: string | null): string {
  const normalized = (url || '').trim().replace(/\/$/, '');

  if (!normalized) {
    return CANONICAL_FRONTEND_URL;
  }

  if (LEGACY_FRONTEND_HOSTS.some((host) => normalized.includes(host))) {
    return CANONICAL_FRONTEND_URL;
  }

  return normalized;
}

export function getPublicApplicationLink(): string {
  return `${getFrontendBaseUrl()}/apply`;
}