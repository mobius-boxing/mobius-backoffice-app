import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Eye } from 'lucide-react';
import { StoreOrder, STORE_ORDER_STATUS_FLOW, StoreOrderStatus } from '../types';
import { storeOrdersApi } from '../services/api';
import { useEntityList, FetchParams } from '../hooks/useEntityList';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import StoreNoCompanySelected from '../components/ui/StoreNoCompanySelected';
import OrderStatusBadge from '../components/store/OrderStatusBadge';
import StoreOrderDetailModal from '../components/modals/StoreOrderDetailModal';

const StoreOrders: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId, hasCompanySelected, isSuperAdmin } = useEffectiveCompany();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    (params: FetchParams) =>
      storeOrdersApi.getAll(
        effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params
      ),
    [effectiveCompanyId]
  );

  const {
    filteredData,
    loading,
    search,
    setSearch,
    refresh,
    filters,
    setFilters,
    pagination,
    setPage,
  } = useEntityList<StoreOrder>({
    fetchFn: fetchOrders,
    searchFields: ['storeUserEmail', 'uuid'],
    initialLimit: 100,
  });

  // All selectable statuses for the filter dropdown (linear flow + cancelled).
  const FILTER_STATUSES: StoreOrderStatus[] = [...STORE_ORDER_STATUS_FLOW, 'cancelled'];
  const statusFilter = (filters.status as string) || '';

  // Refetch whenever the selected company changes (superAdmin company switch).
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const showEmpty = isSuperAdmin && !hasCompanySelected;

  const openDetail = (order: StoreOrder) => {
    setSelectedUuid(order.uuid);
    setIsDetailOpen(true);
  };

  const columns = [
    {
      header: t('storeOrders.columns.ref'),
      accessor: (order: StoreOrder) => (
        <span className="text-sm font-medium text-secondary-900">
          #{order.uuid.slice(0, 8)}
        </span>
      ),
    },
    {
      header: t('storeOrders.columns.buyer'),
      accessor: (order: StoreOrder) => (
        <span className="text-sm text-secondary-700">{order.storeUserEmail}</span>
      ),
    },
    {
      header: t('storeOrders.columns.date'),
      accessor: (order: StoreOrder) => (
        <span className="text-sm text-secondary-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t('storeOrders.columns.items'),
      accessor: (order: StoreOrder) => (
        <span className="text-sm text-secondary-700">{order.itemCount}</span>
      ),
    },
    {
      header: t('storeOrders.columns.status'),
      accessor: (order: StoreOrder) => <OrderStatusBadge status={order.status} />,
    },
    {
      header: t('common.actions'),
      accessor: (order: StoreOrder) => (
        <Button variant="ghost" size="sm" onClick={() => openDetail(order)}>
          <Eye className="h-4 w-4 mr-2" />
          {t('storeOrders.view')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{t('storeOrders.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">{t('storeOrders.subtitle')}</p>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      {showEmpty ? (
        <StoreNoCompanySelected />
      ) : (
        <div className="bg-white shadow-md rounded-xl border border-secondary-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-secondary-200 bg-secondary-50/30">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder={t('storeOrders.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                aria-label={t('storeOrders.filters.statusLabel')}
                value={statusFilter}
                onChange={(e) =>
                  setFilters(e.target.value ? { status: e.target.value } : {})
                }
                className="w-full sm:w-auto px-4 py-2 border border-secondary-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('storeOrders.filters.allStatuses')}</option>
                {FILTER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`storeOrders.statuses.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Table
            data={filteredData}
            columns={columns}
            loading={loading}
            emptyMessage={t('storeOrders.empty')}
          />

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPage(pagination.page - 1)}
              >
                {t('storeOrders.pager.prev')}
              </Button>
              <span className="text-sm text-secondary-500">
                {t('storeOrders.pager.pageOf', {
                  page: pagination.page,
                  total: pagination.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPage(pagination.page + 1)}
              >
                {t('storeOrders.pager.next')}
              </Button>
            </div>
          )}
        </div>
      )}

      <StoreOrderDetailModal
        isOpen={isDetailOpen}
        orderUuid={selectedUuid}
        effectiveCompanyId={effectiveCompanyId}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUuid(null);
        }}
        onStatusAdvanced={() => {
          setActionError(null);
          refresh();
        }}
      />
    </div>
  );
};

export default StoreOrders;
