/**
 * TeamSynk — useScrollReveal Hook
 * 
 * Attaches IntersectionObserver to elements with .ts-reveal (and variants).
 * Call this ONCE in your App.tsx or a layout wrapper component.
 * 
 * Usage in App.tsx:
 *   import { useScrollReveal } from './hooks/useScrollReveal'
 *   function App() {
 *     useScrollReveal()
 *     return <Router>...</Router>
 *   }
 * 
 * Then add classes to any element:
 *   <div className="ts-reveal">Fades up on scroll</div>
 *   <div className="ts-reveal-left">Slides in from right</div>
 *   <div className="ts-reveal-right">Slides in from left</div>
 *   <div className="ts-reveal-scale">Scales in</div>
 *   <div className="ts-stagger">
 *     <div className="ts-reveal">Child 1 (0ms delay)</div>
 *     <div className="ts-reveal">Child 2 (70ms delay)</div>
 *     <div className="ts-reveal">Child 3 (140ms delay)</div>
 *   </div>
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollReveal() {
  const location = useLocation()

  useEffect(() => {
    const SELECTOR = '.ts-reveal, .ts-reveal-left, .ts-reveal-right, .ts-reveal-scale, .ts-reveal-fade'

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('ts-visible')
            // Don't unobserve — keep visible once triggered
          }
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    // Small delay to let the new page render
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(SELECTOR)
      elements.forEach((el) => {
        // If already in viewport on page load, make visible immediately
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.95) {
          el.classList.add('ts-visible')
        } else {
          observer.observe(el)
        }
      })
    }, 50)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [location.pathname]) // Re-run on route change
}


/**
 * ═══════════════════════════════════════════════════════════════
 * HOW TO WIRE EVERYTHING TOGETHER — App.tsx Integration
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. IMPORT THE CSS (once, in App.tsx or index.tsx):
 *
 *    import './premiumMotion.css'
 *
 *
 * 2. IMPORT AND RENDER COMPONENTS:
 *
 *    import { Navbar }         from './components/Navbar/Navbar'
 *    import { ParticleSystem } from './components/ParticleSystem/ParticleSystem'
 *    import { useScrollReveal } from './hooks/useScrollReveal'
 *
 *
 * 3. YOUR App.tsx SHOULD LOOK LIKE THIS:
 *
 *    import React from 'react'
 *    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
 *    import './premiumMotion.css'
 *    import { Navbar }         from './components/Navbar/Navbar'
 *    import { ParticleSystem } from './components/ParticleSystem/ParticleSystem'
 *    import { useScrollReveal } from './hooks/useScrollReveal'
 *    // ... your page imports
 *
 *    function AppInner() {
 *      useScrollReveal() // ← activates scroll reveal on every route change
 *      return (
 *        <>
 *          {/* Particle system — fixed, behind everything *\/}
 *          <ParticleSystem />
 *
 *          {/* Background blobs — CSS-only *\/}
 *          <div className="ts-bg-blobs" />
 *          <div className="ts-bg-spotlight" />
 *
 *          {/* Navbar *\/}
 *          <Navbar />
 *
 *          {/* Page content *\/}
 *          <main style={{ position: 'relative', zIndex: 1 }}>
 *            <Routes>
 *              <Route path="/dashboard"       element={<Dashboard />} />
 *              <Route path="/find-players"    element={<FindPlayers />} />
 *              <Route path="/browse-sessions" element={<BrowseSessions />} />
 *              <Route path="/marketplace"     element={<Marketplace />} />
 *              <Route path="/create-session"  element={<CreateSession />} />
 *              <Route path="/profile"         element={<Profile />} />
 *              {/* ...all your other routes *\/}
 *            </Routes>
 *          </main>
 *        </>
 *      )
 *    }
 *
 *    export default function App() {
 *      return (
 *        <Router>
 *          <AppInner />
 *        </Router>
 *      )
 *    }
 *
 *
 * 4. FILE PLACEMENT:
 *
 *    src/
 *    ├── components/
 *    │   ├── Navbar/
 *    │   │   └── Navbar.tsx           ← drop Navbar.tsx here
 *    │   └── ParticleSystem/
 *    │       └── ParticleSystem.tsx   ← drop ParticleSystem.tsx here
 *    ├── hooks/
 *    │   └── useScrollReveal.ts       ← THIS file (remove JSDoc comments, keep the hook)
 *    ├── premiumMotion.css             ← drop premiumMotion.css here
 *    └── App.tsx                      ← wire as shown above
 *
 *
 * 5. USING CSS CLASSES IN YOUR EXISTING PAGES (optional enhancement):
 *
 *    Instead of inline styles, you can sprinkle these classes:
 *
 *    Scroll reveal:
 *      <div className="ts-reveal">...</div>
 *      <div className="ts-reveal-left">...</div>
 *
 *    Staggered group:
 *      <div className="ts-stagger">
 *        <Card className="ts-reveal" />
 *        <Card className="ts-reveal" />
 *      </div>
 *
 *    Gold button:
 *      <button className="ts-btn-gold">Create Session</button>
 *
 *    Ghost button:
 *      <button className="ts-btn-ghost">View All</button>
 *
 *    Card with hover:
 *      <div className="ts-card">...</div>
 *
 *    Input:
 *      <input className="ts-input" />
 *
 *    Badge:
 *      <span className="ts-badge-gold">Premium</span>
 *      <span className="ts-badge-success">Open</span>
 *      <span className="ts-badge-danger">Full</span>
 *
 *    Gold text:
 *      <h1 className="ts-gold-text">TeamSynk</h1>
 *      <h1 className="ts-gold-text-shimmer">Live</h1>
 *
 *    Floating element:
 *      <div className="ts-float">...</div>
 *
 *    Skeleton loader:
 *      <div className="ts-skeleton" style={{ width: '200px', height: '20px' }} />
 *
 *    Divider:
 *      <hr className="ts-divider" />
 *
 *
 * 6. NAVBAR NOTES:
 *
 *    The Navbar auto-detects active routes via useLocation().
 *    Update the navItems array in Navbar.tsx if your routes differ.
 *    The ProfileMenu calls supabase.auth.signOut() — same as your existing logout.
 *    The logo renders "TS" text — replace with your <img> tag if you have a logo file.
 *
 *    To use your actual logo image, in Navbar.tsx find the TS text span and replace with:
 *      <img src={IMAGES.logo} alt="TeamSynk" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
 */

export {}