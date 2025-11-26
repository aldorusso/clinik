"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"

// Parse JWT to get expiration time
function parseJwt(token: string): { exp: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// Get time until token expires in milliseconds
function getTimeUntilExpiry(token: string): number {
  const payload = parseJwt(token)
  if (!payload) return 0
  const expiryTime = payload.exp * 1000 // Convert to milliseconds
  return expiryTime - Date.now()
}

interface UseSessionCheckOptions {
  checkIntervalMs?: number  // How often to check token validity (default: 60 seconds)
  warningBeforeMs?: number  // Show warning this many ms before expiry (default: 5 minutes)
}

interface SessionState {
  isExpired: boolean
  isExpiringSoon: boolean
  timeUntilExpiry: number
  isRefreshing: boolean
}

export function useSessionCheck(options: UseSessionCheckOptions = {}) {
  const {
    checkIntervalMs = 60 * 1000, // Check every minute
    warningBeforeMs = 5 * 60 * 1000, // Warn 5 minutes before expiry
  } = options

  const router = useRouter()
  const [sessionState, setSessionState] = useState<SessionState>({
    isExpired: false,
    isExpiringSoon: false,
    timeUntilExpiry: Infinity,
    isRefreshing: false,
  })
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const checkSession = useCallback(() => {
    const token = auth.getToken()

    if (!token) {
      setSessionState({
        isExpired: true,
        isExpiringSoon: false,
        timeUntilExpiry: 0,
        isRefreshing: false,
      })
      return
    }

    const timeUntilExpiry = getTimeUntilExpiry(token)

    if (timeUntilExpiry <= 0) {
      setSessionState({
        isExpired: true,
        isExpiringSoon: false,
        timeUntilExpiry: 0,
        isRefreshing: false,
      })
    } else if (timeUntilExpiry <= warningBeforeMs) {
      setSessionState((prev) => ({
        ...prev,
        isExpired: false,
        isExpiringSoon: true,
        timeUntilExpiry,
      }))
    } else {
      setSessionState({
        isExpired: false,
        isExpiringSoon: false,
        timeUntilExpiry,
        isRefreshing: false,
      })
    }
  }, [warningBeforeMs])

  const extendSession = useCallback(async () => {
    const token = auth.getToken()
    if (!token) return false

    setSessionState((prev) => ({ ...prev, isRefreshing: true }))

    try {
      const response = await api.refreshToken(token)
      auth.setToken(response.access_token)
      setSessionState({
        isExpired: false,
        isExpiringSoon: false,
        timeUntilExpiry: getTimeUntilExpiry(response.access_token),
        isRefreshing: false,
      })
      return true
    } catch {
      setSessionState((prev) => ({ ...prev, isRefreshing: false }))
      return false
    }
  }, [])

  const logout = useCallback(() => {
    auth.removeToken()
    router.push("/")
  }, [router])

  const dismissWarning = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      isExpiringSoon: false,
    }))
  }, [])

  // Set up interval to check session
  useEffect(() => {
    // Initial check
    checkSession()

    // Set up periodic check
    checkIntervalRef.current = setInterval(checkSession, checkIntervalMs)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkSession, checkIntervalMs])

  return {
    ...sessionState,
    extendSession,
    logout,
    dismissWarning,
    checkSession,
  }
}
