"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "inverted"
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className
}: MetricCardProps) {
  const isInverted = variant === "inverted"

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200",
        isInverted
          ? "bg-dark-bg text-white shadow-lg"
          : "bg-card border border-border/50 shadow-sm hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-xs font-medium uppercase tracking-wider",
            isInverted ? "text-gray-400" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            isInverted ? "text-white" : "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              isInverted ? "text-gray-400" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={cn(
            "p-3 rounded-xl",
            isInverted
              ? "bg-sidebar-primary/20"
              : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              isInverted ? "text-sidebar-primary" : "text-primary"
            )} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
            trend.isPositive
              ? "bg-emerald/10 text-emerald"
              : "bg-destructive/10 text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
          <span className={cn(
            "text-xs",
            isInverted ? "text-gray-500" : "text-muted-foreground"
          )}>
            vs mes anterior
          </span>
        </div>
      )}
    </div>
  )
}

interface MetricCardGridProps {
  children: React.ReactNode
  className?: string
}

export function MetricCardGrid({ children, className }: MetricCardGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
      className
    )}>
      {children}
    </div>
  )
}
