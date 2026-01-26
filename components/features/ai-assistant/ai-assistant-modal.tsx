'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Copy, Check, Send, Youtube, FileText, Linkedin, Newspaper, TrendingUp, History } from 'lucide-react'

interface AiAssistantModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PromptSuggestion {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  prompt: string
}

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'youtube',
    icon: <Youtube className="w-4 h-4 text-white" />,
    iconBg: 'bg-red-500',
    title: 'Summarise YouTube and generate 5 ideas',
    prompt: 'Can you summarise this video https://www.youtube.com/watch?v=EXAMPLE and generate 5 different post ideas?',
  },
  {
    id: 'blog',
    icon: <FileText className="w-4 h-4 text-white" />,
    iconBg: 'bg-green-500',
    title: 'Summarise a blog post and generate one post',
    prompt: 'Can you pick top points from this blog https://example.com/blog-post and generate one post for me?',
  },
  {
    id: 'linkedin',
    icon: <Linkedin className="w-4 h-4 text-white" />,
    iconBg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    title: 'Analyze a LinkedIn Profile to Generate Content Ideas',
    prompt: 'Analyze my LinkedIn profile https://www.linkedin.com/in/yourprofile/ and generate 7 post ideas for next week.',
  },
  {
    id: 'news',
    icon: <Newspaper className="w-4 h-4 text-white" />,
    iconBg: 'bg-blue-500',
    title: 'Search latest news to find post ideas',
    prompt: 'Can you generate 5 ideas based on what is happening currently in tech industry?',
  },
  {
    id: 'viral',
    icon: <TrendingUp className="w-4 h-4 text-white" />,
    iconBg: 'bg-purple-500',
    title: 'Find viral posts related to a particular topic',
    prompt: 'Can you share some viral posts related to AI and productivity?',
  },
]

export function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const [prompt, setPrompt] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSend = async (text?: string) => {
    const messageText = text || prompt
    if (!messageText.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: messageText }])
    setPrompt('')
    setLoading(true)

    try {
      const response = await fetch('/api/suflate/ai-assist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: messageText }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setPrompt('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-gray-900">AI Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Initial State - Prompt Suggestions */
            <div className="p-6">
              {/* Hero */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl rotate-6" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Start a conversation with AI Assistant
                </h2>
                <p className="text-sm text-gray-500">Powered by GPT-4</p>
              </div>

              {/* Prompt Suggestions */}
              <div className="space-y-3">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSend(suggestion.prompt)}
                    className="w-full flex items-start gap-4 p-4 text-left border border-gray-200 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg ${suggestion.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">{suggestion.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        Prompt: &quot;{suggestion.prompt}&quot;
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyPrompt(suggestion.id, suggestion.prompt)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedId === suggestion.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="p-6 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <span className="text-lg">+</span>
                New
              </button>
            )}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Write your prompt..."
                className="w-full px-4 py-3 pr-12 bg-gray-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !prompt.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-500 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
