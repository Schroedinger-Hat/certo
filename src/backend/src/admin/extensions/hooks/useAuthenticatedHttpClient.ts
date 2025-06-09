import { useCallback } from 'react'
import axios, { AxiosRequestConfig } from 'axios'

// Since we can't import from @strapi/helper-plugin directly in this environment,
// we'll mock the needed functionality
interface Auth {
  getToken(): string
}

interface NotificationProps {
  type: string
  message: {
    id: string
    defaultMessage: string
  }
}

// Mock implementations for Strapi helpers
const auth: Auth = {
  getToken: () => {
    // In a real implementation, this would come from @strapi/helper-plugin
    return localStorage.getItem('jwtToken') || ''
  }
}

const useNotification = () => {
  return (props: NotificationProps) => {
    console.error(`[Notification] ${props.type}: ${props.message.defaultMessage}`)
  }
}

const useAuthenticatedHttpClient = () => {
  const toggleNotification = useNotification()

  const get = useCallback(
    async (url: string, config: AxiosRequestConfig = {}) => {
      try {
        const { data } = await axios.get(url, {
          ...config,
          headers: {
            Authorization: `Bearer ${auth.getToken()}`,
            ...(config.headers || {})
          }
        })

        return data
      } catch (err) {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occurred' }
        })

        throw err
      }
    },
    [toggleNotification]
  )

  const post = useCallback(
    async (url: string, data: any, config: AxiosRequestConfig = {}) => {
      try {
        const response = await axios.post(url, data, {
          ...config,
          headers: {
            Authorization: `Bearer ${auth.getToken()}`,
            ...(config.headers || {})
          }
        })

        return response.data
      } catch (err) {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occurred' }
        })

        throw err
      }
    },
    [toggleNotification]
  )

  const put = useCallback(
    async (url: string, data: any, config: AxiosRequestConfig = {}) => {
      try {
        const response = await axios.put(url, data, {
          ...config,
          headers: {
            Authorization: `Bearer ${auth.getToken()}`,
            ...(config.headers || {})
          }
        })

        return response.data
      } catch (err) {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occurred' }
        })

        throw err
      }
    },
    [toggleNotification]
  )

  const del = useCallback(
    async (url: string, config: AxiosRequestConfig = {}) => {
      try {
        const response = await axios.delete(url, {
          ...config,
          headers: {
            Authorization: `Bearer ${auth.getToken()}`,
            ...(config.headers || {})
          }
        })

        return response.data
      } catch (err) {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occurred' }
        })

        throw err
      }
    },
    [toggleNotification]
  )

  return {
    get,
    post,
    put,
    del
  }
}

export default useAuthenticatedHttpClient 