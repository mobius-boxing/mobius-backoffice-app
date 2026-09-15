import { canAccessBackoffice, hasPermissionCode } from './rbac';

describe('hasPermissionCode', () => {
  it('denies a null/undefined subject', () => {
    expect(hasPermissionCode(null, 'users.edit')).toBe(false);
    expect(hasPermissionCode(undefined, 'users.edit')).toBe(false);
  });

  it('always allows superAdmin regardless of codes', () => {
    expect(hasPermissionCode({ role: 'superAdmin', permissions: [] }, 'users.edit')).toBe(true);
  });

  it('allows an exact code match', () => {
    expect(hasPermissionCode({ role: 'member', permissions: ['users.edit'] }, 'users.edit')).toBe(true);
  });

  it('denies a missing code', () => {
    expect(hasPermissionCode({ role: 'member', permissions: ['roles.edit'] }, 'users.edit')).toBe(false);
  });

  it('denies a .readonly grant when allowReadOnly is not set', () => {
    expect(
      hasPermissionCode({ role: 'member', permissions: ['users.edit.readonly'] }, 'users.edit')
    ).toBe(false);
  });

  it('allows a .readonly grant when allowReadOnly is set', () => {
    expect(
      hasPermissionCode({ role: 'member', permissions: ['users.edit.readonly'] }, 'users.edit', {
        allowReadOnly: true,
      })
    ).toBe(true);
  });

  it('applies the legacy fallback for a codeless admin', () => {
    expect(hasPermissionCode({ role: 'admin', permissions: [] }, 'anything.at.all')).toBe(true);
    expect(hasPermissionCode({ role: 'admin' }, 'anything.at.all')).toBe(true);
  });

  it('does NOT apply the legacy fallback once the admin carries real codes', () => {
    expect(hasPermissionCode({ role: 'admin', permissions: ['users.edit'] }, 'roles.edit')).toBe(false);
  });

  it('does not apply the legacy fallback to a plain member', () => {
    expect(hasPermissionCode({ role: 'member', permissions: [] }, 'users.edit')).toBe(false);
  });
});

describe('canAccessBackoffice', () => {
  it('denies a null subject', () => {
    expect(canAccessBackoffice(null)).toBe(false);
  });

  it('allows superAdmin', () => {
    expect(canAccessBackoffice({ role: 'superAdmin', permissions: [] })).toBe(true);
  });

  it('allows a company actor holding any of the four entry codes', () => {
    expect(canAccessBackoffice({ role: 'member', permissions: ['users.edit'] })).toBe(true);
    expect(canAccessBackoffice({ role: 'member', permissions: ['users.edit.readonly'] })).toBe(true);
    expect(canAccessBackoffice({ role: 'member', permissions: ['roles.edit'] })).toBe(true);
    expect(canAccessBackoffice({ role: 'member', permissions: ['roles.edit.readonly'] })).toBe(true);
  });

  it('allows a user with devices.approve', () => {
    expect(canAccessBackoffice({ role: 'member', permissions: ['devices.approve'] })).toBe(true);
  });

  it('denies a member with an unrelated code', () => {
    expect(canAccessBackoffice({ role: 'member', permissions: ['customers.edit'] })).toBe(false);
  });

  it('applies the legacy fallback for a codeless admin', () => {
    expect(canAccessBackoffice({ role: 'admin', permissions: [] })).toBe(true);
  });

  it('denies a codeless plain member', () => {
    expect(canAccessBackoffice({ role: 'member', permissions: [] })).toBe(false);
  });
});
