import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Bot, User, Sparkles, Sprout, RotateCcw, Info } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { VoiceInputButton, SpeakButton } from '../components/VoiceControls'

const quickPrompts = [
  'When should I harvest my crop?',
  'What vehicle should I book for 5,000 kg?',
  'How do I reduce transport costs?',
  'What are common tomato leaf diseases?',
  'Recommend a fertilizer schedule'
]

export default function FarmerAssistant() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)
  const initialSent = useRef(false)

  useEffect(() => {
    setMessages([{
      role: 'ai',
      text: `Namaste ${user?.full_name || 'farmer'}. I am the KrishiDrive Agronomy Assistant. I match keywords in your question to written agronomic guidance — I am not a language model. Ask about harvest timing, transport, costs, disease reference information or fertilizer schedules.`,
      engine: 'Rule-based keyword engine'
    }])
  }, [user?.full_name])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (override) => {
    const question = (override || input).trim()
    if (!question || loading) return
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.ai.cropAssistant({
        question,
        crop_name: selectedCrop,
        location: user?.village || 'Nashik',
        language
      })
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: res.answer,
        suggestions: res.suggestions,
        engine: res.engine_info?.type || res.engine_info?.name
      }])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'ai',
        text: `I could not reach the assistant service. ${err.message}`,
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQ && !initialSent.current) {
      initialSent.current = true
      send(initialQ)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ])

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-[#1e362e]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Sprout size={22} className="text-emerald-600" /> {t('nav.farmAssistant')}
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
            <Info size={12} /> Keyword-based guidance, not an LLM. Verify field decisions with a local agronomist.
          </p>
        </div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Context crop
          <select
            value={selectedCrop}
            onChange={(event) => setSelectedCrop(event.target.value)}
            className="ml-2 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300"
          >
            {['Tomato', 'Wheat', 'Rice', 'Grapes', 'Onion', 'Potato', 'Cotton'].map((crop) => <option key={crop}>{crop}</option>)}
          </select>
        </label>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 grid place-items-center shrink-0 mt-0.5"><Bot size={16} /></div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'bg-emerald-700 text-white' : message.error ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900' : 'bg-gray-50 dark:bg-[#162a23] text-gray-800 dark:text-gray-100'}`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
              {message.role === 'ai' && !message.error && (
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-gray-200/60 dark:border-[#274a3d]">
                  <span className="text-[10px] text-gray-400">{message.engine}</span>
                  <SpeakButton text={message.text} />
                </div>
              )}
              {message.suggestions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {message.suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => send(suggestion)} className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#12211c] px-2 py-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">{suggestion}</button>
                  ))}
                </div>
              )}
            </div>
            {message.role === 'user' && <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 grid place-items-center shrink-0 mt-0.5"><User size={16} /></div>}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 grid place-items-center"><Bot size={16} /></div>
            <div className="rounded-2xl bg-gray-50 dark:bg-[#162a23] px-3.5 py-2.5 text-xs text-gray-500 flex items-center gap-2">
              Matching guidance… <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]" /><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" /></span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((prompt) => (
          <button key={prompt} onClick={() => send(prompt)} disabled={loading} className="whitespace-nowrap rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 disabled:opacity-50">{prompt}</button>
        ))}
        <button onClick={() => setMessages((prev) => prev.slice(0, 1))} className="whitespace-nowrap rounded-full border border-gray-200 dark:border-[#274a3d] px-3 py-1.5 text-[11px] font-semibold text-gray-500 inline-flex items-center gap-1"><RotateCcw size={12} /> Clear</button>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && send()}
          placeholder={`Ask about ${selectedCrop}, harvest timing, transport, costs…`}
          aria-label="Ask the farming assistant"
          className="flex-1 rounded-2xl border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <VoiceInputButton onResult={(text) => setInput(text)} />
        <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send question" className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-4 text-white"><Send size={18} /></button>
      </div>
    </div>
  )
}
