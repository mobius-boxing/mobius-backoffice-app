import { useState, useCallback } from 'react';

interface ConfirmModalState {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

interface UseConfirmModalReturn {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading: boolean;
  showConfirm: (options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }) => void;
  handleConfirm: () => void;
  handleClose: () => void;
}

export const useConfirmModal = (): UseConfirmModalReturn => {
  const [state, setState] = useState<ConfirmModalState>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });
  const [loading, setLoading] = useState(false);

  const showConfirm = useCallback((options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
  }) => {
    setState({
      isOpen: true,
      message: options.message,
      title: options.title,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      variant: options.variant,
      onConfirm: options.onConfirm,
    });
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await state.onConfirm();
    } finally {
      setLoading(false);
      handleClose();
    }
  }, [state.onConfirm, handleClose]);

  return {
    isOpen: state.isOpen,
    message: state.message,
    title: state.title,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    loading,
    showConfirm,
    handleConfirm,
    handleClose,
  };
};

export default useConfirmModal;
