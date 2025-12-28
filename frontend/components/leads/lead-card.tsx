"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Phone,
  Mail,
  Edit,
  Trash2,
  UserPlus,
  UserCheck,
} from "lucide-react"
import { Lead } from "@/lib/api"
import { getStatusInfo, getPriorityColor } from "./lead-constants"

interface LeadCardProps {
  lead: Lead
  onEdit: (lead: Lead) => void
  onDelete: (leadId: string) => void
  onAssign: (lead: Lead) => void
  onConvert: (lead: Lead) => void
}

export function LeadCard({ lead, onEdit, onDelete, onAssign, onConvert }: LeadCardProps) {
  const statusInfo = getStatusInfo(lead.status)

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{lead.first_name} {lead.last_name}</h3>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
              {lead.priority.toUpperCase()}
            </span>
            {lead.assigned_to_name && (
              <Badge variant="outline" className="text-xs">
                Asignado a: {lead.assigned_to_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {lead.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </div>
            )}
            <div>
              Fuente: {lead.source}
            </div>
            <div>
              {new Date(lead.created_at).toLocaleDateString()}
            </div>
          </div>
          {lead.notes && (
            <div className="text-sm text-muted-foreground">
              {lead.notes.substring(0, 100)}{lead.notes.length > 100 && '...'}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(lead)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          {!lead.assigned_to_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssign(lead)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Asignar
            </Button>
          )}
          {lead.status !== 'en_tratamiento' && lead.status !== 'completado' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvert(lead)}
              className="text-green-600 hover:text-green-700"
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Convertir
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(lead.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
