import React, { RefObject } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, RefreshCw } from 'lucide-react';

interface AvatarCardProps {
  user: { name?: string; profile_full_url?: string | null } | null;
  initials: string;
  isPending: boolean;
  onAvatarClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  t: (key: string) => string;
}

export const AvatarCard = React.memo(
  ({ user, initials, isPending, onAvatarClick, onFileChange, fileInputRef, t }: AvatarCardProps) => {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-3.5 relative overflow-hidden">
        {/* Subtle gradient accent */}

        <div className="relative group cursor-pointer" onClick={onAvatarClick}>
          <Avatar className="size-24 border-4 border-white shadow-md relative">
            {user?.profile_full_url ? (
              <AvatarImage src={user.profile_full_url} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Camera overlay */}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200">
            <Camera className="text-white size-6" />
          </div>

          {/* Upload spinner */}
          {isPending && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <RefreshCw className="text-white size-6 animate-spin" />
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-400 relative z-10">
          {t('driver:tap_to_change_picture') || 'Tap avatar to update photo'}
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    );
  }
);

AvatarCard.displayName = 'AvatarCard';
