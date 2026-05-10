'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { TenantContext as TenantContextValue } from './tenant.service';
import { usePathname } from 'next/navigation';

interface TenantProviderProps {
  children: React.ReactNode;
  initialContext: TenantContextValue;
}

type TenantContextState = TenantContextValue & {
  isRoleResolved: boolean;
};

const TenantContext = createContext<TenantContextState | null>(null);

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
  initialContext,
}) => {
  const [supabase] = useState(() => createClientComponentClient());
  const [context, setContext] = useState<TenantContextState>({
    ...initialContext,
    isRoleResolved: Boolean(initialContext.userRole),
  });
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

  useEffect(() => {
    if (context.isRoleResolved || context.userRole) return;

    let isMounted = true;

    const resolveUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user) {
        setContext((current) => ({ ...current, isRoleResolved: true, userRole: null }));
        return;
      }

      const { data } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('tenant_id', context.tenant.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      setContext((current) => ({
        ...current,
        userRole: data?.role ?? null,
        isRoleResolved: true,
      }));
    };

    void resolveUserRole();

    return () => {
      isMounted = false;
    };
  }, [context.isRoleResolved, context.tenant.id, context.userRole, supabase]);

  return <TenantContext.Provider value={context}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
