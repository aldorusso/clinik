"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Mail, CheckCircle, Building } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    clinicName: "",
    contactName: "",
    email: "",
    phone: "",
    message: ""
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Simular envío de solicitud
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSuccess(true)
    } catch (err: any) {
      setError("Error al enviar la solicitud. Inténtelo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (success) {
    return (
      <main className="flex min-h-screen">
        {/* Left side - Brand and Marketing */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-lg rotate-12"></div>
            <div className="absolute top-40 right-40 w-24 h-24 border border-white/30 rounded-lg -rotate-12"></div>
            <div className="absolute bottom-40 left-40 w-28 h-28 border border-white/30 rounded-lg rotate-45"></div>
          </div>

          <div className="flex flex-col justify-between h-full p-12 relative z-10 text-white">
            {/* Top section with logo */}
            <div>
              <div className="mb-8">
                <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Center section with main content */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Main heading */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold mb-2">
                  Hola<br />
                  Clinic.online! 👋
                </h1>
              </div>

              {/* Description */}
              <div className="max-w-md">
                <p className="text-lg text-white/90 leading-relaxed">
                  Simplifica y automatiza la gestión de leads médicos.
                  Obtén mayor productividad a través de la automatización
                  y ahorra toneladas de tiempo.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div>
              <p className="text-white/60 text-sm">
                © 2024 Clinic.online. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Success Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          {/* Mobile header for small screens */}
          <div className="lg:hidden absolute top-8 left-8 right-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Clinic.online</h1>
            <p className="text-muted-foreground text-sm">Gestión integral de clínicas estéticas</p>
          </div>

          <div className="w-full max-w-md mt-24 lg:mt-0">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Clinic.online</h1>
              <h2 className="text-3xl font-bold text-foreground mb-4">¡Solicitud Enviada!</h2>
              <p className="text-muted-foreground mb-4">
                Hemos recibido tu solicitud de acceso para <strong>{formData.clinicName}</strong>.
              </p>
            </div>

            <div className="space-y-6">
              <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Nuestro equipo te contactará en menos de 24 horas para configurar tu cuenta y brindarte una demostración personalizada.
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
      {/* Left side - Brand and Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-lg rotate-12"></div>
          <div className="absolute top-40 right-40 w-24 h-24 border border-white/30 rounded-lg -rotate-12"></div>
          <div className="absolute bottom-40 left-40 w-28 h-28 border border-white/30 rounded-lg rotate-45"></div>
        </div>

        <div className="flex flex-col justify-between h-full p-12 relative z-10 text-white">
          {/* Top section with logo */}
          <div>
            <div className="mb-8">
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Center section with main content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Main heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-2">
                Hola<br />
                Clinic.online! 👋
              </h1>
            </div>

            {/* Description */}
            <div className="max-w-md">
              <p className="text-lg text-white/90 leading-relaxed">
                Simplifica y automatiza la gestión de leads médicos.
                Obtén mayor productividad a través de la automatización
                y ahorra toneladas de tiempo.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div>
            <p className="text-white/60 text-sm">
              © 2024 Clinic.online. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        {/* Mobile header for small screens */}
        <div className="lg:hidden absolute top-8 left-8 right-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Clinic.online</h1>
          <p className="text-muted-foreground text-sm">Gestión integral de clínicas estéticas</p>
        </div>

        <div className="w-full max-w-md mt-24 lg:mt-0">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
              <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Clinic.online</h1>
            <h2 className="text-3xl font-bold text-foreground mb-4">Solicitar Acceso</h2>
            <p className="text-muted-foreground">
              Completa el formulario y nos pondremos en contacto contigo para configurar tu clínica.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Input
              placeholder="Nombre de la Clínica *"
              value={formData.clinicName}
              onChange={(e) => handleInputChange('clinicName', e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base"
            />

            <Input
              placeholder="Nombre de Contacto *"
              value={formData.contactName}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base"
            />

            <Input
              type="email"
              placeholder="Correo Electrónico *"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base"
            />

            <Input
              type="tel"
              placeholder="Teléfono"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={loading}
              className="h-12 text-base"
            />

            <Textarea
              placeholder="Cuéntanos sobre tu clínica y necesidades..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              disabled={loading}
              className="text-base min-h-[100px]"
              rows={4}
            />

            <Button
              type="submit"
              className="w-full h-12 font-medium text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Spinner size="sm" className="mr-2 border-primary-foreground border-t-transparent" />
                  Enviando solicitud...
                </div>
              ) : (
                "Enviar Solicitud de Acceso"
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
