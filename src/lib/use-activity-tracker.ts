import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './auth-context'
import { supabase } from './supabase'

function generateSessionId(): string {
  const stored = sessionStorage.getItem('activity_session_id')
  if (stored) return stored
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  sessionStorage.setItem('activity_session_id', id)
  return id
}

function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return 'mobile'
  if (/Tablet|iPad/i.test(ua)) return 'tablet'
  return 'desktop'
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Domovska stranka',
  '/kurzy': 'Kurzy',
  '/blog': 'Blog',
  '/obchod': 'Obchod',
  '/tym': 'Tym',
  '/reference': 'Reference',
  '/prihlaseni': 'Prihlaseni',
  '/registrace': 'Registrace',
  '/prehled': 'Dashboard',
  '/admin': 'Admin Panel',
}

function resolvePageTitle(path: string): string {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path]
  if (path.startsWith('/admin')) return 'Admin'
  if (path.startsWith('/prehled')) return 'Dashboard'
  if (path.startsWith('/kurz/')) return 'Detail kurzu'
  if (path.startsWith('/blog/')) return 'Blog clanek'
  if (path.startsWith('/obchod/')) return 'Produkt'
  return path
}

const FLUSH_INTERVAL = 30_000
const MIN_DURATION = 2

export function useActivityTracker() {
  const { user } = useAuth()
  const location = useLocation()
  const sessionId = useRef(generateSessionId())
  const pageEnteredAt = useRef(Date.now())
  const lastPath = useRef('')
  const queueRef = useRef<Array<Record<string, unknown>>>([])
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return
    const batch = [...queueRef.current]
    queueRef.current = []

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('user_activity').insert(batch)
      }
    } catch {
      queueRef.current.unshift(...batch)
    }
  }, [])

  const trackEvent = useCallback(
    (eventType: string, extras: Record<string, unknown> = {}) => {
      const entry = {
        user_id: user?.id ?? null,
        session_id: sessionId.current,
        event_type: eventType,
        page_path: location.pathname,
        page_title: resolvePageTitle(location.pathname),
        referrer: document.referrer || '',
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        duration_seconds: 0,
        metadata: extras,
      }
      queueRef.current.push(entry)

      if (queueRef.current.length >= 10) {
        flush()
      }
    },
    [user, location.pathname, flush]
  )

  useEffect(() => {
    if (location.pathname === lastPath.current) return

    if (lastPath.current) {
      const duration = Math.round((Date.now() - pageEnteredAt.current) / 1000)
      if (duration >= MIN_DURATION) {
        queueRef.current.push({
          user_id: user?.id ?? null,
          session_id: sessionId.current,
          event_type: 'page_view',
          page_path: lastPath.current,
          page_title: resolvePageTitle(lastPath.current),
          referrer: document.referrer || '',
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          duration_seconds: duration,
          metadata: {},
        })
      }
    }

    lastPath.current = location.pathname
    pageEnteredAt.current = Date.now()

    if (!queueRef.current.some(e => e.event_type === 'session_start' && e.session_id === sessionId.current)) {
      trackEvent('session_start')
    }
  }, [location.pathname, user, trackEvent])

  useEffect(() => {
    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL)

    const handleBeforeUnload = async () => {
      const duration = Math.round((Date.now() - pageEnteredAt.current) / 1000)
      if (duration >= MIN_DURATION && lastPath.current) {
        queueRef.current.push({
          user_id: user?.id ?? null,
          session_id: sessionId.current,
          event_type: 'page_view',
          page_path: lastPath.current,
          page_title: resolvePageTitle(lastPath.current),
          referrer: '',
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          duration_seconds: duration,
          metadata: {},
        })
      }
      trackEvent('session_end')

      if (queueRef.current.length > 0 && user) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_activity`, {
              method: 'POST',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(queueRef.current)
            })
          }
        } catch (error) {
          console.error('Failed to flush activity:', error)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flush()
    }
  }, [user, flush, trackEvent])

  return { trackEvent }
}
