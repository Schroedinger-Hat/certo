import antfu from '@antfu/eslint-config'

const ignores = [
  '.nuxt',
  '**/.nuxt/**',
  '.output',
  '**/.output/**',
  'node_modules',
  '**/node_modules/**',
  'public',
  '**/public/**',
]

export default antfu(
  {
    ignores,

    stylistic: {
      indent: 2,
      quotes: 'single',
    },

    typescript: true,
    vue: true,
    jsonc: false,
    yaml: false,

    rules: {
      'no-console': ['error', {
        allow: ['info', 'warn', 'trace', 'error', 'group', 'groupEnd'],
      }],
      'style/comma-dangle': 'off',
      'curly': ['error', 'all'],
      'node/prefer-global/process': ['error', 'always'],
    },
  },
)
