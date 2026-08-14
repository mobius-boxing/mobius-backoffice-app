/**
 * The one and only place the customer-facing module URL is composed.
 *
 * Shape: `https://{company.slug}.{module.publicDomainLabel}.{BASE}` — e.g.
 * `https://qa-demo-co.vencimientos.mobiusboxing.com`. The middle label comes
 * from the `modules` table, never from the module slug: `countdown` is served
 * from `vencimientos` and guessing produces a hostname that does not resolve.
 *
 * The base domain is read from the environment (CRA only exposes variables
 * prefixed `REACT_APP_`) and defaults to production, so no `.env` file has to
 * exist for the backoffice to show the right URL.
 */
const BASE_DOMAIN =
  process.env.REACT_APP_PUBLIC_MODULE_DOMAIN || 'mobiusboxing.com';

/**
 * Returns null when either part is missing — a company with no slug or a module
 * with no public app has no URL, and callers branch on that single value rather
 * than re-deriving the eligibility rules.
 */
export const buildModuleUrl = (
  companySlug: string | null | undefined,
  publicDomainLabel: string | null | undefined
): string | null => {
  if (!companySlug || !publicDomainLabel) return null;
  return `https://${companySlug}.${publicDomainLabel}.${BASE_DOMAIN}`;
};
