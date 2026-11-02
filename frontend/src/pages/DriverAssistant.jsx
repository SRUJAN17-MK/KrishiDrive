import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, Bot, User, Zap, Fuel,
  Wrench, Navigation, TrendingUp, ShieldCheck
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function DriverAssistant() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hello ${user?.full_name || 'Driver'}! I am your KrishiDrive On-Device Transit Copilot. Ask me about highway congestion, Kasara Ghat / NH-48 conditions, diesel-saving techniques, vehicle health checks, or finding return loads to avoid empty miles.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async (overrideQ) => {
    const q = (overrideQ || input).trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.ai.driverAssistant({
        question: q,
        current_location: 'Nashik',
        destination: 'Mumbai',
        vehicle_type: 'Truck (10-Ton)'
      })
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: res.answer,
          tips: res.tips,
          model: res.model_info?.name
        }
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: 'Local inference error. Please verify network connection or try asking again.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    'How do I save 12-15% diesel on highway?',
    'Any traffic delays on NH-48 route?',
    'What checks are needed before a 300 km haul?',
    'How to find return loads from wholesale mandis?'
  ]

  return (
    <div className="fade-in max-w-5xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-[#1e362e]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              AI Transit & Freight Assistant
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300/40">
              Snapdragon NPU Powered
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time highway advice, fuel conservation, and return-load guidance
          </p>
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
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Bot size={18} />
              </div>
            )}

            <div className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.model && (
                <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                  <Zap size={11} /> {msg.model} (Local NPU)
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
              <Bot size={18} />
            </div>
            <div className="chat-bubble chat-ai flex items-center gap-2 py-3 px-4">
              <span className="text-xs text-gray-500">NPU computing response...</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 border border-blue-200/50 dark:border-blue-800/40 transition font-medium"
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
          placeholder="Ask about highways, diesel savings, brake inspections..."
          className="flex-1 px-4 py-3 bg-white dark:bg-[#12211c] border border-gray-200 dark:border-forest-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow transition disabled:opacity-50 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}