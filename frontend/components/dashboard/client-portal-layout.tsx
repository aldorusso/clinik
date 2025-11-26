"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClientSidebar } from "./client-sidebar"
import { SessionExpiryModal } from "@/components/session-expiry-modal"
import { User, api } from "@/lib/api"
import { auth } from "@/lib/auth"

interface ClientPortalLayoutProps {
  children: ReactNode
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const token = auth.getToken()
      if (!token) {
        router.push("/")
        return
      }

      try {
        const userData = await api.getCurrentUser(token)
        setUser(userData)

        // Redirigir si no es client
        if (userData.role === "superadmin") {
          router.push("/dashboard/superadmin")
          return
        }
        if (userData.role === "tenant_admin") {
          router.push("/dashboard/admin")
          return
        }
        if (userData.role === "manager") {
          router.push("/dashboard")
          return
        }
        if (userData.role === "user") {
          router.push("/dashboard")
          return
        }
        // Solo clients pueden estar aqui
        if (userData.role !== "client") {
          router.push("/")
          return
        }
        setLoading(false)
      } catch (error) {
        auth.removeToken()
        router.push("/")
      }
    }

    loadUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ClientSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
      <SessionExpiryModal />
    </div>
  )
}
