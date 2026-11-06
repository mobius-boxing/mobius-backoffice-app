import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import UserAvatar from '../ui/UserAvatar';

const AVATAR_PX = 256;

/** Center-crops to a square and re-encodes as a 256x256 JPEG on a white background. */
const resizeToAvatar = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_PX;
      canvas.height = AVATAR_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx || side === 0) {
        reject(new Error('canvas'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, AVATAR_PX, AVATAR_PX);
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        AVATAR_PX,
        AVATAR_PX
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('encode'))),
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { avatarUuid?: string | null; firstName?: string; lastName?: string };
  upload: (image: Blob) => Promise<string>;
  remove: () => Promise<void>;
  onChanged: (avatarUuid: string | null) => void;
}

/** The same dialog serves "my photo" (sidebar) and an admin editing another user. */
const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  user,
  upload,
  remove,
  onChanged,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<string | null>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
    } catch (err: any) {
      setError(err?.response?.data?.message || fallback);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let image: Blob;
    try {
      image = await resizeToAvatar(file);
    } catch {
      setError(t('avatar.invalidImage'));
      return;
    }
    await run(() => upload(image), t('avatar.uploadFailed'));
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('avatar.title')} size="sm">
      <div className="flex flex-col items-center gap-4">
        <UserAvatar
          user={user}
          className="gd-avatar-preview"
          textClassName="text-2xl font-medium"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          data-testid="avatar-file-input"
          onChange={handleFile}
        />
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => inputRef.current?.click()} loading={busy}>
            {t('avatar.upload')}
          </Button>
          {user.avatarUuid && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await remove();
                  return null;
                }, t('avatar.removeFailed'))
              }
            >
              {t('avatar.remove')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AvatarModal;
