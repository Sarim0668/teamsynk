import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

const PAYMENT_METHODS = ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'Cash on Delivery', 'Rocket', 'UPaisa']

// ─── Status Badge Component ──────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, any> = {
    'AVAILABLE': { label: '🟢 Available', color: '#4ade80', bg: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
    'ORDERED': { label: '🟡 Order Pending', color: '#eab308', bg: 'rgba(234,179,8,0.1)', borderColor: 'rgba(234,179,8,0.3)' },
    'SOLD': { label: '✅ Sold', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' },
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

// ─── Condition Badge ──────────────────────────────────────────────────────────
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

// ─── Input Components ────────────────────────────────────────────────────────
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

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={{ color: '#6b7280', fontSize: '11px', fontWeight: '700', marginBottom: '4px', display: 'block', fontFamily: "'Inter', sans-serif" }}>{label}</label>}
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '12px 16px',
          background: focused ? 'rgba(200,162,0,0.05)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(200,162,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '12px', color: '#f9fafb', fontSize: '14px',
          fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical',
          transition: 'all 0.22s ease',
        }}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, children }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={{ color: '#6b7280', fontSize: '11px', fontWeight: '700', marginBottom: '4px', display: 'block', fontFamily: "'Inter', sans-serif" }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '12px 40px 12px 16px',
            background: focused ? 'rgba(200,162,0,0.05)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? 'rgba(200,162,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px', color: '#f9fafb', fontSize: '14px',
            fontFamily: "'Inter', sans-serif", outline: 'none', appearance: 'none',
            cursor: 'pointer', transition: 'all 0.22s ease',
          }}
        >{children}</select>
        <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#4b5563' }}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(12,12,18,0.9)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)', padding: '22px' }}>
      <div style={{ height: 12, width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 12, width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 36, background: 'rgba(200,162,0,0.05)', borderRadius: 10 }} />
    </div>
  )
}

