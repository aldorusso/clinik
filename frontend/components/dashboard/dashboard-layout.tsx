"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { SessionExpiryModal } from "@/components/session-expiry-modal"
import { User, api } from "@/lib/api"
import { auth } from "@/lib/auth"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
        
        // If user is tenant_admin and NOT already in admin area, redirect to admin layout
        if (userData.role === "tenant_admin") {
          const currentPath = window.location.pathname
          if (!currentPath.includes('/admin')) {
            // Map common paths to admin paths
            if (currentPath === '/dashboard') {
              router.push('/dashboard/admin')
            } else if (currentPath === '/dashboard/servicios') {
              router.push('/dashboard/admin/servicios')
            } else if (currentPath === '/dashboard/objetivos') {
              router.push('/dashboard/admin/objetivos')
            } else {
              // For other paths, just redirect to admin dashboard
              router.push('/dashboard/admin')
            }
            return
          } else {
            // User is tenant_admin and trying to access admin area
            // This layout should not be used, they should use AdminDashboardLayout
            // Redirect to ensure they use the correct layout
            router.push('/dashboard/admin')
            return
          }
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
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
      <SessionExpiryModal />
    </div>
  )
}
