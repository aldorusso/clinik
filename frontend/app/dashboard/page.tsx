"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MetricCard, MetricCardGrid } from "@/components/dashboard/metric-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { SalesFunnel } from "@/components/dashboard/sales-funnel"
import { api, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import {
  Users,
  Calendar,
  TrendingUp,
  UserCheck
} from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

        // Redirect based on user role
        if (userData.role === "tenant_admin") {
          router.push("/dashboard/admin")
          return
        }
      } catch (error) {
        auth.removeToken()
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Mock data - en produccion esto vendria de la API
  const activities = [
    {
      id: "1",
      user: { name: "Maria Garcia", initials: "MG" },
      action: "agendo una cita con",
      target: "Juan Perez",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: "appointment" as const
    },
    {
      id: "2",
      user: { name: "Carlos Lopez", initials: "CL" },
      action: "convirtio un lead en paciente:",
      target: "Ana Martinez",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      type: "sale" as const
    },
    {
      id: "3",
      user: { name: "Laura Torres", initials: "LT" },
      action: "registro un nuevo lead:",
      target: "Pedro Sanchez",
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      type: "lead" as const
    },
    {
      id: "4",
      user: { name: "Roberto Diaz", initials: "RD" },
      action: "realizo una llamada a",
      target: "Sofia Morales",
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
      type: "call" as const
    },
    {
      id: "5",
      user: { name: "Elena Ruiz", initials: "ER" },
      action: "envio cotizacion a",
      target: "Miguel Fernandez",
      timestamp: new Date(Date.now() - 1000 * 60 * 240),
      type: "email" as const
    }
  ]

  const funnelStages = [
    { id: "1", name: "Nuevos", count: 45, percentage: 35, color: "bg-blue-500" },
    { id: "2", name: "Contactados", count: 32, percentage: 25, color: "bg-indigo-500" },
    { id: "3", name: "Calificados", count: 28, percentage: 22, color: "bg-purple-500" },
    { id: "4", name: "Cita Agendada", count: 15, percentage: 12, color: "bg-pink-500" },
    { id: "5", name: "En Tratamiento", count: 8, percentage: 6, color: "bg-emerald" }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenido, {user?.first_name || user?.full_name || "Usuario"}
          </h1>
          <p className="text-muted-foreground">
            Aqui tienes un resumen de tu actividad
          </p>
        </div>

        {/* Metric Cards */}
        <MetricCardGrid>
          <MetricCard
            title="Total Leads"
            value="128"
            subtitle="Este mes"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="inverted"
          />
          <MetricCard
            title="Citas Programadas"
            value="24"
            subtitle="Esta semana"
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
          />
          <MetricCard
            title="Tasa de Conversion"
            value="18%"
            subtitle="Promedio"
            icon={TrendingUp}
            trend={{ value: 3, isPositive: true }}
          />
          <MetricCard
            title="Pacientes Activos"
            value="86"
            subtitle="En tratamiento"
            icon={UserCheck}
            trend={{ value: 5, isPositive: true }}
          />
        </MetricCardGrid>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed
              activities={activities}
              title="Actividad Reciente"
              maxItems={5}
              onViewAll={() => router.push("/dashboard/actividad")}
            />
          </div>

          {/* Sales Funnel */}
          <div className="lg:col-span-1">
            <SalesFunnel
              stages={funnelStages}
              title="Pipeline de Leads"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
