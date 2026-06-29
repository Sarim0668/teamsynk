// src/components/support/HelpSupport.tsx
import React from 'react'

export const HelpSupport: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      padding: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1 style={{ color: '#FFD700', fontSize: '48px' }}>🆘 Help & Support</h1>
      <p style={{ color: '#888', fontSize: '18px', marginTop: '16px' }}>
        This page is working! 🎉
      </p>
      <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
        If you can see this, the route is working correctly.
      </p>
    </div>
  )
}