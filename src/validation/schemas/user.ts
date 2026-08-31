import { z } from 'zod';
import {
  boolean,
  email,
  oneOf,
  optionalSelect,
  password,
  requiredText,
  Translate,
} from '../fields';

/**
 * B6 user schema. Bounds read from `information_schema.columns` on the live
 * schema (2026-08-30) (AMENDMENT A1):
 *   users.email     varchar(255) NOT NULL, UNIQUE (email) — GLOBAL
 *   users.firstName varchar(255) NOT NULL
 *   users.lastName  varchar(255) NOT NULL
 *   users.password  varchar(255) NOT NULL
 *   users.role      text         NOT NULL, default 'member'
 *   users.companyId integer      NULL
 *   users.isActive  boolean      NULL, default true
 *
 * THE FIRST REAL CHECK CONSTRAINT IN THE SWEEP:
 *   CHECK (role = ANY (ARRAY['member','admin','superAdmin']))
 * Every other "enum" so far has been a dropdown with nothing behind it. This
 * one is enforced by Postgres, so an out-of-list value is a 23514 whose message
 * carries the constraint name. `USER_ROLES` below is that array verbatim, read
 * from `pg_constraint`, not from the dropdown's options — and the live data
 * agrees with it.
 *
 * PASSWORD, and why it is optional: the edit form treats a blank box as "leave
 * the current password alone". The 8-character minimum is the modal's existing
 * product rule and is kept; the column itself only bounds length at 255 (it
 * stores a hash, so the rule is about what the user types, not what is stored).
 *
 * `companyId` IS a form field here, unlike everywhere else in this sweep: a
 * superAdmin assigns a user to a company, so it is a select rather than a
 * token-derived value (L-009 still governs which company the CALLER may act
 * on; that check stays server-side).
 */

export const USER_ROLES = ['member', 'admin', 'superAdmin'] as const;

const NAME_MAX = 255;
const PASSWORD_MIN = 8;

export const editUserSchema = (t: Translate) =>
  z.object({
    firstName: requiredText(t, t('userModal.firstName'), NAME_MAX),
    lastName: requiredText(t, t('userModal.lastName'), NAME_MAX),
    email: email(t),
    role: oneOf(t, t('userModal.role'), USER_ROLES),
    companyId: optionalSelect(),
    // `UpdateUserRequest.isActive` is non-optional; the checkbox always
    // yields a real boolean.
    isActive: boolean({ required: true }),
    // Blank means "unchanged", so this must stay optional.
    password: password(t, t('userModal.newPassword'), { min: PASSWORD_MIN }),
  });

export type EditUserSchema = z.infer<ReturnType<typeof editUserSchema>>;
