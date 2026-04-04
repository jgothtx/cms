<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-skeleton-loader type="article" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
</script>
