describe('All page routes render', () => {
  const routes = [
    '/',
    '/contracts',
    '/contracts/new',
    '/contracts/sample-id',
    '/contracts/sample-id/edit',
    '/vendors',
    '/vendors/new',
    '/vendors/sample-id'
  ];

  routes.forEach((route) => {
    it(`loads ${route}`, () => {
      cy.visit(route);
      cy.contains('Contract Management System').should('be.visible');
      cy.get('main').should('be.visible');
    });
  });
});
