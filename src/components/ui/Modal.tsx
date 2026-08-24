import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="gd-modal-overlay fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        <div
          className={`gd-modal-panel relative w-full ${sizeClasses[size]} text-left p-7 animate-scale-in`}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between mb-5">
              {title && (
                <h3 className="gd-modal-title">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="-mr-2 -mt-1 ml-auto p-2"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
