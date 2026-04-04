<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>Contract Management System</v-app-bar-title>
      <v-spacer />
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ currentUser?.role || 'User' }}</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item @click="handleLogout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer app>
      <v-list dense>
        <v-list-item prepend-icon="mdi-home" title="Dashboard" to="/" />
        <v-list-item prepend-icon="mdi-file-document" title="Contracts" to="/contracts" />
        <v-list-item prepend-icon="mdi-organization" title="Vendors" to="/vendors" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { store } from './stores/app';

const currentUser = computed(() => store.state.currentUser);

onMounted(() => {
  // Mock auth for demo and Cypress role testing
  const mockRole = (localStorage.getItem('mockRole') as 'Admin' | 'Contract Manager' | 'Viewer' | null) || 'Contract Manager';
  store.mockAuth(mockRole);
});

function handleLogout() {
  store.state.currentUser = null;
}
</script>
