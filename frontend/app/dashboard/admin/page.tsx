"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
import { api, User } from "@/lib/api"
import { auth } from "@/lib/auth"

export default function AdminDashboard() {
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

        // Verify user is admin
        if (userData.role !== "admin") {
          router.push("/dashboard")
          return
        }

        setUser(userData)
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
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // This is the Admin dashboard
  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {user?.full_name || user?.email}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Tareas Activas</CardTitle>
              <CardDescription>Trabajos de scraping en progreso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No hay tareas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tareas Completadas</CardTitle>
              <CardDescription>Total de trabajos finalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Aún no has completado tareas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>Total de resultados obtenidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Sin resultados aún
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin-specific section */}
        <Card>
          <CardHeader>
            <CardTitle>Panel de Administración</CardTitle>
            <CardDescription>
              Funciones administrativas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Las funciones de administración estarán disponibles próximamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}