// ─── Sell Button ──────────────────────────────────────────────────────────────
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

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ item, isOwner, isBuyer, isProcessing, onBuy, onConfirm, onCancel, onOpen }: any) {
  const [hovered, setHovered] = useState(false)
  const isOrdered = item.status === 'ORDERED'
  const isSold = item.status === 'SOLD'
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
        border: `1px solid ${isOrdered ? 'rgba(234,179,8,0.4)' : isSold ? 'rgba(34,197,94,0.15)' : hovered ? 'rgba(200,162,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
        overflow: 'hidden',
        cursor: isSold ? 'default' : 'pointer',
        transition: 'all 0.35s ease',
        transform: hovered && !isSold ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && !isSold ? '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(200,162,0,0.06)' : '0 4px 20px rgba(0,0,0,0.3)',
        opacity: isSold ? 0.5 : isOrdered ? 0.85 : 1,
        pointerEvents: isSold ? 'none' : 'auto',
      }}
    >
      {/* Order overlay indicator */}
      {isOrdered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(234,179,8,0.04)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}

      <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        {/* Top row: badges */}
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

        {/* Name */}
        <h3 style={{
          fontSize: '16px', fontWeight: '800', color: 'white',
          letterSpacing: '-0.02em', margin: '0 0 4px',
          fontFamily: "'Inter', sans-serif",
        }}>{item.item_name}</h3>

        {/* Description */}
        {item.description && (
          <p style={{
            color: '#6b7280', fontSize: '12px', lineHeight: '1.4',
            margin: '0 0 10px', fontFamily: "'Inter', sans-serif",
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{item.description}</p>
        )}

        {/* ORDERED status message */}
        {isOrdered && (
          <div style={{
            background: 'rgba(234,179,8,0.1)',
            border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '12px',
          }}>
            <p style={{
              color: '#eab308',
              fontSize: '11px',
              fontWeight: '700',
              margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}>
              {isOwner ? '🟡 Buyer placed order - Confirm payment to complete' : '🟡 Order placed - Waiting for seller confirmation'}
            </p>
            {item.ordered_at && (
              <p style={{ color: '#4b5563', fontSize: '9px', margin: '2px 0 0 0', fontFamily: "'Inter', sans-serif" }}>
                {new Date(item.ordered_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Payment methods */}
        {item.payment_methods?.length > 0 && !isSold && (
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

        {/* Footer: Price + Actions */}
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
              color: isSold ? '#4b5563' : '#FFD700',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.03em',
            }}>
              ${Number(item.price).toFixed(2)}
            </div>
          </div>

          {/* Action Buttons */}
          {isSold ? (
            <span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>✅ Sold</span>
          ) : isOrdered && isOwner ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onConfirm(item) }}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isProcessing ? 'rgba(34,197,94,0.2)' : '#22c55e',
                  color: '#0a0a0a',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isProcessing ? <Spinner /> : '✅'} Confirm
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(item) }}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'transparent',
                  color: '#f87171',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s ease',
                }}
              >
                ❌ Cancel
              </button>
            </div>
          ) : isAvailable && !isOwner ? (
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
          ) : isOrdered && isBuyer ? (
            <span style={{ color: '#eab308', fontSize: '12px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>⏳ Pending</span>
          ) : isOwner && isAvailable ? (
            <span style={{ color: '#4b5563', fontSize: '12px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>Your Item</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ listing, userProfile, onClose, onBuy, onConfirm, onCancel, processingId }: any) {
  const isOwner = listing.seller_id === userProfile?.id
  const isBuyer = listing.buyer_id === userProfile?.id
  const isOrdered = listing.status === 'ORDERED'
  const isAvailable = listing.status === 'AVAILABLE'
  const isSold = listing.status === 'SOLD'
  const isProcessing = processingId === listing.id

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(10,10,16,0.98)',
          backdropFilter: 'blur(40px)',
          border: `1px solid ${isOrdered ? 'rgba(234,179,8,0.4)' : isSold ? 'rgba(34,197,94,0.2)' : 'rgba(200,162,0,0.2)'}`,
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
          animation: 'modalIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
          opacity: isSold ? 0.6 : 1,
        }}
      >
        <div style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <ConditionBadge condition={listing.condition} />
                <StatusBadge status={listing.status} />
                {listing.category && (
                  <span style={{
                    padding: '3px 10px', borderRadius: '99px',
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60a5fa', fontSize: '10px', fontWeight: '700',
                    fontFamily: "'Inter', sans-serif",
                  }}>{listing.category}</span>
                )}
              </div>
              <h2 style={{
                fontSize: '24px', fontWeight: '900',
                color: 'white', letterSpacing: '-0.03em',
                margin: 0, fontFamily: "'Inter', sans-serif",
              }}>{listing.item_name}</h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36,
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#6b7280', fontSize: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e5e7eb' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#6b7280' }}
            >✕</button>
          </div>

          {/* Description */}
          {listing.description && (
            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px', fontFamily: "'Inter', sans-serif" }}>
              {listing.description}
            </p>
          )}

          {/* Order Info */}
          {isOrdered && (
            <div style={{
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <p style={{
                color: '#eab308',
                fontSize: '14px',
                fontWeight: '700',
                margin: 0,
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>🟡</span>
                {isOwner ? 'Order Placed - Awaiting Your Confirmation' : 'Order Placed - Waiting for Seller'}
              </p>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '6px 0 0 0', fontFamily: "'Inter', sans-serif" }}>
                {isOwner 
                  ? 'Confirm payment received to complete the sale.' 
                  : 'Please pay the seller using the contact details below.'}
              </p>
              {listing.ordered_at && (
                <p style={{ color: '#4b5563', fontSize: '10px', margin: '8px 0 0 0', fontFamily: "'Inter', sans-serif" }}>
                  Ordered: {new Date(listing.ordered_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Contact Info */}
          {!isSold && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>📱</span>
                <div>
                  <div style={{ color: '#4b5563', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Seller Contact</div>
                  <div style={{ color: '#FFD700', fontSize: '16px', fontWeight: '800', fontFamily: "'Inter', sans-serif" }}>
                    {listing.seller_phone || 'Not provided'}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ color: '#4b5563', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", marginBottom: '6px' }}>
                  Accepted Payment Methods
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(listing.payment_methods || ['JazzCash', 'EasyPaisa']).map((m: string) => (
                    <span key={m} style={{
                      padding: '4px 12px', borderRadius: '99px',
                      background: 'rgba(200,162,0,0.08)',
                      border: '1px solid rgba(200,162,0,0.2)',
                      color: '#c8a200',
                      fontSize: '11px', fontWeight: '700',
                      fontFamily: "'Inter', sans-serif",
                    }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Price + Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{ color: '#4b5563', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Total Price</div>
              <div style={{
                fontSize: '32px', fontWeight: '900',
                color: isSold ? '#4b5563' : '#FFD700',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.04em',
              }}>
                ${Number(listing.price).toFixed(2)}
              </div>
            </div>

            {isSold ? (
              <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: '800', fontFamily: "'Inter', sans-serif" }}>✅ Sold</span>
            ) : isOrdered && isOwner ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                <button
                  onClick={() => { onClose(); onConfirm(listing) }}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isProcessing ? 'rgba(34,197,94,0.2)' : '#22c55e',
                    color: '#0a0a0a',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isProcessing ? <Spinner /> : '✅'} Confirm Payment
                </button>
                <button
                  onClick={() => { onClose(); onCancel(listing) }}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'transparent',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  ❌ Cancel Order
                </button>
              </div>
            ) : isAvailable && !isOwner ? (
              <button
                onClick={() => { onClose(); onBuy(listing) }}
                disabled={isProcessing}
                style={{
                  padding: '12px 28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: isProcessing ? 'rgba(200,162,0,0.3)' : '#c8a200',
                  color: isProcessing ? '#4b5563' : '#0a0a0a',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.25s ease',
                }}
              >
                {isProcessing ? <Spinner /> : '🛒'} Buy Now
              </button>
            ) : isOrdered && isBuyer ? (
              <span style={{ color: '#eab308', fontSize: '16px', fontWeight: '800', fontFamily: "'Inter', sans-serif" }}>⏳ Pending</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Listing Form ──────────────────────────────────────────────────────
function CreateForm({ formData, setFormData, onSubmit, onCancel, togglePayment }: any) {
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
          <TextAreaField
            label="Description"
            value={formData.description}
            onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the item"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            <SelectField
              label="Condition"
              value={formData.condition}
              onChange={(e: any) => setFormData({ ...formData, condition: e.target.value })}
            >
              <option value="New">🆕 New</option>
              <option value="Like New">✨ Like New</option>
              <option value="Good">👍 Good</option>
              <option value="Fair">👌 Fair</option>
              <option value="Poor">🔧 Poor</option>
            </SelectField>
          </div>
          <InputField
            label="Category"
            value={formData.category}
            onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g. Football, Cricket"
          />
          <InputField
            label="📱 Phone Number *"
            value={formData.seller_phone}
            onChange={(e: any) => setFormData({ ...formData, seller_phone: e.target.value })}
            placeholder="Enter phone number for payment"
            type="tel"
            required
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#6b7280', fontSize: '11px', fontWeight: '700', marginBottom: '6px', display: 'block', fontFamily: "'Inter', sans-serif" }}>
              💳 Accepted Payment Methods
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PAYMENT_METHODS.map(m => (
                <label
                  key={m}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    cursor: 'pointer',
                    background: formData.payment_methods.includes(m) ? 'rgba(200,162,0,0.12)' : 'transparent',
                    border: `1px solid ${formData.payment_methods.includes(m) ? 'rgba(200,162,0,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    color: formData.payment_methods.includes(m) ? '#FFD700' : '#6b7280',
                    fontSize: '12px',
                    fontWeight: '700',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.22s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.payment_methods.includes(m)}
                    onChange={() => togglePayment(m)}
                    style={{ display: 'none' }}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

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

// ─── Main Marketplace Component ──────────────────────────────────────────────
export const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    item_name: '', description: '', price: '', condition: 'Good',
    category: '', seller_phone: '', payment_methods: ['JazzCash', 'EasyPaisa'],
  })

  // ─── Load Data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      setUserProfile(profile)
    }

    const { data, error: listingsError } = await supabase
      .from('marketplace')
      .select('*')
      .in('status', ['AVAILABLE', 'ORDERED'])
      .order('created_at', { ascending: false })

    if (listingsError) {
      console.error('Error loading listings:', listingsError)
      setError('Failed to load listings')
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Create Listing ─────────────────────────────────────────────────────────
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!userProfile) { setError('Please login first'); return }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) { setError('Please enter a valid price'); return }
    if (!formData.item_name.trim()) { setError('Please enter an item name'); return }
    if (!formData.seller_phone.trim()) { setError('Please enter your phone number'); return }

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
      setError('Failed to create listing: ' + insertError.message)
    } else {
      alert('✅ Listing created successfully!')
      setShowCreateForm(false)
      setFormData({ item_name: '', description: '', price: '', condition: 'Good', category: '', seller_phone: '', payment_methods: ['JazzCash', 'EasyPaisa'] })
      loadData()
    }
  }

  // ─── Place Order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async (listing: any) => {
    if (!userProfile) { alert('⚠️ Please login first'); return }
    if (listing.seller_id === userProfile.id) { alert('⚠️ You cannot buy your own item'); return }
    if (listing.status !== 'AVAILABLE') { alert('⚠️ This item is no longer available'); return }

    setProcessingId(listing.id)

    const paymentMethods = listing.payment_methods || ['JazzCash', 'EasyPaisa']
    const phoneNumber = listing.seller_phone || 'Not provided'

    const confirm = window.confirm(
      `Place order for "${listing.item_name}" for $${listing.price}?\n\n` +
      `📱 Seller: ${phoneNumber}\n` +
      `💳 Payment: ${paymentMethods.join(', ')}\n\n` +
      `⚠️ Seller must confirm payment to complete.`
    )

    if (!confirm) { setProcessingId(null); return }

    const { error: updateError } = await supabase
      .from('marketplace')
      .update({
        status: 'ORDERED',
        buyer_id: userProfile.id,
        ordered_at: new Date().toISOString(),
        order_status: 'pending'
      })
      .eq('id', listing.id)

    if (updateError) {
      alert('❌ Failed to place order: ' + updateError.message)
      setProcessingId(null)
      return
    }

    await supabase.from('orders').insert({
      listing_id: listing.id,
      buyer_id: userProfile.id,
      seller_id: listing.seller_id,
      amount: listing.price,
      order_status: 'pending',
      ordered_at: new Date().toISOString()
    })

    alert(`✅ Order placed!\n\n📱 Contact seller: ${phoneNumber}\n💳 Pay via: ${paymentMethods.join(', ')}\n\n⏳ Waiting for seller confirmation.`)
    setProcessingId(null)
    loadData()
  }

  // ─── Confirm Payment ────────────────────────────────────────────────────────
  const handleConfirmPayment = async (listing: any) => {
    if (!window.confirm(`Confirm payment received for "${listing.item_name}"?\nThis will mark it as SOLD.`)) return

    setProcessingId(listing.id)

    const { error: updateError } = await supabase
      .from('marketplace')
      .update({
        status: 'SOLD',
        seller_confirmed: true,
        sold_at: new Date().toISOString(),
        order_status: 'completed'
      })
      .eq('id', listing.id)

    if (updateError) {
      alert('❌ Failed to confirm: ' + updateError.message)
      setProcessingId(null)
      return
    }

    await supabase
      .from('orders')
      .update({
        order_status: 'completed',
        confirmed_at: new Date().toISOString()
      })
      .eq('listing_id', listing.id)

    alert(`✅ "${listing.item_name}" marked as SOLD!`)
    setProcessingId(null)
    loadData()
  }

  // ─── Cancel Order ───────────────────────────────────────────────────────────
  const handleCancelOrder = async (listing: any) => {
    if (!window.confirm(`Cancel order for "${listing.item_name}"?\nItem will return to AVAILABLE.`)) return

    setProcessingId(listing.id)

    const { error: updateError } = await supabase
      .from('marketplace')
      .update({
        status: 'AVAILABLE',
        buyer_id: null,
        ordered_at: null,
        order_status: null,
        seller_confirmed: false
      })
      .eq('id', listing.id)

    if (updateError) {
      alert('❌ Failed to cancel: ' + updateError.message)
      setProcessingId(null)
      return
    }

    await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('listing_id', listing.id)

    alert(`✅ Order cancelled. "${listing.item_name}" is available again.`)
    setProcessingId(null)
    loadData()
  }

  const togglePaymentMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter((m: string) => m !== method)
        : [...prev.payment_methods, method]
    }))
  }

  const openDetail = (listing: any) => { setSelectedListing(listing); setShowDetail(true) }
  const closeDetail = () => { setShowDetail(false); setSelectedListing(null) }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0F',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
      padding: '40px 24px',
      position: 'relative',
    }}>
      {/* Ambient Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(200,162,0,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1060px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.04em', margin: 0, fontFamily: "'Inter', sans-serif" }}>
              🛒 Marketplace
            </h1>
            <p style={{ color: '#4b5563', margin: '4px 0 0', fontFamily: "'Inter', sans-serif" }}>
              {listings.length} item{listings.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <SellButton active={showCreateForm} onToggle={() => setShowCreateForm(!showCreateForm)} />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '14px 20px',
            borderRadius: '14px',
            marginBottom: '20px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: "'Inter', sans-serif",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <CreateForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateListing}
            onCancel={() => setShowCreateForm(false)}
            togglePayment={togglePaymentMethod}
          />
        )}

        {/* Listings Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'rgba(12,12,18,0.9)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, fontFamily: "'Inter', sans-serif" }}>No listings yet</h3>
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
                isBuyer={item.buyer_id === userProfile?.id}
                isProcessing={processingId === item.id}
                onBuy={handlePlaceOrder}
                onConfirm={handleConfirmPayment}
                onCancel={handleCancelOrder}
                onOpen={openDetail}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <span style={{ color: '#374151', fontSize: '11px', fontWeight: '500', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>
            TEAMSYNK · SECURE TRADING
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedListing && (
        <DetailModal
          listing={selectedListing}
          userProfile={userProfile}
          onClose={closeDetail}
          onBuy={handlePlaceOrder}
          onConfirm={handleConfirmPayment}
          onCancel={handleCancelOrder}
          processingId={processingId}
        />
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0D0F; }
        ::-webkit-scrollbar-thumb { background: rgba(200,162,0,0.3); border-radius: 3px; }
      `}</style>
    </div>
  )
}