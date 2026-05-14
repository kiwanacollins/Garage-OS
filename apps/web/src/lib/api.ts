const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
const isHttpsPage =
  typeof window !== 'undefined' && window.location.protocol === 'https:';
const shouldUseRelativeApi =
  configuredApiUrl.length === 0 ||
  (isHttpsPage && configuredApiUrl.startsWith('http://'));

export const API_URL = shouldUseRelativeApi
  ? ''
  : configuredApiUrl.replace(/\/+$/, '');

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    throw new Error((body as { message?: string } | null)?.message ?? 'Unable to complete request');
  }

  return body as T;
}
