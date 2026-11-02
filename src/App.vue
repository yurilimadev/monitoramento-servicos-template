<template>
  <div id="app-root">
    <AppHeader />
    <DemoBanner />
    <main class="container-fluid">
      <section class="container-fluid my-4">
        <router-view />
      </section>
    </main>
    <footer class="container-fluid text-center py-3">
      Feito com Vue 3 + Google Sheets — adapte para seus dados
    </footer>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import DemoBanner from './components/DemoBanner.vue'
import { onMounted } from 'vue'
import { useMonitorStore } from './stores/monitorStore.js'
import { isDemo } from './services/dataProvider.js'

const store = useMonitorStore()

onMounted(() => {
  store.loadReferenceData()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap');
body { font-family: 'Nunito', sans-serif; background: #f8f9fa; }
#app { min-height: 100vh; display: flex; flex-direction: column; }
#app-root { flex: 1; }
.accordion-collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
}
.accordion-collapse.show {
  max-height: 2000px;
}
@media (min-width: 768px) {
  .w-md-auto { width: auto !important; }
}
</style>