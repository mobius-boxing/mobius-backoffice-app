import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2 } from 'lucide-react';
import { StoreOrderDetail, STORE_ORDER_STATUS_FLOW } from '../../types';
import { storeOrdersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import OrderStatusBadge from '../store/OrderStatusBadge';

interface StoreOrderDetailModalProps {
  isOpen: boolean;
  orderUuid: string | null;
  effectiveCompanyId?: string;
  onClose: () => void;
  onStatusAdvanced: () => void; // tell the list to refresh after a successful PUT
}

const StoreOrderDetailModal: React.FC<StoreOrderDetailModalProps> = ({
  isOpen,
  orderUuid,
  effectiveCompanyId,
  onClose,
  onStatusAdvanced,
}) => {
  const { t } = useTranslation();

  const [order, setOrder] = useState<StoreOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  // Fetch on open (and clear on close), mirroring ManageCompanyModulesModal.
  useEffect(() => {
    if (isOpen && orderUuid) {
      setLoading(true);
      setError(null);
      storeOrdersApi
        .getByUuid(orderUuid, effectiveCompanyId)
        .then(setOrder)
        .catch((e: any) =>
          setError(e?.response?.data?.message || t('storeOrders.errors.loadFailed'))
        )
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      setOrder(null);
      setError(null);
      setAdvancing(false);
    }
  }, [isOpen, orderUuid, effectiveCompanyId, t]);

  const currentIndex = order ? STORE_ORDER_STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus = STORE_ORDER_STATUS_FLOW[currentIndex + 1]; // undefined when delivered
  const isFinal = !nextStatus;

  const advance = async () => {
    if (!order || !nextStatus) return;
    setAdvancing(true);
    setError(null);
    try {
      const updated = await storeOrdersApi.updateStatus(
        order.uuid,
        nextStatus,
        effectiveCompanyId
      );
      setOrder(updated); // re-render stepper with the new current state
      onStatusAdvanced(); // page refetches the list cell
    } catch (e: any) {
      setError(e?.response?.data?.message || t('storeOrders.errors.statusFailed'));
    } finally {
      setAdvancing(false);
    }
  };

  const title = order
    ? t('storeOrders.detail.title', { ref: '#' + order.uuid.slice(0, 8) })
    : t('storeOrders.detail.loadingTitle');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <svg
            className="animate-spin h-6 w-6 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Header meta */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                {t('storeOrders.detail.buyer')}
              </dt>
              <dd className="mt-1 text-sm text-secondary-900 break-words">
                {order.storeUserEmail}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                {t('storeOrders.detail.date')}
              </dt>
              <dd className="mt-1 text-sm text-secondary-900">
                {new Date(order.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                {t('storeOrders.detail.status')}
              </dt>
              <dd className="mt-1">
                <OrderStatusBadge status={order.status} />
              </dd>
            </div>
          </dl>

          {/* Status stepper */}
          <div>
            <ol
              className="flex items-center gap-2 overflow-x-auto"
              aria-label={t('storeOrders.detail.progressLabel')}
            >
              {STORE_ORDER_STATUS_FLOW.map((s, i) => {
                const state =
                  i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
                return (
                  <li
                    key={s}
                    className="flex items-center gap-2 shrink-0"
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    <span
                      className={
                        'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ' +
                        (state === 'done'
                          ? 'bg-green-100 text-green-700'
                          : state === 'current'
                          ? 'bg-primary-600 text-white'
                          : 'bg-secondary-100 text-secondary-400')
                      }
                    >
                      {state === 'done' ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span
                      className={
                        state === 'upcoming'
                          ? 'text-xs text-secondary-400'
                          : 'text-xs font-medium text-secondary-700'
                      }
                    >
                      {t(`storeOrders.statuses.${s}`)}
                    </span>
                    {i < STORE_ORDER_STATUS_FLOW.length - 1 && (
                      <span
                        className={`h-px w-6 ${
                          i < currentIndex ? 'bg-green-300' : 'bg-secondary-200'
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Advance action */}
            <div className="mt-4">
              {!isFinal ? (
                <Button onClick={advance} loading={advancing} disabled={advancing}>
                  {t('storeOrders.detail.advanceTo', {
                    status: t(`storeOrders.statuses.${nextStatus}`),
                  })}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('storeOrders.detail.completed')}
                </span>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
              {t('storeOrders.detail.items')}
            </h4>
            <ul className="divide-y divide-secondary-200 border-t border-b border-secondary-200">
              {order.items.map((item) => (
                <li key={item.uuid} className="py-3">
                  <p className="text-sm font-medium text-secondary-900">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    {t('storeOrders.detail.itemMeta', {
                      type: t(`storeOrders.itemTypes.${item.itemType}`, item.itemType),
                      quantity: item.quantity,
                      unitsPerPallet: item.unitsPerPallet,
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
              {t('storeOrders.detail.notes')}
            </h4>
            <p className="text-sm text-secondary-700 whitespace-pre-wrap">
              {order.notes?.trim() ? order.notes : t('storeOrders.detail.noNotes')}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end pt-4 border-t border-secondary-200 mt-4">
        <Button variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
};

export default StoreOrderDetailModal;
