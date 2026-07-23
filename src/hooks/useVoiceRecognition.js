import { useState, useEffect, useRef, useCallback } from 'react'

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let currentTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript
      }
      setTranscript(currentTranscript)
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      setError(event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [isSupported])

  const startListening = useCallback((onResult) => {
    if (!isSupported || !recognitionRef.current) {
      setError('Browser speech recognition not supported')
      return
    }

    setError(null)
    setTranscript('')
    setIsListening(true)

    try {
      if (onResult) {
        recognitionRef.current.onresult = (event) => {
          let currentTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          setTranscript(currentTranscript)
          if (event.results[0].isFinal && currentTranscript.trim()) {
            onResult(currentTranscript.trim())
          }
        }
      }
      recognitionRef.current.start()
    } catch (err) {
      console.warn('Failed to start speech recognition:', err)
      setIsListening(false)
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      setIsListening(false)
    }
  }, [isListening])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening
  }
}
