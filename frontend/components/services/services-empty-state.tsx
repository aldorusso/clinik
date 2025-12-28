"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Stethoscope, Plus } from "lucide-react"

interface ServicesEmptyStateProps {
  searchTerm: string
  canCreate?: boolean
  onCreate?: () => void
}

export function ServicesEmptyState({ searchTerm, canCreate, onCreate }: ServicesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">No hay servicios</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {searchTerm
            ? "No se encontraron servicios que coincidan con la busqueda."
            : "Comienza creando el primer servicio de la clinica."
          }
        </p>
        {canCreate && !searchTerm && onCreate && (
          <div className="mt-6">
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Servicio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
