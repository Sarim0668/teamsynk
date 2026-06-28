// src/components/community/CommunityHub.tsx
import React from 'react'

export const CommunityHub: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1 style={{ color: '#FFD700', fontSize: '48px' }}>🏠 Community Hub</h1>
      <p style={{ color: '#6b7280', fontSize: '18px', marginTop: '12px' }}>
        If you can see this, the component is loading!
      </p>
      <div style={{
        marginTop: '24px',
        padding: '16px 24px',
        background: 'rgba(200,162,0,0.1)',
        border: '1px solid rgba(200,162,0,0.3)',
        borderRadius: '12px',
        color: '#c8a200'
      }}>
        ✅ Community Hub is working!
      </div>
    </div>
  )
}