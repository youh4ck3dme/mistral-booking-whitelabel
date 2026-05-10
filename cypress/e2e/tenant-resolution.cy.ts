describe('Tenant Resolution', () => {
  beforeEach(() => {
    // Clear all cookies and session storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should resolve demo-clinic tenant from URL', () => {
    cy.visit('/demo-clinic');
    cy.contains('Demo Clinic').should('be.visible');
    cy.url().should('include', '/demo-clinic');
  });

  it('should resolve wellness-center tenant from URL', () => {
    cy.visit('/wellness-center');
    cy.contains('Wellness Center').should('be.visible');
    cy.url().should('include', '/wellness-center');
  });

  it('should redirect to 404 for non-existent tenant', () => {
    cy.visit('/non-existent-tenant', { failOnStatusCode: false });
    cy.url().should('include', '/404');
  });

  it('should display tenant-specific branding for demo-clinic', () => {
    cy.visit('/demo-clinic');
    // Check for demo-clinic specific branding (blue color)
    cy.get('header').should('have.css', 'border-top-color', 'rgb(59, 130, 246)');
  });

  it('should display tenant-specific branding for wellness-center', () => {
    cy.visit('/wellness-center');
    // Check for wellness-center specific branding (purple color)
    cy.get('header').should('have.css', 'border-top-color', 'rgb(139, 92, 246)');
  });

  it('should display tenant-specific services for demo-clinic', () => {
    cy.visit('/demo-clinic');
    cy.contains('General Checkup').should('be.visible');
    cy.contains('Dental Cleaning').should('be.visible');
    cy.contains('Blood Test').should('be.visible');
    // Should not show wellness-center services
    cy.contains('Yoga Class').should('not.exist');
  });

  it('should display tenant-specific services for wellness-center', () => {
    cy.visit('/wellness-center');
    cy.contains('Yoga Class').should('be.visible');
    cy.contains('Meditation').should('be.visible');
    cy.contains('Massage').should('be.visible');
    // Should not show demo-clinic services
    cy.contains('General Checkup').should('not.exist');
  });

  it('should navigate between tenants correctly', () => {
    cy.visit('/demo-clinic');
    cy.contains('Demo Clinic').should('be.visible');
    
    cy.visit('/wellness-center');
    cy.contains('Wellness Center').should('be.visible');
    
    cy.visit('/demo-clinic');
    cy.contains('Demo Clinic').should('be.visible');
  });

  it('should show platform admin link for demo-clinic', () => {
    cy.visit('/demo-clinic');
    cy.get('a[href="/platform"]').should('be.visible');
  });
});
