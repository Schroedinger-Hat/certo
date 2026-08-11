<script setup lang="ts">
import { apiClient } from '~/api/api-client'

definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'Credential Requests | Certo' })

type RequestStatus = 'pending' | 'approved' | 'rejected'

interface CredentialRequest {
  id: number
  status: RequestStatus
  achievementId: number
  recipientEmail: string
  recipientName?: string
  expirationDate?: string
  requesterNote?: string
  reviewerNote?: string
  submittedByEmail: string
  reviewedByEmail?: string
  reviewedAt?: string
  issuedCredentialId?: string
  createdAt: string
}

const requests = ref<CredentialRequest[]>([])
const loading = ref(true)
const activeFilter = ref<RequestStatus | 'all'>('all')
const reviewingId = ref<number | null>(null)
const reviewerNote = ref('')
const actionState = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
const actionError = ref('')

async function loadRequests() {
  loading.value = true
  try {
    const filter = activeFilter.value === 'all' ? undefined : activeFilter.value
    const result = await apiClient.getCredentialRequests(filter)
    requests.value = result.data ?? result ?? []
  }
  catch (e: any) {
    console.error('Failed to load requests:', e)
  }
  finally {
    loading.value = false
  }
}

async function approve(id: number) {
  actionState.value = 'loading'
  actionError.value = ''
  try {
    await apiClient.approveCredentialRequest(id, reviewerNote.value || undefined)
    actionState.value = 'done'
    reviewingId.value = null
    reviewerNote.value = ''
    await loadRequests()
  }
  catch (e: any) {
    actionState.value = 'error'
    actionError.value = e?.data?.error?.message || e.message || 'Approval failed'
  }
}

async function reject(id: number) {
  if (!reviewerNote.value.trim()) return
  actionState.value = 'loading'
  actionError.value = ''
  try {
    await apiClient.rejectCredentialRequest(id, reviewerNote.value)
    actionState.value = 'done'
    reviewingId.value = null
    reviewerNote.value = ''
    await loadRequests()
  }
  catch (e: any) {
    actionState.value = 'error'
    actionError.value = e?.data?.error?.message || e.message || 'Rejection failed'
  }
}

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return requests.value
  return requests.value.filter(r => r.status === activeFilter.value)
})

const pendingCount = computed(() => requests.value.filter(r => r.status === 'pending').length)

onMounted(loadRequests)
watch(activeFilter, loadRequests)

const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: 'text-amber-600 bg-amber-50',
  approved: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
}
</script>

<template>
  <div class="container mx-auto py-10 px-4 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">
          Credential Requests
        </h1>
        <p class="text-gray-500 mt-1">
          Review and approve credential issuance requests
        </p>
      </div>
      <div v-if="pendingCount > 0" class="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full">
        <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span class="text-sm font-medium text-amber-700">{{ pendingCount }} pending</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="f in (['all', 'pending', 'approved', 'rejected'] as const)"
        :key="f"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
        :class="activeFilter === f
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="activeFilter = f"
      >
        {{ f.charAt(0).toUpperCase() + f.slice(1) }}
        <span v-if="f === 'pending' && pendingCount > 0" class="ml-1 text-xs bg-amber-300 text-amber-900 rounded-full px-1.5">{{ pendingCount }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-gray-400">
      <div class="i-lucide-loader-2 w-8 h-8 animate-spin mx-auto mb-3" />
      <p>Loading requests...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredRequests.length === 0" class="text-center py-16 text-gray-400">
      <div class="i-lucide-inbox w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="font-medium">No {{ activeFilter === 'all' ? '' : activeFilter + ' ' }}requests</p>
    </div>

    <!-- Request list -->
    <div v-else class="space-y-4">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden"
      >
        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-gray-900">Achievement #{{ req.achievementId }}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="STATUS_COLOR[req.status]">
                  {{ req.status }}
                </span>
              </div>
              <p class="text-sm text-gray-500">
                Recipient: <span class="font-medium text-gray-700">{{ req.recipientEmail }}</span>
                <span v-if="req.recipientName"> ({{ req.recipientName }})</span>
              </p>
              <p class="text-sm text-gray-500 mt-0.5">
                Submitted by <span class="font-medium">{{ req.submittedByEmail }}</span>
                · {{ new Date(req.createdAt).toLocaleDateString() }}
              </p>
              <p v-if="req.requesterNote" class="text-sm text-gray-600 mt-2 italic">
                "{{ req.requesterNote }}"
              </p>
              <p v-if="req.reviewerNote" class="text-sm text-gray-500 mt-1">
                Reviewer note: <span class="text-gray-700">{{ req.reviewerNote }}</span>
              </p>
              <NuxtLink
                v-if="req.issuedCredentialId"
                :to="`/credentials/${encodeURIComponent(req.issuedCredentialId)}`"
                class="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mt-1"
              >
                <div class="i-lucide-external-link w-3.5 h-3.5" />
                View issued credential
              </NuxtLink>
            </div>

            <!-- Approve/Reject buttons (pending only) -->
            <div v-if="req.status === 'pending'" class="shrink-0">
              <div v-if="reviewingId !== req.id" class="flex gap-2">
                <button
                  class="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                  @click="reviewingId = req.id; reviewerNote = ''; actionState = 'idle'"
                >
                  Review
                </button>
              </div>
            </div>
          </div>

          <!-- Review form (inline) -->
          <div v-if="reviewingId === req.id" class="mt-4 pt-4 border-t border-gray-100">
            <textarea
              v-model="reviewerNote"
              placeholder="Add a note (required to reject, optional to approve)"
              rows="2"
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <div v-if="actionError" class="text-sm text-red-600 mt-1">{{ actionError }}</div>
            <div class="flex gap-2 mt-2">
              <button
                class="px-4 py-1.5 text-sm font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                :disabled="actionState === 'loading'"
                @click="approve(req.id)"
              >
                <span v-if="actionState === 'loading'" class="i-lucide-loader-2 w-3.5 h-3.5 animate-spin mr-1" />
                Approve &amp; Issue
              </button>
              <button
                class="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                :disabled="actionState === 'loading' || !reviewerNote.trim()"
                @click="reject(req.id)"
              >
                Reject
              </button>
              <button
                class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                @click="reviewingId = null; actionState = 'idle'"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
