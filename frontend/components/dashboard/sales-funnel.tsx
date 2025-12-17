"use client"

import { cn } from "@/lib/utils"

interface FunnelStage {
  id: string
  name: string
  count: number
  percentage: number
  color?: string
}

interface SalesFunnelProps {
  stages: FunnelStage[]
  title?: string
  showPercentages?: boolean
  className?: string
}

const defaultColors = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-emerald",
]

export function SalesFunnel({
  stages,
  title = "Funnel de Ventas",
  showPercentages = true,
  className
}: SalesFunnelProps) {
  const maxCount = Math.max(...stages.map(s => s.count))

  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border/50 shadow-sm p-6",
      className
    )}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Distribucion de leads por etapa
        </p>
      </div>

      {/* Funnel Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
          const color = stage.color || defaultColors[index % defaultColors.length]

          return (
            <div key={stage.id} className="space-y-2">
              {/* Label Row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {stage.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {stage.count}
                  </span>
                  {showPercentages && (
                    <span className="text-xs text-muted-foreground">
                      ({stage.percentage}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar - Pill Style */}
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    color
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total en pipeline</span>
          <span className="font-semibold text-foreground">
            {stages.reduce((acc, s) => acc + s.count, 0)} leads
          </span>
        </div>
      </div>
    </div>
  )
}

interface FunnelMiniProps {
  stages: { name: string; count: number; color?: string }[]
  className?: string
}

export function FunnelMini({ stages, className }: FunnelMiniProps) {
  const total = stages.reduce((acc, s) => acc + s.count, 0)

  return (
    <div className={cn("flex h-2.5 rounded-full overflow-hidden bg-muted", className)}>
      {stages.map((stage, index) => {
        const width = total > 0 ? (stage.count / total) * 100 : 0
        const color = stage.color || defaultColors[index % defaultColors.length]

        return (
          <div
            key={stage.name}
            className={cn("h-full transition-all duration-500", color)}
            style={{ width: `${width}%` }}
            title={`${stage.name}: ${stage.count}`}
          />
        )
      })}
    </div>
  )
}
