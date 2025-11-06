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

  useEffect(() => {
    const loadUser = async () => {
      const token = auth.getToken()
      if (!token) {
        router.push("/")
        return
      }

      try {
        const userData = await api.getCurrentUser(token)

        // Verify user is admin
        if (userData.role !== "admin") {
          router.push("/dashboard")
          return
        }

        setUser(userData)
      } catch (error) {
        auth.removeToken()
        router.push("/")
      }
    }

    loadUser()
  }, [router])

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
