<script setup lang="ts">
</script>

<template>
  <section class="relative max-w-6xl mx-auto py-16 px-4 overflow-hidden">
    <!-- Soft pastel diagonal background -->
    <div class="absolute inset-0 -z-10 bg-gradient-to-br from-[#FFE5AE] via-white to-white" style="opacity:0.7" />
    <!-- Clouds (SVG) -->
    <svg class="absolute left-0 top-0 w-48 h-32 -z-0" viewBox="0 0 200 100" fill="none">
      <ellipse cx="90" cy="50" rx="50" ry="25" fill="#F8F6FF" />
      <ellipse cx="130" cy="60" rx="20" ry="10" fill="#F8F6FF" />
      <ellipse cx="60" cy="40" rx="15" ry="8" fill="#F8F6FF" />
      <ellipse cx="100" cy="55" rx="40" ry="18" fill="#F3D6E3" fill-opacity="0.3" />
    </svg>
    <svg class="absolute right-0 top-0 w-48 h-32 -z-0" viewBox="0 0 200 100" fill="none">
      <ellipse cx="110" cy="50" rx="50" ry="25" fill="#F8F6FF" />
      <ellipse cx="70" cy="60" rx="20" ry="10" fill="#F8F6FF" />
      <ellipse cx="140" cy="40" rx="15" ry="8" fill="#F8F6FF" />
      <ellipse cx="100" cy="55" rx="40" ry="18" fill="#F3D6E3" fill-opacity="0.3" />
    </svg>
    <!-- Heading -->
    <h1 class="text-5xl font-bold text-center mb-4 tracking-tight">
      How it works
    </h1>
    <p class="text-center text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
      Just few simple steps to start create certificates for your business
    </p>
    <!-- Stepper -->
    <div class="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-12 md:gap-0 mb-20">
      <!-- Horizontal line -->
      <div class="hidden md:block absolute left-0 right-0 top-8 h-0.5 bg-gray-200 z-0" style="top:44px" />
      <!-- Step 1 -->
      <div class="flex-1 flex flex-col items-center z-10">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-400 bg-white text-2xl font-bold mb-2">
            1
          </div>
        </div>
        <div class="mt-6 text-center">
          <div class="text-3xl font-bold leading-tight mb-2">
            Strapi Admin User<br>creates certificates
          </div>
        </div>
      </div>
      <!-- Step 2 -->
      <div class="flex-1 flex flex-col items-center z-10">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-400 bg-white text-2xl font-bold mb-2">
            2
          </div>
        </div>
        <div class="mt-6 text-center">
          <div class="text-3xl font-bold leading-tight mb-2">
            Company Issuer<br>sends certificates
          </div>
        </div>
      </div>
      <!-- Step 3 -->
      <div class="flex-1 flex flex-col items-center z-10">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-400 bg-white text-2xl font-bold mb-2">
            3
          </div>
        </div>
        <div class="mt-6 text-center">
          <div class="text-3xl font-bold leading-tight mb-2">
            Recipients receive<br>& share certificates
          </div>
        </div>
      </div>
    </div>
    <!-- Step-by-step guide -->
    <div class="mb-16">
      <h2 class="text-2xl font-semibold mb-6 text-center">
        Get Started in 3 Steps
      </h2>
      <ol class="list-decimal list-inside space-y-6 text-lg text-gray-700 max-w-2xl mx-auto">
        <li>
          <span class="font-bold">Clone the Certo repository:</span><br>
          <code class="bg-gray-100 px-2 py-1 rounded text-base">git clone https://github.com/schroedinger-hat/certo.git</code>
        </li>
        <li>
          <span class="font-bold">Bootstrap the frontend and backend:</span><br>
          <span class="block">Navigate to the project directory and install dependencies for both apps:</span>
          <code class="block bg-gray-100 px-2 py-1 rounded text-base my-1">cd certo/src/frontend && npm install</code>
          <code class="block bg-gray-100 px-2 py-1 rounded text-base my-1">cd ../backend && npm install</code>
          <span class="block mt-1">Start both servers:</span>
          <code class="block bg-gray-100 px-2 py-1 rounded text-base my-1">npm run dev</code>
        </li>
        <li>
          <span class="font-bold">Set up Strapi achievements and roles:</span><br>
          <span class="block">In the Strapi admin panel, create an admin account then create a new <b>Achievement</b> and assign roles for issuers. Create an Issuer account, then sign in on the frontend and start sending certificates.</span>
        </li>
      </ol>
    </div>
    <!-- Contact Button -->
    <div class="flex justify-center mb-8">
      <a href="mailto:hello@schroedinger-hat.org" class="inline-flex items-center px-6 py-3 rounded-xl bg-[#FFE5AE] text-gray-900 font-semibold text-lg shadow hover:bg-[#FFD580] transition-colors">
        Contact Us
        <span class="i-heroicons-arrow-right ml-2 w-5 h-5" />
      </a>
    </div>
  </section>
</template>

<style scoped>
</style>
