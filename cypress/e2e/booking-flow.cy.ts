describe('Booking Flow', () => {
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'test-password-123';
  let testUserId: string;

  before(() => {
    // Create test user
    cy.createTestUser(testEmail, testPassword);
    
    // Get user ID (simplified - in real test, you'd query Supabase)
    testUserId = 'test-user-id';
    
    // Add user to demo-clinic tenant with client role
    cy.addUserToTenant(testUserId, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'client');
  });

  after(() => {
    // Clean up: delete test user
    cy.deleteTestUser(testEmail);
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should display available services on tenant booking page', () => {
    cy.visit('/demo-clinic/book');
    cy.contains('Rezervácia termínu').should('be.visible');
    cy.contains('Vyberte službu').should('be.visible');
    cy.contains('General Checkup').should('be.visible');
    cy.contains('Dental Cleaning').should('be.visible');
    cy.contains('Blood Test').should('be.visible');
  });

  it('should allow selecting a service', () => {
    cy.visit('/demo-clinic/book');
    cy.contains('General Checkup').click();
    cy.contains('Vyberte dátum').should('be.visible');
  });

  it('should display available dates after selecting a service', () => {
    cy.visit('/demo-clinic/book');
    cy.contains('General Checkup').click();
    // Should show date selection
    cy.get('button').should('contain', 'Pondelok');
  });

  it('should display time slots after selecting a date', () => {
    cy.visit('/demo-clinic/book');
    cy.contains('General Checkup').click();
    // Click on the first date button
    cy.get('button').contains('Pondelok').first().click();
    // Should show time slots
    cy.contains('Vyberte čas').should('be.visible');
    cy.get('button').should('contain', '08:00');
  });

  it('should show booking summary after selecting service, date, and time', () => {
    cy.visit('/demo-clinic/book');
    
    // Select service
    cy.contains('General Checkup').click();
    
    // Select date (first available)
    cy.get('button').contains('Pondelok').first().click();
    
    // Select time slot (first available)
    cy.get('button').contains('08:00').first().click();
    
    // Should show summary
    cy.contains('Prehľad rezervácie').should('be.visible');
    cy.contains('General Checkup').should('be.visible');
    cy.contains('Cena:').should('be.visible');
    cy.contains('Trvanie:').should('be.visible');
  });

  it('should redirect to login when trying to book without authentication', () => {
    cy.visit('/demo-clinic/book');
    
    // Select service
    cy.contains('General Checkup').click();
    
    // Select date
    cy.get('button').contains('Pondelok').first().click();
    
    // Select time
    cy.get('button').contains('08:00').first().click();
    
    // Try to submit booking
    cy.contains('Potvrdiť rezerváciu').click();
    
    // Should redirect to login (or show error)
    cy.url().should('include', '/login');
  });

  it('should create a booking successfully when authenticated', () => {
    // Login first
    cy.login(testEmail, testPassword);
    
    // Navigate to booking page
    cy.visit('/demo-clinic/book');
    
    // Select service
    cy.contains('General Checkup').click();
    
    // Select date
    cy.get('button').contains('Pondelok').first().click();
    
    // Select time
    cy.get('button').contains('08:00').first().click();
    
    // Submit booking
    cy.contains('Potvrdiť rezerváciu').click();
    
    // Should show success message
    cy.contains('Rezervácia úspešná!').should('be.visible');
    cy.contains('ID rezervácie:').should('be.visible');
  });

  it('should show booking in client portal after creation', () => {
    // Login first
    cy.login(testEmail, testPassword);
    
    // Navigate to booking page
    cy.visit('/demo-clinic/book');
    
    // Create a booking (simplified flow)
    cy.contains('General Checkup').click();
    cy.get('button').contains('Pondelok').first().click();
    cy.get('button').contains('08:00').first().click();
    cy.contains('Potvrdiť rezerváciu').click();
    
    // Go to portal
    cy.contains('Zobraziť moje rezervácie').click();
    
    // Should show the booking
    cy.contains('Moje rezervácie').should('be.visible');
    cy.contains('General Checkup').should('be.visible');
  });

  it('should allow cancelling a booking from client portal', () => {
    // Login first
    cy.login(testEmail, testPassword);
    
    // Navigate to booking page
    cy.visit('/demo-clinic/book');
    
    // Create a booking
    cy.contains('General Checkup').click();
    cy.get('button').contains('Pondelok').first().click();
    cy.get('button').contains('08:00').first().click();
    cy.contains('Potvrdiť rezerváciu').click();
    
    // Go to portal
    cy.contains('Zobraziť moje rezervácie').click();
    
    // Cancel the booking
    cy.contains('Zrušiť').click();
    
    // Should show success or updated status
    cy.contains('Zrušená').should('be.visible');
  });

  it('should show error when trying to book a time slot that is already taken', () => {
    // Login first
    cy.login(testEmail, testPassword);
    
    // Create first booking
    cy.visit('/demo-clinic/book');
    cy.contains('General Checkup').click();
    cy.get('button').contains('Pondelok').first().click();
    cy.get('button').contains('08:00').first().click();
    cy.contains('Potvrdiť rezerváciu').click();
    cy.contains('Rezervácia úspešná!').should('be.visible');
    
    // Try to book the same slot again
    cy.visit('/demo-clinic/book');
    cy.contains('General Checkup').click();
    cy.get('button').contains('Pondelok').first().click();
    cy.get('button').contains('08:00').first().click();
    cy.contains('Potvrdiť rezerváciu').click();
    
    // Should show error
    cy.contains('Nepodarilo sa vytvoriť rezerváciu').should('be.visible');
  });
});
