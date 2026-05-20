import { useState, useCallback } from 'react';
import {
  useForm,
  UseFormReturn,
  DefaultValues,
  FieldValues,
  UseFormProps,
} from 'react-hook-form';

export interface UseModalFormOptions<T extends FieldValues> {
  defaultValues?: DefaultValues<T>;
  onSuccess?: () => void;
  onClose?: () => void;
  formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
}

export interface UseModalFormReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  clearError: () => void;
  handleSubmit: (
    apiCall: (data: T) => Promise<unknown>
  ) => (data: T) => Promise<void>;
  handleClose: () => void;
  resetForm: () => void;
}

export function useModalForm<T extends FieldValues>(
  options: UseModalFormOptions<T> = {}
): UseModalFormReturn<T> {
  const { defaultValues, onSuccess, onClose, formOptions } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<T>({
    defaultValues,
    ...formOptions,
  });

  const clearError = useCallback(() => setError(''), []);

  const handleSubmit = useCallback(
    (apiCall: (data: T) => Promise<unknown>) =>
      async (data: T): Promise<void> => {
        setLoading(true);
        setError('');

        try {
          await apiCall(data);
          form.reset();
          onSuccess?.();
        } catch (err: unknown) {
          console.error('Form submission error:', err);

          let errorMessage = 'An error occurred';
          if (err && typeof err === 'object') {
            const axiosError = err as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            errorMessage =
              axiosError.response?.data?.message ||
              axiosError.message ||
              errorMessage;
          }

          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },
    [form, onSuccess]
  );

  const handleClose = useCallback(() => {
    form.reset();
    setError('');
    onClose?.();
  }, [form, onClose]);

  const resetForm = useCallback(() => {
    form.reset(defaultValues);
    setError('');
  }, [form, defaultValues]);

  return {
    form,
    loading,
    error,
    setError,
    clearError,
    handleSubmit,
    handleClose,
    resetForm,
  };
}

export default useModalForm;
