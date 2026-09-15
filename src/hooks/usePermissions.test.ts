import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('usePermissions', () => {
  it('reports isSuperAdmin and unconditional access for a superAdmin', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'superAdmin', permissions: [] } });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.has('anything.at.all')).toBe(true);
  });

  it('exposes the session permissions array', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'member', permissions: ['users.edit'] } });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions).toEqual(['users.edit']);
    expect(result.current.has('users.edit')).toBe(true);
    expect(result.current.has('roles.edit')).toBe(false);
  });

  it('respects allowReadOnly for a .readonly-only grant', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'member', permissions: ['roles.edit.readonly'] } });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.has('roles.edit')).toBe(false);
    expect(result.current.has('roles.edit', { allowReadOnly: true })).toBe(true);
  });

  it('denies everything for no session', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.has('users.edit')).toBe(false);
    expect(result.current.permissions).toEqual([]);
  });
});
