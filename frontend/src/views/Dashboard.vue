<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dashboardApi } from '../services/api';

const router = useRouter();
const summary = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await dashboardApi.summary();
    summary.value = data;
  } finally {
    loading.value = false;
  }
});

function statusColor(status: string) {
  const map: Record<string, string> = {
    Active: 'success', Draft: 'grey', 'Under Review': 'info', 'Expiring Soon': 'warning', Expired: 'error', Terminated: 'error', Archived: 'grey-darken-1',
  };
  return map[status] || 'grey';
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-body-2 text-medium-emphasis">Contract portfolio overview</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="router.push('/contracts/new')">New Contract</v-btn>
      <v-btn variant="outlined" prepend-icon="mdi-domain" @click="router.push('/vendors/new')">New Vendor</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <template v-if="summary">
      <!-- Metric Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" @click="router.push('/contracts?status=Active')">
            <div class="d-flex align-center">
              <v-avatar color="success" variant="tonal" size="48" class="mr-4"><v-icon>mdi-check-circle</v-icon></v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ summary.totalActive }}</div>
                <div class="text-body-2 text-medium-emphasis">Active Contracts</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" @click="router.push('/contracts?expiry_window=30')">
            <div class="d-flex align-center">
              <v-avatar color="warning" variant="tonal" size="48" class="mr-4"><v-icon>mdi-clock-alert</v-icon></v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ summary.expiring30 }}</div>
                <div class="text-body-2 text-medium-emphasis">Expiring (30 days)</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" @click="router.push('/contracts?status=Expired')">
            <div class="d-flex align-center">
              <v-avatar color="error" variant="tonal" size="48" class="mr-4"><v-icon>mdi-alert-circle</v-icon></v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ summary.expired }}</div>
                <div class="text-body-2 text-medium-emphasis">Expired</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center">
              <v-avatar color="error" variant="tonal" size="48" class="mr-4"><v-icon>mdi-shield-alert</v-icon></v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ summary.highRisk }}</div>
                <div class="text-body-2 text-medium-emphasis">High Risk</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Expiry Breakdown -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0">Expiry Buckets</v-card-title>
            <v-list density="compact">
              <v-list-item @click="router.push('/contracts?expiry_window=30')">
                <template #prepend><v-icon color="error" size="small">mdi-circle</v-icon></template>
                <v-list-item-title>Within 30 days</v-list-item-title>
                <template #append><v-chip size="small" color="error">{{ summary.expiring30 }}</v-chip></template>
              </v-list-item>
              <v-list-item @click="router.push('/contracts?expiry_window=60')">
                <template #prepend><v-icon color="warning" size="small">mdi-circle</v-icon></template>
                <v-list-item-title>Within 60 days</v-list-item-title>
                <template #append><v-chip size="small" color="warning">{{ summary.expiring60 }}</v-chip></template>
              </v-list-item>
              <v-list-item @click="router.push('/contracts?expiry_window=90')">
                <template #prepend><v-icon color="info" size="small">mdi-circle</v-icon></template>
                <v-list-item-title>Within 90 days</v-list-item-title>
                <template #append><v-chip size="small" color="info">{{ summary.expiring90 }}</v-chip></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0">By Status</v-card-title>
            <v-list density="compact">
              <v-list-item v-for="s in summary.byStatus" :key="s.status" @click="router.push(`/contracts?status=${s.status}`)">
                <template #prepend><v-chip :color="statusColor(s.status)" size="x-small" label>{{ s.status }}</v-chip></template>
                <template #append><span class="font-weight-bold">{{ s.count }}</span></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0">Top Vendors</v-card-title>
            <v-list density="compact">
              <v-list-item v-for="v in summary.byVendor" :key="v.vendor">
                <v-list-item-title>{{ v.vendor }}</v-list-item-title>
                <template #append><v-chip size="small">{{ v.count }}</v-chip></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Activity -->
      <v-card class="pa-4">
        <div class="d-flex align-center mb-3">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0">Recent Activity</v-card-title>
          <v-spacer />
          <v-btn variant="text" size="small" @click="router.push('/activity')">View All</v-btn>
        </div>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in summary.recentActivity" :key="event.id">
              <td class="text-caption">{{ new Date(event.timestamp).toLocaleString() }}</td>
              <td><v-chip size="x-small" :color="event.action === 'Create' ? 'success' : event.action === 'Delete' ? 'error' : 'info'" label>{{ event.action }}</v-chip></td>
              <td>{{ event.entity_type }}</td>
              <td class="text-body-2">{{ event.change_summary }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </template>
  </div>
</template>
