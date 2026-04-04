describe('Role-based behavior', () => {
  function buildToken(role) {
    const payload = {
      sub: `role-${role}-${Date.now()}`,
      email: `${role.replace(/\s+/g, '').toLowerCase()}@example.com`,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    return Cypress.Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  it('viewer does not see write buttons in UI', () => {
    cy.visit('/contracts', {
      onBeforeLoad(win) {
        win.localStorage.setItem('mockRole', 'Viewer');
      }
    });

    cy.contains('New Contract').should('not.exist');

    cy.visit('/vendors', {
      onBeforeLoad(win) {
        win.localStorage.setItem('mockRole', 'Viewer');
      }
    });

    cy.contains('New Vendor').should('not.exist');
  });

  it('viewer is denied write API calls', () => {
    const token = buildToken('Viewer');

    cy.request({
      method: 'POST',
      url: '/api/vendors',
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
      body: {
        legal_name: `Blocked-${Date.now()}`,
        risk_tier: 'Low'
      }
    }).then((res) => {
      expect(res.status).to.eq(403);
    });
  });
});
