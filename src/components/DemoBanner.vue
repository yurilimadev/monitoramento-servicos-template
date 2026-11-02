<template>
  <div v-if="isDemo" class="alert alert-info alert-dismissible fade show rounded-0 mb-0 border-0 border-bottom" role="alert">
    <div class="container d-flex flex-wrap align-items-center gap-2">
      <i class="bi bi-info-circle-fill"></i>
      <span>
        <strong>Modo demonstração</strong> — os dados exibidos são fictícios e ficam salvos apenas neste navegador.
      </span>
      <span v-if="alteracoes > 0" class="badge text-bg-secondary">
        {{ alteracoes }} alteração(ões) local(is)
      </span>
      <div class="ms-auto d-flex gap-2">
        <button type="button" class="btn btn-sm btn-outline-dark" @click="resetar">
          Resetar dados demo
        </button>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { isDemo, resetDemoData, quantidadeAlteracoesLocais } from '../services/dataProvider.js'

const alteracoes = ref(isDemo ? quantidadeAlteracoesLocais() : 0)

function resetar() {
  if (!confirm('Remover as alterações locais e voltar aos dados fictícios originais?')) return
  resetDemoData()
  window.location.reload()
}
</script>
