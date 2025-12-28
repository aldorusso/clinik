"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

export function DocumentsInfoCard() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Información sobre sus documentos</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Todos sus documentos están protegidos y encriptados</li>
              <li>• Puede acceder a ellos las 24 horas desde su portal</li>
              <li>• Los consentimientos deben firmarse antes del tratamiento</li>
              <li>• Si tiene dudas, contacte a su médico tratante</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
