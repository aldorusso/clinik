"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Target } from "lucide-react"

interface ObjectivesEmptyStateProps {
  hasSearchTerm: boolean
}

export function ObjectivesEmptyState({ hasSearchTerm }: ObjectivesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">
          {hasSearchTerm ? "No se encontraron objetivos" : "No hay objetivos asignados"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasSearchTerm
            ? "Intenta con otros terminos de busqueda."
            : "Tu administrador te asignara objetivos proximamente."
          }
        </p>
      </CardContent>
    </Card>
  )
}
