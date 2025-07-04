import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      collections: {
        'simple-icons': () => import('@iconify-json/simple-icons/icons.json').then(i => i.default),
        'heroicons': () => import('@iconify-json/heroicons/icons.json').then(i => i.default),
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  safelist: [
    // Simple Icons for sponsors
    'i-simple-icons-slack',
    'i-simple-icons-netflix',
    'i-simple-icons-fitbit',
    'i-simple-icons-google',
    'i-simple-icons-airbnb',
    'i-simple-icons-uber',
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
