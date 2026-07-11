import { useEffect, useRef } from 'react'

export const useAbortController = () => {
  const controllerRef = useRef(null)

  const createController = () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    controllerRef.current = new AbortController()
    return controllerRef.current
  }

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  return createController
}