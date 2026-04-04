describe('Vendor duplicate name protection', () => {
  it('rejects creating a vendor with a duplicate legal name (case-insensitive)', () => {
    const name = `Duplicate Vendor ${Date.now()}`;

    cy.visit('/vendors/new');
    cy.get('input').eq(0).clear().type(name);
    cy.contains('Save').click();
    cy.url().should('include', '/vendors');
    cy.contains(name).should('be.visible');

    cy.visit('/vendors/new');
    cy.get('input').eq(0).clear().type(`  ${name.toUpperCase()}  `);
    cy.contains('Save').click();

    // Duplicate should be rejected; user should remain on create form.
    cy.url().should('include', '/vendors/new');
  });
});
