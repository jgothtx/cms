<template>
  <v-container>
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h4 mb-2">Dashboard</h1>
        <p class="text-subtitle2 text-grey-darken-1">Portfolio Overview and Key Metrics</p>
      </v-col>
    </v-row>

    <v-row v-if="loading" class="mb-6">
      <v-col cols="12">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <v-row v-else class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="bg-primary text-white">
          <v-card-text>
            <div class="text-h6">Active Contracts</div>
            <div class="text-h4 font-weight-bold">{{ dashboardData.total_active_contracts || 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="bg-warning text-white">
          <v-card-text>
            <div class="text-h6">Expiring (30 Days)</div>
            <div class="text-h4 font-weight-bold">{{ dashboardData.expiring_30_days || 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="bg-error text-white">
          <v-card-text>
            <div class="text-h6">Expired</div>
            <div class="text-h4 font-weight-bold">{{ dashboardData.expired_contracts || 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="bg-info text-white">
          <v-card-text>
            <div class="text-h6">High Risk</div>
            <div class="text-h4 font-weight-bold">{{ dashboardData.high_risk_contracts || 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Contracts by Status</v-card-title>
          <v-card-text>
            <div v-if="dashboardData.status_summary" class="px-4">
              <v-list density="compact">
                <v-list-item v-for="(count, status) in dashboardData.status_summary" :key="status">
                  <template v-slot:prepend>
                    <v-chip label size="small">{{ count }}</v-chip>
                  </template>
                  <v-list-item-title>{{ status }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column gap-2">
              <v-btn color="primary" prepend-icon="mdi-plus" to="/contracts/new">
                Create Contract
              </v-btn>
              <v-btn color="secondary" prepend-icon="mdi-plus" to="/vendors/new">
                Create Vendor
              </v-btn>
              <v-btn color="info" prepend-icon="mdi-list" to="/contracts">
                View All Contracts
              </v-btn>
              <v-btn color="info" prepend-icon="mdi-organization" to="/vendors">
                View All Vendors
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { store } from '../stores/app';

const loading = ref(false);
const error = ref<string | null>(null);

const dashboardData = ref(store.state.dashboardData || {
  total_active_contracts: 0,
  expiring_30_days: 0,
  expired_contracts: 0,
  high_risk_contracts: 0,
  status_summary: {}
});

onMounted(async () => {
  loading.value = true;
  await store.fetchDashboardData();
  dashboardData.value = store.state.dashboardData || dashboardData.value;
  error.value = store.state.error;
  loading.value = false;
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
