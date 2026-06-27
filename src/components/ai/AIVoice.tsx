// src/components/ai/AIVoice.tsx
// ─── GET YOUR FREE GEMINI API KEY HERE ───────────────────────────────────────
// https://aistudio.google.com/app/apikey
// Sign in with Google → Create API Key → paste below
// Free tier: 1500 requests/day, always online (no laptop needed!)
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

// ─── Quotes & Shayri ─────────────────────────────────────────────────────────
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

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a warm, supportive AI friend. Keep replies short (1-2 sentences max), friendly, and conversational. Be encouraging and empathetic. Never be robotic. Respond naturally like a real friend would.`

export const AIVoice: React.FC = () => {
  const [isListening, setIsListening]     = useState(false)
  const [userText, setUserText]           = useState('')
  const [aiResponse, setAiResponse]       = useState('')
  const [isProcessing, setIsProcessing]   = useState(false)
  const [status, setStatus]               = useState('Tap the mic to start')
  const [voiceGender, setVoiceGender]     = useState<'female' | 'male' | 'kid'>('female')
  const [quoteIdx, setQuoteIdx]           = useState(0)
  const [shayriIdx, setShayriIdx]         = useState(0)

  const recognitionRef = useRef<any>(null)

  // ─── Quote Rotation ──────────────────────────────────────────────────────
  const nextQuote = () => {
    setQuoteIdx(i => (i + 1) % QUOTES.length)
    setShayriIdx(i => (i + 1) % SHAYRIS.length)
  }

  // ─── Speech Recognition Setup ────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatus('❌ Speech not supported in this browser')
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
      setStatus(e.error === 'no-speech' ? 'No speech detected — try again' : '❌ Mic error: ' + e.error)
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

  // ─── Text to Speech ──────────────────────────────────────────────────────
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.pitch = voiceGender === 'female' ? 1.2 : voiceGender === 'kid' ? 1.7 : 0.85
    utterance.rate  = voiceGender === 'kid' ? 1.15 : 1.0
    utterance.volume = 1

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) {
      if (voiceGender === 'female') {
        const femaleVoice = voices.find(v => /female|woman|girl/i.test(v.name))
        if (femaleVoice) utterance.voice = femaleVoice
      } else if (voiceGender === 'male') {
        const maleVoice = voices.find(v => /male|man/i.test(v.name) && !/female/i.test(v.name))
        if (maleVoice) utterance.voice = maleVoice
      }
    }

    window.speechSynthesis.speak(utterance)
  }, [voiceGender])

  // ─── Send to Gemini API ──────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return

    setIsProcessing(true)
    setStatus('🤔 Thinking...')

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            { role: 'user', parts: [{ text }] }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 80,
            stopSequences: []
          }
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
      setStatus('💬 Replied!')
      speakText(reply)

    } catch (error: any) {
      const msg = error.message || 'Unknown error'
      setStatus('❌ ' + (msg.includes('API_KEY') ? 'Invalid API key — check GEMINI_API_KEY' : msg))
      console.error('Gemini error:', error)
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
      setStatus('❌ Could not start mic — already running?')
    }
  }

  const clearConversation = () => {
    setUserText('')
    setAiResponse('')
    setStatus('Tap the mic to start')
    window.speechSynthesis?.cancel()
  }

  const currentQuote  = QUOTES[quoteIdx]
  const currentShayri = SHAYRIS[shayriIdx]

  // ─── Dynamic style helpers (functions can't live inside a CSSProperties Record) ──
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.03)',
    color: active ? '#c084fc' : '#64748b',
    transition: 'all 0.2s',
  })

  const tagStyle = (color: string): React.CSSProperties => ({
    fontSize: 10, padding: '3px 10px', borderRadius: 99,
    border: `1px solid ${color}40`, background: `${color}15`, color,
  })

  // ─── Styles ──────────────────────────────────────────────────────────────
  const styles: Record<string, React.CSSProperties> = {
    app: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    card: {
      maxWidth: '480px',
      width: '100%',
      background: 'rgba(15, 12, 41, 0.7)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px',
      padding: '28px 24px',
      position: 'relative',
      overflow: 'hidden',
    },

    // Header
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    avatarCircle: {
      width: 44, height: 44, borderRadius: '50%',
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, boxShadow: '0 0 0 3px rgba(168,85,247,0.25)',
    },
    brandTitle: { color: '#e2e8f0', fontSize: 17, fontWeight: 500 },
    brandSub: { color: '#a78bfa', fontSize: 11, marginTop: 2 },
    onlinePill: {
      padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500,
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80',
    },

    // Quote card
    quoteCard: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '14px 16px 14px 20px',
      marginBottom: 18, cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s',
    },
    quoteAccent: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
      borderRadius: 99, background: currentQuote.color,
    },
    quoteText: { color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' },
    quoteAuthor: { color: '#a78bfa', fontSize: 11, marginTop: 6, fontWeight: 500 },

    // Mic button
    micBtn: {
      width: 88, height: 88, borderRadius: '50%', border: 'none',
      cursor: 'pointer', fontSize: 36, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 12px',
      background: isListening
        ? 'linear-gradient(135deg, #dc2626, #f43f5e)'
        : isProcessing
          ? 'linear-gradient(135deg, #0891b2, #3b82f6)'
          : 'linear-gradient(135deg, #7c3aed, #a855f7)',
      boxShadow: isListening
        ? '0 0 0 8px rgba(244,63,94,0.18), 0 0 0 20px rgba(244,63,94,0.06)'
        : '0 0 0 8px rgba(168,85,247,0.12), 0 0 0 18px rgba(168,85,247,0.05)',
      transition: 'all 0.3s ease',
    },
    statusLabel: { color: '#94a3b8', fontSize: 13, textAlign: 'center', minHeight: 20 },

    // Voice pills
    voicePills: { display: 'flex', gap: 8, justifyContent: 'center', margin: '14px 0' },

    // Chat box
    chatBox: {
      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '14px 16px', minHeight: 90,
      marginBottom: 12,
    },
    userMsg: { color: '#86efac', fontSize: 13, lineHeight: 1.6, marginBottom: 8 },
    aiMsg: { color: '#fbbf24', fontSize: 13, lineHeight: 1.6 },
    placeholder: { color: '#334155', fontSize: 13, textAlign: 'center', padding: '16px 0' },

    // Bottom row
    bottomRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
    clearBtn: {
      padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
      background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: 12, cursor: 'pointer',
    },

    // Shayri strip
    shayriStrip: {
      padding: '12px 14px',
      background: 'rgba(251,191,36,0.05)',
      border: '1px solid rgba(251,191,36,0.12)',
      borderRadius: 12, textAlign: 'center',
    },
    shayriText: { color: '#fcd34d', fontSize: 12.5, lineHeight: 1.85 },
    shayriLabel: { color: '#78350f', fontSize: 10, marginTop: 4, letterSpacing: '0.05em' },
  }

  return (
    <div style={styles.app}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.avatarCircle}>🎙️</div>
            <div>
              <div style={styles.brandTitle}>AI Friend</div>
              <div style={styles.brandSub}>Always here to listen 💕</div>
            </div>
          </div>
          <div style={styles.onlinePill}>🟢 Online</div>
        </div>

        {/* Quote Card */}
        <div style={styles.quoteCard} onClick={nextQuote}>
          <div style={styles.quoteAccent} />
          <div style={styles.quoteText}>{currentQuote.text}</div>
          <div style={styles.quoteAuthor}>— {currentQuote.author} · tap to change</div>
        </div>

        {/* Mic Button */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <button
            style={styles.micBtn}
            onClick={toggleListening}
            disabled={isProcessing}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? '⏹️' : isProcessing ? '⏳' : '🎤'}
          </button>
          <div style={styles.statusLabel}>{status || '\u00A0'}</div>
        </div>

        {/* Voice Pills */}
        <div style={styles.voicePills}>
          {(['female', 'kid', 'male'] as const).map(v => (
            <button key={v} style={pillStyle(voiceGender === v)} onClick={() => setVoiceGender(v)}>
              {v === 'female' ? '👩 Female' : v === 'kid' ? '🧒 Kid' : '👨 Male'}
            </button>
          ))}
        </div>

        {/* Chat Box */}
        <div style={styles.chatBox}>
          {!userText && !aiResponse
            ? <div style={styles.placeholder}>💬 Say anything — I'm here for you! 💕</div>
            : <>
                {userText   && <div style={styles.userMsg}>🧑 You: {userText}</div>}
                {aiResponse && <div style={styles.aiMsg}>👩 Friend: {aiResponse}</div>}
              </>
          }
        </div>

        {/* Bottom Row */}
        <div style={styles.bottomRow}>
          {(userText || aiResponse) && (
            <button style={styles.clearBtn} onClick={clearConversation}>🗑️ Clear</button>
          )}
          <div style={{ flex: 1 }} />
          <span style={tagStyle('#a855f7')}>Gemini Flash</span>
          <span style={tagStyle('#3b82f6')}>Free</span>
          <span style={tagStyle('#ec4899')}>Always On</span>
        </div>

        {/* Shayri Strip */}
        <div style={styles.shayriStrip}>
          <div style={styles.shayriText}>{currentShayri}</div>
          <div style={styles.shayriLabel}>URDU SHAYRI · tap quote above for next</div>
        </div>

      </div>
    </div>
  )
}