<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const drawer = ref(true);
const rail = ref(false);
const devRole = ref(localStorage.getItem('devRole') || 'Admin');

function setRole(role: string) {
  devRole.value = role;
  localStorage.setItem('devRole', role);
  window.location.reload();
}

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'Contracts', icon: 'mdi-file-document-multiple', to: '/contracts' },
  { title: 'Vendors', icon: 'mdi-domain', to: '/vendors' },
  { title: 'Reminders', icon: 'mdi-bell-ring', to: '/reminders' },
  { title: 'Upload Contract', icon: 'mdi-cloud-upload', to: '/contracts/upload' },
  { title: 'Activity Log', icon: 'mdi-history', to: '/activity' },
  { title: 'Archive', icon: 'mdi-archive', to: '/archive' },
  { title: 'Admin', icon: 'mdi-cog', to: '/admin' },
];
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent color="primary" theme="dark">
      <v-list-item
        prepend-icon="mdi-briefcase-check"
        title="Contract Mgmt"
        subtitle="VMO Portal"
        nav
        class="mb-2"
        @click="rail = !rail"
      />
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          rounded="xl"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat color="surface" border="b">
      <v-app-bar-nav-icon @click="rail = !rail" />
      <v-toolbar-title class="text-h6 font-weight-bold">
        {{ $route.meta?.title || $route.name?.toString().replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Dashboard' }}
      </v-toolbar-title>
      <v-spacer />
      <v-chip class="mr-4" :color="devRole === 'Admin' ? 'primary' : devRole === 'Contract Manager' ? 'info' : 'grey'" variant="elevated" size="small">
        {{ devRole }}
      </v-chip>
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon v-bind="props"><v-icon>mdi-account-circle</v-icon></v-btn>
        </template>
        <v-list density="compact">
          <v-list-subheader>Switch Role (Dev)</v-list-subheader>
          <v-list-item v-for="role in ['Admin', 'Contract Manager', 'Viewer']" :key="role" :title="role" @click="setRole(role)" :active="devRole === role" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
