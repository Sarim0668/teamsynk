import React, { useState, useRef, useEffect } from 'react'

interface BackgroundMusicProps {
  autoPlay?: boolean
  loop?: boolean
  volume?: number
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({
  autoPlay = true,
  loop = true,
  volume = 0.3
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element with correct path
    const audio = new Audio('/music/background.mp3')
    audio.loop = loop
    audio.volume = volume
    
    audioRef.current = audio

    // Try to autoplay
    if (autoPlay) {
      audio.play()
        .then(() => {
          setIsPlaying(true)
          console.log('🎵 Music playing!')
        })
        .catch(() => {
          console.log('🔇 Autoplay blocked - click play button')
          setIsPlaying(false)
        })
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.log('Play error:', err))
      }
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setCurrentVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div
        style={{
          background: 'rgba(10,10,10,0.85)',
          border: '1px solid #c8a20040',
          borderRadius: '12px',
          padding: showControls ? '12px 16px' : '10px',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          minWidth: showControls ? '200px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            background: isPlaying ? '#c8a20020' : '#c8a200',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '18px',
            color: isPlaying ? '#c8a200' : '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            flexShrink: 0
          }}
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>

        {showControls && (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '10px', 
                color: '#888', 
                marginBottom: '2px',
                whiteSpace: 'nowrap'
              }}>
                🎵 Background Music
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentVolume}
                onChange={handleVolumeChange}
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(to right, #c8a200, #FFD700)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none'
                }}
              />
            </div>
            <span style={{ color: '#666', fontSize: '10px' }}>
              {Math.round(currentVolume * 100)}%
            </span>
          </>
        )}
      </div>
    </div>
  )
}