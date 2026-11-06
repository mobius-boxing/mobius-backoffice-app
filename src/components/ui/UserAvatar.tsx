import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const avatarSrc = (avatarUuid: string): string =>
  `${API_BASE_URL}/api/public/avatars/${avatarUuid}`;

interface UserAvatarProps {
  user: { avatarUuid?: string | null; firstName?: string; lastName?: string } | null | undefined;
  /** Sizing/colour of the circle; the photo fills it. */
  className: string;
  textClassName?: string;
}

/** Photo when the user has one and it loads; otherwise the initials. */
const UserAvatar: React.FC<UserAvatarProps> = ({ user, className, textClassName }) => {
  const avatarUuid = user?.avatarUuid ?? null;
  const [failedUuid, setFailedUuid] = useState<string | null>(null);

  useEffect(() => {
    setFailedUuid(null);
  }, [avatarUuid]);

  const showPhoto = avatarUuid !== null && failedUuid !== avatarUuid;

  return (
    <span className={`${className} overflow-hidden`}>
      {showPhoto ? (
        <img
          className="gd-avatar-img"
          src={avatarSrc(avatarUuid)}
          alt=""
          onError={() => setFailedUuid(avatarUuid)}
        />
      ) : (
        <span className={textClassName}>
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </span>
      )}
    </span>
  );
};

export default UserAvatar;
