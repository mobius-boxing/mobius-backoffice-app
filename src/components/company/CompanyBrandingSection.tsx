import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, X } from 'lucide-react';
import { Company, CompanyBranding, FileRecord } from '../../types';
import { companiesApi, filesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Button from '../ui/Button';
import Input from '../ui/Input';

/** Mobius green — what a tenant gets until somebody picks a colour. */
const DEFAULT_BRAND_COLOR = '#018445';
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_DISPLAY_NAME_LENGTH = 80;
const MAX_LOGIN_MESSAGE_LENGTH = 160;

interface CompanyBrandingSectionProps {
  company: Company;
  /** Called after a successful save so the parent can refetch server state. */
  onSaved: () => void;
}

/** The form's own shape: text inputs never hold null, they hold ''. */
interface BrandingFormValues {
  displayName: string;
  brandColor: string;
  /** '' means "same as the brand colour"; it is never pre-filled with a copy. */
  accentColor: string;
  loginMessage: string;
}

/** '' ⇒ null, which is how the API expresses "unset". */
const orNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Company-level whitelabel identity (spec revision 2: one identity per client,
 * used by every module it has). Lives inside ManageCompanyModulesModal — no new
 * route, no nested modal (AC-19).
 *
 * The save is a WHOLESALE replacement: all five keys are always submitted, so
 * editing only the colour cannot clear the display name.
 *
 * No live preview on purpose (spec Non-goal): the module SPA's `applyBranding`
 * sets CSS custom properties on <html> globally and would repaint the
 * backoffice itself. The swatch below is a static square.
 */
const CompanyBrandingSection: React.FC<CompanyBrandingSectionProps> = ({
  company,
  onSaved,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The logo is a uuid reference, not a form text field: it changes through the
  // uploader, so it is component state that the submit handler reads.
  const [logoFileUuid, setLogoFileUuid] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<FileRecord | null>(null);
  const [uploading, setUploading] = useState(false);

  // The logo lives outside react-hook-form, so `isDirty` cannot see it — this
  // is its equivalent, and both together decide whether a refill is safe.
  const [logoDirty, setLogoDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors, isDirty },
      reset,
      watch,
      setValue,
    },
    error,
    setError,
  } = useModalForm<BrandingFormValues>({
    defaultValues: {
      displayName: '',
      brandColor: '',
      accentColor: '',
      loginMessage: '',
    },
    formOptions: { mode: 'onSubmit' },
  });

  /**
   * Fill the form from a stored branding blob. Unset fields become '' — never
   * the strings "null"/"undefined" (AC-3). `reset` also clears the dirty flag,
   * which is what makes the guard below work.
   */
  const fillForm = useCallback(
    (branding: Partial<CompanyBranding> | undefined) => {
      const stored = branding ?? {};
      reset({
        displayName: stored.displayName ?? '',
        brandColor: stored.brandColor ?? '',
        // Never `?? stored.brandColor`: pre-filling would persist a copy of the
        // brand colour on the next save and destroy the fallback for good.
        accentColor: stored.accentColor ?? '',
        loginMessage: stored.loginMessage ?? '',
      });
      setLogoFileUuid(stored.logoFileUuid ?? null);
      setLogoFile(null);
      setLogoDirty(false);
      setError('');
    },
    [reset, setError]
  );

  const fillFromCompany = useCallback(() => {
    fillForm(company.branding);
  }, [fillForm, company.branding]);

  useEffect(() => {
    // The parent refetches (and hands down a NEW company object) after every
    // module toggle and after a save. Refilling then would silently throw away
    // whatever the user has typed, so unsaved edits win: they are only ever
    // replaced by an explicit save or by the discard button.
    if (isDirty || logoDirty) return;
    fillFromCompany();
  }, [fillFromCompany, isDirty, logoDirty]);

  // Show the current logo's name. Fail-soft: filesApi.getFile answers null on
  // any error, and the uuid alone is still enough to keep the reference.
  useEffect(() => {
    let cancelled = false;
    if (!logoFileUuid) {
      setLogoFile(null);
      return;
    }
    filesApi.getFile(logoFileUuid).then((file) => {
      if (!cancelled) setLogoFile(file);
    });
    return () => {
      cancelled = true;
    };
  }, [logoFileUuid]);

  const handlePickLogo = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const handleLogoSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      // superAdmins carry no company of their own, so the target company is
      // named explicitly; the API ignores it for every other role.
      const created = await filesApi.uploadFile(file, company.uuid);
      setLogoFileUuid(created.uuid);
      setLogoFile(created);
      setLogoDirty(true);
    } catch (err: unknown) {
      const uploadError = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      setError(
        uploadError.message === 'FILE_TOO_LARGE'
          ? t('branding.error.tooLarge')
          : uploadError.response?.data?.message ||
            t('branding.error.uploadFailed')
      );
    } finally {
      setUploading(false);
    }
  };

  /**
   * The save owns its own try/catch instead of delegating to `useModalForm`:
   * that hook's fallback message is a hardcoded English literal, and AC-7/AC-11
   * require the API's message or a translated one (the hook is shared with
   * other modals, so it is not the place to fix this).
   */
  const onSubmit = formSubmit(async (data) => {
    const branding: CompanyBranding = {
      displayName: orNull(data.displayName),
      brandColor: orNull(data.brandColor)?.toLowerCase() ?? null,
      accentColor: orNull(data.accentColor)?.toLowerCase() ?? null,
      logoFileUuid,
      loginMessage: orNull(data.loginMessage),
    };

    setSaving(true);
    setError('');
    try {
      const updated = await companiesApi.updateBranding(company.uuid, branding);
      // Show what the server actually stored (it lower-cases the colour), and
      // clear the dirty flags so the parent's refetch may refill freely.
      fillForm(updated.branding);
      onSaved();
    } catch (err: unknown) {
      const saveError = err as { response?: { data?: { message?: string } } };
      setError(
        saveError?.response?.data?.message || t('branding.error.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  });

  const colorValue = watch('brandColor');
  const swatchColor = HEX_COLOR_PATTERN.test(colorValue || '')
    ? colorValue
    : DEFAULT_BRAND_COLOR;

  // Pure selection, no colour maths: what the accent WOULD look like today.
  // An empty accent shows the brand colour in the swatch and the picker while
  // the text input stays empty, which is exactly the stored state.
  const accentValue = watch('accentColor');
  const accentSwatchColor = HEX_COLOR_PATTERN.test(accentValue || '')
    ? accentValue
    : swatchColor;
  const accentIsUnset = (accentValue || '').trim().length === 0;

  return (
    <section className="pt-4 mt-4 border-t border-secondary-200">
      <h3 className="text-sm font-semibold text-secondary-900">
        {t('branding.title')}
      </h3>
      <p className="mt-1 text-xs text-secondary-500">
        {t('branding.description')}
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-4"
            data-testid="branding-error"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('displayName', {
            maxLength: {
              value: MAX_DISPLAY_NAME_LENGTH,
              message: t('branding.validation.displayNameMaxLength'),
            },
          })}
          type="text"
          label={t('branding.displayName')}
          placeholder={t('branding.displayNamePlaceholder')}
          error={errors.displayName?.message}
          data-testid="branding-display-name"
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            {t('branding.brandColor')}
          </label>
          <div className="flex items-center gap-3">
            <span
              className="h-9 w-9 rounded-md border border-secondary-300 shrink-0"
              style={{ backgroundColor: swatchColor }}
              title={t('branding.colorPreview')}
              data-testid="branding-color-swatch"
            />
            {/* Native picker: writes the same form field the text input holds.
                `shouldDirty` is NOT optional here — it defaults to false, and
                without it a colour chosen through the picker leaves `isDirty`
                false, so the refetch effect above discards the pick. */}
            <input
              type="color"
              name="brandColorPicker"
              value={swatchColor}
              onChange={(event) =>
                setValue('brandColor', event.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="h-9 w-12 rounded-md border border-secondary-300 bg-white p-1 shrink-0"
              aria-label={t('branding.brandColor')}
              data-testid="branding-brand-color-picker"
            />
            <div className="flex-1">
              <Input
                {...register('brandColor', {
                  pattern: {
                    value: HEX_COLOR_PATTERN,
                    message: t('branding.validation.brandColorInvalid'),
                  },
                })}
                type="text"
                placeholder={t('branding.brandColorPlaceholder')}
                error={errors.brandColor?.message}
                data-testid="branding-brand-color"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            {t('branding.accentColor')}
          </label>
          <div className="flex items-center gap-3">
            <span
              className="h-9 w-9 rounded-md border border-secondary-300 shrink-0"
              style={{ backgroundColor: accentSwatchColor }}
              title={t('branding.accentColorPreview')}
              data-testid="branding-accent-swatch"
            />
            {/* One-way, like the brand picker above: an <input type="color">
                cannot hold "empty", so it only ever WRITES the form field.
                `shouldDirty` for the same reason as the brand picker. */}
            <input
              type="color"
              name="accentColorPicker"
              value={accentSwatchColor}
              onChange={(event) =>
                setValue('accentColor', event.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="h-9 w-12 rounded-md border border-secondary-300 bg-white p-1 shrink-0"
              aria-label={t('branding.accentColor')}
              data-testid="branding-accent-color-picker"
            />
            <div className="flex-1">
              <Input
                {...register('accentColor', {
                  pattern: {
                    value: HEX_COLOR_PATTERN,
                    message: t('branding.validation.accentColorInvalid'),
                  },
                })}
                type="text"
                placeholder={t('branding.accentColorPlaceholder')}
                error={errors.accentColor?.message}
                data-testid="branding-accent-color"
              />
            </div>
          </div>
          {accentIsUnset && (
            <p
              className="mt-1.5 text-xs text-secondary-500"
              data-testid="branding-accent-hint"
            >
              {t('branding.accentColorHint')}
            </p>
          )}
        </div>

        <Input
          {...register('loginMessage', {
            maxLength: {
              value: MAX_LOGIN_MESSAGE_LENGTH,
              message: t('branding.validation.loginMessageMaxLength'),
            },
          })}
          type="text"
          label={t('branding.loginMessage')}
          placeholder={t('branding.loginMessagePlaceholder')}
          error={errors.loginMessage?.message}
          data-testid="branding-login-message"
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            {t('branding.logo')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleLogoSelected}
            className="hidden"
            data-testid="branding-logo-input"
          />
          {logoFileUuid ? (
            <div className="flex items-center justify-between rounded-md border border-secondary-200 bg-secondary-50 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-secondary-400 shrink-0" />
                <span className="text-sm text-secondary-900 truncate">
                  {logoFile?.originalName || t('branding.logoUnnamed')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLogoFileUuid(null);
                  setLogoDirty(true);
                }}
                disabled={saving || uploading}
                className="text-red-600 hover:text-red-700 disabled:opacity-50 shrink-0"
                title={t('branding.logoRemove')}
                aria-label={t('branding.logoRemove')}
                data-testid="branding-logo-remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePickLogo}
                disabled={saving || uploading}
                className="inline-flex items-center"
                data-testid="branding-logo-upload"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading
                  ? t('branding.logoUploading')
                  : t('branding.logoChoose')}
              </Button>
              <span className="text-xs text-secondary-500">
                {t('branding.logoNone')}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fillFromCompany}
            disabled={saving || uploading}
            data-testid="branding-cancel"
          >
            {t('branding.cancel')}
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={uploading}
            data-testid="branding-save"
          >
            {t('branding.save')}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default CompanyBrandingSection;
