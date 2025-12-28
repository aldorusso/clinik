"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lead, User } from "@/lib/api"

interface AssignLeadDialogProps {
  lead: Lead | null
  doctors: User[]
  onClose: () => void
  onAssign: (doctorId: string) => void
}

export function AssignLeadDialog({ lead, doctors, onClose, onAssign }: AssignLeadDialogProps) {
  return (
    <Dialog open={lead !== null} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Lead</DialogTitle>
          <DialogDescription>
            Selecciona un médico para asignar el lead: {lead?.first_name} {lead?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="doctor-select" className="text-sm font-medium">
              Médico
            </label>
            <Select onValueChange={onAssign}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar médico" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name} ({doctor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {doctors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay médicos disponibles para asignar
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
