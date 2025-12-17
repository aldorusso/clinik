"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ConsentimientosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect after 3 seconds to admin dashboard
    const timer = setTimeout(() => {
      router.push("/dashboard/admin")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              Funcionalidad No Disponible
            </h1>
            <p className="text-muted-foreground">
              Esta funcionalidad ha sido deshabilitada temporalmente
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Sistema de Consentimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-amber-700">
                <strong>El módulo de consentimientos ha sido deshabilitado</strong> debido a problemas de permisos y complejidad.
              </p>
              
              <p className="text-amber-700">
                Los pacientes pueden ver sus documentos en el portal de pacientes a través de:
              </p>
              
              <ul className="list-disc list-inside text-amber-700 space-y-1 ml-4">
                <li>Portal del Paciente → Documentos</li>
                <li>Historial médico integrado</li>
                <li>Documentos de consultas y tratamientos</li>
              </ul>

              <div className="mt-6 p-4 bg-white rounded border">
                <p className="text-sm text-gray-600">
                  <strong>Redirigiendo automáticamente al dashboard en 3 segundos...</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alternativas Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📋 Historial Médico</h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona el historial médico de pacientes desde el módulo principal
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">👥 Portal de Pacientes</h3>
                <p className="text-sm text-muted-foreground">
                  Los pacientes pueden acceder a sus documentos directamente en su portal
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📅 Citas</h3>
                <p className="text-sm text-muted-foreground">
                  Gestiona citas y adjunta documentos necesarios
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🗂️ Servicios</h3>
                <p className="text-sm text-muted-foreground">
                  Configura servicios con sus requisitos de documentación
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}