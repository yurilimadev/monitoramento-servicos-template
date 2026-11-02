<template>
  <div class="col-md-9 h-100 overflow-hidden">
    <div v-if="store.servicesToRender.length > 0" class="p-4 border shadow overflow-hidden">
      <div class="text-center">
        <h5>{{ store.selectedSecretaria || '[SECRETARIA]' }}</h5>
        <p>{{ store.selectedAgrupamento || '[Agrupamento]' }}</p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label class="form-label fw-bold">Responsável</label>
          <select class="form-select shadow" v-model="store.selectedResponsavel" required>
            <option disabled value="">Selecione...</option>
            <option v-for="r in store.responsaveis" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Data Atualização</label>
          <input class="form-control shadow" type="text" ref="dateInput" placeholder="Selecione a data" required>
        </div>
      </div>

      <div class="text-center mb-3">
        <button type="button" class="btn btn-outline-info btn-sm" :disabled="loading"
          @click="puxarDados">
          <i class="bi bi-cloud-download"></i> Puxar dados já salvos desta data
        </button>
      </div>

      <form @submit.prevent="onSubmit">
        <div class="accordion mt-3" id="accordionServicos">
          <div
            v-for="(svc, idx) in store.servicesToRender"
            :key="idx"
            class="accordion-item"
          >
            <h2 class="accordion-header">
              <button
                class="accordion-button"
                :class="{ collapsed: openIdx !== idx }"
                type="button"
                @click="toggleAccordion(idx)"
              >
                <span class="me-2">{{ idx + 1 }}.</span>
                <span class="flex-grow-1 text-truncate">{{ svc.servico }}</span>
                <i
                  v-if="isFilled(idx)"
                  class="bi bi-check-circle-fill text-success ms-2"
                  title="Preenchido"
                ></i>
                <i
                  v-else
                  class="bi bi-circle text-muted ms-2"
                  title="Pendente"
                ></i>
              </button>
            </h2>
            <div
              class="accordion-collapse"
              :class="{ show: openIdx === idx }"
            >
              <div class="accordion-body">
                <ServiceCard
                  :servicoNome="svc.servico"
                  v-model="serviceData[idx]"
                />
              </div>
            </div>
          </div>
          <p v-if="store.servicesToRender.length === 0" class="text-center text-muted mt-4">
            Selecione os filtros e clique em "Filtrar" para carregar os serviços.
          </p>
        </div>
        <hr>
        <div class="row mt-4">
          <div class="col-12 d-md-flex justify-content-md-end">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Enviando...' : 'Atualizar' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <div v-else class="p-4 border shadow overflow-hidden text-center text-muted mt-3">
      <p>Selecione a Secretaria e o Agrupamento e clique em "Filtrar" para carregar os serviços.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useMonitorStore } from '../stores/monitorStore.js'
import ServiceCard from './ServiceCard.vue'
import { buscarDadosSalvos, upsertDados } from '../services/dataProvider.js'

export default {
  components: { ServiceCard },
  setup() {
    const store = useMonitorStore()
    const serviceData = ref({})
    const submitting = ref(false)
    const loading = ref(false)
    const dateInput = ref(null)
    const openIdx = ref(0)
    let flatpickrInstance = null

    function toggleAccordion(idx) {
      openIdx.value = openIdx.value === idx ? -1 : idx
    }

    function isFilled(idx) {
      const d = serviceData.value[idx]
      if (!d) return false
      return (d.aberto > 0 || d.andamento > 0 || d.encerrado > 0) || (d.observacao && d.observacao.trim() !== '')
    }

    onMounted(() => {
      store.selectedResponsavel = ''
      store.selectedDataInicio = ''
    })

    watch(() => store.servicesToRender, async (services) => {
      serviceData.value = {}
      openIdx.value = 0
      if (services.length > 0) {
        await nextTick()
        if (dateInput.value && !flatpickrInstance) {
          flatpickrInstance = flatpickr(dateInput.value, {
            locale: 'pt',
            dateFormat: 'd/m/Y',
            allowInput: true,
            onChange: (dates, dateStr) => { store.selectedDataInicio = dateStr },
          })
        }
      }
    }, { deep: true })

    watch(() => store.selectedDataInicio, (val) => {
      if (flatpickrInstance) {
        flatpickrInstance.setDate(val || '', true)
      }
    })

    async function puxarDados() {
      if (!store.selectedDataInicio) {
        alert('Por favor, selecione a "Data Atualização" primeiro.')
        return
      }
      loading.value = true
      try {
        const dados = await buscarDadosSalvos(
          store.selectedSecretaria,
          store.selectedAgrupamento,
          store.selectedDataInicio,
          store.selectedDataInicio
        )
        dados.forEach(reg => {
          const idx = store.servicesToRender.findIndex(s =>
            s.servico.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() ===
            (reg.servico || reg.serviço || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
          )
          if (idx >= 0) {
            serviceData.value[idx] = {
              aberto: parseInt(reg.aberto) || 0,
              andamento: parseInt(reg.em_andamento || reg.andamento) || 0,
              encerrado: parseInt(reg.encerrado) || 0,
              observacao: reg.observacao || '',
              codigoUnico: reg.codigo_unico || '',
            }
          }
        })
        alert(dados.length > 0
          ? `Foram carregados ${dados.length} registros para a data ${store.selectedDataInicio}!`
          : 'Nenhum dado prévio encontrado para esta seleção.')
      } catch (err) {
        console.error(err)
        alert('Erro ao buscar dados na planilha.')
      } finally {
        loading.value = false
      }
    }

    async function gerarHashSHA256(mensagem) {
      const msgBuffer = new TextEncoder().encode(mensagem)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    async function onSubmit() {
      if (!store.selectedResponsavel || !store.selectedDataInicio) {
        alert('Preencha o Responsável e a Data de Atualização.')
        return
      }
      if (store.servicesToRender.length === 0) {
        alert('Filtre e carregue os serviços antes de atualizar.')
        return
      }

      submitting.value = true
      const dataToSend = []

      for (let i = 0; i < store.servicesToRender.length; i++) {
        const svc = store.servicesToRender[i]
        const dados = serviceData.value[i] || {}
        let codigoUnico = dados.codigoUnico || ''
        if (!codigoUnico) {
          const temp = store.selectedDataInicio + store.selectedSecretaria + store.selectedAgrupamento + svc.servico
          codigoUnico = await gerarHashSHA256(temp)
        }
        dataToSend.push({
          codigo_unico: codigoUnico,
          dia_da_atualizacao: store.selectedDataInicio,
          secretaria: store.selectedSecretaria,
          nome_agrupamento: store.selectedAgrupamento,
          serviço: svc.servico,
          aberto: dados.aberto || 0,
          andamento: dados.andamento || 0,
          encerrado: dados.encerrado || 0,
          responsavel: store.selectedResponsavel,
          observacao: dados.observacao || '',
        })
      }

      try {
        const result = await upsertDados(dataToSend)
        console.log('Sucesso:', result)
        alert('Dados salvos com sucesso!')
        window.location.reload()
      } catch (err) {
        console.error('Erro:', err)
        alert('Erro ao salvar dados.')
      } finally {
        submitting.value = false
      }
    }

    return { store, serviceData, submitting, loading, dateInput, openIdx, puxarDados, onSubmit, toggleAccordion, isFilled }
  }
}
</script>