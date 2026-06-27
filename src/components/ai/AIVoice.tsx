// src/components/ai/AIVoice.tsx
// ─── GET YOUR FREE GEMINI API KEY HERE ───────────────────────────────────────
// https://aistudio.google.com/app/apikey
// Sign in with Google → Create API Key → paste in your .env as VITE_GEMINI_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

const QUOTES = [
  { text: '"In the middle of every difficulty lies opportunity."', author: 'Albert Einstein', color: 'linear-gradient(180deg,#a855f7,#ec4899)' },
  { text: '"You are braver than you believe, stronger than you seem."', author: 'A.A. Milne', color: 'linear-gradient(180deg,#3b82f6,#06b6d4)' },
  { text: '"The only way to do great work is to love what you do."', author: 'Steve Jobs', color: 'linear-gradient(180deg,#f59e0b,#ef4444)' },
  { text: '"Believe you can and you\'re halfway there."', author: 'Theodore Roosevelt', color: 'linear-gradient(180deg,#10b981,#3b82f6)' },
  { text: '"Your limitation — it\'s only your imagination."', author: 'Unknown', color: 'linear-gradient(180deg,#f43f5e,#a855f7)' },
  { text: '"Push yourself, because no one else is going to do it for you."', author: 'Unknown', color: 'linear-gradient(180deg,#06b6d4,#a855f7)' },
  { text: '"Dream it. Wish it. Do it."', author: 'Unknown', color: 'linear-gradient(180deg,#ec4899,#f59e0b)' },
  { text: '"Hard times never last, but hard people do."', author: 'Robert H. Schuller', color: 'linear-gradient(180deg,#8b5cf6,#06b6d4)' },
  { text: '"Success is not final, failure is not fatal — it is the courage to continue that counts."', author: 'Winston Churchill', color: 'linear-gradient(180deg,#f59e0b,#a855f7)' },
  { text: '"You didn\'t come this far to only come this far."', author: 'Unknown', color: 'linear-gradient(180deg,#10b981,#ec4899)' },
]

const SHAYRIS = [
  'Himmat kar, ruk mat — har andheri raat ke baad subah aati hai ✨',
  'Tooti hui khwaab ko phir se jod le — waqt hai, umeed hai, tu hai 💫',
  'Zindagi mein haar nahi, bas ek aur try hai baaki 🌟',
  'Khud pe yaqeen rakh — duniya teri raah dekh rahi hai 🚀',
  'Mushkilein tujhe toda nahi, banaya hai — yahi teri pehchaan hai 💪',
  'Gir ke uthna seekh — yahi toh zindagi hai meri jaan 🌹',
  'Tu akela nahi, teri dua ke saath ek poori kainaat hai 🌌',
]

const SYSTEM_PROMPT = `You are a warm, supportive AI friend. Keep replies short (1-2 sentences max), friendly, and conversational. Be encouraging and empathetic. Never be robotic. Respond naturally like a real friend would.`

type InputMode = 'voice' | 'text'

