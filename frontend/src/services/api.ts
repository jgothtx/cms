import axios, { AxiosInstance } from 'axios';
import { Contract, Vendor, Reminder } from '../../../backend/src/models';

export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = '/api', token?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (token) {
      this.setToken(token);
    }

    // Add token to all requests if set
    this.client.interceptors.request.use(config => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string): void {
    this.token = token;
  }

  // Health
  async getHealth(): Promise<any> {
    const { data } = await this.client.get('/health');
    return data;
  }

  // Vendors
  async getVendors(limit = 100, offset = 0): Promise<any> {
    const { data } = await this.client.get('/vendors', { params: { limit, offset } });
    return data;
  }

  async getVendor(id: string): Promise<Vendor> {
    const { data } = await this.client.get(`/vendors/${id}`);
    return data;
  }

  async createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
    const { data } = await this.client.post('/vendors', vendor);
    return data;
  }

  async updateVendor(id: string, vendor: Partial<Vendor>): Promise<Vendor> {
    const { data } = await this.client.patch(`/vendors/${id}`, vendor);
    return data;
  }

  async deleteVendor(id: string): Promise<Vendor> {
    const { data } = await this.client.delete(`/vendors/${id}`);
    return data;
  }

  async deactivateVendor(id: string): Promise<Vendor> {
    const { data } = await this.client.post(`/vendors/${id}/deactivate`, {});
    return data;
  }

  // Contracts
  async getContracts(params?: any): Promise<any> {
    const { data } = await this.client.get('/contracts', { params });
    return data;
  }

  async getContract(id: string): Promise<Contract> {
    const { data } = await this.client.get(`/contracts/${id}`);
    return data;
  }

  async createContract(contract: Partial<Contract>): Promise<Contract> {
    const { data } = await this.client.post('/contracts', contract);
    return data;
  }

  async updateContract(id: string, contract: Partial<Contract>): Promise<Contract> {
    const { data } = await this.client.patch(`/contracts/${id}`, contract);
    return data;
  }

  async archiveContract(id: string): Promise<Contract> {
    const { data } = await this.client.post(`/contracts/${id}/archive`, {});
    return data;
  }

  async restoreContract(id: string): Promise<Contract> {
    const { data } = await this.client.post(`/contracts/${id}/restore`, {});
    return data;
  }

  async deleteContract(id: string): Promise<void> {
    await this.client.delete(`/contracts/${id}`);
  }

  // Reminders
  async getReminders(contractId: string): Promise<any> {
    const { data } = await this.client.get(`/contracts/${contractId}/reminders`);
    return data;
  }

  async createReminder(contractId: string, reminder: Partial<Reminder>): Promise<Reminder> {
    const { data } = await this.client.post(`/contracts/${contractId}/reminders`, reminder);
    return data;
  }

  async updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder> {
    const { data } = await this.client.patch(`/reminders/${id}`, reminder);
    return data;
  }

  // Dashboard
  async getDashboardSummary(): Promise<any> {
    const { data } = await this.client.get('/dashboard/summary');
    return data;
  }

  // Export
  async exportContractsCsv(): Promise<Blob> {
    const response = await this.client.get('/contracts/export.csv', {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
