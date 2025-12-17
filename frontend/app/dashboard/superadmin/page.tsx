"use client"

import { useEffect, useState } from "react"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, UserCheck, TrendingUp } from "lucide-react"
import { api, TenantWithStats } from "@/lib/api"
import { auth } from "@/lib/auth"

export default function SuperadminDashboardPage() {
  const [tenants, setTenants] = useState<TenantWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const tenantsData = await api.getTenantsWithStats(token)
        setTenants(tenantsData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const totalTenants = tenants.length
  const activeTenants = tenants.filter(t => t.is_active).length
  const totalUsers = tenants.reduce((acc, t) => acc + (t.user_count || 0) + (t.tenant_admin_count || 0), 0)
  const totalClients = tenants.reduce((acc, t) => acc + (t.client_count || 0), 0)

  return (
    <SuperadminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard SuperAdmin</h1>
          <p className="text-muted-foreground">
            Vista general de la plataforma multi-tenant
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizaciones
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                {activeTenants} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Internos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Admins y usuarios de tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Clientes externos de tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Actividad
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Organizaciones activas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Organizaciones Recientes</CardTitle>
            <CardDescription>
              Ultimas organizaciones registradas en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay organizaciones registradas aun
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.slice(0, 5).map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tenant.slug} - {tenant.plan}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {(tenant.tenant_admin_count || 0) + (tenant.user_count || 0)} usuarios
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.client_count} clientes
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {tenant.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperadminDashboardLayout>
  )
}
