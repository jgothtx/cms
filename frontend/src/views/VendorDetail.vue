<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vendorApi, contractApi } from '../services/api';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;
const vendor = ref<any>(null);
const contracts = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data: v } = await vendorApi.get(id);
    vendor.value = v;
    const { data: c } = await contractApi.list({ vendor_id: id, limit: 100 });
    contracts.value = c.data;
  } finally {
    loading.value = false;
  }
});

async function deactivate() {
  await vendorApi.deactivate(id);
  const { data } = await vendorApi.get(id);
  vendor.value = data;
}
</script>

<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate />
    <template v-if="vendor">
      <div class="d-flex align-center mb-6">
        <div>
          <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" @click="router.push('/vendors')" class="mb-1">Back to Vendors</v-btn>
          <h1 class="text-h4 font-weight-bold">{{ vendor.legal_name }}</h1>
          <div class="d-flex align-center ga-2 mt-1">
            <v-chip :color="vendor.status === 'Active' ? 'success' : 'grey'" label>{{ vendor.status }}</v-chip>
            <v-chip :color="vendor.risk_tier === 'High' ? 'error' : vendor.risk_tier === 'Medium' ? 'warning' : 'success'" size="small" variant="tonal">{{ vendor.risk_tier }} Risk</v-chip>
          </div>
        </div>
        <v-spacer />
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-pencil" class="mr-2" @click="router.push(`/vendors/${id}/edit`)">Edit</v-btn>
        <v-btn v-if="vendor.status === 'Active'" color="warning" variant="outlined" prepend-icon="mdi-cancel" @click="deactivate">Deactivate</v-btn>
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="pa-5 mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Profile</v-card-title>
            <v-row dense>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">DBA Name</div><div>{{ vendor.dba_name || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Category</div><div>{{ vendor.category || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Tax ID</div><div>{{ vendor.tax_id || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Website</div><div>{{ vendor.website || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Country</div><div>{{ vendor.country || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Performance Rating</div><div>{{ vendor.performance_rating || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Notes</div><div>{{ vendor.notes || '—' }}</div></v-col>
            </v-row>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-5 mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Contacts</v-card-title>
            <v-row dense>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Primary Contact</div><div>{{ vendor.primary_contact_name || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Email</div><div>{{ vendor.primary_contact_email || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Phone</div><div>{{ vendor.primary_contact_phone || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Billing Contact</div><div>{{ vendor.billing_contact_name || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Billing Email</div><div>{{ vendor.billing_contact_email || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Billing Address</div><div>{{ vendor.billing_address || '—' }}</div></v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Related Contracts -->
      <v-card class="pa-4">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 mb-3">Contracts ({{ contracts.length }})</v-card-title>
        <v-table v-if="contracts.length" density="compact">
          <thead><tr><th>Title</th><th>Status</th><th>End Date</th><th>Value</th></tr></thead>
          <tbody>
            <tr v-for="c in contracts" :key="c.id" @click="router.push(`/contracts/${c.id}`)" style="cursor: pointer">
              <td class="text-primary">{{ c.title }}</td>
              <td><v-chip :color="c.status === 'Active' ? 'success' : c.status === 'Expired' ? 'error' : 'grey'" size="x-small" label>{{ c.status }}</v-chip></td>
              <td>{{ c.end_date }}</td>
              <td>{{ c.contract_value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: c.currency || 'USD' }).format(c.contract_value) : '—' }}</td>
            </tr>
          </tbody>
        </v-table>
        <div v-else class="text-body-2 text-medium-emphasis">No contracts</div>
      </v-card>
    </template>
  </div>
</template>
