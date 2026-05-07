'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantContext } from './tenant.service';
import { usePathname } from 'next/navigation';

interface TenantProviderProps {
  children: React.ReactNode;
  initialContext: TenantContext;
}

const TenantContext = createContext<TenantContext | null>(null);

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  initialContext,
}) => {
  const [context, setContext] = useState<TenantContext>(initialContext);
  const pathname = usePathname();

  // Update tenant context when route changes
  useEffect(() => {
    // Extract tenant slug from pathname
    const slug = pathname?.split('/')[1];
    if (slug && slug !== initialContext.tenant.slug) {
      // In a real app, you would fetch the new tenant context here
      // For now, we'll just keep the initial context
      // This is a placeholder for client-side tenant switching
    }
  }, [pathname, initialContext.tenant.slug]);

  return <TenantContext.Provider value={context}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
