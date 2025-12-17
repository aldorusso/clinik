"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AdminSidebar } from "@/components/dashboard/admin-sidebar"
import { SuperadminSidebar } from "@/components/dashboard/superadmin-sidebar"
import { SessionExpiryModal } from "@/components/session-expiry-modal"
import { Spinner } from "@/components/ui/spinner"
import { UserProvider, useUser } from "@/contexts/user-context"

function DashboardContent({ children }: { children: ReactNode }) {
  const { user, loading } = useUser()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  // Determine which sidebar to show based on route
  const renderSidebar = () => {
    if (pathname.startsWith("/dashboard/superadmin")) {
      return <SuperadminSidebar user={user} />
    }
    if (pathname.startsWith("/dashboard/admin")) {
      return <AdminSidebar user={user} />
    }
    return <Sidebar user={user} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
      <SessionExpiryModal />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DashboardContent>{children}</DashboardContent>
    </UserProvider>
  )
}
