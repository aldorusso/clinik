"use client"

import { useEffect, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Loader2, Clock, LogOut } from "lucide-react"
import { useSessionCheck } from "@/hooks/use-session-check"

function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (minutes > 0) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''} ${seconds} segundo${seconds !== 1 ? 's' : ''}`
  }
  return `${seconds} segundo${seconds !== 1 ? 's' : ''}`
}

export function SessionExpiryModal() {
  const {
    isExpired,
    isExpiringSoon,
    timeUntilExpiry,
    isRefreshing,
    extendSession,
    logout,
    dismissWarning,
  } = useSessionCheck({
    checkIntervalMs: 30 * 1000, // Check every 30 seconds
    warningBeforeMs: 5 * 60 * 1000, // Warn 5 minutes before
  })

  const [displayTime, setDisplayTime] = useState(formatTimeRemaining(timeUntilExpiry))

  // Update countdown display
  useEffect(() => {
    if (!isExpiringSoon) return

    const interval = setInterval(() => {
      setDisplayTime(formatTimeRemaining(timeUntilExpiry))
    }, 1000)

    return () => clearInterval(interval)
  }, [isExpiringSoon, timeUntilExpiry])

  const handleExtendSession = async () => {
    const success = await extendSession()
    if (!success) {
      logout()
    }
  }

  // Session expired modal
  if (isExpired) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-center">
              Sesion Expirada
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Tu sesion ha expirado. Por favor, inicia sesion nuevamente para continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={logout}>
              Iniciar Sesion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Session expiring soon modal
  if (isExpiringSoon) {
    return (
      <AlertDialog open={true} onOpenChange={(open) => !open && dismissWarning()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <AlertDialogTitle className="text-center">
              Sesion por Expirar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Tu sesion expirara en <strong>{displayTime}</strong>.
              <br />
              ¿Deseas extender tu sesion?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel onClick={dismissWarning} disabled={isRefreshing}>
              Cerrar Sesion
            </AlertDialogCancel>
            <Button onClick={handleExtendSession} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extendiendo...
                </>
              ) : (
                "Extender Sesion"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return null
}
