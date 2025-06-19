<script setup lang="ts">
interface Badge {
  id: number
  title: string
  description: string
  issueDate: string
  recipient: string
  issuer: string
  status: 'active' | 'pending' | 'revoked'
}

defineProps<{
  badge: Badge
}>()

defineEmits<{
  (e: 'view', badge: Badge): void
  (e: 'download', badge: Badge): void
}>()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- Badge Icon -->
        <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-lg flex items-center justify-center mb-4">
          <div class="w-6 h-6 i-heroicons-academic-cap text-[#00E5C5]"></div>
        </div>

        <!-- Badge Info -->
        <h3 class="text-lg font-medium text-text-primary mb-1">{{ badge.title }}</h3>
        <p class="text-text-secondary text-sm mb-4">{{ badge.description }}</p>

        <!-- Metadata -->
        <div class="space-y-2">
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-calendar mr-2"></div>
            {{ formatDate(badge.issueDate) }}
          </div>
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-user mr-2"></div>
            {{ badge.recipient }}
          </div>
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-academic-cap mr-2"></div>
            {{ badge.issuer }}
          </div>
        </div>
      </div>

      <!-- Status Badge -->
      <span 
        class="px-2 py-1 text-xs font-semibold rounded-full"
        :class="{
          'bg-green-100 text-green-800': badge.status === 'active',
          'bg-yellow-100 text-yellow-800': badge.status === 'pending',
          'bg-red-100 text-red-800': badge.status === 'revoked'
        }"
      >
        {{ badge.status }}
      </span>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex items-center justify-end space-x-4">
      <button 
        @click="$emit('view', badge)"
        class="text-[#00E5C5] hover:text-[#00E5C5]/80 text-sm font-medium"
      >
        View Details
      </button>
      <button 
        @click="$emit('download', badge)"
        class="text-[#00E5C5] hover:text-[#00E5C5]/80 text-sm font-medium"
      >
        Download
      </button>
    </div>
  </div>
</template> 