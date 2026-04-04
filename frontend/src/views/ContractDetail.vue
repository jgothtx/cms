<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contractApi, vendorApi, reminderApi, activityApi, documentApi } from '../services/api';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const contract = ref<any>(null);
const vendor = ref<any>(null);
const reminders = ref<any[]>([]);
const activity = ref<any[]>([]);
const documents = ref<any[]>([]);
const loading = ref(true);
const showReminderDialog = ref(false);
const newReminder = ref({ reminder_date: '', reminder_type: '', reminder_note: '' });
const reminderTypes = ['Renewal Review', 'Expiration Warning', 'Budget Review', 'Compliance Check', 'Performance Review', 'Other'];

onMounted(async () => {
  try {
    const { data: c } = await contractApi.get(id);
    contract.value = c;
    if (c.vendor_id) {
      const { data: v } = await vendorApi.get(c.vendor_id);
      vendor.value = v;
    }
    const [rem, act, docs] = await Promise.all([
      reminderApi.listForContract(id),
      activityApi.list({ entity_id: id, entity_type: 'Contract' }),
      documentApi.listForContract(id),
    ]);
    reminders.value = rem.data;
    activity.value = act.data.data;
    documents.value = docs.data;
  } finally {
    loading.value = false;
  }
});

async function archive() {
  await contractApi.archive(id);
  const { data } = await contractApi.get(id);
  contract.value = data;
}

async function restore() {
  await contractApi.restore(id);
  const { data } = await contractApi.get(id);
  contract.value = data;
}

async function addReminder() {
  await reminderApi.create(id, newReminder.value);
  const { data } = await reminderApi.listForContract(id);
  reminders.value = data;
  showReminderDialog.value = false;
  newReminder.value = { reminder_date: '', reminder_type: '', reminder_note: '' };
}

function statusColor(status: string) {
  const map: Record<string, string> = { Active: 'success', Draft: 'grey', 'Under Review': 'info', 'Expiring Soon': 'warning', Expired: 'error', Terminated: 'error', Archived: 'grey-darken-1' };
  return map[status] || 'grey';
}

function formatCurrency(value: number, currency: string) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(value);
}

function bool(val: any) { return val ? 'Yes' : 'No'; }
</script>

