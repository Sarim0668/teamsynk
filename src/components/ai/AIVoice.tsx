// src/components/ai/AIVoice.tsx
import React, { useState, useRef, useEffect } from 'react'

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── UPDATE THIS WITH YOUR NGROK URL ──────────────────────────────────────
const OLLAMA_URL = 'https://teamsynk-ollama.loca.lt';  // ← Replace with your ngrok URL

export const AIVoice: React.FC = () => {
  const [isListening, setIsListening] = useState(false)
  const [userText, setUserText] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('🟢 Ready')
  const [isOllamaOnline, setIsOllamaOnline] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [voiceGender, setVoiceGender] = useState<'female' | 'male' | 'kid'>('female')

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const retryCountRef = useRef(0)

  // ─── Check Ollama Status ──────────────────────────────────────────────
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`)
      setIsOllamaOnline(res.ok)
      if (res.ok) setStatus('🟢 Ready')
      else setStatus('🔴 AI Offline')
    } catch {
      setIsOllamaOnline(false)
      setStatus('🔴 AI Offline')
    }
  }

  // ─── Scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [userText, aiResponse, isThinking])

  // ─── Speech Recognition ──────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatus('❌ Speech not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      retryCountRef.current = 0
      setStatus('🎤 Listening... Speak freely 😊')
    }

    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }

      if (interimText) {
        setUserText(interimText + '...')
      }

      if (finalText) {
        setUserText(finalText)
        setConversationHistory(prev => [...prev, `User: ${finalText}`])
        sendMessage(finalText)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Recognition Error:', event.error)
      
      if (event.error === 'not-allowed') {
        setStatus('❌ Please allow microphone access')
        setIsListening(false)
        return
      }

      if (event.error === 'no-speech') {
        if (retryCountRef.current < 3) {
          retryCountRef.current++
          setStatus(`⏳ No speech detected. Retry ${retryCountRef.current}/3...`)
          setTimeout(() => {
            try { recognition.start() } catch (e) {}
          }, 1000)
        } else {
          setStatus('⏳ Try again! Click mic to restart')
          setIsListening(false)
          setTimeout(() => {
            if (!isProcessing) setStatus('🟢 Ready')
          }, 2000)
        }
        return
      }

      setStatus('❌ Error: ' + event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (!isProcessing && !isThinking) {
        setStatus('🟢 Ready')
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ─── Speak with Selected Voice ──────────────────────────────────────
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    const voices = window.speechSynthesis.getVoices()
    
    let selectedVoice = null
    
    if (voiceGender === 'female') {
      const femaleVoiceNames = [
        'Google UK English Female',
        'Google US English Female',
        'Samantha',
        'Victoria',
        'Susan',
        'Karen',
        'Zira',
        'Microsoft Zira Desktop',
        'Microsoft Hazel Desktop'
      ]
      for (const name of femaleVoiceNames) {
        const found = voices.find(v => v.name.includes(name))
        if (found) {
          selectedVoice = found
          break
        }
      }
    } else if (voiceGender === 'kid') {
      const kidVoiceNames = [
        'Google UK English Female',
        'Samantha',
        'Zira',
        'Microsoft Hazel Desktop'
      ]
      for (const name of kidVoiceNames) {
        const found = voices.find(v => v.name.includes(name))
        if (found) {
          selectedVoice = found
          break
        }
      }
    } else {
      const maleVoiceNames = [
        'Google UK English Male',
        'Google US English Male',
        'Microsoft David Desktop',
        'Microsoft Mark Desktop'
      ]
      for (const name of maleVoiceNames) {
        const found = voices.find(v => v.name.includes(name))
        if (found) {
          selectedVoice = found
          break
        }
      }
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
    
    if (voiceGender === 'female') {
      utterance.pitch = 1.2
      utterance.rate = 1.05
    } else if (voiceGender === 'kid') {
      utterance.pitch = 1.6
      utterance.rate = 1.1
    } else {
      utterance.pitch = 0.9
      utterance.rate = 0.95
    }
    
    utterance.volume = 1

    utterance.onstart = () => {
      setStatus('🔊 Speaking...')
    }
    
    utterance.onend = () => {
      if (!isProcessing && !isListening) {
        setStatus('🟢 Ready')
      }
    }
    
    utterance.onerror = () => {
      setStatus('🔊 Voice playback error')
    }

    window.speechSynthesis.speak(utterance)
  }

  // ─── Send Message Directly to Ollama via Ngrok ──────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return

    setIsProcessing(true)
    setIsThinking(true)
    setStatus('🤔 Thinking...')
    setUserText(text)

    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tinyllama',
          prompt: `User: ${text}\nAI:`,
          stream: false,
          temperature: 0.3,
          max_tokens: 15,
          num_predict: 15,
          num_ctx: 64,
          stop: ['\n', 'User:', 'AI:']
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama Error: ${response.status}`)
      }

      const data = await response.json()
      let aiReply = data.response || "Hey! 😊"
      
      aiReply = aiReply.replace(/^(AI:|Response:|Friend:|User:)/i, '').trim()
      
      if (!aiReply || aiReply.length < 2) {
        const fallbacks = [
          "Hey! 😊", "I'm here! 💕", "Tell me more! ✨",
          "That's cool! 😊", "Got it! 🎯", "Nice! 😄",
          "Hmm, interesting! 🤔", "Go on! 💬", "I hear you! 💕"
        ]
        aiReply = fallbacks[Math.floor(Math.random() * fallbacks.length)]
      }

      setAiResponse(aiReply)
      setStatus('💬 AI replied')
      setIsProcessing(false)
      setIsThinking(false)

      setConversationHistory(prev => [...prev, `AI: ${aiReply}`])
      speakText(aiReply)

    } catch (error) {
      console.error('Error:', error)
      setStatus('❌ ' + (error as Error).message)
      setIsProcessing(false)
      setIsThinking(false)
    }
  }

  // ─── Toggle Listening ─────────────────────────────────────────────────
  const toggleListening = () => {
    if (isListening) {
      try { recognitionRef.current?.abort() } catch (e) {}
      setIsListening(false)
      setStatus('🟢 Ready')
      return
    }

    if (!isOllamaOnline) {
      setStatus('🔴 AI is offline')
      return
    }

    if (isProcessing) {
      setStatus('⏳ Please wait...')
      return
    }

    try {
      setUserText('')
      setAiResponse('')
      setIsThinking(false)
      retryCountRef.current = 0
      recognitionRef.current?.start()
    } catch (e) {
      console.error('Start error:', e)
      setStatus('❌ Failed to start mic')
    }
  }

  // ─── Clear Conversation ──────────────────────────────────────────────
  const clearConversation = () => {
    setUserText('')
    setAiResponse('')
    setIsThinking(false)
    setConversationHistory([])
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'rgba(16,16,22,0.95)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(200,162,0,0.2)',
        borderRadius: '24px',
        padding: '32px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* ─── Header ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 0 30px rgba(200,162,0,0.2)'
            }}>
              🎙️
            </div>
            <div>
              <h2 style={{ color: '#FFD700', fontSize: '20px', margin: 0 }}>AI Friend</h2>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Always here to listen 💕</p>
            </div>
          </div>

          <div style={{
            padding: '4px 14px',
            borderRadius: '99px',
            background: isOllamaOnline ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${isOllamaOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: isOllamaOnline ? '#4ade80' : '#f87171',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {isOllamaOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>

        {/* ─── Avatar ─── */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8a200, #FFD700)',
          margin: '20px auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          boxShadow: isListening ? '0 0 60px rgba(200,162,0,0.4)' : '0 0 30px rgba(200,162,0,0.2)',
          transition: 'box-shadow 0.3s ease'
        }}>
          {isListening ? '🔴' : isProcessing ? '⏳' : isThinking ? '🤔' : '👩'}
        </div>

        <h2 style={{ color: '#FFD700', fontSize: '24px', marginBottom: '4px' }}>
          Your AI Friend 💕
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
          {isListening ? 'Listening... Speak freely! 😊' : 
           isProcessing ? 'Processing...' : 
           isThinking ? 'Thinking... 🤔' : 
           !isOllamaOnline ? 'AI is offline' :
           'Tap mic to talk 💬'}
        </p>

        {/* ─── Voice Gender Selector ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => setVoiceGender('female')}
            style={{
              padding: '4px 12px',
              borderRadius: '99px',
              border: `1px solid ${voiceGender === 'female' ? 'rgba(200,162,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: voiceGender === 'female' ? 'rgba(200,162,0,0.15)' : 'transparent',
              color: voiceGender === 'female' ? '#FFD700' : '#6b7280',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (voiceGender !== 'female') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (voiceGender !== 'female') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            👩 Female
          </button>
          <button
            onClick={() => setVoiceGender('kid')}
            style={{
              padding: '4px 12px',
              borderRadius: '99px',
              border: `1px solid ${voiceGender === 'kid' ? 'rgba(200,162,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: voiceGender === 'kid' ? 'rgba(200,162,0,0.15)' : 'transparent',
              color: voiceGender === 'kid' ? '#FFD700' : '#6b7280',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (voiceGender !== 'kid') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (voiceGender !== 'kid') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            🧒 Kid
          </button>
          <button
            onClick={() => setVoiceGender('male')}
            style={{
              padding: '4px 12px',
              borderRadius: '99px',
              border: `1px solid ${voiceGender === 'male' ? 'rgba(200,162,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: voiceGender === 'male' ? 'rgba(200,162,0,0.15)' : 'transparent',
              color: voiceGender === 'male' ? '#FFD700' : '#6b7280',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (voiceGender !== 'male') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (voiceGender !== 'male') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            👨 Male
          </button>
        </div>

        {/* ─── Status ─── */}
        <div style={{
          padding: '8px 20px',
          borderRadius: '99px',
          display: 'inline-block',
          marginBottom: '20px',
          background: status.includes('✅') ? 'rgba(34,197,94,0.12)' :
                     status.includes('❌') ? 'rgba(239,68,68,0.12)' : 
                     status.includes('🎤') ? 'rgba(234,179,8,0.12)' :
                     'rgba(200,162,0,0.08)',
          border: `1px solid ${
            status.includes('✅') ? 'rgba(34,197,94,0.3)' :
            status.includes('❌') ? 'rgba(239,68,68,0.3)' : 
            status.includes('🎤') ? 'rgba(234,179,8,0.3)' :
            'rgba(200,162,0,0.2)'
          }`,
          color: status.includes('✅') ? '#4ade80' :
                 status.includes('❌') ? '#f87171' : 
                 status.includes('🎤') ? '#eab308' : '#c8a200',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          {status}
        </div>

        {/* ─── Mic Button ─── */}
        <button
          onClick={toggleListening}
          disabled={isProcessing || !isOllamaOnline}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: 'none',
            background: isListening ? '#ef4444' :
                      isProcessing ? 'rgba(200,162,0,0.3)' : 
                      !isOllamaOnline ? 'rgba(255,255,255,0.05)' :
                      'linear-gradient(135deg, #c8a200, #FFD700)',
            color: isListening || isProcessing ? 'white' : '#0a0a0a',
            fontSize: '40px',
            cursor: (isProcessing || !isOllamaOnline) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isListening ? '0 0 60px rgba(239,68,68,0.5)' : '0 0 40px rgba(200,162,0,0.4)',
            animation: isListening ? 'pulse 1s infinite' : 'none',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!isOllamaOnline ? '🔴' : isListening ? '⏹️' : isProcessing ? '⏳' : '🎤'}
        </button>

        <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '12px' }}>
          {!isOllamaOnline ? '🔄 AI is offline...' : 
           isListening ? '🔴 Tap to stop' : 
           isProcessing ? '⏳ Processing...' : 
           '🎤 Tap to talk'}
        </p>

        {/* ─── Transcript ─── */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          minHeight: '100px',
          maxHeight: '200px',
          overflowY: 'auto',
          textAlign: 'left'
        }}>
          {userText && (
            <p style={{ color: '#4ade80', marginBottom: '8px' }}>
              🧑 <strong>You:</strong> {userText}
            </p>
          )}
          {isThinking && !aiResponse && (
            <p style={{ color: '#eab308', marginBottom: '8px' }}>
              🤖 <strong>Friend:</strong> <span style={{ opacity: 0.6 }}>Thinking... 💭</span>
            </p>
          )}
          {aiResponse && (
            <p style={{ color: '#FFD700' }}>
              👩 <strong>Friend:</strong> {aiResponse}
            </p>
          )}
          {!userText && !aiResponse && !isThinking && (
            <p style={{ color: '#4b5563', fontSize: '14px', textAlign: 'center' }}>
              💬 Say anything - I'm here to listen! 💕
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Clear Button ─── */}
        {(userText || aiResponse) && (
          <button
            onClick={clearConversation}
            style={{
              marginTop: '12px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            }}
          >
            🗑️ Clear Conversation
          </button>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.03);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(200,162,0,0.3);
            border-radius: 4px;
          }
        `}</style>
      </div>
    </div>
  )
}