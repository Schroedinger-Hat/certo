<script setup lang="ts">
import { apiClient } from '~/api/api-client'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Scheduled Issuances | Certo' })

interface ScheduledIssuance {
  id: number
  status: 'pending' | 'issued' | 'cancelled' | 'failed'
  achievementId: number
  recipientEmail: string
  recipientName?: string
  scheduledDate: string
  expirationDate?: string
  note?: string
  issuedCredentialId?: string
  failureReason?: string
  scheduledByEmail: string
  createdAt: string
}

const items = ref<ScheduledIssuance[]>([])
const loading = ref(true)
const activeFilter = ref<ScheduledIssuance['status'] | 'all'>('all')
const cancelling = ref<number | null>(null)
const cancelReason = ref('')

async function load() {
  loading.value = true
  try {
    const filter = activeFilter.value === 'all' ? undefined : activeFilter.value as any
    const result = await apiClient.getScheduledIssuances(filter)
    items.value = result.data ?? result ?? []
  }
  finally {
    loading.value = false
  }
}

async function cancel(id: number) {
  try {
    await apiClient.cancelScheduledIssuance(id, cancelReason.value || undefined)
    cancelling.value = null
    cancelReason.value = ''
    await load()
  }
  catch (e: any) {
    alert(e?.data?.error?.message || e.message || 'Cancel failed')
  }
}

const filtered = computed(() =>
  activeFilter.value === 'all' ? items.value : items.value.filter(i => i.status === activeFilter.value),
)

const pendingCount = computed(() => items.value.filter(i => i.status === 'pending').length)

onMounted(load)
watch(activeFilter, load)

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-blue-600 bg-blue-50',
  issued: 'text-green-600 bg-green-50',
  cancelled: 'text-gray-500 bg-gray-100',
  failed: 'text-red-600 bg-red-50',
}
</script>

<template>
  <div class="container mx-auto py-10 px-4 max-w-4xl">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Scheduled Issuances</h1>
        <p class="text-gray-500 mt-1">Credentials queued for automatic issuance at a future date</p>
      </div>
      <div v-if="pendingCount > 0" class="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
        <div class="i-lucide-clock w-4 h-4 text-blue-500" />
        <span class="text-sm font-medium text-blue-700">{{ pendingCount }} pending</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="f in (['all', 'pending', 'issued', 'cancelled', 'failed'] as const)"
        :key="f"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="activeFilter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="activeFilter = f"
      >
        {{ f.charAt(0).toUpperCase() + f.slice(1) }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">
      <div class="i-lucide-loader-2 w-8 h-8 animate-spin mx-auto mb-3" />
      <p>Loading...</p>
    </div>

    <div v-else-if="filtered.length === 0" class="text-center py-16 text-gray-400">
      <div class="i-lucide-calendar-x w-12 h-12 mx-auto mb-3 opacity-40" />
      <p>No {{ activeFilter === 'all' ? '' : activeFilter + ' ' }}scheduled issuances</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="rounded-2xl bg-white border border-gray-200 shadow-sm p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-gray-900">Achievement #{{ item.achievementId }}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="STATUS_COLOR[item.status]">
                {{ item.status }}
              </span>
            </div>
            <p class="text-sm text-gray-500">
              Recipient: <span class="font-medium text-gray-700">{{ item.recipientEmail }}</span>
              <span v-if="item.recipientName"> ({{ item.recipientName }})</span>
            </p>
            <p class="text-sm text-gray-500 mt-0.5">
              Scheduled for: <span class="font-medium text-gray-700">{{ new Date(item.scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
            </p>
            <p v-if="item.note" class="text-sm text-gray-500 mt-1 italic">"{{ item.note }}"</p>
            <p v-if="item.failureReason" class="text-sm text-red-600 mt-1">Error: {{ item.failureReason }}</p>
            <NuxtLink
              v-if="item.issuedCredentialId"
              :to="`/credentials/${encodeURIComponent(item.issuedCredentialId)}`"
              class="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mt-1"
            >
              <div class="i-lucide-external-link w-3.5 h-3.5" />
              View issued credential
            </NuxtLink>
          </div>

          <!-- Cancel button (pending only) -->
          <div v-if="item.status === 'pending'" class="shrink-0">
            <div v-if="cancelling !== item.id">
              <button
                class="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                @click="cancelling = item.id; cancelReason = ''"
              >
                Cancel
              </button>
            </div>
            <div v-else class="flex flex-col gap-2 min-w-48">
              <input
                v-model="cancelReason"
                type="text"
                placeholder="Cancel reason (optional)"
                class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
              <div class="flex gap-2">
                <button
                  class="px-3 py-1 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  @click="cancel(item.id)"
                >
                  Confirm cancel
                </button>
                <button class="text-sm text-gray-400 hover:text-gray-600" @click="cancelling = null">
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
