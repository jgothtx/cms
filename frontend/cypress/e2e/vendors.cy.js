describe('Vendor flows', () => {
  function makeToken(role = 'Admin') {
    const payload = {
      sub: `cypress-${role}-${Date.now()}`,
      email: `${role.toLowerCase()}@example.com`,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    return Cypress.Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  it('creates a vendor from Vendor form', () => {
    const uniqueName = `Cypress Vendor ${Date.now()}`;

    cy.visit('/vendors/new');

    cy.contains('Create Vendor').should('be.visible');
    cy.get('input[label="Legal Name *"]').should('not.exist');

    cy.get('input').eq(0).clear().type(uniqueName);

    cy.contains('Save').click();

    cy.url().should('include', '/vendors');
    cy.contains(uniqueName, { timeout: 10000 }).should('be.visible');
  });

  it('soft deletes used vendor by setting it inactive', () => {
    const token = makeToken('Admin');
    const vendorName = `Used Vendor ${Date.now()}`;

    // Create used vendor
    cy.request({
      method: 'POST',
      url: '/api/vendors',
      headers: { Authorization: `Bearer ${token}` },
      body: { legal_name: vendorName, risk_tier: 'Medium' }
    }).then((vendorRes) => {
      const vendorId = vendorRes.body.id;

      // Create contract referencing vendor to make it non-deletable
      cy.request({
        method: 'POST',
        url: '/api/contracts',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          title: `Contract for ${vendorName}`,
          vendor_id: vendorId,
          contract_owner: 'owner@example.com',
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          status: 'Active'
        }
      });
    });

    cy.on('window:confirm', (text) => {
      expect(text).to.include('Delete vendor');
      return true;
    });

    cy.visit('/vendors', {
      onBeforeLoad(win) {
        win.localStorage.setItem('mockRole', 'Admin');
      }
    });

    cy.contains('td', vendorName)
      .parent('tr')
      .within(() => {
        cy.get('button').last().click({ force: true });
      });

    cy.contains('Delete').click();

    // Soft delete should set vendor status to inactive.
    cy.contains('td', vendorName)
      .parent('tr')
      .contains('Inactive', { timeout: 10000 })
      .should('be.visible');
  });
});
