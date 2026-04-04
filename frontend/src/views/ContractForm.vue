<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contractApi, vendorApi } from '../services/api';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const saving = ref(false);
const errors = ref<string[]>([]);
const vendors = ref<any[]>([]);
const contracts = ref<any[]>([]);

const form = ref({
  title: '', vendor_id: '', contract_owner: '', status: 'Draft',
  start_date: '', end_date: '', external_reference_id: '', contract_type: '',
  description: '', parent_contract_id: '', effective_date: '', signature_date: '',
  termination_date: '', initial_term_months: null as number | null, renewal_term_months: null as number | null,
  auto_renew: false, notice_period_days: null as number | null,
  contract_value: null as number | null, currency: 'USD',
  billing_frequency: '', payment_terms: '', cost_center_code: '', spend_category: '',
  price_escalation_terms: '', risk_tier: 'Low', data_classification: '',
  insurance_required: false, soc2_required: false, dpa_required: false,
  compliance_exceptions: '', regulatory_tags: '', key_obligations: '', sla_terms: '',
  service_credits_terms: '', audit_rights: false, notes: '',
});

const statuses = ['Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated'];
const riskTiers = ['Low', 'Medium', 'High'];
const billingFreqs = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'One-Time', 'Usage-Based'];
const dataClassifications = ['Public', 'Internal', 'Confidential', 'Restricted'];
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK'];

onMounted(async () => {
  loading.value = true;
  const [v, c] = await Promise.all([
    vendorApi.list({ limit: 200 }),
    contractApi.list({ limit: 200 }),
  ]);
  vendors.value = v.data.data;
  contracts.value = c.data.data;

  if (isEdit.value) {
    const { data } = await contractApi.get(route.params.id as string);
    Object.keys(form.value).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        (form.value as any)[key] = data[key];
      }
    });
  }
  loading.value = false;
});

