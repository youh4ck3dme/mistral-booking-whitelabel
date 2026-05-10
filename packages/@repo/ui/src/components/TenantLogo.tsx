import React from 'react';
import Image from 'next/image';
import { cn } from '../utils/cn';

export interface TenantLogoProps {
  tenant: {
    logo_url?: string;
    name: string;
    primary_color?: string;
  };
  className?: string;
}

export const TenantLogo: React.FC<TenantLogoProps> = ({ tenant, className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {tenant.logo_url ? (
        <Image
          src={tenant.logo_url}
          alt={tenant.name}
          width={120}
          height={40}
          className="object-contain"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: tenant.primary_color || '#3B82F6' }}
        >
          {tenant.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="font-semibold">{tenant.name}</span>
    </div>
  );
};
