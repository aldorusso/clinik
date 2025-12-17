"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { User, api } from "@/lib/api"
import { auth } from "@/lib/auth"

interface UserContextType {
  user: User | null
  loading: boolean
  refetch: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
  requiredRole?: string | string[]
  redirectTo?: string
}

export function UserProvider({ children, requiredRole, redirectTo = "/" }: UserProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push(redirectTo)
      return
    }

    try {
      const userData = await api.getCurrentUser(token)
      setUser(userData)

      // Check role requirements
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!roles.includes(userData.role)) {
          // Redirect based on role
          if (userData.role === "tenant_admin") {
            router.push("/dashboard/admin")
          } else if (userData.role === "superadmin") {
            router.push("/dashboard/superadmin")
          } else {
            router.push("/dashboard")
          }
          return
        }
      }

      setLoading(false)
    } catch (error) {
      auth.removeToken()
      router.push(redirectTo)
    }
  }

  useEffect(() => {
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refetch = async () => {
    setLoading(true)
    await loadUser()
  }

  return (
    <UserContext.Provider value={{ user, loading, refetch }}>
      {children}
    </UserContext.Provider>
  )
}
