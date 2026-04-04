import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app';
import { database } from '../src/database';

const app = createApp();

function makeToken(role: 'Admin' | 'Contract Manager' | 'Viewer', email = 'tester@example.com') {
  const payload = {
    sub: `test-${role.replace(/\s+/g, '-').toLowerCase()}`,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

async function clearTables() {
  await database.run('DELETE FROM activity_events');
  await database.run('DELETE FROM reminders');
  await database.run('DELETE FROM contracts');
  await database.run('DELETE FROM vendors');
  await database.run('DELETE FROM users');
}

describe('vendors api', () => {
  beforeAll(async () => {
    await database.initialize();
  });

  beforeEach(async () => {
    await clearTables();
  });

  afterAll(async () => {
    await database.close();
  });

  test('health endpoint works without auth', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('contract manager can create vendor', async () => {
    const token = makeToken('Contract Manager');

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send({ legal_name: 'Acme Vendor', risk_tier: 'Medium' });

    expect(res.status).toBe(201);
    expect(res.body.legal_name).toBe('Acme Vendor');
  });

  test('viewer cannot create vendor', async () => {
    const token = makeToken('Viewer');

    const res = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send({ legal_name: 'Blocked Vendor', risk_tier: 'Low' });

    expect(res.status).toBe(403);
  });

  test('duplicate legal names are blocked case-insensitively', async () => {
    const token = makeToken('Admin', 'admin@example.com');

    const first = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send({ legal_name: 'Duplicate Name LLC', risk_tier: 'High' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/vendors')
      .set('Authorization', `Bearer ${token}`)
      .send({ legal_name: '  duplicate name llc  ', risk_tier: 'Low' });

    expect(second.status).toBe(409);
    expect(second.body.error.field).toBe('legal_name');
  });
});
