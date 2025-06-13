<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import BadgeVerifier from '~/components/BadgeVerifier.vue'

const route = useRoute()
const id = ref('')

onMounted(() => {
  // Get the id from query params if present
  if (route.query.id) {
    id.value = route.query.id.toString()
  }
})

useHead({
  title: 'Verify Badge | Certo',
  meta: [
    { name: 'description', content: 'Verify Open Badges credentials' }
  ]
})
</script>

<template>
  <div class="container mx-auto py-10 px-4">
    <h1 class="text-3xl font-bold text-center mb-8">
      Open Badge Verification
    </h1>
    
    <ClientOnly>
      <BadgeVerifier :initialIdentifier="id" />
      <template #fallback>
        <div class="text-center py-8">
          <div class="i-lucide-loader animate-spin w-8 h-8 mx-auto"></div>
          <p class="mt-4">Loading verification tool...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template> 