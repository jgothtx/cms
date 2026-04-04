<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vendorApi } from '../services/api';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const saving = ref(false);
const errors = ref<string[]>([]);

const form = ref({
  legal_name: '', dba_name: '', category: '', tax_id: '', website: '',
  primary_contact_name: '', primary_contact_email: '', primary_contact_phone: '',
  billing_contact_name: '', billing_contact_email: '', billing_address: '',
  country: '', risk_tier: 'Low', performance_rating: '', notes: '',
});

onMounted(async () => {
  if (isEdit.value) {
    loading.value = true;
    const { data } = await vendorApi.get(route.params.id as string);
    Object.keys(form.value).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        (form.value as any)[key] = data[key];
      }
    });
    loading.value = false;
  }
});

async function save() {
  errors.value = [];
  if (!form.value.legal_name.trim()) { errors.value.push('Legal name is required'); return; }

  saving.value = true;
  try {
    const payload = { ...form.value };
    Object.keys(payload).forEach(k => { if ((payload as any)[k] === '') (payload as any)[k] = null; });
    payload.legal_name = form.value.legal_name; // Keep even if empty for validation

    if (isEdit.value) {
      await vendorApi.update(route.params.id as string, payload);
      router.push(`/vendors/${route.params.id}`);
    } else {
      const { data } = await vendorApi.create(payload);
      router.push(`/vendors/${data.id}`);
    }
  } catch (err: any) {
    const msg = err.response?.data?.error || err.message;
    errors.value.push(msg);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" @click="router.back()" class="mb-2">Back</v-btn>
    <h1 class="text-h4 font-weight-bold mb-6">{{ isEdit ? 'Edit Vendor' : 'New Vendor' }}</h1>

    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-if="errors.length" type="error" class="mb-4" closable>
      <ul><li v-for="e in errors" :key="e">{{ e }}</li></ul>
    </v-alert>

    <v-form v-if="!loading" @submit.prevent="save">
      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Vendor Profile</v-card-title>
        <v-row dense>
          <v-col cols="12" md="6"><v-text-field v-model="form.legal_name" label="Legal Name *" /></v-col>
          <v-col cols="12" md="6"><v-text-field v-model="form.dba_name" label="DBA Name" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.category" label="Category" /></v-col>
          <v-col cols="6" md="4"><v-select v-model="form.risk_tier" :items="['Low', 'Medium', 'High']" label="Risk Tier" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.country" label="Country" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.tax_id" label="Tax ID / Registration" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.website" label="Website" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.performance_rating" label="Performance Rating" /></v-col>
        </v-row>
      </v-card>

      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Contacts</v-card-title>
        <v-row dense>
          <v-col cols="12" md="4"><v-text-field v-model="form.primary_contact_name" label="Primary Contact Name" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.primary_contact_email" label="Primary Contact Email" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.primary_contact_phone" label="Primary Contact Phone" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.billing_contact_name" label="Billing Contact Name" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.billing_contact_email" label="Billing Contact Email" /></v-col>
          <v-col cols="12"><v-textarea v-model="form.billing_address" label="Billing Address" rows="2" /></v-col>
        </v-row>
      </v-card>

      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Notes</v-card-title>
        <v-textarea v-model="form.notes" label="Notes" rows="4" />
      </v-card>

      <div class="d-flex justify-end ga-3">
        <v-btn variant="outlined" @click="router.back()">Cancel</v-btn>
        <v-btn color="primary" type="submit" :loading="saving" size="large">{{ isEdit ? 'Update Vendor' : 'Create Vendor' }}</v-btn>
      </div>
    </v-form>
  </div>
</template>
