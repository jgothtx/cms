import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/api', () => {
  return {
    apiClient: {
      setToken: vi.fn(),
      getVendors: vi.fn(),
      createVendor: vi.fn(),
      updateVendor: vi.fn(),
      getContracts: vi.fn(),
      createContract: vi.fn(),
      updateContract: vi.fn(),
      archiveContract: vi.fn(),
      getDashboardSummary: vi.fn()
    }
  };
});

import { store } from './app';
import { apiClient } from '../services/api';

describe('app store', () => {
  beforeEach(() => {
    store.state.contracts = [];
    store.state.vendors = [];
    store.state.error = null;
    vi.clearAllMocks();
  });

  it('fetchVendors populates state', async () => {
    (apiClient.getVendors as any).mockResolvedValue({
      data: [{ id: 'v1', legal_name: 'Acme', risk_tier: 'High', status: 'Active' }]
    });

    await store.fetchVendors();

    expect(store.state.vendors).toHaveLength(1);
    expect(store.state.vendors[0].legal_name).toBe('Acme');
  });

  it('createVendor appends new vendor', async () => {
    (apiClient.createVendor as any).mockResolvedValue({
      id: 'v2', legal_name: 'New Vendor', risk_tier: 'Low', status: 'Active'
    });

    await store.createVendor({ legal_name: 'New Vendor', risk_tier: 'Low' } as any);

    expect(store.state.vendors.map(v => v.legal_name)).toContain('New Vendor');
  });

  it('fetchContracts captures API failures', async () => {
    (apiClient.getContracts as any).mockRejectedValue(new Error('boom'));

    await store.fetchContracts();

    expect(store.state.error).toContain('boom');
  });

  it('role helpers reflect current user role', () => {
    store.state.currentUser = { role: 'Viewer' };
    expect(store.isViewer()).toBe(true);
    expect(store.canWrite()).toBe(false);

    store.state.currentUser = { role: 'Admin' };
    expect(store.canWrite()).toBe(true);
  });
});
