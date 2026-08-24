import { updateApiUrl } from '~/api/api-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Set the API URL from the runtime config
  if (config.public.apiUrl && typeof config.public.apiUrl === 'string') {
    updateApiUrl(config.public.apiUrl)
  }
})
