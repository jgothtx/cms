<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { reminderApi, contractApi } from '../services/api';

const router = useRouter();
const reminders = ref<any[]>([]);
const contracts = ref<Record<string, any>>({});
const loading = ref(true);
const filter = ref('upcoming');

onMounted(async () => {
  try {
    const { data } = await reminderApi.listAll();
    reminders.value = data;
    const contractIds = [...new Set(data.map((r: any) => r.contract_id))];
    for (const id of contractIds) {
      try {
        const { data: c } = await contractApi.get(id as string);
        contracts.value[id as string] = c;
      } catch {}
    }
  } finally {
    loading.value = false;
  }
});

const filtered = computed(() => {
  const now = new Date();
  return reminders.value.filter(r => {
    if (filter.value === 'upcoming') return !r.completed && new Date(r.reminder_date) >= now;
    if (filter.value === 'overdue') return !r.completed && new Date(r.reminder_date) < now;
    if (filter.value === 'completed') return r.completed;
    return true;
  });
});

async function markComplete(id: string) {
  await reminderApi.update(id, { completed: true });
  const idx = reminders.value.findIndex(r => r.id === id);
  if (idx >= 0) reminders.value[idx].completed = true;
}
</script>

<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">Reminders</h1>

    <v-btn-toggle v-model="filter" mandatory class="mb-4">
      <v-btn value="upcoming">Upcoming</v-btn>
      <v-btn value="overdue">Overdue</v-btn>
      <v-btn value="completed">Completed</v-btn>
      <v-btn value="all">All</v-btn>
    </v-btn-toggle>

    <v-progress-linear v-if="loading" indeterminate />

    <v-card>
      <v-list v-if="filtered.length">
        <v-list-item v-for="r in filtered" :key="r.id" :subtitle="r.reminder_note" lines="three">
          <template #prepend>
            <v-icon :color="r.completed ? 'success' : new Date(r.reminder_date) < new Date() ? 'error' : 'warning'" class="mr-3">
              {{ r.completed ? 'mdi-check-circle' : 'mdi-bell-ring' }}
            </v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ r.reminder_type }} — {{ r.reminder_date }}
          </v-list-item-title>
          <div class="text-caption text-medium-emphasis mt-1">
            Contract:
            <router-link v-if="contracts[r.contract_id]" :to="`/contracts/${r.contract_id}`" class="text-primary text-decoration-none">
              {{ contracts[r.contract_id].title }}
            </router-link>
            <span v-else>{{ r.contract_id }}</span>
          </div>
          <template #append>
            <v-btn v-if="!r.completed" size="small" variant="tonal" color="success" @click="markComplete(r.id)">Complete</v-btn>
          </template>
        </v-list-item>
      </v-list>
      <div v-else class="pa-6 text-center text-medium-emphasis">No reminders in this category</div>
    </v-card>
  </div>
</template>
