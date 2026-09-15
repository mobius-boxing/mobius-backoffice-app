import { z } from 'zod';
import { requiredText, Translate } from '../fields';

/**
 * The Roles page only ever sets `name` — `profileType` and
 * `hasAccessToAllMachines` are pre-existing columns with server defaults and
 * are not exposed here. Bound at `roles.name varchar(200) NOT NULL`.
 */

const NAME_MAX = 200;

export const createRoleSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('roles.name'), NAME_MAX),
  });

export const renameRoleSchema = createRoleSchema;

export type CreateRoleSchema = z.infer<ReturnType<typeof createRoleSchema>>;
