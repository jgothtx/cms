<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userApi } from '../services/api';

const users = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await userApi.list();
    users.value = data;
  } catch {
    // May fail for non-admin
  } finally {
    loading.value = false;
  }
});

const headers = [
  { title: 'Name', key: 'display_name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Status', key: 'active' },
  { title: 'Created', key: 'created_at' },
];

const statuses = ['Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Archived'];
const riskTiers = ['Low', 'Medium', 'High'];
const billingFreqs = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'One-Time', 'Usage-Based'];
const dataClassifications = ['Public', 'Internal', 'Confidential', 'Restricted'];
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Admin</h1>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-5 mb-4">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Users & Roles</v-card-title>
          <v-progress-linear v-if="loading" indeterminate />
          <v-data-table v-else :headers="headers" :items="users" density="comfortable" hide-default-footer>
            <template #item.role="{ item }">
              <v-chip :color="item.role === 'Admin' ? 'primary' : item.role === 'Contract Manager' ? 'info' : 'grey'" size="small">{{ item.role }}</v-chip>
            </template>
            <template #item.active="{ item }">
              <v-chip :color="item.active ? 'success' : 'grey'" size="x-small">{{ item.active ? 'Active' : 'Inactive' }}</v-chip>
            </template>
            <template #item.created_at="{ item }">{{ new Date(item.created_at).toLocaleDateString() }}</template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card class="pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Contract Statuses</v-card-title>
          <v-chip v-for="s in statuses" :key="s" class="mr-1 mb-1" size="small">{{ s }}</v-chip>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Risk Tiers</v-card-title>
          <v-chip v-for="r in riskTiers" :key="r" class="mr-1 mb-1" size="small">{{ r }}</v-chip>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Billing Frequencies</v-card-title>
          <v-chip v-for="b in billingFreqs" :key="b" class="mr-1 mb-1" size="small">{{ b }}</v-chip>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Data Classifications</v-card-title>
          <v-chip v-for="d in dataClassifications" :key="d" class="mr-1 mb-1" size="small">{{ d }}</v-chip>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
