"use client"

import { Badge } from "@/components/ui/badge"

export function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Pendiente</Badge>
    case "signed":
      return <Badge variant="default" className="bg-green-500">Firmado</Badge>
    case "completed":
      return <Badge variant="default" className="bg-blue-500">Completado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function getCategoryBadge(category: string) {
  const categoryMap = {
    consent: { label: "Consentimiento", variant: "destructive" as const },
    prescription: { label: "Receta", variant: "secondary" as const },
    report: { label: "Informe", variant: "outline" as const },
    treatment_plan: { label: "Plan Tratamiento", variant: "default" as const },
    invoice: { label: "Factura", variant: "secondary" as const },
    medical_record: { label: "Registro Médico", variant: "default" as const }
  }

  const config = categoryMap[category as keyof typeof categoryMap] || { label: category, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
