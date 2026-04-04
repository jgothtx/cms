<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <h1 class="text-h4">Vendors</h1>
          <v-btn v-if="canWrite" color="primary" prepend-icon="mdi-plus" to="/vendors/new">
            New Vendor
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Risk Tier</th>
                <th>Category</th>
                <th>Status</th>
                <th>Contact Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vendor in vendors" :key="vendor.id">
                <td>{{ vendor.legal_name }}</td>
                <td>
                  <v-chip :label="true" size="small" :color="getRiskColor(vendor.risk_tier)">
                    {{ vendor.risk_tier }}
                  </v-chip>
                </td>
                <td>{{ vendor.category || 'N/A' }}</td>
                <td>{{ vendor.status }}</td>
                <td>{{ vendor.primary_contact_email || 'N/A' }}</td>
                <td>
                  <v-menu v-if="canWrite">
                    <template v-slot:activator="{ props }">
                      <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                    </template>
                    <v-list>
                      <v-list-item :to="`/vendors/${vendor.id}`">
                        <v-list-item-title>Edit</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-if="isAdmin" @click="handleDelete(vendor)">
                        <v-list-item-title>Delete</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-if="vendor.status !== 'Inactive'" @click="handleDeactivate(vendor.id)">
                        <v-list-item-title>Deactivate</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { store } from '../stores/app';
import { Vendor } from '../../../backend/src/models';

const vendors = computed(() => store.state.vendors);
const canWrite = computed(() => store.canWrite());
const isAdmin = computed(() => store.isAdmin());
const error = ref<string | null>(null);

function getRiskColor(risk: string): string {
  const colors: { [key: string]: string } = {
    'High': 'error',
    'Medium': 'warning',
    'Low': 'success'
  };
  return colors[risk] || 'grey';
}

async function handleDeactivate(vendorId: string) {
  try {
    await store.deactivateVendor(vendorId);
    error.value = null;
  } catch {
    error.value = store.state.error;
  }
}

async function handleDelete(vendor: Vendor) {
  if (!confirm(`Delete vendor \"${vendor.legal_name}\"?`)) {
    return;
  }

  try {
    await store.deleteVendor(vendor.id);
    error.value = null;
  } catch {
    error.value = store.state.error;
  }
}

onMounted(async () => {
  await store.fetchVendors();
  error.value = store.state.error;
});
</script>
