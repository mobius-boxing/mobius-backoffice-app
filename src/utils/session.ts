// Cross-subdomain session token.
//
// app.mobiusboxing.com and backoffice.mobiusboxing.com are different ORIGINS, so localStorage
// cannot be shared between them. We keep the JWT in a cookie scoped to the parent domain
// (REACT_APP_COOKIE_DOMAIN, e.g. ".mobiusboxing.com") so every subdomain reads the same
// session: one login and one logout apply everywhere. On localhost the domain is omitted
// (host-only cookie, which browsers share across ports, so dev gets the same behavior).
//
// The cookie is intentionally NOT HttpOnly: auth still travels as a Bearer header read by JS,
// the same exposure as the previous localStorage token. Moving to an HttpOnly, server-set
// cookie would be a separate, larger hardening change.

const COOKIE_NAME = 'mobius_session';
const COOKIE_DOMAIN = process.env.REACT_APP_COOKIE_DOMAIN; // ".mobiusboxing.com" in prod; unset locally
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days; the server still enforces JWT expiry

const buildCookie = (nameValue: string, maxAge: number): string => {
  const parts = [nameValue, 'path=/', `max-age=${maxAge}`, 'samesite=lax'];
  if (COOKIE_DOMAIN) parts.push(`domain=${COOKIE_DOMAIN}`);
  if (window.location.protocol === 'https:') parts.push('secure');
  return parts.join('; ');
};

export const getToken = (): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setToken = (token: string): void => {
  document.cookie = buildCookie(`${COOKIE_NAME}=${encodeURIComponent(token)}`, MAX_AGE_SECONDS);
};

export const clearToken = (): void => {
  document.cookie = buildCookie(`${COOKIE_NAME}=`, 0);
};

// The device-approval secret: a member's browser must be approved by an admin
// before the API answers anything else, and it presents this value as
// X-Device-Token. Same cookie scope as the session above, so one browser is one
// device across every Mobius origin. Deliberately NOT cleared on logout —
// signing out does not make this a different browser, and dropping it would
// send the member back through an approval on the next login.
const DEVICE_COOKIE_NAME = 'mobius_device';
const DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const getDeviceToken = (): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + DEVICE_COOKIE_NAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

export const setDeviceToken = (token: string): void => {
  document.cookie = buildCookie(
    `${DEVICE_COOKIE_NAME}=${encodeURIComponent(token)}`,
    DEVICE_MAX_AGE_SECONDS
  );
};
