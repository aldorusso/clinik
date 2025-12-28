"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { Lead } from "@/lib/api"
import { LeadCard } from "./lead-card"

interface LeadsListProps {
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onDelete: (leadId: string) => void
  onAssign: (lead: Lead) => void
  onConvert: (lead: Lead) => void
  onCreateNew: () => void
}

export function LeadsList({
  leads,
  onEdit,
  onDelete,
  onAssign,
  onConvert,
  onCreateNew,
}: LeadsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Leads</CardTitle>
        <CardDescription>
          Todos los leads capturados en la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.map((lead: Lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={onAssign}
              onConvert={onConvert}
            />
          ))}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No hay leads</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza creando tu primer lead.
            </p>
            <div className="mt-6">
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Lead
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
