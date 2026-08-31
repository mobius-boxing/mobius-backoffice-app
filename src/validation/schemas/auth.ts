import { z } from 'zod';
import { email, password, Translate } from '../fields';

/**
 * B6 auth schemas — the "verify-only" set. These three pages were ALREADY
 * validated before this batch; converting them to schemas moves the rules
 * without changing a single one, so any behaviour difference here is a bug.
 * Each rule below is the modal's own, kept verbatim:
 *
 *   Login           email required + pattern, password required
 *   ForgotPassword  email required + pattern
 *   ResetPassword   password required, min 8, upper+lower+digit pattern;
 *                   confirmPassword required and equal to it
 *
 * Their messages keep their existing `login.*` / `resetPassword.validation.*`
 * keys rather than moving to the shared
 * `validation.*` namespace: the copy is already Spanish, already reviewed, and
 * retranslating it would be churn with a chance of regression.
 *
 * NOTE the divergence from the web app's copy of this file: this app's login
 * keys are FLAT (`login.emailRequired`), the web app's are nested
 * (`login.validation.emailRequired`). That is the one intended difference
 * between the two `fields.ts` copies, and it propagates here.
 *
 * `users.password` is varchar(255) — the hash's column, not the typed value's,
 * so the max is a sanity bound, not a policy.
 */

const PASSWORD_MIN = 8;

/**
 * At least one lowercase, one uppercase and one digit. Byte-identical to the
 * regex `ResetPassword.tsx` has always used; do not "improve" it here without
 * changing the product rule deliberately.
 */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const loginSchema = (t: Translate) =>
  z.object({
    email: email(t),
    password: z
      .string({ error: t('login.passwordRequired') })
      .min(1, t('login.passwordRequired')),
  });

export const forgotPasswordSchema = (t: Translate) =>
  z.object({
    email: email(t),
  });

/**
 * The first CROSS-FIELD rule in the whole program: `confirmPassword` is checked
 * against `newPassword` with `.refine`, and `path` pins the message on the
 * confirm input — without it zod reports the error at the object root, where no
 * field can display it.
 */
export const resetPasswordSchema = (t: Translate) =>
  z
    .object({
      newPassword: password(t, t('resetPassword.newPasswordLabel'), {
        min: PASSWORD_MIN,
        required: true,
      }).regex(PASSWORD_PATTERN, t('resetPassword.validation.passwordPattern')),
      confirmPassword: z
        .string({ error: t('resetPassword.validation.confirmPasswordRequired') })
        .min(1, t('resetPassword.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('resetPassword.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });

export type LoginSchema = z.infer<ReturnType<typeof loginSchema>>;
export type ResetPasswordSchema = z.infer<ReturnType<typeof resetPasswordSchema>>;
