describe('Admin Dashboard', () => {
  const adminEmail = `admin-${Date.now()}@example.com`;
  const adminPassword = 'admin-password-123';
  let adminUserId: string;

  before(() => {
    // Create admin user
    cy.createTestUser(adminEmail, adminPassword);
    
    // Add user to demo-clinic tenant with admin role
    adminUserId = 'admin-user-id';
    cy.addUserToTenant(adminUserId, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin');
  });

  after(() => {
    // Clean up: delete test user
    cy.deleteTestUser(adminEmail);
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should redirect non-admin users from admin dashboard', () => {
    // Login as regular user (not admin)
    const userEmail = `user-${Date.now()}@example.com`;
    cy.createTestUser(userEmail, 'user-password-123');
    cy.addUserToTenant('user-id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'client');
    cy.login(userEmail, 'user-password-123');
    
    // Try to access admin dashboard
    cy.visit('/demo-clinic/admin', { failOnStatusCode: false });
    
    // Should redirect to home page
    cy.url().should('not.include', '/admin');
    cy.url().should('include', '/demo-clinic');
  });

  it('should allow admin users to access admin dashboard', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    cy.contains('Admin Panel').should('be.visible');
    cy.contains('Služby').should('be.visible');
    cy.contains('Rezervácie').should('be.visible');
    cy.contains('Branding').should('be.visible');
  });

  it('should display services tab by default', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    cy.contains('Služby').should('be.visible');
    cy.contains('General Checkup').should('be.visible');
    cy.contains('Dental Cleaning').should('be.visible');
  });

  it('should allow switching between tabs', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    // Switch to Bookings tab
    cy.contains('Rezervácie').click();
    cy.contains('Rezervácie').should('be.visible');
    
    // Switch to Branding tab
    cy.contains('Branding').click();
    cy.contains('Logo URL').should('be.visible');
    
    // Switch to AI tab
    cy.contains('AI Nastavenia').click();
    cy.contains('Odporúčania služieb').should('be.visible');
  });

  it('should display all services in admin dashboard', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    cy.contains('General Checkup').should('be.visible');
    cy.contains('Dental Cleaning').should('be.visible');
    cy.contains('Blood Test').should('be.visible');
  });

  it('should allow toggling service active status', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    // Find General Checkup row and click Deactivate
    cy.contains('General Checkup')
      .parent()
      .parent()
      .within(() => {
        cy.contains('Aktívna').should('be.visible');
        cy.contains('Deaktivovať').click();
      });
    
    // Should show Inactive
    cy.contains('General Checkup')
      .parent()
      .parent()
      .within(() => {
        cy.contains('Neaktívna').should('be.visible');
        cy.contains('Aktivovať').should('be.visible');
      });
    
    // Reactivate
    cy.contains('General Checkup')
      .parent()
      .parent()
      .within(() => {
        cy.contains('Aktivovať').click();
      });
    
    // Should show Active again
    cy.contains('General Checkup')
      .parent()
      .parent()
      .within(() => {
        cy.contains('Aktívna').should('be.visible');
      });
  });

  it('should display bookings in admin dashboard', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    // Switch to Bookings tab
    cy.contains('Rezervácie').click();
    
    // Table headers should be visible
    cy.contains('ID').should('be.visible');
    cy.contains('Služba').should('be.visible');
    cy.contains('Používateľ').should('be.visible');
    cy.contains('Dátum a čas').should('be.visible');
    cy.contains('Stav').should('be.visible');
  });

  it('should allow updating branding', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/demo-clinic/admin');
    
    // Switch to Branding tab
    cy.contains('Branding').click();
    
    // Update primary color
    cy.get('input[type="color"]').invoke('val', '#FF0000').trigger('change');
    
    // Check if preview updates
    cy.get('div').should('have.css', 'background-color', 'rgb(255, 0, 0)');
  });

  it('should display platform admin page', () => {
    cy.login(adminEmail, adminPassword);
    cy.visit('/platform');
    
    cy.contains('Platform Admin').should('be.visible');
    cy.contains('NEXIFY TECH CENTER').should('be.visible');
    cy.contains('Počet Tenantov').should('be.visible');
    cy.contains('Demo Clinic').should('be.visible');
    cy.contains('Wellness Center').should('be.visible');
  });
});
