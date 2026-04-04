describe('Contract page behavior', () => {
  it('loads contract list and supports filtering controls', () => {
    cy.visit('/contracts');
    cy.contains('Contracts').should('be.visible');
    cy.contains('New Contract').should('be.visible');
    cy.contains('Export CSV').should('be.visible');
  });

  it('opens contract create page with required fields', () => {
    cy.visit('/contracts/new');
    cy.contains('Create Contract').should('be.visible');
    cy.get('form').should('be.visible');
    cy.get('input[type="date"]').should('have.length.at.least', 2);
    cy.contains('Save').should('be.visible');
  });
});
