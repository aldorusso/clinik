"use client"

import { FileText } from "lucide-react"

export function EmptyHistory() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <FileText className="mx-auto h-12 w-12 mb-4" />
      <p>No hay entradas en el historial médico</p>
      <p className="text-sm">Comience agregando la primera entrada</p>
    </div>
  )
}
