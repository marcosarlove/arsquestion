<template>
  <AppHeader />
  <router-view />
  <ContinueFab />
</template>

<script>
import AppHeader from './components/AppHeader.vue';
import ContinueFab from './components/ContinueFab.vue';

export default {
  name: 'App',
  components: { AppHeader, ContinueFab },
}
</script>

<style>
/* Estilos globais podem ser mantidos aqui ou movidos para um arquivo CSS separado */
</style>
