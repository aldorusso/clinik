"use client"

import { Badge } from "@/components/ui/badge"
import { CommercialObjective } from "@/lib/api"
import { CheckCircle, AlertTriangle, Target, TrendingUp, Clock } from "lucide-react"

interface ObjectiveStatusBadgeProps {
  objective: CommercialObjective
}

export function ObjectiveStatusBadge({ objective }: ObjectiveStatusBadgeProps) {
  if (objective.is_completed) {
    return (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Completado
      </Badge>
    )
  }
  if (objective.is_overdue) {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Vencido
      </Badge>
    )
  }
  if (objective.progress_percentage >= 90) {
    return (
      <Badge variant="default">
        <Target className="h-3 w-3 mr-1" />
        Casi Listo
      </Badge>
    )
  }
  if (objective.progress_percentage >= 50) {
    return (
      <Badge variant="secondary">
        <TrendingUp className="h-3 w-3 mr-1" />
        En Progreso
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Clock className="h-3 w-3 mr-1" />
      Iniciando
    </Badge>
  )
}
