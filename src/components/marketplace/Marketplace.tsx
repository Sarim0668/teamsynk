import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

const PAYMENT_METHODS = ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'Cash on Delivery', 'Rocket', 'UPaisa']

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, any> = {
    'AVAILABLE': { label: '🟢 Available', color: '#4ade80', bg: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
  }
  const config = configs[status] || configs['AVAILABLE']
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '99px',
      background: config.bg,
      border: `1px solid ${config.borderColor}`,
      color: config.color,
      fontSize: '10px',
      fontWeight: '800',
      fontFamily: "'Inter', sans-serif",
      letterSpacing: '0.05em',
    }}>
      {config.label}
    </span>
  )
}

// ─── Condition Badge ──────────────────────────────────────────────────────
const ConditionBadge: React.FC<{ condition: string }> = ({ condition }) => {
  const configs: Record<string, any> = {
    'New': { color: '#4ade80', dot: '#4ade80' },
    'Like New': { color: '#60a5fa', dot: '#60a5fa' },
    'Good': { color: '#c8a200', dot: '#FFD700' },
    'Fair': { color: '#f97316', dot: '#f97316' },
    'Poor': { color: '#f87171', dot: '#ef4444' },
  }
  const config = configs[condition] || configs['Good']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '99px',
      background: `${config.color}15`,
      border: `1px solid ${config.color}40`,
      color: config.color,
      fontSize: '10px', fontWeight: '800',
      fontFamily: "'Inter', sans-serif",
      letterSpacing: '0.05em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.dot, display: 'inline-block' }} />
      {condition}
    </span>
  )
}

// ─── Input Components ────────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder, type = 'text', required, ...props }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={{ color: '#6b7280', fontSize: '11px', fontWeight: '700', marginBottom: '4px', display: 'block', fontFamily: "'Inter', sans-serif" }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '12px 16px',
          background: focused ? 'rgba(200,162,0,0.05)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(200,162,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '12px', color: '#f9fafb', fontSize: '14px',
          fontFamily: "'Inter', sans-serif", outline: 'none',
          transition: 'all 0.22s ease',
          ...props
        }}
      />
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
}

// ─── Sell Button ──────────────────────────────────────────────────────────
function SellButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '12px 24px',
        borderRadius: '14px',
        border: active ? '1px solid rgba(239,68,68,0.3)' : 'none',
        cursor: 'pointer',
        background: active
          ? hovered ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.1)'
          : hovered ? 'linear-gradient(135deg, #c8a200, #FFD700)' : 'linear-gradient(135deg, #b89200, #d4a500)',
        color: active ? '#f87171' : '#0a0a0a',
        fontSize: '13px',
        fontWeight: '800',
        letterSpacing: '0.03em',
        fontFamily: "'Inter', sans-serif",
        transform: hovered && !active ? 'scale(1.04) translateY(-1px)' : 'scale(1)',
        boxShadow: hovered && !active ? '0 0 28px rgba(200,162,0,0.5), 0 4px 16px rgba(200,162,0,0.3)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {active ? '✕ Cancel' : '🏷️ Sell Item'}
    </button>
  )
}

