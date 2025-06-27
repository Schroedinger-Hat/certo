import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { apiClient, updateApiUrl } from '~/api/api-client'

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl

  updateApiUrl(apiUrl)
  // Do not set apiClient.baseUrl directly since it's private

  nuxtApp.provide('apiClient', apiClient)
})
