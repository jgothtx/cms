<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center gap-2 mb-4">
          <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
          <h1 class="text-h4">{{ id ? 'Edit' : 'Create' }} Contract</h1>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="form.title"
                label="Contract Title *"
                required
                placeholder="e.g., Acme Corp - Enterprise License"
              />

              <v-select
                v-model="form.vendor_id"
                label="Vendor *"
                :items="vendors"
                item-title="legal_name"
                item-value="id"
                required
                hint="Select or create a vendor"
              />

              <v-text-field
                v-model="form.contract_owner"
                label="Contract Owner *"
                required
                placeholder="e.g., john.doe@company.com"
              />

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.start_date"
                    label="Start Date *"
                    type="date"
                    required
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.end_date"
                    label="End Date *"
                    type="date"
                    required
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.status"
                    label="Status"
                    :items="statusOptions"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.risk_tier"
                    label="Risk Tier"
                    :items="riskTierOptions"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.contract_value"
                    label="Contract Value"
                    type="number"
                    prefix="$"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.currency"
                    label="Currency"
                    placeholder="USD"
                  />
                </v-col>
              </v-row>

              <v-checkbox
                v-model="form.auto_renew"
                label="Auto Renew"
              />

              <v-text-field
                v-model.number="form.notice_period_days"
                label="Notice Period (Days)"
                type="number"
              />

              <v-textarea
                v-model="form.notes"
                label="Notes"
                rows="3"
              />

              <v-divider class="my-4" />

              <div class="d-flex gap-2">
                <v-btn type="submit" color="primary">Save</v-btn>
                <v-btn @click="$router.back()">Cancel</v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { store } from '../stores/app';

const router = useRouter();
const route = useRoute();
const id = route.params.id as string || null;
const vendors = computed(() => store.state.vendors);
const error = ref<string | null>(null);

const statusOptions = ['Draft', 'Under Review', 'Active'];
const riskTierOptions = ['Low', 'Medium', 'High'];

const form = ref({
  title: '',
  vendor_id: '',
  contract_owner: '',
  start_date: '',
  end_date: '',
  status: 'Draft',
  risk_tier: 'Medium',
  contract_value: 0,
  currency: 'USD',
  auto_renew: false,
  notice_period_days: 0,
  notes: ''
});

async function handleSubmit() {
  try {
    const now = new Date().toISOString();
    const contractData = {
      ...form.value,
      created_at: now,
      created_by: store.state.currentUser?.id || 'system',
      updated_at: now,
      updated_by: store.state.currentUser?.id || 'system',
      archived: false
    };

    if (id) {
      await store.updateContract(id, contractData);
    } else {
      await store.createContract(contractData);
    }

    router.push('/contracts');
  } catch (err: any) {
    error.value = err.message || 'Failed to save contract';
  }
}

onMounted(async () => {
  await store.fetchVendors();
  error.value = store.state.error;
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
