import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('status')
          .eq('id', session.user.id)
          .single()

        if (profile?.status === 'suspended') {
          setIsSuspended(true)
          await supabase.auth.signOut()
          setUser(null)
        } else {
          setUser(session.user)
          setIsSuspended(false)
        }
      } else {
        setUser(null)
        setIsSuspended(false)
      }
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('status')
          .eq('id', session.user.id)
          .single()

        if (profile?.status === 'suspended') {
          setIsSuspended(true)
          await supabase.auth.signOut()
          setUser(null)
        } else {
          setUser(session.user)
          setIsSuspended(false)
        }
      } else {
        setUser(null)
        setIsSuspended(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, isSuspended }
}