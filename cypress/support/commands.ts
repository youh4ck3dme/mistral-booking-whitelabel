/// <reference types="cypress" />

// Custom commands for Cypress
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/demo-clinic');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/');
});

Cypress.Commands.add('createTestUser', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SUPABASE_URL')}/auth/v1/signup`,
    body: {
      email,
      password,
      options: {
        redirect_to: 'http://localhost:3000/auth/callback',
      },
    },
    headers: {
      apikey: Cypress.env('SUPABASE_ANON_KEY'),
      Authorization: `Bearer ${Cypress.env('SUPABASE_ANON_KEY')}`,
      'Content-Type': 'application/json',
    },
  });
});

Cypress.Commands.add('deleteTestUser', (email: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SUPABASE_URL')}/auth/v1/admin/delete_user`,
    body: { email },
    headers: {
      apikey: Cypress.env('SUPABASE_ANON_KEY'),
      Authorization: `Bearer ${Cypress.env('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
  });
});

// Add test user to tenant
Cypress.Commands.add('addUserToTenant', (userId: string, tenantId: string, role: string = 'client') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SUPABASE_URL')}/rest/v1/tenant_users`,
    body: {
      tenant_id: tenantId,
      user_id: userId,
      role,
    },
    headers: {
      apikey: Cypress.env('SUPABASE_ANON_KEY'),
      Authorization: `Bearer ${Cypress.env('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createTestUser(email: string, password: string): Chainable<void>;
      deleteTestUser(email: string): Chainable<void>;
      addUserToTenant(userId: string, tenantId: string, role?: string): Chainable<void>;
    }
  }
}
