import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface ProfileCardProps {
  user: User | null;
  initials: string;
  roleLabel: string;
}

export const ProfileCard = React.memo(({ user, initials, roleLabel }: ProfileCardProps) => {
  return (
    <div className="bg-white rounded-3xl p-5 flex flex-col items-center gap-4 shadow-sm shadow-black/5">
      <Avatar className="w-24 h-24 border-4 border-white shadow-md shadow-primary/10">
        {user?.profile_full_url && (
          <AvatarImage src={user.profile_full_url} alt={user.name} loading="lazy" />
        )}
        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold animate-fade-in">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{user?.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5 leading-none">{user?.email || 'No email registered'}</p>
        <span className="inline-flex items-center mt-3 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full tracking-wide">
          <ShieldCheck size={12} className="mr-1" strokeWidth={2.5} />
          {roleLabel}
        </span>
      </div>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';
