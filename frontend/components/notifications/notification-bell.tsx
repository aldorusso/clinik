"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api, Notification, NotificationType } from "@/lib/api"
import { auth } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

/**
 * NotificationBell Component
 *
 * Componente de campanita de notificaciones con dropdown que muestra:
 * - Badge con contador de notificaciones no leídas
 * - Lista de las últimas 5 notificaciones
 * - Link a la página completa de notificaciones
 * - Botón para marcar todas como leídas
 *
 * Features:
 * - Polling automático cada 30 segundos para actualizar el contador
 * - Click en notificación la marca como leída y navega a action_url
 * - Colores según tipo de notificación (info, success, warning, error)
 */
export function NotificationBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = auth.getToken()
      if (!token) return

      const { unread_count } = await api.getNotificationCount(token)
      setUnreadCount(unread_count)
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  // Fetch recent notifications (últimas 5)
  const fetchNotifications = async () => {
    try {
      const token = auth.getToken()
      if (!token) return

      setIsLoading(true)
      const { notifications: fetchedNotifications } = await api.getNotifications(token, {
        skip: 0,
        limit: 5,
      })
      setNotifications(fetchedNotifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Polling para actualizar el contador cada 30 segundos
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // 30 segundos
    return () => clearInterval(interval)
  }, [])

  // Fetch notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Marcar notificación como leída y navegar
  const handleNotificationClick = async (notification: Notification) => {
    try {
      const token = auth.getToken()
      if (!token) return

      // Marcar como leída si no lo está
      if (!notification.is_read) {
        await api.markNotificationAsRead(token, notification.id)
        // Actualizar estado local
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      // Cerrar dropdown
      setIsOpen(false)

      // Navegar si hay action_url
      if (notification.action_url) {
        router.push(notification.action_url)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      const token = auth.getToken()
      if (!token) return

      await api.markAllNotificationsAsRead(token)

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  // Obtener color según tipo de notificación
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
        return <Info className="h-4 w-4 text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No tienes notificaciones
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer focus:bg-accent"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start gap-2">
                  <span className="text-lg mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm font-medium leading-none ${
                          !notification.is_read ? "font-semibold" : ""
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
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
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer justify-center text-primary"
          onClick={() => {
            setIsOpen(false)
            router.push("/dashboard/notifications")
          }}
        >
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
