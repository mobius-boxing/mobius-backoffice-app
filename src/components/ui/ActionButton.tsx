import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import Tooltip from './Tooltip';
import { cn } from '../../utils/cn';

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

const DANGER_CLASS = 'text-secondary-400 hover:text-red-600 transition-colors';

/**
 * The icon-only button for a grid actions column. Unlike the web app's
 * `ActionButton`, this keeps the plain `<button>` + the caller's own utility
 * classes (D-5) so the four pages that use it look exactly as they did —
 * only the tooltip and `aria-label` are new.
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  children,
  tone = 'default',
  className,
  ...props
}) => (
  <Tooltip label={label}>
    <button
      type="button"
      aria-label={label}
      className={cn(tone === 'danger' && DANGER_CLASS, className)}
      {...props}
    >
      {children}
    </button>
  </Tooltip>
);

export default ActionButton;
