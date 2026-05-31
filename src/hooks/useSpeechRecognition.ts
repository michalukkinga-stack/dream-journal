import { useState, useRef, useCallback } from 'react'

interface ISpeechRecognitionEvent {
  resultIndex: number
  results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } }
}

interface ISpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface UseSpeechRecognitionResult {
  isSupported: boolean
  isListening: boolean
  interim: string
  start: (onResult: (text: string) => void) => void
  stop: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const onResultRef = useRef<((text: string) => void) | null>(null)

  const Ctor = typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
    : undefined

  const isSupported = !!Ctor

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback((onResult: (text: string) => void) => {
    if (!Ctor) return
    stop()

    onResultRef.current = onResult
    const recognition = new Ctor()
    recognition.lang = 'pl-PL'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      setInterim('')
    }

    recognition.onresult = (event) => {
      let interimText = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }
      setInterim(interimText)
      if (finalText) {
        onResultRef.current?.(finalText.trim())
        setInterim('')
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterim('')
    }

    recognition.start()
  }, [Ctor, stop])

  return { isSupported, isListening, interim, start, stop }
}
