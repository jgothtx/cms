<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { contractApi, vendorApi } from '../services/api';

const router = useRouter();
const contracts = ref<any[]>([]);
const vendors = ref<Record<string, string>>({});
const loading = ref(true);
const devRole = localStorage.getItem('devRole') || 'Admin';

async function load() {
  loading.value = true;
  try {
    const { data } = await contractApi.list({ archived: 'true', limit: 200 });
    contracts.value = data.data;
    // Also include expired/terminated
    const { data: expired } = await contractApi.list({ status: 'Expired', limit: 200 });
    const { data: terminated } = await contractApi.list({ status: 'Terminated', limit: 200 });
    const ids = new Set(contracts.value.map(c => c.id));
    for (const c of [...expired.data, ...terminated.data]) {
      if (!ids.has(c.id)) { contracts.value.push(c); ids.add(c.id); }
    }
    // Load vendor names
    const { data: v } = await vendorApi.list({ limit: 200 });
    for (const vendor of v.data) { vendors.value[vendor.id] = vendor.legal_name; }
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function restore(id: string) {
  await contractApi.restore(id);
  load();
}

const headers = [
  { title: 'Title', key: 'title', sortable: true },
  { title: 'Vendor', key: 'vendor_id', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'End Date', key: 'end_date', sortable: true },
  { title: 'Archived', key: 'archived', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
];
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-2">Archive</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Archived, expired, and terminated contracts</p>

    <v-card>
      <v-data-table :headers="headers" :items="contracts" :loading="loading" density="comfortable" hide-default-footer>
        <template #item.title="{ item }">
          <router-link :to="`/contracts/${item.id}`" class="text-primary text-decoration-none">{{ item.title }}</router-link>
        </template>
        <template #item.vendor_id="{ item }">{{ vendors[item.vendor_id] || item.vendor_id }}</template>
        <template #item.status="{ item }">
          <v-chip :color="item.status === 'Expired' ? 'error' : item.status === 'Terminated' ? 'error' : 'grey'" size="small" label>{{ item.status }}</v-chip>
        </template>
        <template #item.archived="{ item }">
          <v-chip v-if="item.archived" size="x-small" color="grey" label>Archived</v-chip>
          <span v-else>—</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn v-if="item.archived && devRole === 'Admin'" size="small" variant="tonal" color="success" @click="restore(item.id)">Restore</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
