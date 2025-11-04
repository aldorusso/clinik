"use client"

import { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { User } from "@/lib/api"

interface DashboardLayoutProps {
  children: ReactNode
  user: User | null
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
