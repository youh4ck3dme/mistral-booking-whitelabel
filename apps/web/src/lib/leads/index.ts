// Leads module exports
// IMPORTANT: 
// - Use lead.service.client for client components
// - Use lead.service.server for server components ONLY
// - Never import lead.service.server in client components

export * from './lead.types';
export * from './lead.utils';

// Client-safe exports (for use in 'use client' components)
export * as client from './lead.service.client';

// Server-only exports (for use in server components)
export * as server from './lead.service.server';
