import { useState, useCallback } from 'react';
import {
  useForm,
  UseFormReturn,
  DefaultValues,
  FieldValues,
  Path,
  Resolver,
  UseFormProps,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';

export interface UseModalFormOptions<T extends FieldValues> {
  defaultValues?: DefaultValues<T>;
  onSuccess?: () => void;
  onClose?: () => void;
  /**
   * Optional zod schema (see `src/validation/fields.ts`). When present the form
   * validates through `zodResolver` on blur; when absent NOTHING changes, which
   * is what lets forms migrate one at a time.
   */
  schema?: ZodType<T>;
  formOptions?: Omit<UseFormProps<T>, 'defaultValues'>;
}

/** The API's field-level 400 (`src/dto/input/shared/ValidationError.ts`). */
interface ServerFieldError {
  field?: unknown;
  message?: unknown;
}

interface ServerErrorBody {
  code?: string;
  message?: string;
  errors?: ServerFieldError[];
}

/**
 * Pins the API's `VALIDATION_ERROR` field messages onto the matching inputs.
 *
 * Returns `null` when the body is not a field-level 400 (caller shows the
 * banner as before), otherwise the messages that matched no registered field —
 * a nested or renamed field must still reach the user somehow.
 */
function applyServerFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  body: ServerErrorBody | undefined
): string[] | null {
  if (body?.code !== 'VALIDATION_ERROR' || !Array.isArray(body.errors)) {
    return null;
  }

  const registered = form.getValues() as Record<string, unknown>;
  const unmapped: string[] = [];

  body.errors.forEach((item) => {
    const message = typeof item?.message === 'string' ? item.message : '';
    if (!message) return;

    const field = typeof item?.field === 'string' ? item.field : '';
    if (field && Object.prototype.hasOwnProperty.call(registered, field)) {
      form.setError(field as Path<T>, { type: 'server', message });
      return;
    }
    unmapped.push(message);
  });

  return unmapped;
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
  const { defaultValues, onSuccess, onClose, schema, formOptions } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<T>({
    defaultValues,
    ...(schema
      ? {
          // The cast bridges zod 4's `ZodType<Output, Input=unknown>` and
          // `zodResolver`'s demand that Input extend `FieldValues`. Our numeric
          // primitives preprocess `unknown` on purpose (an <input type="number">
          // hands over a string), so the input side genuinely is unknown.
          resolver: zodResolver(
            schema as unknown as ZodType<T, FieldValues>
          ) as unknown as Resolver<T>,
          mode: 'onBlur' as const,
        }
      : {}),
    // `formOptions` still wins: a caller that already set its own resolver or
    // mode keeps it.
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
          let body: ServerErrorBody | undefined;
          if (err && typeof err === 'object') {
            const axiosError = err as {
              response?: { data?: ServerErrorBody };
              message?: string;
            };
            body = axiosError.response?.data;
            errorMessage =
              body?.message || axiosError.message || errorMessage;
          }

          // A field-level 400 lands ON the offending inputs. Only what could
          // not be matched to a registered field falls back to the banner —
          // otherwise the user reads the same sentence twice.
          const unmapped = applyServerFieldErrors(form, body);
          if (unmapped === null) {
            setError(errorMessage);
          } else if (unmapped.length > 0) {
            setError(unmapped.join(' '));
          }
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
