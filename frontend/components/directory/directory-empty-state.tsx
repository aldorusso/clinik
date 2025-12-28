"use client"

import { Button } from "@/components/ui/button"
import { Users, X } from "lucide-react"

interface DirectoryEmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export function DirectoryEmptyState({ hasFilters, onClearFilters }: DirectoryEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
      <p className="text-muted-foreground">
        {hasFilters
          ? "Intenta con otros terminos de busqueda o filtros"
          : "No hay usuarios registrados en la organizacion"
        }
      </p>
      {hasFilters && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={onClearFilters}
        >
          <X className="h-3 w-3 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