export const AIVoice: React.FC = () => {
  const [isListening, setIsListening]   = useState(false)
  const [userText, setUserText]         = useState('')
  const [aiResponse, setAiResponse]     = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus]             = useState('Tap the mic to start')
  const [voiceGender, setVoiceGender]   = useState<'female' | 'male' | 'kid'>('female')
  const [quoteIdx, setQuoteIdx]         = useState(0)
  const [shayriIdx, setShayriIdx]       = useState(0)
  const [inputMode, setInputMode]       = useState<InputMode>('voice')
  const [typedText, setTypedText]       = useState('')
  const [micSupported, setMicSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const textInputRef   = useRef<HTMLInputElement>(null)

  // ─── Quote Rotation ──────────────────────────────────────────────────────
  const nextQuote = () => {
    setQuoteIdx(i => (i + 1) % QUOTES.length)
    setShayriIdx(i => (i + 1) % SHAYRIS.length)
  }

  // ─── Speech Recognition Setup ────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicSupported(false)
      setInputMode('text')
      setStatus('Type your message below 👇')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      setStatus('🔴 Listening...')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || ''
      if (transcript.trim()) {
        setUserText(transcript)
        sendMessage(transcript)
      }
    }

    recognition.onerror = (e: any) => {
      setIsListening(false)
      // Auto-switch to text mode on mic errors
      if (e.error === 'network' || e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicSupported(false)
        setInputMode('text')
        setStatus('Mic unavailable — type your message below 👇')
      } else if (e.error === 'no-speech') {
        setStatus('No speech detected — try again or type below')
      } else {
        setStatus(`Mic error (${e.error}) — switching to text mode`)
        setInputMode('text')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Focus text input when switching to text mode
  useEffect(() => {
    if (inputMode === 'text') {
      setTimeout(() => textInputRef.current?.focus(), 100)
    }
  }, [inputMode])

  // ─── Text to Speech ──────────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.pitch  = voiceGender === 'female' ? 1.2 : voiceGender === 'kid' ? 1.7 : 0.85
    utterance.rate   = voiceGender === 'kid' ? 1.15 : 1.0
    utterance.volume = 1
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) {
      if (voiceGender === 'female') {
        const v = voices.find(v => /female|woman|girl/i.test(v.name))
        if (v) utterance.voice = v
      } else if (voiceGender === 'male') {
        const v = voices.find(v => /male|man/i.test(v.name) && !/female/i.test(v.name))
        if (v) utterance.voice = v
      }
    }
    window.speechSynthesis.speak(utterance)
  }, [voiceGender])

  // ─── Send to Gemini ───────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return
    setIsProcessing(true)
    setStatus('🤔 Thinking...')
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 80 }
        })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
      if (!reply || reply.length < 2) {
        const fallbacks = ["Hey! 😊", "I'm here for you! 💕", "Tell me more! ✨", "You've got this! 💪"]
        reply = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      }
      setAiResponse(reply)
      setStatus(inputMode === 'voice' ? '💬 Replied!' : '💬 Replied! — type another message')
      speakText(reply)
    } catch (error: any) {
      const msg = error.message || 'Unknown error'
      setStatus('❌ ' + (msg.includes('API_KEY') ? 'Invalid API key' : msg))
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── Mic Toggle ──────────────────────────────────────────────────────────
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.abort()
      setIsListening(false)
      setStatus('Tap the mic to start')
      return
    }
    try {
      setUserText('')
      setAiResponse('')
      setStatus('')
      recognitionRef.current?.start()
    } catch {
      setStatus('❌ Could not start mic')
      setInputMode('text')
    }
  }

  // ─── Text Submit ─────────────────────────────────────────────────────────
  const handleTextSubmit = () => {
    const text = typedText.trim()
    if (!text || isProcessing) return
    setUserText(text)
    setTypedText('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTextSubmit()
  }

  const clearConversation = () => {
    setUserText('')
    setAiResponse('')
    setTypedText('')
    setStatus(inputMode === 'voice' ? 'Tap the mic to start' : 'Type your message below 👇')
    window.speechSynthesis?.cancel()
  }

  const currentQuote  = QUOTES[quoteIdx]
  const currentShayri = SHAYRIS[shayriIdx]

  // ─── Style Helpers ────────────────────────────────────────────────────────
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.03)',
    color: active ? '#c084fc' : '#64748b',
    transition: 'all 0.2s',
  })

  const modePillStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? activeColor + '60' : 'rgba(255,255,255,0.08)'}`,
    background: active ? activeColor + '20' : 'rgba(255,255,255,0.03)',
    color: active ? activeColor : '#64748b',
    transition: 'all 0.2s', fontWeight: active ? 500 : 400,
  })

  const tagStyle = (color: string): React.CSSProperties => ({
    fontSize: 10, padding: '3px 10px', borderRadius: 99,
    border: `1px solid ${color}40`, background: `${color}15`, color,
  })

  const s: Record<string, React.CSSProperties> = {
    app: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    card: {
      maxWidth: '480px', width: '100%',
      background: 'rgba(15,12,41,0.75)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px', padding: '28px 24px',
      position: 'relative', overflow: 'hidden',
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    avatarCircle: {
      width: 44, height: 44, borderRadius: '50%',
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, boxShadow: '0 0 0 3px rgba(168,85,247,0.25)',
    },
    brandTitle: { color: '#e2e8f0', fontSize: 17, fontWeight: 500 },
    brandSub:   { color: '#a78bfa', fontSize: 11, marginTop: 2 },
    onlinePill: {
      padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80',
    },
    quoteCard: {
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '14px 16px 14px 20px',
      marginBottom: 18, cursor: 'pointer', position: 'relative',
    },
    quoteAccent: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
      borderRadius: 99, background: currentQuote.color,
    },
    quoteText:   { color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' },
    quoteAuthor: { color: '#a78bfa', fontSize: 11, marginTop: 6, fontWeight: 500 },

    // Mode toggle bar
    modeBar: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 },

    // Mic area
    micBtn: {
      width: 88, height: 88, borderRadius: '50%', border: 'none',
      cursor: isProcessing ? 'not-allowed' : 'pointer',
      fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 12px',
      background: isListening
        ? 'linear-gradient(135deg,#dc2626,#f43f5e)'
        : isProcessing
          ? 'linear-gradient(135deg,#0891b2,#3b82f6)'
          : 'linear-gradient(135deg,#7c3aed,#a855f7)',
      boxShadow: isListening
        ? '0 0 0 8px rgba(244,63,94,0.18),0 0 0 20px rgba(244,63,94,0.06)'
        : '0 0 0 8px rgba(168,85,247,0.12),0 0 0 18px rgba(168,85,247,0.05)',
      transition: 'all 0.3s ease',
    },
    statusLabel: { color: '#94a3b8', fontSize: 13, textAlign: 'center', minHeight: 20 },

    // Text input area
    textInputWrap: {
      display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4,
    },
    textInput: {
      flex: 1, padding: '12px 16px', borderRadius: 12,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#e2e8f0', fontSize: 14, outline: 'none',
    },
    sendBtn: {
      padding: '12px 18px', borderRadius: 12, border: 'none',
      background: isProcessing ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
      color: 'white', fontSize: 18, cursor: isProcessing ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
    },
    textHint: { color: '#475569', fontSize: 11, textAlign: 'center', marginBottom: 12 },

    voicePills: { display: 'flex', gap: 8, justifyContent: 'center', margin: '14px 0' },
    chatBox: {
      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '14px 16px', minHeight: 90, marginBottom: 12,
    },
    userMsg:     { color: '#86efac', fontSize: 13, lineHeight: 1.6, marginBottom: 8 },
    aiMsg:       { color: '#fbbf24', fontSize: 13, lineHeight: 1.6 },
    placeholder: { color: '#334155', fontSize: 13, textAlign: 'center', padding: '16px 0' },
    bottomRow:   { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
    clearBtn: {
      padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
      background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: 12, cursor: 'pointer',
    },
    shayriStrip: {
      padding: '12px 14px',
      background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)',
      borderRadius: 12, textAlign: 'center',
    },
    shayriText:  { color: '#fcd34d', fontSize: 12.5, lineHeight: 1.85 },
    shayriLabel: { color: '#78350f', fontSize: 10, marginTop: 4, letterSpacing: '0.05em' },
  }

  return (
    <div style={s.app}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.avatarCircle}>🎙️</div>
            <div>
              <div style={s.brandTitle}>AI Friend</div>
              <div style={s.brandSub}>Always here to listen 💕</div>
            </div>
          </div>
          <div style={s.onlinePill}>🟢 Online</div>
        </div>

        {/* Quote Card */}
        <div style={s.quoteCard} onClick={nextQuote}>
          <div style={s.quoteAccent} />
          <div style={s.quoteText}>{currentQuote.text}</div>
          <div style={s.quoteAuthor}>— {currentQuote.author} · tap to change</div>
        </div>

        {/* Mode Toggle — hidden if mic not supported */}
        {micSupported && (
          <div style={s.modeBar}>
            <button style={modePillStyle(inputMode === 'voice', '#a855f7')} onClick={() => { setInputMode('voice'); setStatus('Tap the mic to start') }}>
              🎤 Voice
            </button>
            <button style={modePillStyle(inputMode === 'text', '#3b82f6')} onClick={() => setInputMode('text')}>
              ⌨️ Type
            </button>
          </div>
        )}

        {/* Voice Mode */}
        {inputMode === 'voice' && (
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <button
              style={s.micBtn}
              onClick={toggleListening}
              disabled={isProcessing}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? '⏹️' : isProcessing ? '⏳' : '🎤'}
            </button>
            <div style={s.statusLabel}>{status || '\u00A0'}</div>
          </div>
        )}

        {/* Text Mode */}
        {inputMode === 'text' && (
          <div style={{ marginBottom: 4 }}>
            <div style={s.textInputWrap}>
              <input
                ref={textInputRef}
                style={s.textInput}
                type="text"
                placeholder="Type your message..."
                value={typedText}
                onChange={e => setTypedText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
              />
              <button style={s.sendBtn} onClick={handleTextSubmit} disabled={isProcessing}>
                {isProcessing ? '⏳' : '➤'}
              </button>
            </div>
            <div style={s.textHint}>Press Enter or ➤ to send · AI will speak the reply</div>
            <div style={s.statusLabel}>{status || '\u00A0'}</div>
          </div>
        )}

        {/* Voice Gender Pills */}
        <div style={s.voicePills}>
          {(['female', 'kid', 'male'] as const).map(v => (
            <button key={v} style={pillStyle(voiceGender === v)} onClick={() => setVoiceGender(v)}>
              {v === 'female' ? '👩 Female' : v === 'kid' ? '🧒 Kid' : '👨 Male'}
            </button>
          ))}
        </div>

        {/* Chat Box */}
        <div style={s.chatBox}>
          {!userText && !aiResponse
            ? <div style={s.placeholder}>💬 Say or type anything — I'm here! 💕</div>
            : <>
                {userText   && <div style={s.userMsg}>🧑 You: {userText}</div>}
                {aiResponse && <div style={s.aiMsg}>👩 Friend: {aiResponse}</div>}
              </>
          }
        </div>

        {/* Bottom Row */}
        <div style={s.bottomRow}>
          {(userText || aiResponse) && (
            <button style={s.clearBtn} onClick={clearConversation}>🗑️ Clear</button>
          )}
          <div style={{ flex: 1 }} />
          <span style={tagStyle('#a855f7')}>Gemini Flash</span>
          <span style={tagStyle('#3b82f6')}>Free</span>
          <span style={tagStyle('#ec4899')}>Always On</span>
        </div>

        {/* Shayri Strip */}
        <div style={s.shayriStrip}>
          <div style={s.shayriText}>{currentShayri}</div>
          <div style={s.shayriLabel}>URDU SHAYRI · tap quote above for next</div>
        </div>

      </div>
    </div>
  )
}