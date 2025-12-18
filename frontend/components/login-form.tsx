"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Building2, ChevronRight, ArrowLeft } from "lucide-react"
import { api, UserRole, AvailableTenant } from "@/lib/api"
import { auth } from "@/lib/auth"

// Helper to get redirect path based on user role
function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "superadmin":
      return "/dashboard/superadmin"
    case "tenant_admin":
      return "/dashboard/admin"
    case "patient":
      return "/portal"
    case "closer":
    case "manager":
    case "medico":
    case "recepcionista":
    default:
      return "/dashboard"
  }
}

type LoginStep = "credentials" | "select-tenant"

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [availableTenants, setAvailableTenants] = useState<AvailableTenant[]>([])
  const [tempToken, setTempToken] = useState("")

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Basic validation
    if (!email || !password) {
      setError("Por favor ingrese email y contraseña")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.login({
        username: email,
        password: password,
      })

      // Process login response
      const result = auth.processLoginResponse(response)

      if (result.requiresTenantSelection && result.tenants) {
        // Multi-tenant: show tenant selector
        setAvailableTenants(result.tenants)
        setTempToken(response.access_token)
        setStep("select-tenant")
      } else {
        // Direct login - get user and redirect
        const user = await api.getCurrentUser(response.access_token)
        const redirectPath = getRedirectPath(user.role)
        router.push(redirectPath)
      }
    } catch (err: any) {
      setError(err.message || "Credenciales inválidas. Verifique su email y contraseña.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTenantSelect = async (tenant: AvailableTenant) => {
    setError("")
    setIsLoading(true)

    try {
      const response = await api.selectTenant(tempToken, tenant.tenant_id)
      auth.completeTenantSelection(response)

      // Redirect based on role
      const redirectPath = getRedirectPath(response.role)
      router.push(redirectPath)
    } catch (err: any) {
      setError(err.message || "Error al seleccionar organización")
      setIsLoading(false)
    }
  }

  const handleBackToCredentials = () => {
    setStep("credentials")
    setAvailableTenants([])
    setTempToken("")
    setError("")
    auth.clearPendingTenantSelection()
  }

  // Tenant Selection Step
  if (step === "select-tenant") {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Clinic.online</h1>
          <h2 className="text-3xl font-bold text-foreground mb-4">Selecciona tu organización</h2>
          <p className="text-muted-foreground">
            Tu cuenta tiene acceso a múltiples organizaciones.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona con cuál deseas trabajar.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tenant Cards */}
        <div className="space-y-3">
          {availableTenants.map((tenant) => (
            <Card
              key={tenant.tenant_id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary ${
                isLoading ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => handleTenantSelect(tenant)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {tenant.tenant_logo ? (
                      <img
                        src={tenant.tenant_logo}
                        alt={tenant.tenant_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {tenant.tenant_name}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {tenant.role.replace("_", " ")}
                        {tenant.is_default && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Por defecto
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="flex items-center justify-center mt-4">
            <Spinner size="sm" className="mr-2" />
            <span className="text-muted-foreground">Accediendo...</span>
          </div>
        )}

        {/* Back button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full mt-6"
          onClick={handleBackToCredentials}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Usar otra cuenta
        </Button>
      </div>
    )
  }

  // Credentials Step (original form)
  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Clinic.online</h1>
        <h2 className="text-3xl font-bold text-foreground mb-4">¡Bienvenido de Nuevo!</h2>
        <p className="text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Solicita acceso ahora.
          </Link>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Te contactaremos en menos de 24 horas.
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleCredentialsSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            id="email"
            type="email"
            placeholder="usuario@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
            className="h-12 text-base"
          />

          <Input
            id="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="h-12 text-base"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-medium text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Spinner size="sm" className="mr-2 border-primary-foreground border-t-transparent" />
              Ingresando...
            </div>
          ) : (
            "Ingresar Ahora"
          )}
        </Button>

        {/* Google Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 font-medium text-base"
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Ingresar con Google
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ¿Olvidaste tu contraseña? <span className="font-medium text-primary">Clic aquí</span>
          </Link>
        </div>
      </form>
    </div>
  )
}
