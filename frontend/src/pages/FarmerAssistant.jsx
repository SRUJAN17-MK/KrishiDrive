import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MessageSquare, Send, Bot, User, Sparkles, Sprout,
  Zap, ArrowRight, Mic, CheckCircle2, RotateCcw
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function FarmerAssistant() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Namaste ${user?.full_name || 'Farmer'}! I am your KrishiDrive On-Device Agronomy Copilot powered by Snapdragon NPU. Ask me anything about crop cycles, harvest timing, mandi rate trends, fertilizer dosages, or freight transport optimization.`
    }
  ])
  const [input, setInput] = useState(initialQ)
  const [selectedCrop, setSelectedCrop] = useState('Tomatoes')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialQ && messages.length === 1) {
      handleSend(initialQ)
    }
  }, [initialQ])

  const handleSend = async (overrideQ) => {
    const q = (overrideQ || input).trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.ai.cropAssistant({
        question: q,
        crop_name: selectedCrop,
        location: user?.village || 'Nashik'
      })
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: res.answer,
          suggestions: res.suggestions,
          model: res.model_info?.name
        }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: 'Local inference error. Please verify network connection or rephrase your farming question.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    'When should I harvest my crop?',
    'What vehicle should I book for 5,000 kg?',
    'How do I reduce transit spoilage?',
    'Recommend fertilizer schedule for vegetative stage',
    'How to prevent leaf curl disease?'
  ]

  return (
    <div className="fade-in max-w-5xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-[#1e362e]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              AI Agronomy & Logistics Copilot
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
              Snapdragon NPU Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time localized farming insights running with &lt;15ms latency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Context Crop:</span>
          <select
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-[#12211c] border border-gray-200 dark:border-forest-800 text-xs font-bold rounded-xl text-emerald-800 dark:text-emerald-300 outline-none"
          >
            <option value="Tomatoes">Tomatoes</option>
            <option value="Wheat">Wheat</option>
            <option value="Rice">Rice (Paddy)</option>
            <option value="Grapes">Grapes</option>
            <option value="Onions">Onions</option>
            <option value="Potatoes">Potatoes</option>
            <option value="Cotton">Cotton</option>
          </select>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-5 space-y-4 transition-colors"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Bot size={18} />
              </div>
            )}

            <div className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.model && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <Zap size={11} /> {msg.model} (Local NPU)
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <Bot size={18} />
            </div>
            <div className="chat-bubble chat-ai flex items-center gap-2 py-3 px-4">
              <span className="text-xs text-gray-500">NPU computing response...</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Queries */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/50 dark:border-emerald-800/40 transition font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Ask about ${selectedCrop}, weather, harvesting, truck booking...`}
          className="flex-1 px-4 py-3 bg-white dark:bg-[#12211c] border border-gray-200 dark:border-forest-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow transition disabled:opacity-50 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}