import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('./views/Dashboard.vue') },
    { path: '/contracts', name: 'contracts', component: () => import('./views/ContractList.vue') },
    { path: '/contracts/new', name: 'contract-create', component: () => import('./views/ContractForm.vue') },
    { path: '/contracts/upload', name: 'contract-upload', component: () => import('./views/ContractUpload.vue') },
    { path: '/contracts/:id', name: 'contract-detail', component: () => import('./views/ContractDetail.vue') },
    { path: '/contracts/:id/edit', name: 'contract-edit', component: () => import('./views/ContractForm.vue') },
    { path: '/vendors', name: 'vendors', component: () => import('./views/VendorList.vue') },
    { path: '/vendors/new', name: 'vendor-create', component: () => import('./views/VendorForm.vue') },
    { path: '/vendors/:id', name: 'vendor-detail', component: () => import('./views/VendorDetail.vue') },
    { path: '/vendors/:id/edit', name: 'vendor-edit', component: () => import('./views/VendorForm.vue') },
    { path: '/reminders', name: 'reminders', component: () => import('./views/Reminders.vue') },
    { path: '/activity', name: 'activity', component: () => import('./views/Activity.vue') },
    { path: '/archive', name: 'archive', component: () => import('./views/Archive.vue') },
    { path: '/admin', name: 'admin', component: () => import('./views/Admin.vue') },
  ],
});

export default router;
