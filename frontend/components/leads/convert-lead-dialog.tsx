"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lead } from "@/lib/api"
import { ConvertToPatientForm } from "./convert-to-patient-form"

interface ConvertLeadDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function ConvertLeadDialog({ lead, open, onOpenChange, onSubmit }: ConvertLeadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convertir Lead en Paciente</DialogTitle>
          <DialogDescription>
            Vas a convertir a {lead?.first_name} {lead?.last_name} en paciente.
            Esto cambiará su estado a "En Tratamiento" y opcionalmente creará una cuenta de usuario.
          </DialogDescription>
        </DialogHeader>

        <ConvertToPatientForm
          lead={lead}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
