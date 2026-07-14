import { useEffect } from 'react'

const isEditableTarget = (target) => {
  if (!target) return false
  const tagName = target.tagName?.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

export const ContentProtection = () => {
  useEffect(() => {
    const originalUserSelect = document.body.style.userSelect
    const originalWebkitUserSelect = document.body.style.webkitUserSelect

    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    const preventDefault = (event) => {
      if (isEditableTarget(event.target)) return
      event.preventDefault()
    }

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      const ctrlOrMeta = event.ctrlKey || event.metaKey
      const blockedCombo =
        event.key === 'F12' ||
        (ctrlOrMeta && key === 'u') ||
        (ctrlOrMeta && key === 's') ||
        (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c'].includes(key))

      if (blockedCombo) {
        event.preventDefault()
      }
    }

    document.addEventListener('contextmenu', preventDefault)
    document.addEventListener('copy', preventDefault)
    document.addEventListener('cut', preventDefault)
    document.addEventListener('selectstart', preventDefault)
    document.addEventListener('dragstart', preventDefault)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.userSelect = originalUserSelect
      document.body.style.webkitUserSelect = originalWebkitUserSelect
      document.removeEventListener('contextmenu', preventDefault)
      document.removeEventListener('copy', preventDefault)
      document.removeEventListener('cut', preventDefault)
      document.removeEventListener('selectstart', preventDefault)
      document.removeEventListener('dragstart', preventDefault)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null
}