<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate />
    <template v-if="contract">
      <div class="d-flex align-center mb-6">
        <div>
          <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" @click="router.push('/contracts')" class="mb-1">Back to Contracts</v-btn>
          <h1 class="text-h4 font-weight-bold">{{ contract.title }}</h1>
          <div class="d-flex align-center ga-2 mt-1">
            <v-chip :color="statusColor(contract.status)" label>{{ contract.status }}</v-chip>
            <v-chip v-if="contract.archived" color="grey" label size="small">Archived</v-chip>
            <v-chip v-if="contract.risk_tier" :color="contract.risk_tier === 'High' ? 'error' : contract.risk_tier === 'Medium' ? 'warning' : 'success'" size="small" variant="tonal">{{ contract.risk_tier }} Risk</v-chip>
          </div>
        </div>
        <v-spacer />
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-pencil" class="mr-2" @click="router.push(`/contracts/${id}/edit`)">Edit</v-btn>
        <v-btn v-if="!contract.archived" color="warning" variant="outlined" prepend-icon="mdi-archive" class="mr-2" @click="archive">Archive</v-btn>
        <v-btn v-if="contract.archived" color="success" variant="outlined" prepend-icon="mdi-restore" @click="restore">Restore</v-btn>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <!-- Core Information -->
          <v-card class="mb-4 pa-5">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Core Information</v-card-title>
            <v-row dense>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Contract Owner</div><div>{{ contract.contract_owner }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Vendor</div><div><router-link v-if="vendor" :to="`/vendors/${vendor.id}`" class="text-primary text-decoration-none">{{ vendor.legal_name }}</router-link></div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Contract Type</div><div>{{ contract.contract_type || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">External Ref</div><div>{{ contract.external_reference_id || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Description</div><div>{{ contract.description || '—' }}</div></v-col>
            </v-row>
          </v-card>

          <!-- Dates and Term -->
          <v-card class="mb-4 pa-5">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Dates & Term</v-card-title>
            <v-row dense>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Start Date</div><div>{{ contract.start_date }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">End Date</div><div>{{ contract.end_date }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Effective Date</div><div>{{ contract.effective_date || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Signature Date</div><div>{{ contract.signature_date || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Termination Date</div><div>{{ contract.termination_date || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Auto Renew</div><div>{{ bool(contract.auto_renew) }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Initial Term</div><div>{{ contract.initial_term_months ? `${contract.initial_term_months} months` : '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Renewal Term</div><div>{{ contract.renewal_term_months ? `${contract.renewal_term_months} months` : '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Notice Period</div><div>{{ contract.notice_period_days ? `${contract.notice_period_days} days` : '—' }}</div></v-col>
            </v-row>
          </v-card>

          <!-- Financials -->
          <v-card class="mb-4 pa-5">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Financials</v-card-title>
            <v-row dense>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Contract Value</div><div class="text-h6">{{ formatCurrency(contract.contract_value, contract.currency) }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Billing Frequency</div><div>{{ contract.billing_frequency || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Payment Terms</div><div>{{ contract.payment_terms || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Cost Center</div><div>{{ contract.cost_center_code || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Spend Category</div><div>{{ contract.spend_category || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Price Escalation</div><div>{{ contract.price_escalation_terms || '—' }}</div></v-col>
            </v-row>
          </v-card>

          <!-- Risk and Compliance -->
          <v-card class="mb-4 pa-5">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Risk & Compliance</v-card-title>
            <v-row dense>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Data Classification</div><div>{{ contract.data_classification || '—' }}</div></v-col>
              <v-col cols="4"><div class="text-caption text-medium-emphasis">Audit Rights</div><div>{{ bool(contract.audit_rights) }}</div></v-col>
              <v-col cols="12">
                <div class="text-caption text-medium-emphasis mb-1">Compliance Flags</div>
                <v-chip v-if="contract.insurance_required" color="info" size="small" class="mr-1">Insurance</v-chip>
                <v-chip v-if="contract.soc2_required" color="info" size="small" class="mr-1">SOC2</v-chip>
                <v-chip v-if="contract.dpa_required" color="info" size="small">DPA</v-chip>
                <span v-if="!contract.insurance_required && !contract.soc2_required && !contract.dpa_required" class="text-medium-emphasis">None</span>
              </v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Compliance Exceptions</div><div>{{ contract.compliance_exceptions || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption text-medium-emphasis">Regulatory Tags</div><div>{{ contract.regulatory_tags || '—' }}</div></v-col>
            </v-row>
          </v-card>

          <!-- Obligations and Notes -->
          <v-card class="mb-4 pa-5">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Obligations & Notes</v-card-title>
            <v-row dense>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Key Obligations</div><div>{{ contract.key_obligations || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">SLA Terms</div><div>{{ contract.sla_terms || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Service Credits</div><div>{{ contract.service_credits_terms || '—' }}</div></v-col>
              <v-col cols="12"><div class="text-caption text-medium-emphasis">Notes</div><div>{{ contract.notes || '—' }}</div></v-col>
            </v-row>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <!-- Reminders -->
          <v-card class="mb-4 pa-4">
            <div class="d-flex align-center mb-3">
              <v-card-title class="text-subtitle-1 font-weight-bold px-0">Reminders</v-card-title>
              <v-spacer />
              <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="showReminderDialog = true">Add</v-btn>
            </div>
            <v-list v-if="reminders.length" density="compact">
              <v-list-item v-for="r in reminders" :key="r.id" :subtitle="r.reminder_note">
                <template #prepend>
                  <v-icon :color="r.completed ? 'success' : new Date(r.reminder_date) < new Date() ? 'error' : 'warning'" size="small">
                    {{ r.completed ? 'mdi-check-circle' : 'mdi-bell' }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ r.reminder_type }} — {{ r.reminder_date }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">No reminders</div>
          </v-card>

          <!-- Documents -->
          <v-card class="mb-4 pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 mb-3">Documents</v-card-title>
            <v-list v-if="documents.length" density="compact">
              <v-list-item v-for="d in documents" :key="d.id" :subtitle="`${d.file_type} — ${new Date(d.uploaded_at).toLocaleDateString()}`">
                <template #prepend><v-icon size="small">mdi-file-document</v-icon></template>
                <v-list-item-title>{{ d.file_name }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <div v-else class="text-body-2 text-medium-emphasis">No documents</div>
          </v-card>

          <!-- Activity -->
          <v-card class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold px-0 mb-3">Activity</v-card-title>
            <v-timeline density="compact" side="end">
              <v-timeline-item v-for="e in activity.slice(0, 10)" :key="e.id" :dot-color="e.action === 'Create' ? 'success' : 'info'" size="x-small">
                <div class="text-caption">{{ new Date(e.timestamp).toLocaleString() }}</div>
                <div class="text-body-2">{{ e.change_summary }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Add Reminder Dialog -->
    <v-dialog v-model="showReminderDialog" max-width="500">
      <v-card class="pa-6">
        <v-card-title class="text-h6 px-0">Add Reminder</v-card-title>
        <v-text-field v-model="newReminder.reminder_date" label="Reminder Date" type="date" class="mb-2" />
        <v-select v-model="newReminder.reminder_type" :items="reminderTypes" label="Type" class="mb-2" />
        <v-textarea v-model="newReminder.reminder_note" label="Note" rows="3" />
        <v-card-actions class="px-0">
          <v-spacer />
          <v-btn variant="text" @click="showReminderDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addReminder">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
