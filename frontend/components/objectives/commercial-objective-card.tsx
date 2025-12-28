"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Award } from "lucide-react"
import { CommercialObjective } from "@/lib/api"
import { ObjectiveStatusBadge } from "./objective-status-badge"
import { getTypeIcon, getTypeLabel, getPeriodLabel, formatValue, formatCurrency } from "./objective-helpers"

interface CommercialObjectiveCardProps {
  objective: CommercialObjective
  onUpdateProgress: (objective: CommercialObjective) => void
}

export function CommercialObjectiveCard({ objective, onUpdateProgress }: CommercialObjectiveCardProps) {
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
              <Badge variant="secondary">{getPeriodLabel(objective.period as any)}</Badge>
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
              {formatValue(objective.type, objective.current_value, objective.unit)} / {formatValue(objective.type, objective.target_value, objective.unit)}
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
              <>Quedan {objective.days_remaining} dias</>
            ) : objective.is_overdue ? (
              <span className="text-red-600 font-medium">Vencido</span>
            ) : (
              <>Vence hoy</>
            )}
          </div>
          {objective.reward_amount && (
            <Badge variant="outline" className="text-green-600">
              <Award className="h-3 w-3 mr-1" />
              {formatCurrency(objective.reward_amount)}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onUpdateProgress(objective)}
            disabled={objective.is_completed}
          >
            <Edit className="h-3 w-3 mr-1" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
