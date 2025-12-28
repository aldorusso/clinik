"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Lock, CheckCircle, XCircle } from "lucide-react"
import { api } from "@/lib/api"
import { Logo } from "@/components/logo"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Token no proporcionado. Por favor, usa el enlace del correo.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (!token) {
      setError("Token no válido")
      return
    }

    setLoading(true)

    try {
      await api.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña")
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <main className="flex min-h-screen">
        {/* Left side - Brand (Dark) */}
        <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-24 left-24 w-32 h-32 border border-white/5 rounded-2xl rotate-12"></div>
            <div className="absolute top-1/3 right-24 w-24 h-24 border border-white/5 rounded-2xl -rotate-12"></div>
            <div className="absolute bottom-1/3 left-1/4 w-40 h-40 border border-mint/10 rounded-3xl rotate-45"></div>
            <div className="absolute bottom-24 right-24 w-20 h-20 border border-mint/5 rounded-2xl -rotate-6"></div>
          </div>

          <div className="flex flex-col justify-between h-full px-16 py-14 relative z-10">
            <div>
              <Logo size="lg" variant="light" />
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-cream mb-6">
                Gestiona tu clínica
                <br />
                <span className="text-mint">de forma inteligente.</span>
              </h1>
              <p className="text-lg text-cream-dark/60 leading-relaxed">
                Simplifica la gestión de pacientes, citas y leads en un solo lugar.
              </p>
            </div>

            <div>
              <p className="text-cream-dark/30 text-sm">
                © 2024 ClinicManager. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Success */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
            <Logo size="md" variant="default" />
            <p className="text-muted-foreground text-sm mt-2">Gestión integral de clínicas</p>
          </div>

          <div className="w-full max-w-md mt-24 lg:mt-0">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-mint" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">¡Contraseña Restablecida!</h2>
              <p className="text-muted-foreground">
                Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>

            <Link href="/">
              <Button className="w-full h-12 font-medium text-base">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Invalid token state
  if (!token) {
    return (
      <main className="flex min-h-screen">
        {/* Left side - Brand (Dark) */}
        <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-24 left-24 w-32 h-32 border border-white/5 rounded-2xl rotate-12"></div>
            <div className="absolute top-1/3 right-24 w-24 h-24 border border-white/5 rounded-2xl -rotate-12"></div>
            <div className="absolute bottom-1/3 left-1/4 w-40 h-40 border border-mint/10 rounded-3xl rotate-45"></div>
            <div className="absolute bottom-24 right-24 w-20 h-20 border border-mint/5 rounded-2xl -rotate-6"></div>
          </div>

          <div className="flex flex-col justify-between h-full px-16 py-14 relative z-10">
            <div>
              <Logo size="lg" variant="light" />
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-cream mb-6">
                Gestiona tu clínica
                <br />
                <span className="text-mint">de forma inteligente.</span>
              </h1>
              <p className="text-lg text-cream-dark/60 leading-relaxed">
                Simplifica la gestión de pacientes, citas y leads en un solo lugar.
              </p>
            </div>

            <div>
              <p className="text-cream-dark/30 text-sm">
                © 2024 ClinicManager. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Invalid Token */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
            <Logo size="md" variant="default" />
            <p className="text-muted-foreground text-sm mt-2">Gestión integral de clínicas</p>
          </div>

          <div className="w-full max-w-md mt-24 lg:mt-0">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Enlace Inválido</h2>
              <p className="text-muted-foreground">
                El enlace de recuperación no es válido o ha expirado. Por favor, solicita un nuevo enlace.
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/forgot-password">
                <Button className="w-full h-12 font-medium text-base">
                  Solicitar nuevo enlace
                </Button>
              </Link>
              <div className="text-center">
                <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
                  <ArrowLeft className="inline h-4 w-4 mr-1" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Reset password form
  return (
    <main className="flex min-h-screen">
      {/* Left side - Brand (Dark) */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-24 left-24 w-32 h-32 border border-white/5 rounded-2xl rotate-12"></div>
          <div className="absolute top-1/3 right-24 w-24 h-24 border border-white/5 rounded-2xl -rotate-12"></div>
          <div className="absolute bottom-1/3 left-1/4 w-40 h-40 border border-mint/10 rounded-3xl rotate-45"></div>
          <div className="absolute bottom-24 right-24 w-20 h-20 border border-mint/5 rounded-2xl -rotate-6"></div>
        </div>

        <div className="flex flex-col justify-between h-full px-16 py-14 relative z-10">
          <div>
            <Logo size="lg" variant="light" />
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-cream mb-6">
              Gestiona tu clínica
              <br />
              <span className="text-mint">de forma inteligente.</span>
            </h1>
            <p className="text-lg text-cream-dark/60 leading-relaxed">
              Simplifica la gestión de pacientes, citas y leads en un solo lugar.
            </p>
          </div>

          <div>
            <p className="text-cream-dark/30 text-sm">
              © 2024 ClinicManager. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
          <Logo size="md" variant="default" />
          <p className="text-muted-foreground text-sm mt-2">Gestión integral de clínicas</p>
        </div>

        <div className="w-full max-w-md mt-24 lg:mt-0">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-mint" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Nueva Contraseña</h2>
            <p className="text-muted-foreground">
              Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-medium text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Spinner size="sm" className="mr-2 border-primary-foreground border-t-transparent" />
                  Restableciendo...
                </div>
              ) : (
                "Restablecer Contraseña"
              )}
            </Button>

            <div className="text-center">
              <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
