<script setup>
defineProps({
  badge: {
    type: Object,
    required: true
  },
  className: {
    type: String,
    default: ''
  }
})

function getImageUrl(badge) {
  if (!badge.attributes?.image?.data) return null
  
  const runtimeConfig = useRuntimeConfig()
  const apiUrl = runtimeConfig.public.apiUrl || 'http://localhost:1337'
  return `${apiUrl}${badge.attributes.image.data.attributes.url}`
}

function truncateText(text, maxLength = 100) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<template>
  <div 
    :class="['relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md transition-all hover:shadow-lg', className]"
  >
    <div class="aspect-square w-full relative">
      <img
        v-if="badge.attributes.image?.data"
        :src="getImageUrl(badge)"
        :alt="badge.attributes.name"
        class="w-full h-full object-contain p-4"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <div class="i-lucide-award w-16 h-16 text-gray-400 dark:text-gray-500"></div>
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold">{{ badge.attributes.name }}</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ truncateText(badge.attributes.description, 100) }}
      </p>
      <div v-if="badge.attributes.issuer?.data" class="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Issued by: {{ badge.attributes.issuer.data.attributes.name }}</span>
      </div>
    </div>
  </div>
</template> 