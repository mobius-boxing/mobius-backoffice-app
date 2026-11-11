// The access token lives in memory only: a page reload re-acquires it through the HttpOnly
// refresh cookie that the API sets (POST /api/auth/refresh), so script on the page never
// holds anything that outlives the tab. The device cookie below is the only cookie JS writes;
// it is scoped to the parent domain (REACT_APP_COOKIE_DOMAIN, e.g. ".mobiusboxing.com") so one
// approval covers every Mobius origin. On localhost the domain is omitted (host-only cookie,
// which browsers share across ports).

// Dev builds set REACT_APP_COOKIE_PREFIX=mobius_dev so they never read a prod session.
const COOKIE_PREFIX = process.env.REACT_APP_COOKIE_PREFIX || 'mobius';
const COOKIE_NAME = `${COOKIE_PREFIX}_session`;
const COOKIE_DOMAIN = process.env.REACT_APP_COOKIE_DOMAIN; // ".mobiusboxing.com" in prod; unset locally

const buildCookie = (nameValue: string, maxAge: number): string => {
  const parts = [nameValue, 'path=/', `max-age=${maxAge}`, 'samesite=lax'];
  if (COOKIE_DOMAIN) parts.push(`domain=${COOKIE_DOMAIN}`);
  if (window.location.protocol === 'https:') parts.push('secure');
  return parts.join('; ');
};

let accessToken: string | null = null;

export const getToken = (): string | null => accessToken;

export const setToken = (token: string): void => {
  accessToken = token;
};

export const clearToken = (): void => {
  accessToken = null;
};

// Older builds kept the JWT in a JS-readable `${prefix}_session` cookie. Expire it with the
// attributes it was written with, or the browser keeps the old cookie beside a new one.
document.cookie = buildCookie(`${COOKIE_NAME}=`, 0);

// The device-approval secret: a member's browser must be approved by an admin
// before the API answers anything else, and it presents this value as
// X-Device-Token. Same cookie scope as the session above, so one browser is one
// device across every Mobius origin. Deliberately NOT cleared on logout —
// signing out does not make this a different browser, and dropping it would
// send the member back through an approval on the next login.
const DEVICE_COOKIE_NAME = `${COOKIE_PREFIX}_device`;
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
