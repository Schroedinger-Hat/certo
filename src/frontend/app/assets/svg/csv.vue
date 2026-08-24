<template>
  <svg class="w-full h-auto" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Main spreadsheet/CSV file -->
    <rect x="100" y="100" width="300" height="300" rx="16" fill="white" stroke="#2D3436" stroke-width="2" />

    <!-- Header row -->
    <rect x="100" y="100" width="300" height="50" rx="16" fill="#8B5CF6" stroke="#2D3436" stroke-width="2" />

    <!-- Column lines -->
    <line x1="175" y1="100" x2="175" y2="400" stroke="#E2E8F0" stroke-width="2" />
    <line x1="250" y1="100" x2="250" y2="400" stroke="#E2E8F0" stroke-width="2" />
    <line x1="325" y1="100" x2="325" y2="400" stroke="#E2E8F0" stroke-width="2" />

    <!-- Row lines -->
    <line x1="100" y1="175" x2="400" y2="175" stroke="#E2E8F0" stroke-width="2" />
    <line x1="100" y1="250" x2="400" y2="250" stroke="#E2E8F0" stroke-width="2" />
    <line x1="100" y1="325" x2="400" y2="325" stroke="#E2E8F0" stroke-width="2" />

    <!-- Data rows (simplified representation) -->
    <rect x="110" y="160" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="185" y="160" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="260" y="160" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="335" y="160" width="55" height="8" rx="4" fill="#E2E8F0" />

    <rect x="110" y="235" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="185" y="235" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="260" y="235" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="335" y="235" width="55" height="8" rx="4" fill="#E2E8F0" />

    <rect x="110" y="310" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="185" y="310" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="260" y="310" width="55" height="8" rx="4" fill="#E2E8F0" />
    <rect x="335" y="310" width="55" height="8" rx="4" fill="#E2E8F0" />

    <!-- Decorative elements -->
    <circle cx="420" cy="80" r="30" fill="#8B5CF6" opacity="0.2" />
    <circle cx="80" cy="420" r="40" fill="#8B5CF6" opacity="0.2" />

    <!-- CSV icon -->
    <rect x="80" y="60" width="60" height="80" rx="8" fill="#8B5CF6" opacity="0.9" />
  </svg>
</template>
