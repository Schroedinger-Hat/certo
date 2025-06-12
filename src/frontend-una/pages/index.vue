<script setup>
useHead({
  title: 'Certo - Digital Credential Platform',
  meta: [
    { name: 'description', content: 'Issue, manage, and verify digital credentials using the Open Badges standard' }
  ]
})
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
        Digital Credentials for the Modern World
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Issue, verify, and manage digital credentials using the Open Badges standard.
        Secure, transparent, and verifiable.
      </p>
      
      <div class="flex flex-wrap justify-center gap-4">
        <NuxtLink to="/issue" class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md">
          Issue Badge
        </NuxtLink>
        <NuxtLink to="/verify" class="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md">
          Verify a Credential
        </NuxtLink>
      </div>
    </div>
    
    <div class="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="i-lucide-shield-check w-12 h-12 text-primary-600 mb-4"></div>
        <h2 class="text-xl font-bold mb-2">Secure Verification</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Verify the authenticity of any credential using our powerful verification engine.
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="i-lucide-award w-12 h-12 text-primary-600 mb-4"></div>
        <h2 class="text-xl font-bold mb-2">Badge Issuance</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Create and issue digital badges to recognize achievements, skills, and credentials.
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div class="i-lucide-users w-12 h-12 text-primary-600 mb-4"></div>
        <h2 class="text-xl font-bold mb-2">Credential Management</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Manage your digital credentials in one place, with easy export and sharing options.
        </p>
      </div>
    </div>
  </div>
</template> 