"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bell, CheckCheck, Trash2, ExternalLink, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { api, Notification, NotificationType } from "@/lib/api"
import { auth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

/**
 * Página de Notificaciones
 *
 * Página completa para gestionar las notificaciones del usuario.
 *
 * Features:
 * - Listado completo de todas las notificaciones
 * - Tabs para filtrar: Todas, No leídas, Leídas
 * - Marcar individual como leída
 * - Marcar todas como leídas
 * - Eliminar notificaciones
 * - Click para navegar a action_url
 * - Paginación
 * - Colores según tipo de notificación
 */
export default function NotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = async (unreadOnly?: boolean) => {
    try {
      const token = auth.getToken()
      if (!token) {
        router.push("/")
        return
      }

      setIsLoading(true)
      const response = await api.getNotifications(token, {
        skip: 0,
        limit: 100,
        unread_only: unreadOnly,
      })

      setNotifications(response.notifications)
      setTotalCount(response.total)
      setUnreadCount(response.unread_count)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load notifications
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Refetch when tab changes
  useEffect(() => {
    if (activeTab === "all") {
      fetchNotifications()
    } else if (activeTab === "unread") {
      fetchNotifications(true)
    } else {
      // For "read" tab, fetch all and filter client-side
      fetchNotifications()
    }
  }, [activeTab])

  // Get filtered notifications based on active tab
  const filteredNotifications = () => {
    if (activeTab === "read") {
      return notifications.filter((n) => n.is_read)
    }
    return notifications
  }

  // Marcar como leída
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = auth.getToken()
      if (!token) return

      await api.markNotificationAsRead(token, notificationId)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      toast({
        title: "Notificación marcada como leída",
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      })
    }
  }

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      const token = auth.getToken()
      if (!token) return

      const result = await api.markAllNotificationsAsRead(token)

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)

      toast({
        title: "Éxito",
        description: result.message,
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leídas",
        variant: "destructive",
      })
    }
  }

  // Eliminar notificación
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const token = auth.getToken()
      if (!token) return

      await api.deleteNotification(token, notificationId)

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setTotalCount((prev) => prev - 1)

      toast({
        title: "Notificación eliminada",
      })

      setDeleteDialogOpen(false)
      setNotificationToDelete(null)
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    }
  }

  // Click en notificación
  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }

    // Navegar si hay action_url
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  // Obtener color del badge según tipo
  const getNotificationBadgeVariant = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Obtener color del texto según tipo
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "info":
        return "text-blue-600 dark:text-blue-400"
      case "success":
        return "text-green-600 dark:text-green-400"
      case "warning":
        return "text-yellow-600 dark:text-yellow-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  // Obtener ícono según tipo
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  // Renderizar el contenido de notificaciones
  const notificationsContent = (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus notificaciones y mantente al día
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No leídas</CardDescription>
            <CardTitle className="text-3xl text-primary">{unreadCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leídas</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">
              {totalCount - unreadCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            Todas ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread">
            No leídas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Leídas ({totalCount - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Cargando notificaciones...
              </CardContent>
            </Card>
          ) : filteredNotifications().length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No tienes notificaciones</p>
                <p className="text-sm">
                  {activeTab === "unread"
                    ? "Todas tus notificaciones están leídas"
                    : "Cuando recibas notificaciones, aparecerán aquí"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications().map((notification) => (
              <Card
                key={notification.id}
                className={`${
                  !notification.is_read ? "border-primary/50 bg-primary/5" : ""
                } hover:bg-accent/50 transition-colors`}
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="text-3xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-semibold ${
                                !notification.is_read ? "font-bold" : ""
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            <Badge
                              variant={getNotificationBadgeVariant(notification.type)}
                              className="ml-auto"
                            >
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        {notification.action_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Ver detalles
                          </Button>
                        )}
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <CheckCheck className="mr-2 h-3 w-3" />
                            Marcar como leída
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNotificationToDelete(notification.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La notificación será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNotificationToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (notificationToDelete) {
                  handleDeleteNotification(notificationToDelete)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  return notificationsContent
}