// ─── Listing Card ──────────────────────────────────────────────────────────
function ListingCard({ item, isOwner, isProcessing, onBuy, onOpen }: any) {
  const [hovered, setHovered] = useState(false)
  const isAvailable = item.status === 'AVAILABLE'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(item)}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(24,24,32,0.98)' : 'rgba(12,12,18,0.92)',
        backdropFilter: 'blur(28px)',
        borderRadius: '20px',
        border: `1px solid ${hovered ? 'rgba(200,162,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(200,162,0,0.06)' : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
          <ConditionBadge condition={item.condition} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <StatusBadge status={item.status} />
            {item.category && (
              <span style={{
                padding: '3px 10px', borderRadius: '99px',
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#60a5fa', fontSize: '10px', fontWeight: '700',
                fontFamily: "'Inter', sans-serif",
              }}>{item.category}</span>
            )}
          </div>
        </div>

        <h3 style={{
          fontSize: '16px', fontWeight: '800', color: 'white',
          letterSpacing: '-0.02em', margin: '0 0 4px',
          fontFamily: "'Inter', sans-serif",
        }}>{item.item_name}</h3>

        {item.description && (
          <p style={{
            color: '#6b7280', fontSize: '12px', lineHeight: '1.4',
            margin: '0 0 10px', fontFamily: "'Inter', sans-serif",
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{item.description}</p>
        )}

        {item.payment_methods?.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {item.payment_methods.slice(0, 3).map((m: string) => (
              <span key={m} style={{
                padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#4b5563', fontSize: '9px', fontWeight: '600',
                fontFamily: "'Inter', sans-serif",
              }}>{m}</span>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div>
            <div style={{ color: '#4b5563', fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Price</div>
            <div style={{
              fontSize: '20px', fontWeight: '900',
              color: '#FFD700',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.03em',
            }}>
              ${Number(item.price).toFixed(2)}
            </div>
          </div>

          {isAvailable && !isOwner ? (
            <button
              onClick={(e) => { e.stopPropagation(); onBuy(item) }}
              disabled={isProcessing}
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isProcessing ? 'rgba(200,162,0,0.3)' : '#c8a200',
                color: isProcessing ? '#4b5563' : '#0a0a0a',
                fontSize: '12px',
                fontWeight: '800',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {isProcessing ? <Spinner /> : '🛒 Buy Now'}
            </button>
          ) : isOwner && isAvailable ? (
            <span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>Your Item</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Create Listing Form ──────────────────────────────────────────────────
function CreateForm({ formData, setFormData, onSubmit, onCancel }: any) {
  return (
    <div style={{
      background: 'rgba(10,10,16,0.96)',
      backdropFilter: 'blur(32px)',
      border: '1px solid rgba(200,162,0,0.18)',
      borderRadius: '24px',
      overflow: 'hidden',
      marginBottom: '28px',
      animation: 'fadeSlideDown 0.35s ease both',
    }}>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#FFD700', fontSize: '18px', fontWeight: '800', fontFamily: "'Inter', sans-serif", margin: 0 }}>🏷️ Create Listing</h3>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          >✕ Cancel</button>
        </div>

        <form onSubmit={onSubmit}>
          <InputField
            label="Item Name *"
            value={formData.item_name}
            onChange={(e: any) => setFormData({ ...formData, item_name: e.target.value })}
            placeholder="Enter item name"
            required
          />
          <InputField
            label="Price ($) *"
            value={formData.price}
            onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0.01"
            required
          />
          <InputField
            label="📱 Phone Number *"
            value={formData.seller_phone}
            onChange={(e: any) => setFormData({ ...formData, seller_phone: e.target.value })}
            placeholder="Enter phone number for payment"
            type="tel"
            required
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #c8a200, #FFD700)',
              color: '#0a0a0a',
              fontSize: '14px',
              fontWeight: '900',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 24px rgba(200,162,0,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            🚀 Post Listing
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [buyerPhone, setBuyerPhone] = useState('')
  const [error, setError] = useState('')
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    price: '',
    condition: 'Good',
    category: '',
    seller_phone: '',
    payment_methods: ['JazzCash', 'EasyPaisa'],
  })

  // ─── LOAD DATA - Only show AVAILABLE listings ──────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    let userProfileData = null
    if (user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      userProfileData = profile
      setUserProfile(profile)
    }

    // Only show AVAILABLE listings
    const { data, error } = await supabase
      .from('marketplace')
      .select('*')
      .eq('status', 'AVAILABLE')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading listings:', error)
      setListings([])
    } else {
      console.log('📦 Loaded AVAILABLE listings:', data?.length || 0)
      setListings(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Notification stays for 8 seconds ─────────────────────────────────
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // ─── Send auto message from buyer to seller ────────────────────────────
  const sendAutoMessage = async (sellerId: string, buyerId: string, itemName: string, buyerPhone: string, price: number) => {
    const messageText = `🛒 New Purchase!

I want to buy "${itemName}" for $${price}.

My phone number: ${buyerPhone}

