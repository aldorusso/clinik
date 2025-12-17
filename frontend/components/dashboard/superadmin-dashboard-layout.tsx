"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperadminSidebar } from "./superadmin-sidebar"
import { SessionExpiryModal } from "@/components/session-expiry-modal"
import { User, api } from "@/lib/api"
import { Spinner } from "@/components/ui/spinner"
import { auth } from "@/lib/auth"

interface SuperadminDashboardLayoutProps {
  children: ReactNode
}

export function SuperadminDashboardLayout({ children }: SuperadminDashboardLayoutProps) {
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

        // Verificar que el usuario sea superadmin
        if (userData.role !== "superadmin") {
          // Redirigir segun rol
          if (userData.role === "tenant_admin") {
            router.push("/dashboard/admin")
          } else if (userData.role === "patient") {
            router.push("/portal")
          } else {
            router.push("/dashboard")
          }
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
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SuperadminSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
      <SessionExpiryModal />
    </div>
  )
}
