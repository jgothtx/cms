<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { vendorApi } from '../services/api';

const router = useRouter();
const vendors = ref<any[]>([]);
const total = ref(0);
const loading = ref(true);

const search = ref('');
const statusFilter = ref('');
const categoryFilter = ref('');
const riskFilter = ref('');
const page = ref(1);

const headers = [
  { title: 'Legal Name', key: 'legal_name', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Risk Tier', key: 'risk_tier', sortable: true },
  { title: 'Contact', key: 'primary_contact_name', sortable: false },
  { title: 'Country', key: 'country', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
];

async function load() {
  loading.value = true;
  try {
    const { data } = await vendorApi.list({
      search: search.value || undefined,
      status: statusFilter.value || undefined,
      category: categoryFilter.value || undefined,
      risk_tier: riskFilter.value || undefined,
      page: page.value,
    });
    vendors.value = data.data;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([search, statusFilter, categoryFilter, riskFilter, page], load);
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Vendors</h1>
        <p class="text-body-2 text-medium-emphasis">{{ total }} vendors</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="router.push('/vendors/new')">New Vendor</v-btn>
    </div>

    <v-card class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="12" md="4"><v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search vendors" clearable hide-details /></v-col>
        <v-col cols="4" md="2"><v-select v-model="statusFilter" :items="['Active', 'Inactive']" label="Status" clearable hide-details /></v-col>
        <v-col cols="4" md="3"><v-text-field v-model="categoryFilter" label="Category" clearable hide-details /></v-col>
        <v-col cols="4" md="3"><v-select v-model="riskFilter" :items="['Low', 'Medium', 'High']" label="Risk Tier" clearable hide-details /></v-col>
      </v-row>
    </v-card>

    <v-card>
      <v-data-table :headers="headers" :items="vendors" :loading="loading" density="comfortable" hide-default-footer>
        <template #item.legal_name="{ item }">
          <router-link :to="`/vendors/${item.id}`" class="text-primary font-weight-medium text-decoration-none">{{ item.legal_name }}</router-link>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="item.status === 'Active' ? 'success' : 'grey'" size="small" label>{{ item.status }}</v-chip>
        </template>
        <template #item.risk_tier="{ item }">
          <v-chip :color="item.risk_tier === 'High' ? 'error' : item.risk_tier === 'Medium' ? 'warning' : 'success'" size="small" variant="tonal">{{ item.risk_tier }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="router.push(`/vendors/${item.id}/edit`)"><v-icon size="small">mdi-pencil</v-icon></v-btn>
        </template>
      </v-data-table>
      <v-pagination v-if="total > 50" v-model="page" :length="Math.ceil(total / 50)" class="pa-4" />
    </v-card>
  </div>
</template>
