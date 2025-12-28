"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bell, CheckCircle2 } from "lucide-react"

interface NotificationsTabProps {
  stats: {
    total: number
    unread: number
    read: number
  }
}

export function NotificationsTab({ stats }: NotificationsTabProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Notification Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Notificaciones recibidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No leídas</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats.unread}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leídas</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{stats.read}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ya revisadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Notificaciones</CardTitle>
          <CardDescription>
            Administra cómo y cuándo recibes notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-medium">Ver todas las notificaciones</p>
                <p className="text-sm text-muted-foreground">
                  Accede a la página completa de notificaciones para ver todo el historial
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push('/dashboard/notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                Ver todas
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Tipos de notificaciones</p>
                  <p className="text-sm text-muted-foreground">
                    Actualmente recibes notificaciones sobre:
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                  <span className="text-sm">
                    <strong>Información</strong> - Actualizaciones generales y noticias del sistema
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  <span className="text-sm">
                    <strong>Éxito</strong> - Confirmaciones de acciones completadas
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                  <div className="h-2 w-2 rounded-full bg-yellow-600" />
                  <span className="text-sm">
                    <strong>Advertencias</strong> - Cambios de seguridad y acciones importantes
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="h-2 w-2 rounded-full bg-red-600" />
                  <span className="text-sm">
                    <strong>Errores</strong> - Problemas críticos que requieren atención
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium">Eventos que generan notificaciones:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Cambios en tu contraseña o configuración de seguridad</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Invitaciones aceptadas y nuevos miembros en tu equipo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Cambios en el estado de tu cuenta (activación/desactivación)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Actualizaciones importantes del sistema</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Consejo</p>
              <p className="text-sm text-muted-foreground">
                Las notificaciones te mantienen informado sobre eventos importantes en tiempo real.
                Haz click en el icono de campana en el header para ver tus últimas notificaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
