import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Permission, Role } from '../../types';
import { permissionsApi, rolesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
  /** superAdmin only — which company's catalogue to load. */
  companyId?: string;
}

type GrantState = 'none' | 'readonly' | 'full';

/**
 * One row of the matrix: a permission *concept* — the RW code plus its
 * `.readonly` sibling (when one exists) collapsed into a single none/read/full
 * control. Concepts without a `.readonly` sibling render as a checkbox.
 */
interface ConceptRow {
  code: string;
  name: string;
  description?: string;
  area: string;
  hasReadOnly: boolean;
}

const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  companyId,
}) => {
  const { t } = useTranslation();
  const [catalogue, setCatalogue] = useState<Permission[]>([]);
  const [grants, setGrants] = useState<Record<string, GrantState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !role) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [permissions, fullRole] = await Promise.all([
          permissionsApi.getPermissions(companyId ? { companyId } : {}),
          rolesApi.getRole(role.uuid, companyId),
        ]);
        if (cancelled) return;
        setCatalogue(permissions);

        const codes = new Set(fullRole.permissionCodes ?? []);
        const state: Record<string, GrantState> = {};
        permissions
          .filter((permission) => !permission.readOnly)
          .forEach((permission) => {
            if (codes.has(permission.code)) {
              state[permission.code] = 'full';
            } else if (codes.has(`${permission.code}.readonly`)) {
              state[permission.code] = 'readonly';
            } else {
              state[permission.code] = 'none';
            }
          });
        setGrants(state);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || t('roles.permissionsModal.loadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, role, companyId, t]);

  const conceptsByArea = useMemo(() => {
    const readOnlyCodes = new Set(
      catalogue.filter((permission) => permission.readOnly).map((permission) => permission.code)
    );
    const concepts: ConceptRow[] = catalogue
      .filter((permission) => !permission.readOnly)
      .map((permission) => ({
        code: permission.code,
        name: permission.name,
        description: permission.description,
        area: permission.area || 'actions',
        hasReadOnly: readOnlyCodes.has(`${permission.code}.readonly`),
      }));

    const grouped = new Map<string, ConceptRow[]>();
    concepts.forEach((concept) => {
      const list = grouped.get(concept.area) ?? [];
      list.push(concept);
      grouped.set(concept.area, list);
    });
    grouped.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([area, list]) => ({ area, concepts: list }));
  }, [catalogue]);

  const setGrant = (code: string, state: GrantState) => {
    setGrants((prev) => ({ ...prev, [code]: state }));
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    setError(null);
    try {
      const codes: string[] = [];
      Object.entries(grants).forEach(([code, state]) => {
        if (state === 'full') codes.push(code);
        if (state === 'readonly') codes.push(`${code}.readonly`);
      });
      await rolesApi.setRolePermissions(role.uuid, codes, companyId);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('roles.permissionsModal.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Admin's grants cannot be edited — the grid is read-only.
  const readOnlyView = role?.isProtected === true;

  const stateButton = (concept: ConceptRow, state: GrantState, label: string) => {
    const active = (grants[concept.code] ?? 'none') === state;
    return (
      <button
        type="button"
        disabled={readOnlyView}
        onClick={() => setGrant(concept.code, state)}
        className={`px-2 py-0.5 text-xs rounded border transition-colors ${
          active
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-white text-secondary-600 border-secondary-300 hover:border-primary-400'
        } ${readOnlyView ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {label}
      </button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('roles.permissionsModal.title', { name: role?.name ?? '' })}
      size="2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="gd-alert gd-alert-danger">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {readOnlyView && (
          <div className="gd-alert gd-alert-info">
            <p className="text-sm text-blue-800">{t('roles.permissionsModal.protectedNote')}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-1">
            {conceptsByArea.map(({ area, concepts }) => (
              <div key={area}>
                <h3 className="text-sm font-semibold text-secondary-900 uppercase tracking-wide mb-2 sticky top-0 bg-white py-1">
                  {t(`roles.areas.${area}`, area)}
                </h3>
                <div className="divide-y divide-secondary-100 border border-secondary-200 rounded-md">
                  {concepts.map((concept) => (
                    <div key={concept.code} className="flex items-center justify-between gap-4 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm text-secondary-900 truncate">{concept.name}</div>
                        {concept.description && (
                          <div className="text-xs text-secondary-500 truncate">{concept.description}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        {concept.hasReadOnly ? (
                          <>
                            {stateButton(concept, 'none', t('roles.states.none'))}
                            {stateButton(concept, 'readonly', t('roles.states.readOnly'))}
                            {stateButton(concept, 'full', t('roles.states.full'))}
                          </>
                        ) : (
                          <input
                            type="checkbox"
                            disabled={readOnlyView}
                            checked={(grants[concept.code] ?? 'none') === 'full'}
                            onChange={(e) => setGrant(concept.code, e.target.checked ? 'full' : 'none')}
                            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2 border-t border-secondary-200">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          {!readOnlyView && (
            <Button onClick={handleSave} loading={saving} disabled={loading}>
              {t('roles.permissionsModal.save')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RolePermissionsModal;
