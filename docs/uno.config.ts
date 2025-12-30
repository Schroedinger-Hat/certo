// UnoCSS theme configuration for Certo docs
//
// SHARED WITH MAIN APP: This theme config is intentionally kept in sync with
// the main application's uno.config at /src/frontend/uno.config.ts to ensure
// design consistency. Any theme changes should be made in both locations.
//
// Theme colors:
// - Primary: #5AB69F (Certo teal)
// - Secondary: #FFE5AE (Certo accent)
// - Text colors and fonts aligned with main app

import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  theme: {
    colors: {
      primary: '#5AB69F',
      secondary: '#FFE5AE',
      background: {
        light: '#FFFFFF',
        pink: '#FFE5EC'
      },
      text: {
        primary: '#2D3436',
        secondary: '#495265'
      }
    },
    fontFamily: {
      sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      display: ['Space Grotesk', 'system-ui', 'sans-serif']
    }
  }
})




