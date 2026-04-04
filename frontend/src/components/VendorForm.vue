<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center gap-2 mb-4">
          <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
          <h1 class="text-h4">{{ id ? 'Edit' : 'Create' }} Vendor</h1>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="form.legal_name"
                label="Legal Name *"
                required
              />

              <v-text-field
                v-model="form.dba_name"
                label="DBA Name"
              />

              <v-select
                v-model="form.risk_tier"
                label="Risk Tier *"
                :items="riskTierOptions"
                required
              />

              <v-text-field
                v-model="form.category"
                label="Category"
              />

              <v-text-field
                v-model="form.website"
                label="Website"
                type="url"
              />

              <v-divider class="my-4" />
              <h3>Primary Contact</h3>

              <v-text-field
                v-model="form.primary_contact_name"
                label="Contact Name"
              />

              <v-text-field
                v-model="form.primary_contact_email"
                label="Contact Email"
                type="email"
              />

              <v-text-field
                v-model="form.primary_contact_phone"
                label="Contact Phone"
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
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { store } from '../stores/app';

const router = useRouter();
const route = useRoute();
const id = route.params.id as string || null;

const riskTierOptions = ['Low', 'Medium', 'High'];

const form = ref({
  legal_name: '',
  dba_name: '',
  risk_tier: 'Medium',
  category: '',
  website: '',
  primary_contact_name: '',
  primary_contact_email: '',
  primary_contact_phone: ''
});

async function handleSubmit() {
  try {
    if (id) {
      await store.updateVendor(id, form.value);
    } else {
      await store.createVendor(form.value);
    }
    router.push('/vendors');
  } catch (err) {
    console.error(err);
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
