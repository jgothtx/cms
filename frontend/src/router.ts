import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Dashboard from './components/Dashboard.vue';
import ContractList from './components/ContractList.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/contracts',
    name: 'ContractList',
    component: ContractList
  },
  {
    path: '/contracts/new',
    name: 'CreateContract',
    component: () => import('./components/ContractForm.vue'),
    props: { id: null }
  },
  {
    path: '/contracts/:id',
    name: 'ViewContract',
    component: () => import('./components/ContractDetail.vue')
  },
  {
    path: '/contracts/:id/edit',
    name: 'EditContract',
    component: () => import('./components/ContractForm.vue')
  },
  {
    path: '/vendors',
    name: 'VendorList',
    component: () => import('./components/VendorList.vue')
  },
  {
    path: '/vendors/new',
    name: 'CreateVendor',
    component: () => import('./components/VendorForm.vue'),
    props: { id: null }
  },
  {
    path: '/vendors/:id',
    name: 'ViewVendor',
    component: () => import('./components/VendorDetail.vue')
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
