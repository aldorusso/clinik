"use client"

import { useEffect, useState } from "react"
import { ClientPortalLayout } from "@/components/dashboard/client-portal-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, MessageSquare, Bell, Clock } from "lucide-react"
import { api, User } from "@/lib/api"
import { auth } from "@/lib/auth"

export default function ClientPortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const userData = await api.getCurrentUser(token)
        setUser(userData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido, {user?.first_name || user?.client_company_name || "Cliente"}
          </h1>
          <p className="text-muted-foreground">
            Portal de acceso a tus documentos e informacion
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Documentos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Documentos disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mensajes
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Sin leer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notificaciones
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Nuevas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ultima Actividad
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Hoy</div>
              <p className="text-xs text-muted-foreground">
                Ultimo acceso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        {user?.client_company_name && (
          <Card>
            <CardHeader>
              <CardTitle>Informacion de tu Empresa</CardTitle>
              <CardDescription>
                Datos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                  <p className="text-lg">{user.client_company_name}</p>
                </div>
                {user.client_tax_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">RUC/NIT</p>
                    <p className="text-lg">{user.client_tax_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contacto</p>
                  <p className="text-lg">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Tus ultimas interacciones en el portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay actividad reciente</p>
              <p className="text-sm">Tus documentos y mensajes apareceran aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientPortalLayout>
  )
}
