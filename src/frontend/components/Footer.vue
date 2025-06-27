<script setup lang="ts">
// No additional logic needed
</script>

<template>
  <footer class="w-full bg-gradient-to-b from-white to-[#FFE5AE]/20 pt-16 pb-8 mt-32">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
        <!-- Logo Column -->
        <div class="md:col-span-2">
          <div class="flex items-center gap-3">
            <img src="/certo-logo-text.png" alt="Certo logo" class="h-14 w-auto">
          </div>
          <span class="text-sm ml-2 text-text-secondary">Open Source Certifier</span>
          <p class="mt-4 text-text-secondary max-w-sm">
            Create, manage and issue digital certificates with ease. Open source and built for everyone.
          </p>
          <div class="flex space-x-4 mt-6">
            <a
              href="https://github.com/schroedinger-hat/certo"
              target="_blank"
              rel="noopener noreferrer"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFD700] text-white hover:opacity-80 transition-opacity"
              title="GitHub"
            >
              <div class="i-lucide-github w-4 h-4" />
            </a>
            <a
              href="https://discord.gg/schroedinger-hat"
              target="_blank"
              rel="noopener noreferrer"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFD700] text-white hover:opacity-80 transition-opacity"
              title="Discord"
            >
              <div class="i-lucide-message-circle w-4 h-4" />
            </a>
            <a
              href="https://twitter.com/schroedinger_hat"
              target="_blank"
              rel="noopener noreferrer"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-[#FFD700] text-white hover:opacity-80 transition-opacity"
              title="Twitter"
            >
              <div class="i-lucide-twitter w-4 h-4" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h3 class="font-bold text-lg">
            Quick Links
          </h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink
                to="/"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Home
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/dashboard"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Dashboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/verify"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Verify Credentials
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/issue"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Issue Credentials
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/linkedin"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                LinkedIn Guide
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Resources -->
        <div class="space-y-4">
          <h3 class="font-bold text-lg">
            Resources
          </h3>
          <ul class="space-y-2">
            <li>
              <a
                href="https://github.com/schroedinger-hat/certo"
                target="_blank"
                rel="noopener noreferrer"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                href="https://github.com/schroedinger-hat/certo/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Contributing
              </a>
            </li>
            <li>
              <a
                href="https://github.com/schroedinger-hat/certo/issues"
                target="_blank"
                rel="noopener noreferrer"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                Report an Issue
              </a>
            </li>
            <li>
              <NuxtLink
                to="/about"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                About
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="space-y-4">
          <h3 class="font-bold text-lg">
            Contact
          </h3>
          <ul class="space-y-2">
            <li>
              <a
                href="mailto:info@schroedinger-hat.org"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                info@schroedinger-hat.org
              </a>
            </li>
            <li>
              <a
                href="https://www.schroedinger-hat.org"
                target="_blank"
                rel="noopener noreferrer"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                www.schroedinger-hat.org
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div class="text-center text-text-secondary pt-8 border-t border-gray-200">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <p>Certo © {{ new Date().getFullYear() }}. Made with ❤️ by Schroedinger Hat. All rights reserved.</p>
          <div class="flex space-x-6">
            <a
              href="/privacy-policy"
              class="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms-and-conditions"
              class="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Terms and Conditions
            </a>
            <a
              href="/linkedin"
              class="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              LinkedIn Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
