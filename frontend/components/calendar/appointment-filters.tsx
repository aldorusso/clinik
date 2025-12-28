"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, CheckCircle, Stethoscope, CheckCircle2, XCircle, X } from "lucide-react"
import { User } from "@/lib/api"

interface AppointmentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedProvider: string
  onProviderChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  providers: User[]
  onClearFilters: () => void
}

export function AppointmentFilters({
  searchTerm,
  onSearchChange,
  selectedProvider,
  onProviderChange,
  selectedStatus,
  onStatusChange,
  providers,
  onClearFilters
}: AppointmentFiltersProps) {
  const hasFilters = selectedProvider || selectedStatus || searchTerm

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64"
        />
      </div>

      <Select value={selectedProvider || "all"} onValueChange={(value) => onProviderChange(value === "all" ? "" : value)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Filtrar por médico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los médicos</SelectItem>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                {provider.full_name || `${provider.first_name} ${provider.last_name}`}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus || "all"} onValueChange={(value) => onStatusChange(value === "all" ? "" : value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Estado de cita" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="scheduled">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Programada
            </div>
          </SelectItem>
          <SelectItem value="confirmed">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Confirmada
            </div>
          </SelectItem>
          <SelectItem value="in_progress">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-green-600" />
              En Consulta
            </div>
          </SelectItem>
          <SelectItem value="completed">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completada
            </div>
          </SelectItem>
          <SelectItem value="no_show">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              No Asistió
            </div>
          </SelectItem>
          <SelectItem value="cancelled_by_patient">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Cancelada (Paciente)
            </div>
          </SelectItem>
          <SelectItem value="cancelled_by_clinic">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Cancelada (Clínica)
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
