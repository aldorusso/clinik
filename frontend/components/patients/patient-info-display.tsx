"use client"

import { User as UserIcon } from "lucide-react"
import { Patient } from "./appointment-form-types"

interface PatientInfoDisplayProps {
  patient: Patient
}

export function PatientInfoDisplay({ patient }: PatientInfoDisplayProps) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <UserIcon className="h-4 w-4" />
        <span className="font-medium">Informacion del Paciente</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Nombre:</span> {patient.full_name}
        </div>
        <div>
          <span className="text-muted-foreground">Telefono:</span> {patient.phone}
        </div>
      </div>
    </div>
  )
}
