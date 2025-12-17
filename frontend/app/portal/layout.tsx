"use client"

import { ReactNode, createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PatientSidebar } from "@/components/dashboard/patient-sidebar"
import { SessionExpiryModal } from "@/components/session-expiry-modal"
import { Spinner } from "@/components/ui/spinner"
import { User, api } from "@/lib/api"
import { auth } from "@/lib/auth"

// Patient Context
interface PatientContextType {
  user: User | null
  loading: boolean
  refetch: () => Promise<void>
}

const PatientContext = createContext<PatientContextType | undefined>(undefined)

export function usePatient() {
  const context = useContext(PatientContext)
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider")
  }
  return context
}

function PatientProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const userData = await api.getCurrentUser(token)

      // Redirect non-patients to appropriate dashboard
      if (userData.role === "superadmin") {
        router.push("/dashboard/superadmin")
        return
      }
      if (userData.role === "tenant_admin") {
        router.push("/dashboard/admin")
        return
      }
      if (userData.role !== "patient") {
        router.push("/dashboard")
        return
      }

      setUser(userData)
      setLoading(false)
    } catch (error) {
      auth.removeToken()
      router.push("/")
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const refetch = async () => {
    await loadUser()
  }

  return (
    <PatientContext.Provider value={{ user, loading, refetch }}>
      {children}
    </PatientContext.Provider>
  )
}

function PortalContent({ children }: { children: ReactNode }) {
  const { user, loading } = usePatient()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PatientSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
      <SessionExpiryModal />
    </div>
  )
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <PatientProvider>
      <PortalContent>{children}</PortalContent>
    </PatientProvider>
  )
}
