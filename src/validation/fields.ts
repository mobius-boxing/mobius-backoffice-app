import { z } from 'zod';

/**
 * Shared zod field primitives. Every create/edit form composes its schema from
 * these instead of hand-writing `register()` rule objects, so a rule is stated
 * once, in Spanish, from the i18n `validation.*` namespace.
 *
 * Two hard rules for callers:
 *  1. Bounds come from the column's MIGRATION (`varchar(n)`, `numeric(p,s)`),
 *     never from the inline rule that happens to be in the modal today.
 *  2. Required-ness comes from the migration's `notNullable()`, not from the
 *     current `required:` rule. Where they disagree, the migration wins.
 *
 * This is the `mobius-backoffice-app` copy of `mobius-web-app`'s
 * `src/validation/fields.ts`: the two apps are separate git repos, so the file
 * is duplicated on purpose rather than extracted into a package neither repo
 * can depend on. The ONLY intended divergence is `email()`, whose messages live
 * at this app's own `login.emailRequired` / `login.emailInvalid` keys.
 */

/**
 * The narrow slice of i18next's `TFunction` these primitives need. Typed
 * structurally so callers just pass `t` from `useTranslation()`.
 */
export type Translate = (
  key: string,
  options?: Record<string, unknown>
) => string;

/**
 * Codes are identifiers: letters, digits, `_ . - /` and spaces. Quantified `*`,
 * not `+`: emptiness is `requiredText`'s job, and zod reports EVERY failing
 * check, so `+` made a blank code raise "is required" AND "invalid format".
 */
const CODE_PATTERN = /^[\w.\-/ ]*$/;

/**
 * Deliberately permissive — the server and the mail provider are the real
 * judges.
 *
 * The leading `^$|` is the same decision `CODE_PATTERN` documents: zod reports
 * EVERY failing check, so a pattern that cannot match the empty string makes a
 * BLANK field report "is required" AND "is invalid" at once. Emptiness is
 * `min(1)`'s job; this pattern only judges non-empty input.
 */
const EMAIL_PATTERN = /^$|^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export interface NumberOptions {
  /** Defaults to 0 — no measure or amount in this schema is ever negative. */
  min?: number;
  /** The column's `numeric(p,s)` ceiling, e.g. 999999.99 for numeric(8,2). */
  max?: number;
  /** The column's `numeric(p,s)` scale. */
  decimals?: number;
  /** Set only when the column is `notNullable()` with no default. */
  required?: boolean;
}

/**
 * THE detail this whole library exists for: an `<input type="number">` emits
 * `''` when empty, and `Number('')` is `0` while `parseFloat('')` is `NaN`.
 * Both used to reach the API. Empty becomes `undefined` BEFORE any coercion;
 * an unparseable string is passed through untouched so `z.number()` can report
 * "must be a number" rather than a confusing `NaN`.
 */
const toNumberInput = (value: unknown): unknown => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  return value;
};

/** `1.005` at 2 decimals fails; `1.50` at 2 decimals passes. */
const withinScale = (value: number, decimals: number): boolean =>
  Number(value.toFixed(decimals)) === value;

const numberCore = (t: Translate, label: string, options: NumberOptions) => {
  const { min = 0, max, decimals } = options;
  const notANumber = t('validation.mustBeNumber', { field: label });
  const required = t('validation.required', { field: label });

  let schema = z
    .number({
      error: (issue) => (issue.input === undefined ? required : notANumber),
    })
    .min(min, t('validation.min', { field: label, min }));

  if (max !== undefined) {
    schema = schema.max(max, t('validation.max', { field: label, max }));
  }
  if (decimals !== undefined) {
    schema = schema.refine((value) => withinScale(value, decimals), {
      message: t('validation.decimals', { field: label, decimals }),
    });
  }
  return schema;
};

const numberField = (t: Translate, label: string, options: NumberOptions) => {
  const core = numberCore(t, label, options);
  return z.preprocess(
    toNumberInput,
    options.required ? core : core.optional()
  ) as z.ZodType<number | undefined, unknown>;
};

// ---------------------------------------------------------------- text

export function requiredText(t: Translate, label: string, max: number) {
  const required = t('validation.required', { field: label });
  return z
    .string({ error: required })
    .trim()
    .min(1, required)
    .max(max, t('validation.maxLength', { field: label, max }));
}

/**
 * An empty string stays an empty string. Update payloads drop `undefined`
 * keys, so collapsing `''` to `undefined` would make an optional field
 * impossible to CLEAR once it had a value.
 */
export function optionalText(t: Translate, label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, t('validation.maxLength', { field: label, max }))
    .optional();
}

/** `max` is the column's real `varchar(n)`, not the copy-pasted 50. */
export function code(
  t: Translate,
  max: number,
  label: string = t('validation.fields.code')
) {
  return requiredText(t, label, max).regex(
    CODE_PATTERN,
    t('validation.invalidFormat', { field: label })
  );
}

// --------------------------------------------------------------- number

/** Optional by default; pass `{ required: true }` only for a notNullable column. */
export function nonNegativeNumber(
  t: Translate,
  label: string,
  options: NumberOptions = {}
) {
  return numberField(t, label, options);
}

