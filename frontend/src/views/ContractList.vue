<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { contractApi, vendorApi } from '../services/api';

const router = useRouter();
const route = useRoute();
const contracts = ref<any[]>([]);
const vendors = ref<any[]>([]);
const total = ref(0);
const loading = ref(true);

const search = ref((route.query.search as string) || '');
const statusFilter = ref((route.query.status as string) || '');
const vendorFilter = ref((route.query.vendor_id as string) || '');
const riskFilter = ref((route.query.risk_tier as string) || '');
const ownerFilter = ref((route.query.owner as string) || '');
const expiryFilter = ref(route.query.expiry_window ? Number(route.query.expiry_window) : null);
const page = ref(1);
const itemsPerPage = ref(25);
const sortBy = ref<any[]>([{ key: 'end_date', order: 'asc' }]);

const statuses = ['Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated'];
const riskTiers = ['Low', 'Medium', 'High'];
const expiryWindows = [
  { title: 'Any', value: null },
  { title: '30 days', value: 30 },
  { title: '60 days', value: 60 },
  { title: '90 days', value: 90 },
];

const headers = [
  { title: 'Title', key: 'title', sortable: true },
  { title: 'Vendor', key: 'vendor_name', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'End Date', key: 'end_date', sortable: true },
  { title: 'Value', key: 'contract_value', sortable: true },
  { title: 'Risk', key: 'risk_tier', sortable: true },
  { title: 'Owner', key: 'contract_owner', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
];

async function loadContracts() {
  loading.value = true;
  try {
    const sort = sortBy.value[0];
    const { data } = await contractApi.list({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      vendor_id: vendorFilter.value || undefined,
      risk_tier: riskFilter.value || undefined,
      owner: ownerFilter.value || undefined,
      expiry_window: expiryFilter.value || undefined,
      sort: sort?.key || 'end_date',
      order: sort?.order || 'asc',
      page: page.value,
      limit: itemsPerPage.value,
    });
    contracts.value = data.data;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function loadVendors() {
  const { data } = await vendorApi.list({ limit: 200 });
  vendors.value = data.data;
}

onMounted(() => { loadVendors(); loadContracts(); });
watch([search, statusFilter, vendorFilter, riskFilter, ownerFilter, expiryFilter, page, sortBy], loadContracts, { deep: true });

function vendorName(vendorId: string) {
  return vendors.value.find(v => v.id === vendorId)?.legal_name || vendorId;
}

function statusColor(status: string) {
  const map: Record<string, string> = { Active: 'success', Draft: 'grey', 'Under Review': 'info', 'Expiring Soon': 'warning', Expired: 'error', Terminated: 'error' };
  return map[status] || 'grey';
}

function isExpiring(contract: any) {
  const end = new Date(contract.end_date);
  const now = new Date();
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

function isExpired(contract: any) {
  return new Date(contract.end_date) < new Date();
}

async function exportCsv() {
  const { data } = await contractApi.exportCsv({
    search: search.value || undefined,
    status: statusFilter.value || undefined,
    vendor_id: vendorFilter.value || undefined,
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contracts.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function archiveContract(id: string) {
  await contractApi.archive(id);
  loadContracts();
}

function formatCurrency(value: number, currency: string) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Contracts</h1>
        <p class="text-body-2 text-medium-emphasis">{{ total }} contracts found</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="router.push('/contracts/new')">New Contract</v-btn>
      <v-btn variant="outlined" prepend-icon="mdi-cloud-upload" class="mr-2" @click="router.push('/contracts/upload')">Upload</v-btn>
      <v-btn variant="outlined" prepend-icon="mdi-download" @click="exportCsv">CSV</v-btn>
    </div>

    <!-- Filters -->
    <v-card class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search title or vendor" clearable hide-details />
        </v-col>
        <v-col cols="6" md="2">
          <v-select v-model="statusFilter" :items="statuses" label="Status" clearable hide-details />
        </v-col>
        <v-col cols="6" md="2">
          <v-autocomplete v-model="vendorFilter" :items="vendors" item-title="legal_name" item-value="id" label="Vendor" clearable hide-details />
        </v-col>
        <v-col cols="6" md="2">
          <v-select v-model="riskFilter" :items="riskTiers" label="Risk Tier" clearable hide-details />
        </v-col>
        <v-col cols="6" md="1.5">
          <v-select v-model="expiryFilter" :items="expiryWindows" label="Expiry" clearable hide-details />
        </v-col>
        <v-col cols="12" md="1.5">
          <v-text-field v-model="ownerFilter" label="Owner" clearable hide-details />
        </v-col>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="contracts"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page="page"
        density="comfortable"
        @update:page="page = $event"
        @update:sort-by="sortBy = $event"
        hide-default-footer
      >
        <template #item.title="{ item }">
          <router-link :to="`/contracts/${item.id}`" class="text-primary font-weight-medium text-decoration-none">
            {{ item.title }}
          </router-link>
        </template>
        <template #item.vendor_name="{ item }">{{ vendorName(item.vendor_id) }}</template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" label>{{ item.status }}</v-chip>
        </template>
        <template #item.end_date="{ item }">
          <span :class="{ 'text-error font-weight-bold': isExpired(item), 'text-warning font-weight-bold': isExpiring(item) }">
            {{ item.end_date }}
          </span>
        </template>
        <template #item.contract_value="{ item }">{{ formatCurrency(item.contract_value, item.currency) }}</template>
        <template #item.risk_tier="{ item }">
          <v-chip :color="item.risk_tier === 'High' ? 'error' : item.risk_tier === 'Medium' ? 'warning' : 'success'" size="small" variant="tonal">{{ item.risk_tier }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="router.push(`/contracts/${item.id}/edit`)"><v-icon size="small">mdi-pencil</v-icon></v-btn>
          <v-btn icon size="small" variant="text" color="warning" @click="archiveContract(item.id)"><v-icon size="small">mdi-archive</v-icon></v-btn>
        </template>
      </v-data-table>
      <v-pagination v-if="total > itemsPerPage" v-model="page" :length="Math.ceil(total / itemsPerPage)" class="pa-4" />
    </v-card>
  </div>
</template>
