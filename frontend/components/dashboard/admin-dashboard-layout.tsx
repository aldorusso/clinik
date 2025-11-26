"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "./admin-sidebar"
import { User, api } from "@/lib/api"
import { auth } from "@/lib/auth"

interface AdminDashboardLayoutProps {
  children: ReactNode
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
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

        // Redirigir segun rol
        if (userData.role === "superadmin") {
          router.push("/dashboard/superadmin")
          return
        }
        if (userData.role === "client") {
          router.push("/portal")
          return
        }
        if (userData.role === "user") {
          router.push("/dashboard")
          return
        }
        // Solo admin de tenant puede estar aqui
        if (userData.role !== "tenant_admin") {
          router.push("/dashboard")
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
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