export function positiveInt(
  t: Translate,
  label: string,
  options: NumberOptions = {}
) {
  const core = numberCore(t, label, { max: 2147483647, ...options }).refine(
    (value) => Number.isInteger(value),
    { message: t('validation.integer', { field: label }) }
  );
  return z.preprocess(
    toNumberInput,
    options.required ? core : core.optional()
  ) as z.ZodType<number | undefined, unknown>;
}

/**
 * Amounts on the way IN. `utils/money.ts` is the way OUT (display only, and it
 * must never format an editable input's value) — the two do not overlap.
 * `decimals` defaults to 2; pass the column's scale when it differs.
 */
export function money(
  t: Translate,
  label: string,
  options: NumberOptions = {}
) {
  return numberField(t, label, { decimals: 2, ...options });
}

// ------------------------------------------------- select / bool / misc

export function requiredSelect(t: Translate, label: string) {
  const message = t('validation.selectRequired', { field: label });
  return z.string({ error: message }).trim().min(1, message);
}

export function optionalSelect() {
  return z.string().trim().optional();
}

export function email(t: Translate) {
  const required = t('login.emailRequired');
  return z
    .string({ error: required })
    .trim()
    .min(1, required)
    .regex(EMAIL_PATTERN, t('login.emailInvalid'));
}

/**
 * A value constrained to a database CHECK constraint's list.
 *
 * `users.role` and `invitations.role` are the FIRST columns in this whole sweep
 * with a real CHECK — CHECK (role = ANY (ARRAY['member','admin','superAdmin']))
 * — so unlike every other "enum" in this codebase the list is enforced by
 * Postgres and a value outside it is a 23514, not a silent write. Pass the
 * constraint's own array, read from `pg_constraint`, never a list copied from a
 * dropdown's options.
 */
export function oneOf<T extends readonly [string, ...string[]]>(
  t: Translate,
  label: string,
  values: T
) {
  const required = t('validation.selectRequired', { field: label });
  const invalid = t('validation.invalidFormat', { field: label });
  // Built from `string()` rather than `z.enum()` so both messages stay ours
  // (zod 4's enum rejects the params object this pairing needs), then typed as
  // the literal union — which is what the request types actually declare, so
  // call sites need no cast.
  return z
    .string({ error: required })
    .trim()
    .min(1, required)
    .refine((value) => (values as readonly string[]).includes(value), {
      message: invalid,
    }) as unknown as z.ZodType<T[number], unknown>;
}

/**
 * A password on the way in. Optional by default because the EDIT user form
 * treats a blank box as "leave the current password alone" — mapping an empty
 * string to undefined is what makes that work, and it is why this cannot be
 * `requiredText` with a min.
 *
 * `min` is the product rule (8), `max` the column width (255). Neither is a
 * strength policy: hashing and any complexity rules stay server-side.
 */
export function password(
  t: Translate,
  label: string,
  options: { min?: number; max?: number; required: true }
): z.ZodString;
export function password(
  t: Translate,
  label: string,
  options?: { min?: number; max?: number; required?: boolean }
): z.ZodType<string | undefined, unknown>;
export function password(
  t: Translate,
  label: string,
  options: { min?: number; max?: number; required?: boolean } = {}
) {
  const { min = 8, max = 255, required = false } = options;
  const requiredMessage = t('validation.required', { field: label });
  const schema = z
    .string({ error: requiredMessage })
    .min(min, t('validation.minLength', { field: label, min }))
    .max(max, t('validation.maxLength', { field: label, max }));

  if (required) return schema;
  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    schema.optional()
  ) as z.ZodType<string | undefined, unknown>;
}

const booleanCore = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean().optional());

/**
 * `''` is "not answered", never `false`.
 *
 * `{ required: true }` narrows the type to `boolean` for the forms whose
 * request type declares the flag non-optional (a rendered checkbox always
 * yields true/false, so this changes the TYPE, not the runtime rule).
 */
export function boolean(options: { required: true }): z.ZodType<boolean, unknown>;
export function boolean(options?: {
  required?: boolean;
}): z.ZodType<boolean | undefined, unknown>;
export function boolean(_options: { required?: boolean } = {}) {
  return booleanCore as z.ZodType<boolean, unknown> &
    z.ZodType<boolean | undefined, unknown>;
}

const isRealDate = (y: number, m: number, d: number): boolean => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
};

/**
 * Accepts `DD/MM/YYYY` (typed) and `YYYY-MM-DD` (what `<input type="date">`
 * emits), rejects impossible calendar dates, and always hands the API ISO.
 */
export function dateDDMMYYYY(t: Translate, label: string) {
  const required = t('validation.required', { field: label });
  const invalid = t('validation.invalidDate', { field: label });

  return z
    .string({ error: required })
    .trim()
    .min(1, required)
    .refine((value) => normaliseDate(value) !== null, { message: invalid })
    .transform((value) => normaliseDate(value) as string);
}

function normaliseDate(value: string): string | null {
  const iso = ISO_DATE.exec(value);
  if (iso) {
    return isRealDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
      ? `${iso[1]}-${iso[2]}-${iso[3]}`
      : null;
  }
  const local = DDMMYYYY.exec(value);
  if (local) {
    return isRealDate(Number(local[3]), Number(local[2]), Number(local[1]))
      ? `${local[3]}-${local[2]}-${local[1]}`
      : null;
  }
  return null;
}
