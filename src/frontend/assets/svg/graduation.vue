<template>
  <svg class="w-full h-auto" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Background circle -->
    <circle cx="250" cy="250" r="200" fill="url(#grad1)" />

    <!-- Stylized person -->
    <!-- Graduation cap -->
    <path d="M180 180h140v30l-70-20-70 20v-30z" fill="#2D3436" />
    <path d="M250 190l60 20v40l-60 20-60-20v-40l60-20z" fill="#2D3436" />
    <rect x="245" y="230" width="10" height="40" fill="#2D3436" />
    <circle cx="250" cy="270" r="8" fill="#2D3436" />

    <!-- Face and neck -->
    <path d="M200 240C200 220 220 210 250 210C280 210 300 220 300 240V300C300 320 280 340 250 340C220 340 200 320 200 300V240Z" fill="#00E5C5" />
    <path d="M220 280C220 280 235 290 250 290C265 290 280 280 280 280" stroke="#2D3436" stroke-width="3" stroke-linecap="round" />

    <!-- Glasses -->
    <path d="M220 260C220 255 225 250 230 250H240C245 250 250 255 250 260C250 265 245 270 240 270H230C225 270 220 265 220 260Z" fill="#2D3436" />
    <path d="M260 260C260 255 265 250 270 250H280C285 250 290 255 290 260C290 265 285 270 280 270H270C265 270 260 265 260 260Z" fill="#2D3436" />
    <path d="M250 260H260" stroke="#2D3436" stroke-width="2" />

    <!-- Body/Shirt -->
    <path d="M180 300C180 300 200 400 250 400C300 400 320 300 320 300" fill="#00E5C5" />
    <path d="M180 300C180 300 200 400 250 400C300 400 320 300 320 300" stroke="#00E5C5" stroke-width="2" />

    <!-- Arms -->
    <path d="M180 320C160 330 150 350 140 380" stroke="#00E5C5" stroke-width="20" stroke-linecap="round" />
    <path d="M320 320C340 330 350 350 360 380" stroke="#00E5C5" stroke-width="20" stroke-linecap="round" />

    <!-- Certificate/Paper -->
    <rect x="310" y="360" width="60" height="80" transform="rotate(-15 310 360)" fill="white" stroke="#2D3436" stroke-width="2" />
    <path d="M320 380L360 370M320 400L360 390M320 420L360 410" stroke="#2D3436" stroke-width="2" />

    <!-- Gradient definition -->
    <defs>
      <radialGradient id="grad1" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#00E5C5" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#FFE5EC" stop-opacity="0.1" />
      </radialGradient>
    </defs>
  </svg>
</template>
