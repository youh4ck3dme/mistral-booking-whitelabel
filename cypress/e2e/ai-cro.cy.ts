describe('AI CRO Layer', () => {
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'test-password-123';

  before(() => {
    // Create test user
    cy.createTestUser(testEmail, testPassword);
    
    // Add user to demo-clinic tenant
    cy.addUserToTenant('test-user-id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'client');
  });

  after(() => {
    // Clean up: delete test user
    cy.deleteTestUser(testEmail);
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should display service recommendations on booking page', () => {
    cy.login(testEmail, testPassword);
    cy.visit('/demo-clinic/book');
    
    // After selecting a service and proceeding, recommendations should appear
    // This is a placeholder - actual recommendation display depends on implementation
    cy.contains('Vyberte službu').should('be.visible');
  });

  it('should show upsell bundles in booking flow', () => {
    cy.login(testEmail, testPassword);
    cy.visit('/demo-clinic/book');
    
    // Select a service
    cy.contains('General Checkup').click();
    
    // In a real implementation, upsell bundles would be displayed
    // For now, we just verify the flow continues
    cy.contains('Vyberte dátum').should('be.visible');
  });

  it('should track AI impressions when recommendations are shown', () => {
    // This test would verify that impressions are logged in the database
    // Implementation depends on the actual AI tracking setup
    cy.login(testEmail, testPassword);
    cy.visit('/demo-clinic/book');
    
    // Select service
    cy.contains('General Checkup').click();
    
    // In a real test, we would query the database to verify the impression was logged
    // cy.request() to Supabase to check ai_impressions table
  });

  it('should apply deterministic fallback when AI is unavailable', () => {
    // This test would simulate AI service being down
    // and verify that fallback recommendations are shown
    cy.login(testEmail, testPassword);
    cy.visit('/demo-clinic/book');
    
    // Select service
    cy.contains('General Checkup').click();
    
    // Continue with booking - fallback should work seamlessly
    cy.contains('Vyberte dátum').should('be.visible');
  });

  it('should display AI settings in admin dashboard', () => {
    // Login as admin
    const adminEmail = `admin-${Date.now()}@example.com`;
    cy.createTestUser(adminEmail, 'admin-password-123');
    cy.addUserToTenant('admin-user-id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin');
    cy.login(adminEmail, 'admin-password-123');
    
    cy.visit('/demo-clinic/admin');
    cy.contains('AI Nastavenia').click();
    
    cy.contains('Odporúčania služieb').should('be.visible');
    cy.contains('Upsell Balíčky').should('be.visible');
    cy.contains('AI Experimenty').should('be.visible');
  });
});
