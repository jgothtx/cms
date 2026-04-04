<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { activityApi } from '../services/api';

const events = ref<any[]>([]);
const total = ref(0);
const loading = ref(true);
const page = ref(1);

const entityTypeFilter = ref('');
const actionFilter = ref('');

const entityTypes = ['Contract', 'Vendor', 'Reminder', 'User'];
const actions = ['Create', 'Update', 'StatusChange', 'Archive', 'Restore', 'Delete', 'Deactivate'];

async function load() {
  loading.value = true;
  try {
    const { data } = await activityApi.list({
      entity_type: entityTypeFilter.value || undefined,
      action: actionFilter.value || undefined,
      page: page.value,
      limit: 50,
    });
    events.value = data.data;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([entityTypeFilter, actionFilter, page], load);

function actionColor(action: string) {
  const map: Record<string, string> = { Create: 'success', Update: 'info', StatusChange: 'warning', Archive: 'grey', Restore: 'success', Delete: 'error', Deactivate: 'warning' };
  return map[action] || 'grey';
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Activity Log</h1>

    <v-card class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="6" md="3"><v-select v-model="entityTypeFilter" :items="entityTypes" label="Entity Type" clearable hide-details /></v-col>
        <v-col cols="6" md="3"><v-select v-model="actionFilter" :items="actions" label="Action" clearable hide-details /></v-col>
      </v-row>
    </v-card>

    <v-card>
      <v-table density="comfortable">
        <thead>
          <tr><th>Timestamp</th><th>Action</th><th>Entity Type</th><th>Summary</th></tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td class="text-caption">{{ new Date(event.timestamp).toLocaleString() }}</td>
            <td><v-chip :color="actionColor(event.action)" size="x-small" label>{{ event.action }}</v-chip></td>
            <td>{{ event.entity_type }}</td>
            <td class="text-body-2">{{ event.change_summary }}</td>
          </tr>
        </tbody>
      </v-table>
      <v-pagination v-if="total > 50" v-model="page" :length="Math.ceil(total / 50)" class="pa-4" />
    </v-card>
  </div>
</template>
