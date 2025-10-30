'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/lib/types';

interface UserAvatarProps {
  user: UserProfile | { firstName?: string; lastName?: string; profilePictureUrl?: string };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl', 
  xl: 'text-3xl',
};

export function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showRing = true 
}: UserAvatarProps) {
  const initials = `${user.firstName?.charAt(0)?.toUpperCase() || ''}${user.lastName?.charAt(0)?.toUpperCase() || ''}`;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  
  return (
    <Avatar 
      className={`${sizeClasses[size]} ${showRing ? 'ring-2 ring-primary/20' : ''} ${className}`}
    >
      {user.profilePictureUrl ? (
        <AvatarImage 
          src={user.profilePictureUrl} 
          alt={name || 'User'}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold ${textSizeClasses[size]}`}>
        {initials || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}