Please contact me to complete the transaction.`

    const { error } = await supabase.from('messages').insert({
      sender_id: buyerId,
      receiver_id: sellerId,
      message_text: messageText,
      is_read: false,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('Failed to send auto message:', error)
      return false
    }
    console.log('✅ Auto message sent from buyer to seller')
    return true
  }

  // ─── CREATE LISTING ──────────────────────────────────────────────────────
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) {
      setNotification({ text: '⚠️ Please login first', type: 'error' })
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setNotification({ text: '⚠️ Please enter a valid price', type: 'error' })
      return
    }
    if (!formData.item_name.trim()) {
      setNotification({ text: '⚠️ Please enter an item name', type: 'error' })
      return
    }
    if (!formData.seller_phone.trim()) {
      setNotification({ text: '⚠️ Please enter your phone number', type: 'error' })
      return
    }

    const { error: insertError } = await supabase.from('marketplace').insert({
      seller_id: userProfile.id,
      item_name: formData.item_name.trim(),
      description: formData.description.trim(),
      price,
      condition: formData.condition,
      category: formData.category.trim() || 'Other',
      seller_phone: formData.seller_phone.trim(),
      payment_methods: formData.payment_methods,
      status: 'AVAILABLE',
    })

    if (insertError) {
      setNotification({ text: '❌ Failed: ' + insertError.message, type: 'error' })
    } else {
      setNotification({ text: '✅ Listing created successfully!', type: 'success' })
      setShowCreateForm(false)
      setFormData({ item_name: '', description: '', price: '', condition: 'Good', category: '', seller_phone: '', payment_methods: ['JazzCash', 'EasyPaisa'] })
      loadData()
    }
  }

  // ─── BUY NOW - DELETE the listing (same as admin panel) ──────────────
  const handleBuyNow = async (listing: any) => {
    if (!userProfile) {
      setNotification({ text: '⚠️ Please login first', type: 'error' })
      return
    }
    if (listing.seller_id === userProfile.id) {
      setNotification({ text: '⚠️ You cannot buy your own item', type: 'error' })
      return
    }
    if (listing.status !== 'AVAILABLE') {
      setNotification({ text: '⚠️ This item is no longer available', type: 'error' })
      return
    }

    setSelectedListing(listing)
    setShowBuyModal(true)
    setBuyerPhone('')
    setError('')
  }

  const confirmPurchase = async () => {
    if (!buyerPhone.trim() || buyerPhone.trim().length < 10) {
      setError('⚠️ Please enter a valid phone number (min 10 digits)')
      return
    }

    if (!window.confirm(`⚠️ Confirm purchase of "${selectedListing.item_name}" for $${selectedListing.price}?\n\nThis will send your phone number to the seller via auto-message and the listing will be DELETED permanently.`)) {
      return
    }

    const listing = selectedListing
    setProcessingId(listing.id)
    setShowBuyModal(false)

    try {
      // ─── 1. Send auto message from buyer to seller ──────────────────────
      const messageSent = await sendAutoMessage(
        listing.seller_id,
        userProfile.id,
        listing.item_name,
        buyerPhone.trim(),
        listing.price
      )

      if (!messageSent) {
        setNotification({ text: '⚠️ Auto-message failed, but purchase will continue', type: 'error' })
      }

      // ─── 2. DELETE the listing (SAME AS ADMIN PANEL) ────────────────────
      console.log('🗑️ DELETING listing:', listing.id)
      const { error: deleteError } = await supabase
        .from('marketplace')
        .delete()
        .eq('id', listing.id)

      if (deleteError) {
        console.error('❌ Delete failed:', deleteError)
        setNotification({ text: '❌ Failed to delete listing: ' + deleteError.message, type: 'error' })
        setProcessingId(null)
        return
      }

      console.log('✅ Listing DELETED successfully')

      // ─── 3. Create order record for admin tracking ──────────────────────
      await supabase.from('orders').insert({
        listing_id: listing.id,
        buyer_id: userProfile.id,
        seller_id: listing.seller_id,
        buyer_phone: buyerPhone.trim(),
        amount: listing.price,
        item_name: listing.item_name,
        order_status: 'pending',
        ordered_at: new Date().toISOString()
      })

      // ─── 4. IMMEDIATELY update state to remove the item ────────────────
      setListings(prev => prev.filter(item => item.id !== listing.id))
      
      // ─── 5. Reload from database to be safe ─────────────────────────────
      await loadData()

      setNotification({ 
        text: `✅ Purchase confirmed! Auto-message sent to seller with your phone number. The listing has been DELETED permanently.`, 
        type: 'success' 
      })
      
    } catch (err: any) {
      console.error('❌ Purchase error:', err)
      setNotification({ text: '❌ Error: ' + err.message, type: 'error' })
    } finally {
      setProcessingId(null)
    }
  }

  const openDetail = (listing: any) => { setSelectedListing(listing); setShowDetail(true) }
  const closeDetail = () => { setShowDetail(false); setSelectedListing(null) }

  // ─── BUY MODAL ───────────────────────────────────────────────────────────
  const renderBuyModal = () => {
    if (!showBuyModal || !selectedListing) return null

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease both',
        }}
        onClick={() => setShowBuyModal(false)}
      >
        <div
          style={{
            background: 'rgba(10,10,16,0.98)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(200,162,0,0.2)',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '32px',
            animation: 'modalIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#FFD700', fontSize: '20px', fontWeight: 'bold' }}>
              🛒 Confirm Purchase
            </h3>
            <button
              onClick={() => setShowBuyModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#aaa', fontSize: '14px' }}>
              You are about to purchase <strong style={{ color: 'white' }}>"{selectedListing.item_name}"</strong>
            </p>
            <p style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
              ${Number(selectedListing.price).toFixed(2)}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <InputField
              label="📱 Your Phone Number *"
              value={buyerPhone}
              onChange={(e: any) => setBuyerPhone(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
              required
            />
            <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
              This will be auto-sent to the seller via message.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.2)',
              borderRadius: '8px',
              color: '#ff4444',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div style={{
            background: 'rgba(255,68,68,0.05)',
            border: '1px solid rgba(255,68,68,0.15)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold' }}>
                Your phone number will be sent to the seller
              </p>
              <p style={{ color: '#888', fontSize: '11px' }}>
                The listing will be DELETED permanently after confirmation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowBuyModal(false)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid #333',
                color: '#666',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmPurchase}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                color: '#0a0a0a',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Confirm & Buy
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── NOTIFICATION BANNER ────────────────────────────────────────────────
  const renderNotification = () => {
    if (!notification) return null

    const colors = {
      success: { bg: 'rgba(82,192,122,0.08)', border: 'rgba(82,192,122,0.2)', text: '#52c07a' },
      error: { bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.2)', text: '#ff4444' },
      info: { bg: 'rgba(200,162,0,0.08)', border: 'rgba(200,162,0,0.2)', text: '#c8a200' }
    }

    const config = colors[notification.type] || colors.info

    return (
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        padding: '12px 24px',
        background: 'rgba(10,10,16,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${config.border}`,
        borderRadius: '12px',
        color: config.text,
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        animation: 'fadeSlideUp 0.3s ease both',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        {notification.text}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      padding: '40px 24px',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {renderNotification()}
      {renderBuyModal()}

      <div style={{ maxWidth: '1060px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.04em', margin: 0, fontFamily: "'Inter', sans-serif" }}>
              🛒 Marketplace
            </h1>
            <p style={{ color: '#4b5563', margin: '4px 0 0', fontFamily: "'Inter', sans-serif" }}>
              {listings.length} available
            </p>
          </div>
          <SellButton active={showCreateForm} onToggle={() => setShowCreateForm(!showCreateForm)} />
        </div>

        {showCreateForm && (
          <CreateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateListing}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading...</div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'rgba(12,12,18,0.9)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, fontFamily: "'Inter', sans-serif" }}>No listings available</h3>
            <p style={{ color: '#4b5563', margin: '8px 0 20px', fontFamily: "'Inter', sans-serif" }}>Be the first to sell something!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '12px 28px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                color: '#0a0a0a',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              🏷️ Sell First Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                isOwner={item.seller_id === userProfile?.id}
                isProcessing={processingId === item.id}
                onBuy={handleBuyNow}
                onOpen={openDetail}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <span style={{ color: '#374151', fontSize: '11px', fontWeight: '500', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>
            TEAMSYNK · SECURE TRADING
          </span>
        </div>
      </div>

      {showDetail && selectedListing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={closeDetail}
        >
          <div
            style={{
              background: 'rgba(10,10,16,0.98)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(200,162,0,0.2)',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{selectedListing.item_name}</h2>
              <button onClick={closeDetail} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <StatusBadge status={selectedListing.status} />

            {selectedListing.description && (
              <p style={{ color: '#aaa', fontSize: '14px', margin: '16px 0' }}>{selectedListing.description}</p>
            )}

            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFD700', marginBottom: '16px' }}>
              ${Number(selectedListing.price).toFixed(2)}
            </div>

            {selectedListing.seller_phone && (
              <p style={{ color: '#888', fontSize: '13px' }}>
                📱 Seller: {selectedListing.seller_phone}
              </p>
            )}

            {selectedListing.status === 'AVAILABLE' && selectedListing.seller_id !== userProfile?.id && (
              <button
                onClick={() => { closeDetail(); handleBuyNow(selectedListing) }}
                disabled={processingId === selectedListing.id}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #c8a200, #FFD700)',
                  color: '#0a0a0a',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '16px'
                }}
              >
                🛒 Buy Now
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.3); border-radius: 3px; }
      `}</style>
    </div>
  )
}