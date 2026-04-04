<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { contractApi } from '../services/api';

const router = useRouter();
const file = ref<File | null>(null);
const provider = ref('auto');
const providers = ref<string[]>([]);
const spec = ref<any>(null);
const loading = ref(false);
const result = ref<any>(null);
const error = ref('');

onMounted(async () => {
  try {
    const { data } = await contractApi.uploadSpec();
    spec.value = data.spec;
    providers.value = data.providers;
  } catch {}
});

function onFileChange(files: File | File[]) {
  file.value = Array.isArray(files) ? files[0] || null : files;
}

async function upload() {
  if (!file.value) return;
  error.value = '';
  result.value = null;
  loading.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file.value);
    formData.append('provider', provider.value);
    const { data } = await contractApi.upload(formData);
    result.value = data;
  } catch (err: any) {
    const resp = err.response?.data;
    if (resp?.extracted) {
      result.value = resp;
      error.value = resp.error;
    } else {
      error.value = resp?.error || err.message;
    }
  } finally {
    loading.value = false;
  }
}

const providerOptions = [
  { title: 'Auto', value: 'auto' },
  { title: 'OpenAI', value: 'openai' },
  { title: 'Anthropic', value: 'anthropic' },
];
</script>

<template>
  <div>
    <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" @click="router.push('/contracts')" class="mb-2">Back to Contracts</v-btn>
    <h1 class="text-h4 font-weight-bold mb-6">Upload Contract</h1>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="pa-6">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-4">Upload a scanned contract for AI extraction</v-card-title>

          <v-file-input
            label="Select contract file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            prepend-icon="mdi-paperclip"
            show-size
            @update:model-value="onFileChange"
            class="mb-4"
          />

          <v-select v-model="provider" :items="providerOptions" label="OCR Provider" class="mb-4" />

          <div class="text-caption text-medium-emphasis mb-4">
            Supported formats: PNG, JPEG, WebP, PDF (max 10 MB)<br />
            Configured providers: {{ providers.length ? providers.join(', ') : 'None — set OPENAI_API_KEY or ANTHROPIC_API_KEY' }}
          </div>

          <v-btn color="primary" size="large" :loading="loading" :disabled="!file" @click="upload" prepend-icon="mdi-cloud-upload" block>
            Extract & Create Contract
          </v-btn>
        </v-card>

        <!-- Results -->
        <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>

        <v-card v-if="result?.contract" class="mt-4 pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Extraction Result</v-card-title>
          <div class="mb-3">
            <v-chip color="success" class="mr-2">Provider: {{ result.provider }}</v-chip>
          </div>
          <div class="mb-3">
            <strong>Contract:</strong>
            <router-link :to="`/contracts/${result.contract.id}`" class="text-primary ml-1">{{ result.contract.title }}</router-link>
          </div>
          <div class="mb-3">
            <strong>Vendor:</strong>
            <router-link :to="`/vendors/${result.vendor.id}`" class="text-primary ml-1">{{ result.vendor.legal_name }}</router-link>
          </div>
          <div v-if="result.document" class="mb-3">
            <strong>Document:</strong> {{ result.document.file_name }}
          </div>
          <div v-if="result.relationResults?.parent">
            <strong>Parent Contract:</strong>
            <span v-if="result.relationResults.parent.resolved" class="text-success"> Resolved (by {{ result.relationResults.parent.by }})</span>
            <span v-else class="text-warning"> Not resolved: {{ result.relationResults.parent.reference }}</span>
          </div>
        </v-card>

        <!-- Raw Extracted JSON -->
        <v-card v-if="result?.extracted" class="mt-4 pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Raw Extracted Data</v-card-title>
          <pre class="text-body-2 bg-grey-lighten-4 pa-3 rounded" style="overflow-x: auto; max-height: 400px;">{{ JSON.stringify(result.extracted, null, 2) }}</pre>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="pa-5">
          <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-3">Expected JSON Schema</v-card-title>
          <pre v-if="spec" class="text-body-2 bg-grey-lighten-4 pa-3 rounded" style="overflow-x: auto; max-height: 600px;">{{ JSON.stringify(spec, null, 2) }}</pre>
          <div v-else class="text-medium-emphasis">Loading spec...</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
