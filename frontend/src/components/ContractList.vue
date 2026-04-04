<template>
  <v-container>
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 mb-2">Contracts</h1>
            <p class="text-subtitle2 text-grey-darken-1">Manage and track all vendor contracts</p>
          </div>
          <v-btn v-if="canWrite" color="primary" prepend-icon="mdi-plus" to="/contracts/new">
            New Contract
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-text-field
          v-model="searchQuery"
          label="Search"
          placeholder="Contract title..."
          prepend-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          @update:model-value="onSearch"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterStatus"
          label="Status"
          :items="statusOptions"
          variant="outlined"
          density="compact"
          clearable
          @update:model-value="onFilterChange"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterRiskTier"
          label="Risk Tier"
          :items="riskTierOptions"
          variant="outlined"
          density="compact"
          clearable
          @update:model-value="onFilterChange"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn color="success" prepend-icon="mdi-download" @click="exportCsv">
          Export CSV
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-table v-if="!loading" density="compact">
            <thead>
              <tr>
                <th>Title</th>
                <th>Vendor</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Value</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contract in filteredContracts" :key="contract.id"
                  :class="{
                    'bg-red-lighten-5': contract.status === 'Expired',
                    'bg-orange-lighten-5': contract.status === 'Expiring Soon'
                  }">
                <td>
                  <router-link :to="`/contracts/${contract.id}`" class="text-decoration-none">
                    {{ contract.title }}
                  </router-link>
                </td>
                <td>{{ getVendorName(contract.vendor_id) }}</td>
                <td>{{ contract.contract_owner }}</td>
                <td>
                  <v-chip :label="true" size="small" :color="getStatusColor(contract.status)">
                    {{ contract.status }}
                  </v-chip>
                </td>
                <td>{{ formatDate(contract.start_date) }}</td>
                <td>{{ formatDate(contract.end_date) }}</td>
                <td v-if="contract.contract_value">${{ formatCurrency(contract.contract_value) }}</td>
                <td v-else>-</td>
                <td>
                  <v-chip :label="true" size="small" :color="getRiskColor(contract.risk_tier)">
                    {{ contract.risk_tier || 'N/A' }}
                  </v-chip>
                </td>
                <td>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props" />
                    </template>
                    <v-list>
                      <v-list-item :to="`/contracts/${contract.id}`">
                        <v-list-item-title>View</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-if="canWrite" :to="`/contracts/${contract.id}/edit`">
                        <v-list-item-title>Edit</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-if="canWrite" @click="handleArchive(contract.id)">
                        <v-list-item-title>Archive</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-if="canWrite" @click="handleDelete(contract.id)">
                        <v-list-item-title>Delete</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </td>
              </tr>
              <tr v-if="filteredContracts.length === 0">
                <td colspan="9" class="text-center pa-6 text-grey">
                  No contracts found
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-skeleton-loader v-else type="table-row@5" />
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { store } from '../stores/app';
import { Contract } from '../../../backend/src/models';
import { apiClient } from '../services/api';

const contracts = computed(() => store.state.contracts);
const vendors = computed(() => store.state.vendors);
const canWrite = computed(() => store.canWrite());
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const filterStatus = ref<string | null>(null);
const filterRiskTier = ref<string | null>(null);

const statusOptions = ['Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated'];
const riskTierOptions = ['Low', 'Medium', 'High'];

const filteredContracts = computed(() => {
  let result = contracts.value;

  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value);
  }

  if (filterRiskTier.value) {
    result = result.filter(c => c.risk_tier === filterRiskTier.value);
  }

  return result;
});

function getVendorName(vendorId: string): string {
  const vendor = vendors.value.find(v => v.id === vendorId);
  return vendor?.legal_name || 'Unknown';
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'Active': 'success',
    'Draft': 'info',
    'Expired': 'error',
    'Expiring Soon': 'warning',
    'Under Review': 'primary',
    'Terminated': 'grey'
  };
  return colors[status] || 'grey';
}

function getRiskColor(risk: string): string {
  const colors: { [key: string]: string } = {
    'High': 'error',
    'Medium': 'warning',
    'Low': 'success'
  };
  return colors[risk] || 'grey';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function onSearch() {
  // Debounce search
  if (searchQuery.value) {
    store.fetchContracts({ search: searchQuery.value });
  } else {
    store.fetchContracts();
  }
}

function onFilterChange() {
  const params: any = {};
  if (filterStatus.value) params.status = filterStatus.value;
  if (filterRiskTier.value) params.risk_tier = filterRiskTier.value;
  store.fetchContracts(params);
}

async function handleArchive(contractId: string) {
  if (confirm('Archive this contract?')) {
    await store.archiveContract(contractId);
  }
}

async function handleDelete(contractId: string) {
  if (!confirm('Delete this contract? This will archive it and remove it from the active list.')) {
    return;
  }

  try {
    await store.deleteContract(contractId);
    error.value = null;
  } catch {
    error.value = store.state.error;
  }
}

async function exportCsv() {
  try {
    const blob = await apiClient.exportContractsCsv();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contracts.csv';
    link.click();
  } catch (err: any) {
    error.value = err.message || 'Failed to export';
  }
}

onMounted(async () => {
  loading.value = true;
  await store.fetchVendors();
  await store.fetchContracts();
  error.value = store.state.error;
  loading.value = false;
});
</script>