async function save() {
  errors.value = [];
  if (!form.value.title.trim()) errors.value.push('Title is required');
  if (!form.value.vendor_id) errors.value.push('Vendor is required');
  if (!form.value.contract_owner.trim()) errors.value.push('Contract owner is required');
  if (!form.value.start_date) errors.value.push('Start date is required');
  if (!form.value.end_date) errors.value.push('End date is required');
  if (form.value.start_date && form.value.end_date && form.value.end_date <= form.value.start_date) {
    errors.value.push('End date must be after start date');
  }
  if (form.value.contract_value !== null && form.value.contract_value < 0) {
    errors.value.push('Contract value cannot be negative');
  }
  if (errors.value.length) return;

  saving.value = true;
  try {
    const payload = { ...form.value };
    // Clean empty strings to null
    Object.keys(payload).forEach(k => {
      if ((payload as any)[k] === '') (payload as any)[k] = null;
    });

    if (isEdit.value) {
      await contractApi.update(route.params.id as string, payload);
      router.push(`/contracts/${route.params.id}`);
    } else {
      const { data } = await contractApi.create(payload);
      router.push(`/contracts/${data.id}`);
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
    <h1 class="text-h4 font-weight-bold mb-6">{{ isEdit ? 'Edit Contract' : 'New Contract' }}</h1>

    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-if="errors.length" type="error" class="mb-4" closable>
      <ul><li v-for="e in errors" :key="e">{{ e }}</li></ul>
    </v-alert>

    <v-form v-if="!loading" @submit.prevent="save">
      <!-- Core Information -->
      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Core Information</v-card-title>
        <v-row dense>
          <v-col cols="12" md="6"><v-text-field v-model="form.title" label="Contract Title *" :rules="[v => !!v || 'Required']" /></v-col>
          <v-col cols="12" md="6"><v-autocomplete v-model="form.vendor_id" :items="vendors" item-title="legal_name" item-value="id" label="Vendor *" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.contract_owner" label="Contract Owner *" /></v-col>
          <v-col cols="12" md="4"><v-select v-model="form.status" :items="statuses" label="Status" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.contract_type" label="Contract Type" /></v-col>
          <v-col cols="12" md="6"><v-text-field v-model="form.external_reference_id" label="External Reference ID" /></v-col>
          <v-col cols="12" md="6"><v-autocomplete v-model="form.parent_contract_id" :items="contracts" item-title="title" item-value="id" label="Parent Contract" clearable /></v-col>
          <v-col cols="12"><v-textarea v-model="form.description" label="Description" rows="3" /></v-col>
        </v-row>
      </v-card>

      <!-- Dates and Term -->
      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Dates & Term</v-card-title>
        <v-row dense>
          <v-col cols="6" md="3"><v-text-field v-model="form.start_date" label="Start Date *" type="date" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model="form.end_date" label="End Date *" type="date" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model="form.effective_date" label="Effective Date" type="date" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model="form.signature_date" label="Signature Date" type="date" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model="form.termination_date" label="Termination Date" type="date" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model.number="form.initial_term_months" label="Initial Term (months)" type="number" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model.number="form.renewal_term_months" label="Renewal Term (months)" type="number" /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model.number="form.notice_period_days" label="Notice Period (days)" type="number" /></v-col>
          <v-col cols="12" md="3"><v-switch v-model="form.auto_renew" label="Auto Renew" color="primary" /></v-col>
        </v-row>
      </v-card>

      <!-- Financials -->
      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Financials</v-card-title>
        <v-row dense>
          <v-col cols="6" md="3"><v-text-field v-model.number="form.contract_value" label="Contract Value" type="number" prefix="$" /></v-col>
          <v-col cols="6" md="3"><v-autocomplete v-model="form.currency" :items="currencies" label="Currency" /></v-col>
          <v-col cols="6" md="3"><v-select v-model="form.billing_frequency" :items="billingFreqs" label="Billing Frequency" clearable /></v-col>
          <v-col cols="6" md="3"><v-text-field v-model="form.payment_terms" label="Payment Terms" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.cost_center_code" label="Cost Center Code" /></v-col>
          <v-col cols="6" md="4"><v-text-field v-model="form.spend_category" label="Spend Category" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.price_escalation_terms" label="Price Escalation" /></v-col>
        </v-row>
      </v-card>

      <!-- Risk and Compliance -->
      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Risk & Compliance</v-card-title>
        <v-row dense>
          <v-col cols="6" md="3"><v-select v-model="form.risk_tier" :items="riskTiers" label="Risk Tier" /></v-col>
          <v-col cols="6" md="3"><v-select v-model="form.data_classification" :items="dataClassifications" label="Data Classification" clearable /></v-col>
          <v-col cols="4" md="2"><v-switch v-model="form.insurance_required" label="Insurance" color="primary" density="compact" /></v-col>
          <v-col cols="4" md="2"><v-switch v-model="form.soc2_required" label="SOC2" color="primary" density="compact" /></v-col>
          <v-col cols="4" md="2"><v-switch v-model="form.dpa_required" label="DPA" color="primary" density="compact" /></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.compliance_exceptions" label="Compliance Exceptions" rows="2" /></v-col>
          <v-col cols="12" md="6"><v-text-field v-model="form.regulatory_tags" label="Regulatory Tags" /></v-col>
          <v-col cols="12" md="3"><v-switch v-model="form.audit_rights" label="Audit Rights" color="primary" /></v-col>
        </v-row>
      </v-card>

      <!-- Obligations and Notes -->
      <v-card class="mb-4 pa-5">
        <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Obligations & Notes</v-card-title>
        <v-row dense>
          <v-col cols="12"><v-textarea v-model="form.key_obligations" label="Key Obligations" rows="3" /></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.sla_terms" label="SLA Terms" rows="3" /></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.service_credits_terms" label="Service Credits Terms" rows="3" /></v-col>
          <v-col cols="12"><v-textarea v-model="form.notes" label="Notes" rows="3" /></v-col>
        </v-row>
      </v-card>

      <div class="d-flex justify-end ga-3">
        <v-btn variant="outlined" @click="router.back()">Cancel</v-btn>
        <v-btn color="primary" type="submit" :loading="saving" size="large">{{ isEdit ? 'Update Contract' : 'Create Contract' }}</v-btn>
      </div>
    </v-form>
  </div>
</template>
