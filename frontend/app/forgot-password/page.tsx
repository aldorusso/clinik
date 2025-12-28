"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { Logo } from "@/components/logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen">
        {/* Left side - Brand (Dark) */}
        <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-24 left-24 w-32 h-32 border border-white/5 rounded-2xl rotate-12"></div>
            <div className="absolute top-1/3 right-24 w-24 h-24 border border-white/5 rounded-2xl -rotate-12"></div>
            <div className="absolute bottom-1/3 left-1/4 w-40 h-40 border border-mint/10 rounded-3xl rotate-45"></div>
            <div className="absolute bottom-24 right-24 w-20 h-20 border border-mint/5 rounded-2xl -rotate-6"></div>
          </div>

          <div className="flex flex-col justify-between h-full px-16 py-14 relative z-10">
            {/* Top section with logo */}
            <div>
              <Logo size="lg" variant="light" />
            </div>

            {/* Center section with main content */}
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

            {/* Footer */}
            <div>
              <p className="text-cream-dark/30 text-sm">
                © 2024 ClinicManager. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          {/* Mobile header for small screens */}
          <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
            <Logo size="md" variant="default" />
            <p className="text-muted-foreground text-sm mt-2">Gestión integral de clínicas</p>
          </div>

          <div className="w-full max-w-md mt-24 lg:mt-0">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-mint" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">¡Correo Enviado!</h2>
              <p className="text-muted-foreground mb-4">
                Si existe una cuenta con el correo <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>

            <div className="space-y-6">
              <Alert className="bg-mint/5 border-mint/20">
                <Mail className="h-4 w-4 text-mint" />
                <AlertDescription className="text-foreground/80">
                  Revisa tu bandeja de entrada y la carpeta de spam. El enlace expira en 24 horas.
                </AlertDescription>
              </Alert>

              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full h-12 font-medium text-base"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen">
      {/* Left side - Brand (Dark) */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-24 left-24 w-32 h-32 border border-white/5 rounded-2xl rotate-12"></div>
          <div className="absolute top-1/3 right-24 w-24 h-24 border border-white/5 rounded-2xl -rotate-12"></div>
          <div className="absolute bottom-1/3 left-1/4 w-40 h-40 border border-mint/10 rounded-3xl rotate-45"></div>
          <div className="absolute bottom-24 right-24 w-20 h-20 border border-mint/5 rounded-2xl -rotate-6"></div>
        </div>

        <div className="flex flex-col justify-between h-full px-16 py-14 relative z-10">
          {/* Top section with logo */}
          <div>
            <Logo size="lg" variant="light" />
          </div>

          {/* Center section with main content */}
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

          {/* Footer */}
          <div>
            <p className="text-cream-dark/30 text-sm">
              © 2024 ClinicManager. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        {/* Mobile header for small screens */}
        <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
          <Logo size="md" variant="default" />
          <p className="text-muted-foreground text-sm mt-2">Gestión integral de clínicas</p>
        </div>

        <div className="w-full max-w-md mt-24 lg:mt-0">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-mint" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Recuperar Contraseña</h2>
            <p className="text-muted-foreground">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base"
            />

            <Button
              type="submit"
              className="w-full h-12 font-medium text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Spinner size="sm" className="mr-2 border-primary-foreground border-t-transparent" />
                  Enviando...
                </div>
              ) : (
                "Enviar enlace de recuperación"
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
