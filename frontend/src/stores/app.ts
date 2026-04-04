import { reactive, computed } from 'vue';
import { apiClient } from '../services/api';
import { Contract, Vendor, Reminder } from '../../../backend/src/models';

interface AppState {
  contracts: Contract[];
  vendors: Vendor[];
  reminders: Reminder[];
  dashboardData: any;
  currentUser: any;
  loading: boolean;
  error: string | null;
}

const state = reactive<AppState>({
  contracts: [],
  vendors: [],
  reminders: [],
  dashboardData: null,
  currentUser: null,
  loading: false,
  error: null
});

function canWrite(): boolean {
  return ['Admin', 'Contract Manager'].includes(state.currentUser?.role);
}

function isViewer(): boolean {
  return state.currentUser?.role === 'Viewer';
}

function isAdmin(): boolean {
  return state.currentUser?.role === 'Admin';
}

// Mock auth for MVP
function mockAuth(role: 'Admin' | 'Contract Manager' | 'Viewer' = 'Contract Manager') {
  const tokenPayload = JSON.stringify({
    sub: `user-${Math.random()}`,
    email: `user${Math.random()}@example.com`,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
  });

  const token = btoa(tokenPayload);

  apiClient.setToken(token);
  state.currentUser = { id: `user-${Math.random()}`, email: 'user@example.com', role };
}

// Vendors
async function fetchVendors() {
  try {
    state.loading = true;
    const result = await apiClient.getVendors(100, 0);
    state.vendors = result.data || [];
    state.error = null;
  } catch (err: any) {
    state.error = err.message || 'Failed to fetch vendors';
  } finally {
    state.loading = false;
  }
}

async function createVendor(vendor: Partial<Vendor>) {
  try {
    state.loading = true;
    const created = await apiClient.createVendor(vendor);
    state.vendors.push(created);
    state.error = null;
    return created;
  } catch (err: any) {
    state.error = err.message || 'Failed to create vendor';
    throw err;
  } finally {
    state.loading = false;
  }
}

async function updateVendor(id: string, vendor: Partial<Vendor>) {
  try {
    state.loading = true;
    const updated = await apiClient.updateVendor(id, vendor);
    const index = state.vendors.findIndex(v => v.id === id);
    if (index !== -1) {
      state.vendors[index] = updated;
    }
    state.error = null;
    return updated;
  } catch (err: any) {
    state.error = err.message || 'Failed to update vendor';
    throw err;
  } finally {
    state.loading = false;
  }
}

async function deleteVendor(id: string) {
  try {
    state.loading = true;
    const updated = await apiClient.deleteVendor(id);
    const index = state.vendors.findIndex(v => v.id === id);
    if (index !== -1) {
      state.vendors[index] = updated;
    }
    state.error = null;
  } catch (err: any) {
    state.error = err.response?.data?.error?.message || err.message || 'Failed to delete vendor';
    throw err;
  } finally {
    state.loading = false;
  }
}

async function deactivateVendor(id: string) {
  try {
    state.loading = true;
    const updated = await apiClient.deactivateVendor(id);
    const index = state.vendors.findIndex(v => v.id === id);
    if (index !== -1) {
      state.vendors[index] = updated;
    }
    state.error = null;
    return updated;
  } catch (err: any) {
    state.error = err.response?.data?.error?.message || err.message || 'Failed to deactivate vendor';
    throw err;
  } finally {
    state.loading = false;
  }
}

// Contracts
async function fetchContracts(filters?: any) {
  try {
    state.loading = true;
    const result = await apiClient.getContracts(filters);
    state.contracts = result.data || [];
    state.error = null;
  } catch (err: any) {
    state.error = err.message || 'Failed to fetch contracts';
  } finally {
    state.loading = false;
  }
}

async function createContract(contract: Partial<Contract>) {
  try {
    state.loading = true;
    const created = await apiClient.createContract(contract);
    state.contracts.push(created);
    state.error = null;
    return created;
  } catch (err: any) {
    state.error = err.message || 'Failed to create contract';
    throw err;
  } finally {
    state.loading = false;
  }
}

async function updateContract(id: string, contract: Partial<Contract>) {
  try {
    state.loading = true;
    const updated = await apiClient.updateContract(id, contract);
    const index = state.contracts.findIndex(c => c.id === id);
    if (index !== -1) {
      state.contracts[index] = updated;
    }
    state.error = null;
    return updated;
  } catch (err: any) {
    state.error = err.message || 'Failed to update contract';
    throw err;
  } finally {
    state.loading = false;
  }
}

async function archiveContract(id: string) {
  try {
    const archived = await apiClient.archiveContract(id);
    const index = state.contracts.findIndex(c => c.id === id);
    if (index !== -1) {
      state.contracts[index] = archived;
    }
    state.error = null;
    return archived;
  } catch (err: any) {
    state.error = err.message || 'Failed to archive contract';
  }
}

async function deleteContract(id: string) {
  try {
    state.loading = true;
    await apiClient.deleteContract(id);
    state.contracts = state.contracts.filter(c => c.id !== id);
    state.error = null;
  } catch (err: any) {
    state.error = err.response?.data?.error?.message || err.message || 'Failed to delete contract';
    throw err;
  } finally {
    state.loading = false;
  }
}

// Dashboard
async function fetchDashboardData() {
  try {
    state.loading = true;
    state.dashboardData = await apiClient.getDashboardSummary();
    state.error = null;
  } catch (err: any) {
    state.error = err.message || 'Failed to fetch dashboard';
  } finally {
    state.loading = false;
  }
}

// Computed properties
const activeContractCount = computed(() => 
  state.contracts.filter(c => c.status === 'Active').length
);

const expiringContracts = computed(() => 
  state.contracts.filter(c => ['Expiring Soon', 'Expired'].includes(c.status))
);

const highRiskContracts = computed(() => 
  state.contracts.filter(c => c.risk_tier === 'High')
);

export const store = {
  state,
  mockAuth,
  canWrite,
  isViewer,
  isAdmin,
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  deactivateVendor,
  fetchContracts,
  createContract,
  updateContract,
  archiveContract,
  deleteContract,
  fetchDashboardData,
  activeContractCount,
  expiringContracts,
  highRiskContracts
};
