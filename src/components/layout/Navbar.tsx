import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { 
  HomeIcon, 
  UserIcon, 
  CalendarIcon, 
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { IMAGES } from '../../constants/images'

export const Navbar: React.FC = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav style={{
      background: '#0a0a0a',
      borderBottom: '1px solid #c8a20030',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#FFD700',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}}>
  <img 
    src={IMAGES.logo} 
    alt="TeamSynk" 
    style={{ height: '35px', objectFit: 'contain' }}
  />
  <span>TEAMSYNK</span>
</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: '#888', textDecoration: 'none' }} title="Dashboard">
            <HomeIcon style={{ width: '20px', height: '20px' }} />
          </Link>
          <Link to="/find-players" style={{ color: '#888', textDecoration: 'none' }} title="Find Players">
            <UsersIcon style={{ width: '20px', height: '20px' }} />
          </Link>
          <Link to="/browse-sessions" style={{ color: '#888', textDecoration: 'none' }} title="Sessions">
            <CalendarIcon style={{ width: '20px', height: '20px' }} />
          </Link>
          <Link to="/marketplace" style={{ color: '#888', textDecoration: 'none' }} title="Marketplace">
            <ShoppingBagIcon style={{ width: '20px', height: '20px' }} />
          </Link>
          <Link to="/profile" style={{ color: '#888', textDecoration: 'none' }} title="Profile">
            <UserIcon style={{ width: '20px', height: '20px' }} />
          </Link>
          <Link to="/create-session" style={{
            background: '#c8a200',
            color: '#0a0a0a',
            padding: '6px 14px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            New
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer'
            }}
          >
            <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>
    </nav>
  )
}