"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Building2, ChevronRight, ArrowLeft } from "lucide-react"
import { api, UserRole, AvailableTenant } from "@/lib/api"
import { auth } from "@/lib/auth"
import { Logo } from "@/components/logo"

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
          <div className="flex justify-center mb-4">
            <Logo size="md" variant="default" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Selecciona tu organización</h2>
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
              className={`cursor-pointer transition-all hover:shadow-md hover:border-accent ${
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
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-accent" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {tenant.tenant_name}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {tenant.role.replace("_", " ")}
                        {tenant.is_default && (
                          <span className="ml-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
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
      <div className="flex flex-col space-y-2 text-center mb-8">
        <div className="hidden lg:flex justify-center mb-2">
          <Logo size="md" variant="default" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inicia sesión
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
              className="h-10"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Spinner size="sm" className="mr-2 border-primary-foreground border-t-transparent" />
              Ingresando...
            </div>
          ) : (
            "Ingresar"
          )}
        </Button>
      </form>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
          Solicita acceso
        </Link>
      </p>
    </div>
  )
}
