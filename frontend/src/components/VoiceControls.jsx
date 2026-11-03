import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2, Square } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

/**
 * Speech input uses the browser Web Speech API. It is progressive enhancement:
 * unsupported browsers get a disabled button and an explicit message, never a
 * fake transcript.
 */
export function useVoiceInput(onResult) {
  const { speechCode, t } = useLanguage()
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    const Recognition = typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null
    if (!Recognition) return undefined
    setSupported(true)
    const recognition = new Recognition()
    recognition.lang = speechCode
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (transcript) onResult(transcript)
    }
    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission denied' : `Voice error: ${event.error}`)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try { recognition.abort() } catch { /* already stopped */ }
    }
  }, [speechCode, onResult])

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError(t('common.voiceUnsupported'))
      return
    }
    setError('')
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch {
      setError(t('common.voiceUnsupported'))
    }
  }, [t])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }
    setListening(false)
  }, [])

  return { listening, supported, error, start, stop }
}

export function VoiceInputButton({ onResult, className = '' }) {
  const { listening, supported, error, start, stop } = useVoiceInput(onResult)
  const { t } = useLanguage()
  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={!supported}
        title={supported ? (listening ? t('common.listening') : t('common.speak')) : t('common.voiceUnsupported')}
        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
        className={`p-2.5 rounded-xl border transition disabled:opacity-40 disabled:cursor-not-allowed ${
          listening
            ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-950/40 dark:border-red-800'
            : 'bg-white dark:bg-[#162a23] border-gray-200 dark:border-[#274a3d] text-gray-600 dark:text-gray-300 hover:text-emerald-700'
        } ${className}`}
      >
        {listening ? <MicOff size={17} /> : <Mic size={17} />}
      </button>
      {error && <span className="text-[10px] text-red-600 mt-1 max-w-[180px]">{error}</span>}
    </div>
  )
}

export function SpeakButton({ text, className = '' }) {
  const { speechCode, t } = useLanguage()
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  const toggle = () => {
    if (!supported) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechCode
    utterance.rate = 0.92
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!supported || !text}
      title={speaking ? t('common.stopSpeaking') : t('common.speak')}
      aria-label={speaking ? 'Stop reading' : 'Read aloud'}
      className={`p-2 rounded-lg border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#162a23] text-gray-500 dark:text-gray-300 hover:text-emerald-700 disabled:opacity-40 ${className}`}
    >
      {speaking ? <Square size={15} /> : <Volume2 size={15} />}
    </button>
  )
}

export function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, languages, t } = useLanguage()
  return (
    <label className={`flex items-center gap-2 ${compact ? '' : 'w-full justify-between'}`}>
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t('common.language')}
        className="bg-gray-50 dark:bg-[#162a23] border border-gray-200 dark:border-[#274a3d] text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
    </label>
  )
}
