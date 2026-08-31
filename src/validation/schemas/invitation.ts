import { z } from 'zod';
import { email, oneOf, optionalSelect, requiredText, Translate } from '../fields';
import { USER_ROLES } from './user';

/**
 * B6 invitation schema. Bounds read from `information_schema.columns` on the
 * live schema (2026-08-30) (AMENDMENT A1):
 *   invitations.email     varchar(255) NOT NULL
 *   invitations.role      text         NOT NULL
 *   invitations.companyId integer      NULL
 *   invitations.token     varchar(255) NOT NULL, UNIQUE — server-generated
 *   invitations.expiresAt timestamptz  NOT NULL       — server-generated
 *
 * `invitations.role` carries the SAME CHECK constraint as `users.role`, so the
 * list is imported from the user schema rather than restated: two copies of a
 * database constraint is one copy too many.
 *
 * `firstName`/`lastName` are collected by the form but are NOT invitation
 * columns — they are carried to the user record created on acceptance. They are
 * bounded by `users.firstName`/`users.lastName` (255) for that reason.
 *
 * `token`, `expiresAt`, `invitedBy` are server-generated and deliberately
 * absent: a client that could set them could forge an invitation.
 */

const NAME_MAX = 255;

export const inviteUserSchema = (t: Translate) =>
  z.object({
    firstName: requiredText(t, t('userModal.firstName'), NAME_MAX),
    lastName: requiredText(t, t('userModal.lastName'), NAME_MAX),
    email: email(t),
    role: oneOf(t, t('userModal.role'), USER_ROLES),
    companyId: optionalSelect(),
  });

export type InviteUserSchema = z.infer<ReturnType<typeof inviteUserSchema>>;
