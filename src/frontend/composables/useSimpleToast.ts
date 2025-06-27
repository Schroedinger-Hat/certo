import { ref } from 'vue'

interface ToastState {
  message: string
  description?: string
  type: 'success' | 'error' | 'info'
  visible: boolean
}

const toastState = ref<ToastState>({
  message: '',
  description: '',
  type: 'info',
  visible: false
})

function show(message: string, description = '', type: 'success' | 'error' | 'info' = 'info') {
  toastState.value = {
    message,
    description,
    type,
    visible: true
  }
  setTimeout(() => {
    toastState.value.visible = false
  }, 3000)
}

export function useSimpleToast() {
  return {
    show,
    toastState
  }
}
