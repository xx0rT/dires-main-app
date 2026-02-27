import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useActivityTracker(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    const updateActivity = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)
    }

    updateActivity()

    const interval = setInterval(updateActivity, 60000)

    return () => clearInterval(interval)
  }, [userId])
}
