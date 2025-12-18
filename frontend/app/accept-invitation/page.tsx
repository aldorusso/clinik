"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle, Loader2, XCircle, Building2, UserPlus, Shield } from "lucide-react"
import { api } from "@/lib/api"

interface InvitationInfo {
  is_valid: boolean
  is_existing_user: boolean
  tenant_name?: string
  role?: string
  inviter_name?: string
  user_email?: string
  requires_password: boolean
}

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadInvitationInfo = async () => {
      if (!token) {
        setLoadingInfo(false)
        return
      }

      try {
        const info = await api.getInvitationInfo(token)
        setInvitationInfo(info)
      } catch (err) {
        setInvitationInfo({ is_valid: false, is_existing_user: false, requires_password: true })
      } finally {
        setLoadingInfo(false)
      }
    }

    loadInvitationInfo()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Token no valido")
      return
    }

    // Only validate password for new users
    if (invitationInfo?.requires_password) {
      if (password.length < 6) {
        setError("La contrasena debe tener al menos 6 caracteres")
        return
      }

      if (password !== confirmPassword) {
        setError("Las contrasenas no coinciden")
        return
      }
    }

    setLoading(true)

    try {
      await api.acceptInvitation({
        token,
        password: invitationInfo?.requires_password ? password : undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error al aceptar la invitacion")
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando invitacion...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>
              {invitationInfo?.is_existing_user ? "Te uniste a la organizacion" : "Invitacion Aceptada"}
            </CardTitle>
            <CardDescription>
              {invitationInfo?.is_existing_user
                ? `Ahora eres parte de ${invitationInfo?.tenant_name || "la organizacion"}. Ya puedes acceder con tu cuenta existente.`
                : "Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesion con tus credenciales."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                Iniciar Sesion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!token || !invitationInfo?.is_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Enlace Invalido</CardTitle>
            <CardDescription>
              El enlace de invitacion no es valido o ha expirado. Por favor, solicita una nueva invitacion a tu administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Link href="/" className="text-sm text-primary hover:underline">
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Volver al inicio de sesion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Existing user - simple acceptance
  if (invitationInfo.is_existing_user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Nueva Invitacion</CardTitle>
            <CardDescription>
              Te han invitado a unirte a una nueva organizacion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Invitation details */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {invitationInfo.tenant_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizacion</p>
                    <p className="font-medium">{invitationInfo.tenant_name}</p>
                  </div>
                </div>
              )}
              {invitationInfo.role && (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rol asignado</p>
                    <p className="font-medium">{invitationInfo.role}</p>
                  </div>
                </div>
              )}
              {invitationInfo.inviter_name && (
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Invitado por</p>
                    <p className="font-medium">{invitationInfo.inviter_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info box for existing users */}
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Ya tienes una cuenta
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Puedes usar tus credenciales existentes ({invitationInfo.user_email}).
                    No necesitas crear una nueva cuenta.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Al aceptar, tendras acceso a esta organizacion ademas de las que ya tienes.
            </p>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceptando...
                </>
              ) : (
                "Aceptar Invitacion"
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/" className="text-primary hover:underline">
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Volver al inicio de sesion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // New user - full registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Aceptar Invitacion</CardTitle>
          <CardDescription>
            Completa tu registro para acceder a la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invitation details for new users too */}
          {(invitationInfo.tenant_name || invitationInfo.role) && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-6">
              {invitationInfo.tenant_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Organizacion:</span>
                  <span className="font-medium">{invitationInfo.tenant_name}</span>
                </div>
              )}
              {invitationInfo.role && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rol:</span>
                  <span className="font-medium">{invitationInfo.role}</span>
                </div>
              )}
              {invitationInfo.inviter_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invitado por:</span>
                  <span className="font-medium">{invitationInfo.inviter_name}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre (opcional)</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido (opcional)</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Perez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite la contrasena"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activando cuenta...
                </>
              ) : (
                "Aceptar Invitacion"
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/" className="text-primary hover:underline">
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Volver al inicio de sesion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
