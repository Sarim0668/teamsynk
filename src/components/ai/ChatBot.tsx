import React, { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  "How do I find players for cricket? 🏏",
  "What's in the Marketplace?",
  "How do sessions work?",
  "Help me set up my profile",
]

const TypingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '12px 16px' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: '#c8a200', opacity: 0.4,
        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-6px);opacity:1} }`}</style>
  </div>
)

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setError(null)
    const userMessage: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to get a response')

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again!'
      setError(msg)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      maxWidth: '640px', margin: '0 auto', padding: '24px 20px',
      background: '#0D0D0F', color: 'white', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #b8860b, #FFD700)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', flexShrink: 0, boxShadow: '0 0 20px rgba(200,162,0,0.25)',
        }}>⚡</div>
        <div>
          <h2 style={{ color: '#FFD700', margin: 0, fontSize: '18px', fontWeight: 700 }}>Synk AI</h2>
          <p style={{ color: '#4b5563', fontSize: '12px', margin: 0, marginTop: '2px' }}>TeamSynk Assistant • Always online</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.6)', animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ color: '#4b5563', fontSize: '11px' }}>Online</span>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, minHeight: '400px', maxHeight: '500px', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px',
        padding: '16px', marginBottom: '16px', background: 'rgba(255,255,255,0.015)',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(200,162,0,0.2) transparent',
      }}>
        {isEmpty && (
          <div style={{ paddingTop: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px', padding: '0 16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>👋</div>
              <p style={{ color: '#9ca3af', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
                Hey! I'm Synk, your TeamSynk assistant.
                <br />
                <span style={{ color: '#6b7280', fontSize: '13px' }}>Ask me anything about sports, sessions, or the platform.</span>
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button key={i} onClick={() => sendMessage(prompt)} style={{
                  padding: '12px 14px', background: 'rgba(200,162,0,0.06)',
                  border: '1px solid rgba(200,162,0,0.15)', borderRadius: '12px',
                  color: '#d4a800', fontSize: '13px', cursor: 'pointer',
                  textAlign: 'left', lineHeight: 1.4,
                }}>{prompt}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            margin: '8px 0', alignItems: 'flex-end', gap: '8px',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #b8860b, #FFD700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', flexShrink: 0,
              }}>⚡</div>
            )}
            <div style={{
              padding: '11px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'rgba(255,255,255,0.05)',
              color: msg.role === 'user' ? '#0a0a0a' : '#e5e7eb',
              maxWidth: '78%', fontSize: '14px', lineHeight: '1.55',
              fontWeight: msg.role === 'user' ? 500 : 400,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', margin: '8px 0' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #b8860b, #FFD700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', flexShrink: 0,
            }}>⚡</div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '18px 18px 18px 4px' }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            textAlign: 'center', margin: '12px 0', padding: '10px 16px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '12px', color: '#f87171', fontSize: '13px',
          }}>⚠️ {error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '8px',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={isLoading}
          autoComplete="off"
          style={{
            flex: 1, padding: '10px 14px', background: 'transparent',
            border: 'none', color: 'white', fontSize: '14px',
            outline: 'none', opacity: isLoading ? 0.5 : 1,
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 22px',
            background: isLoading || !input.trim() ? 'rgba(200,162,0,0.25)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
            border: 'none', borderRadius: '10px',
            color: isLoading || !input.trim() ? '#6b5800' : '#0a0a0a',
            fontWeight: 700, cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px', flexShrink: 0,
          }}
        >{isLoading ? '...' : 'Send'}</button>
      </div>

      <p style={{ textAlign: 'center', color: '#1f2937', fontSize: '11px', margin: '12px 0 0' }}>
        Synk AI · Powered by TeamSynk
      </p>
    </div>
  )
}