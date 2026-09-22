import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Check, Ban } from 'lucide-react';
import { Company, PaginatedResponse, UserDevice } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { devicesApi, companiesApi } from '../services/api';
import { useEntityList, FetchParams } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Table from '../components/ui/Table';
import ActionButton from '../components/ui/ActionButton';
import ConfirmModal from '../components/ui/ConfirmModal';

const USER_AGENT_MAX = 60;

const STATUS_BADGE: Record<UserDevice['status'], string> = {
  pending: 'gd-badge-warning',
  approved: 'gd-badge-positive',
  revoked: 'gd-badge-negative',
};

const readErrorCode = (error: unknown): string | undefined =>
  (error as { response?: { data?: { code?: string } } })?.response?.data?.code;

const Devices: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superAdmin';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const confirm = useConfirmModal();

  // The input updates immediately; the value that reaches the API (below) is
  // debounced so a fast typist doesn't fire one apiRateLimiter-counted request
  // per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    companiesApi
      .getCompanies({ limit: 100 })
      .then((r) => setCompanies([...r.data].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {
        /* silent — dropdown stays empty, the page still gates on a selection */
      });
  }, [isSuperAdmin]);

  // A superAdmin with no company picked yet must see nothing load (D-233): this
  // wrapper answers an empty page itself rather than calling the API with no
  // companyId, which would return every tenant's devices.
  const fetchDevices = useCallback(
    (params: FetchParams): Promise<PaginatedResponse<UserDevice>> => {
      if (isSuperAdmin && !selectedCompanyId) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: typeof params.limit === 'number' ? params.limit : 100,
          totalPages: 0,
        });
      }
      return devicesApi.getDevices({
        page: params.page,
        limit: params.limit,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status: params.status as string | undefined,
        companyId: params.companyId as string | undefined,
      });
    },
    [isSuperAdmin, selectedCompanyId]
  );

  const {
    filteredData: devices,
    loading,
    error,
    refresh,
    setFilters,
  } = useEntityList<UserDevice>({
    fetchFn: fetchDevices,
    initialLimit: 100,
  });

  // `status`/`search`/`companyId` are routed through `setFilters`, not the
  // hook's own `search` state: the hook's auto-fetch effect only re-runs on
  // page/limit/sort/filters changes (search is excluded), and its client-side
  // search matcher only reads flat keys, which `user.email` etc. are not.
  //
  // D-254: this also means the hook's own mount effect fires once with `{}`
  // (its initial `filters` state) before this effect's first run replaces it
  // with `{status: 'pending'}`, so first paint costs two GETs. Accepted: the
  // hook's `filters` default isn't configurable per-instance, the extra call
  // is a plain unfiltered page-1 fetch (cheap, well under apiRateLimiter),
  // and avoiding it would mean forking useEntityList for one page.
  useEffect(() => {
    const next: Record<string, unknown> = {};
    if (statusFilter !== 'all') next.status = statusFilter;
    if (debouncedSearchTerm.trim()) next.search = debouncedSearchTerm.trim();
    if (isSuperAdmin && selectedCompanyId) next.companyId = selectedCompanyId;
    setFilters(next);
  }, [statusFilter, debouncedSearchTerm, selectedCompanyId, isSuperAdmin, setFilters]);

  const truncatedUserAgent = (device: UserDevice): string => {
    const value = device.userAgent || t('devices.unknownUserAgent');
    return value.length > USER_AGENT_MAX ? `${value.slice(0, USER_AGENT_MAX)}…` : value;
  };

  const confirmParams = (device: UserDevice) => ({
    email: device.user.email,
    device: truncatedUserAgent(device),
    requestedAt: new Date(device.requestedAt).toLocaleString(),
  });

  const runDeviceAction = (
    device: UserDevice,
    action: (uuid: string) => Promise<UserDevice>,
    conflictKey: string,
    errorKey: string
  ) => async () => {
    setActionError(null);
    try {
      await action(device.uuid);
      await refresh();
    } catch (err) {
      setActionError(
        readErrorCode(err) === 'INVALID_DEVICE_TRANSITION' ? t(conflictKey) : t(errorKey)
      );
      await refresh();
    }
  };

  const handleApprove = (device: UserDevice) => {
    confirm.showConfirm({
      title: t('devices.approve.confirmTitle'),
      message: t('devices.approve.confirmMessage', confirmParams(device)),
      variant: 'info',
      confirmText: t('devices.approve.submit'),
      onConfirm: runDeviceAction(
        device,
        devicesApi.approveDevice,
        'devices.approve.alreadyApproved',
        'devices.approve.error'
      ),
    });
  };

  const handleRevoke = (device: UserDevice) => {
    confirm.showConfirm({
      title: t('devices.revoke.confirmTitle'),
      message: t('devices.revoke.confirmMessage', confirmParams(device)),
      variant: 'danger',
      confirmText: t('devices.revoke.submit'),
      onConfirm: runDeviceAction(
        device,
        devicesApi.revokeDevice,
        'devices.revoke.alreadyRevoked',
        'devices.revoke.error'
      ),
    });
  };

  const columns = [
    {
      header: t('devices.columns.user'),
      accessor: (device: UserDevice) => (
        <div>
          <div className="text-sm font-medium text-secondary-900">
            {device.user.firstName} {device.user.lastName}
          </div>
          <div className="text-sm text-secondary-500">{device.user.email}</div>
        </div>
      ),
    },
    {
      header: t('devices.columns.device'),
      accessor: (device: UserDevice) => (
        <span className="text-sm text-secondary-900" title={device.userAgent ?? ''}>
          {truncatedUserAgent(device)}
        </span>
      ),
    },
    {
      header: t('devices.columns.ip'),
      accessor: (device: UserDevice) => (
        <span className="text-sm text-secondary-500">{device.requestIp || '—'}</span>
      ),
    },
    {
      header: t('devices.columns.requestedAt'),
      accessor: (device: UserDevice) => (
        <span className="text-sm text-secondary-900">
          {new Date(device.requestedAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: t('devices.columns.status'),
      accessor: (device: UserDevice) => (
        <span className={`gd-badge ${STATUS_BADGE[device.status]}`}>
          {t(`devices.status.${device.status}`)}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (device: UserDevice) => (
        <div className="flex items-center space-x-2">
          {device.status !== 'approved' && (
            <ActionButton
              onClick={() => handleApprove(device)}
              className="text-secondary-400 hover:text-green-600 transition-colors"
              label={t('devices.approve.action')}
            >
              <Check className="h-4 w-4" />
            </ActionButton>
          )}
          {device.status !== 'revoked' && (
            <ActionButton
              onClick={() => handleRevoke(device)}
              tone="danger"
              label={t('devices.revoke.action')}
            >
              <Ban className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="gd-page-head">
        <div>
          <h1 className="gd-page-title">{t('devices.title')}</h1>
          <p className="gd-page-sub">{t('devices.subtitle')}</p>
        </div>
      </div>

      {actionError && (
        <div className="gd-alert gd-alert-danger">
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      {error && !loading && (
        <div className="gd-alert gd-alert-danger">
          <p className="text-sm text-red-800">{t('devices.loadError')}</p>
        </div>
      )}

      <div className="gd-surface overflow-hidden">
        <div className="gd-surface-head flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="gd-search relative sm:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder={t('devices.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">{t('devices.filters.statusAll')}</option>
            <option value="pending">{t('devices.filters.statusPending')}</option>
            <option value="approved">{t('devices.filters.statusApproved')}</option>
            <option value="revoked">{t('devices.filters.statusRevoked')}</option>
          </select>

          {isSuperAdmin && (
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full sm:w-64 border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('devices.selectCompany')}</option>
              {companies.map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Table
          data={devices}
          columns={columns}
          loading={loading}
          emptyMessage={t('devices.empty')}
        />
      </div>

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={confirm.handleClose}
        onConfirm={confirm.handleConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        variant={confirm.variant}
        loading={confirm.loading}
      />
    </div>
  );
};

export default Devices;
