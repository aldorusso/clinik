"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

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
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          {/* Mobile header for small screens */}
          <div className="lg:hidden absolute top-8 left-8 right-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic.online</h1>
            <p className="text-gray-600 text-sm">Gestión integral de clínicas estéticas</p>
          </div>
          
          <div className="w-full max-w-md mt-24 lg:mt-0">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic.online</h1>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Correo Enviado!</h2>
              <p className="text-gray-600 mb-4">
                Si existe una cuenta con el correo <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>

            <div className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Revisa tu bandeja de entrada y la carpeta de spam. El enlace expira en 24 horas.
                </AlertDescription>
              </Alert>
              
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-gray-300 text-gray-700 font-medium text-base"
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

      {/* Right side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        {/* Mobile header for small screens */}
        <div className="lg:hidden absolute top-8 left-8 right-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic.online</h1>
          <p className="text-gray-600 text-sm">Gestión integral de clínicas estéticas</p>
        </div>
        
        <div className="w-full max-w-md mt-24 lg:mt-0">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic.online</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recuperar Contraseña</h2>
            <p className="text-gray-600">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
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
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium text-base" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </div>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </Button>

            <div className="text-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
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
