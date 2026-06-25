// src/components/ai/AIVoice.tsx
import React, { useState, useRef, useEffect } from 'react'
import { config } from '../../config'  // ← Import from config file

// ─── Declare the Web Speech API types ──────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const AIVoice: React.FC = () => {
  const [isListening, setIsListening] = useState(false)
  const [userText, setUserText] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('Ready')

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // ─── Check if browser supports speech recognition ──────────────────────
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setStatus('❌ Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      setStatus('🎤 Listening...')
    }

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript
      setUserText(text)
      setStatus('🤔 Thinking...')
      setIsProcessing(true)

      try {
        // ─── Using Gemini API with config ──────────────────────────────────
        const apiKey = config.geminiApiKey  // ← Use config instead of process.env
        
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === 'AIzaSy...your_actual_gemini_api_key_here') {
          throw new Error('Please add your Gemini API key to src/config.ts')
        }

        console.log('📡 Sending request to Gemini API...')

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a friendly AI companion for a university student. 
                         Be supportive, helpful, and conversational. 
                         Keep responses short (1-2 sentences). 
                         User: ${text}`
                }]
              }]
            })
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error Response:', errorText)
          throw new Error(`API Error ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                        "I'm not sure how to respond. Try again!"

        setAiResponse(aiReply)
        setStatus('✅ AI replied')
        setIsProcessing(false)

        // ─── Text-to-Speech ────────────────────────────────────────────────
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(aiReply)
          utterance.rate = 1
          utterance.pitch = 1
          window.speechSynthesis.speak(utterance)
        }

      } catch (error) {
        console.error('AI Error:', error)
        setStatus('❌ Error: ' + (error as Error).message)
        setIsProcessing(false)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Recognition Error:', event.error)
      setStatus('❌ Error: ' + event.error)
      setIsListening(false)
      setIsProcessing(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (!isProcessing) setStatus('🟢 Ready')
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      setUserText('')
      setAiResponse('')
      recognitionRef.current.start()
    }
  }

  const cancel = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      setIsListening(false)
      setStatus('🟢 Ready')
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'rgba(16,16,22,0.95)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(200,162,0,0.2)',
        borderRadius: '24px',
        padding: '32px',
        textAlign: 'center'
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c8a200, #FFD700)',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          🎙️
        </div>

        <h2 style={{ color: '#FFD700', marginBottom: '4px' }}>AI Voice Assistant</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Talk to your AI companion anytime
        </p>

        {/* Status */}
        <div style={{
          padding: '6px 16px',
          borderRadius: '99px',
          background: status.includes('✅') ? 'rgba(34,197,94,0.1)' :
                     status.includes('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(200,162,0,0.1)',
          border: `1px solid ${status.includes('✅') ? 'rgba(34,197,94,0.3)' :
                                 status.includes('❌') ? 'rgba(239,68,68,0.3)' : 'rgba(200,162,0,0.3)'}`,
          color: status.includes('✅') ? '#4ade80' :
                 status.includes('❌') ? '#f87171' : '#c8a200',
          fontSize: '12px',
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          {status}
        </div>

        {/* Mic Button */}
        <button
          onClick={isListening ? cancel : startListening}
          disabled={isProcessing}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: 'none',
            background: isListening ? '#ef4444' :
                      isProcessing ? 'rgba(200,162,0,0.3)' : 'linear-gradient(135deg, #c8a200, #FFD700)',
            color: isListening || isProcessing ? 'white' : '#0a0a0a',
            fontSize: '32px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isListening ? '0 0 40px rgba(239,68,68,0.4)' :
                      isProcessing ? 'none' : '0 0 30px rgba(200,162,0,0.3)',
            animation: isListening ? 'blink 1s infinite' : 'none'
          }}
        >
          {isListening ? '⏹️' : isProcessing ? '⏳' : '🎤'}
        </button>

        {/* Transcript */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          minHeight: '100px',
          textAlign: 'left'
        }}>
          {userText && (
            <p style={{ color: '#4ade80', marginBottom: '8px' }}>
              🧑 You: {userText}
            </p>
          )}
          {aiResponse && (
            <p style={{ color: '#FFD700' }}>
              🤖 AI: {aiResponse}
            </p>
          )}
          {!userText && !aiResponse && (
            <p style={{ color: '#4b5563', fontSize: '14px' }}>
              Press the mic button and start talking...
            </p>
          )}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(200,162,0,0.2); }
            50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(200,162,0,0.4); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  )
}