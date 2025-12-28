"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Filter,
  X,
  Shield,
  UserCog,
  Stethoscope,
  Briefcase,
  HeadphonesIcon
} from "lucide-react"

interface RoleFilterProps {
  selectedRole: string
  onRoleChange: (role: string) => void
  searchTerm: string
  onClearFilters: () => void
}

export function RoleFilter({
  selectedRole,
  onRoleChange,
  searchTerm,
  onClearFilters
}: RoleFilterProps) {
  const showClearButton = searchTerm || selectedRole !== "all"

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los roles</SelectItem>
          <SelectItem value="tenant_admin">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administrador
            </div>
          </SelectItem>
          <SelectItem value="manager">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Gestor de Leads
            </div>
          </SelectItem>
          <SelectItem value="medico">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Medico
            </div>
          </SelectItem>
          <SelectItem value="closer">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Closer
            </div>
          </SelectItem>
          <SelectItem value="recepcionista">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4" />
              Recepcionista
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      {showClearButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
        >
          <X className="h-3 w-3 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
