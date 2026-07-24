import toast from 'react-hot-toast'

const DEFAULT_DURATIONS = {
  success: 3500,
  error: 5000,
  warning: 4500,
  info: 4000,
}

function createToastId(type, message, dedupeKey) {
  if (dedupeKey) {
    return `goeazy-${type}-${dedupeKey}`
  }

  return `goeazy-${type}-${message}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120)
}

function show(type, message, options = {}) {
  const {
    dedupeKey,
    duration = DEFAULT_DURATIONS[type],
    id = createToastId(type, message, dedupeKey),
    ...restOptions
  } = options

  const toastOptions = {
    id,
    duration,
    ...restOptions,
  }

  switch (type) {
    case 'success':
      return toast.success(message, toastOptions)

    case 'error':
      return toast.error(message, toastOptions)

    case 'warning':
      return toast(message, {
        ...toastOptions,
        icon: '⚠️',
      })

    case 'info':
    default:
      return toast(message, {
        ...toastOptions,
        icon: 'ℹ️',
      })
  }
}

export const notify = {
  success: (message, options) => show('success', message, options),

  error: (message, options) => show('error', message, options),

  warning: (message, options) => show('warning', message, options),

  info: (message, options) => show('info', message, options),

  loading: (message, options = {}) => {
    const id = options.id || options.dedupeKey || 'goeazy-loading'

    return toast.loading(message, {
      ...options,
      id,
    })
  },

  dismiss: (id) => toast.dismiss(id),

  dismissAll: () => toast.dismiss(),
}