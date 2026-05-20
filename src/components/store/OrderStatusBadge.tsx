import React from 'react';
import { useTranslation } from 'react-i18next';
import { StoreOrderStatus } from '../../types';

// Warm Industrial ramps: indigo/sky→blue, emerald→green, yellow→amber,
// violet/fuchsia→purple. Each workflow state gets a distinct hue so no two
// adjacent states collide.
const STATUS_STYLES: Record<StoreOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800', // amber  — awaiting action
  confirmed: 'bg-blue-100 text-blue-800', // blue   — accepted
  in_production: 'bg-purple-100 text-purple-800', // purple — being made
  shipped: 'bg-orange-100 text-orange-800', // orange — in transit
  delivered: 'bg-green-100 text-green-800', // green  — done
};

interface OrderStatusBadgeProps {
  status: StoreOrderStatus;
  className?: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {t(`storeOrders.statuses.${status}`)}
    </span>
  );
};

export default OrderStatusBadge;
