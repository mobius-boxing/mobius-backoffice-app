import { z } from 'zod';
import { optionalText, requiredText, Translate } from '../fields';

/**
 * B6 company schema, for the BACKOFFICE create/edit modals only.
 *
 * Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   companies.name        varchar(255) NOT NULL
 *   companies.description text         NULL
 *   companies.slug        varchar(63)  NOT NULL, UNIQUE — NOT in these modals
 *   companies.branding    jsonb        NOT NULL, default '{}' — NOT in these modals
 *   companies.isActive    boolean      NULL, default true — NOT in these modals
 *
 * SCOPE, deliberately narrow: these two modals collect `name` and `description`
 * and nothing else. `slug` (a DNS label with its own regex and reserved-word
 * list), `branding` (a 5-field JSONB sub-resource behind a different endpoint)
 * and `isActive` are all real columns this form never shows, and the B2 sign-off
 * moved that bespoke logic to B7 precisely so a templated sweep would not make
 * the entity LOOK finished while leaving them unreviewed. A rule here for a
 * field the form does not collect would be exactly that mistake.
 *
 * The web app's own company modal is the B7 one; this file is the backoffice's.
 */

const NAME_MAX = 255;
const DESCRIPTION_MAX = 10000;

export const createCompanySchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('companies.name'), NAME_MAX),
    description: optionalText(t, t('companies.description'), DESCRIPTION_MAX),
  });

export const editCompanySchema = (t: Translate) =>
  createCompanySchema(t)
    .partial()
    .extend({ name: requiredText(t, t('companies.name'), NAME_MAX) });

export type CreateCompanySchema = z.infer<
  ReturnType<typeof createCompanySchema>
>;
