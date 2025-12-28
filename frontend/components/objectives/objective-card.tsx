"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Eye, Trash2, Award } from "lucide-react"
import { CommercialObjective } from "@/lib/api"
import { ObjectiveStatusBadge } from "./objective-status-badge"
import { getTypeIcon, getTypeLabel } from "./objective-helpers"

interface ObjectiveCardProps {
  objective: CommercialObjective
  onEdit: (objective: CommercialObjective) => void
  onDelete: (objective: CommercialObjective) => void
  onViewDetails?: (objective: CommercialObjective) => void
}

export function ObjectiveCard({ objective, onEdit, onDelete, onViewDetails }: ObjectiveCardProps) {
  const IconComponent = getTypeIcon(objective.type)

  return (
    <Card className={`hover:bg-muted/50 transition-colors ${objective.is_overdue ? 'border-red-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">{objective.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getTypeLabel(objective.type)}</Badge>
              <Badge variant="secondary">{objective.commercial_name}</Badge>
            </div>
            {objective.description && (
              <CardDescription className="mt-1">{objective.description}</CardDescription>
            )}
          </div>
          <ObjectiveStatusBadge objective={objective} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progreso</span>
            <span className="font-medium">
              {objective.current_value} / {objective.target_value} {objective.unit}
            </span>
          </div>
          <Progress value={Math.min(objective.progress_percentage, 100)} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {objective.progress_percentage.toFixed(1)}% completado
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {objective.days_remaining > 0 ? (
              <>Quedan {objective.days_remaining} días</>
            ) : objective.is_overdue ? (
              <span className="text-red-600 font-medium">Vencido</span>
            ) : (
              <>Vence hoy</>
            )}
          </div>
          {objective.reward_amount && (
            <Badge variant="outline" className="text-green-600">
              <Award className="h-3 w-3 mr-1" />
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
              }).format(objective.reward_amount)}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(objective)}>
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onViewDetails?.(objective)}>
            <Eye className="h-3 w-3 mr-1" />
            Detalles
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(objective)}>
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
