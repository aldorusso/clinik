"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { User, TenantWithStats, UserRole } from "@/lib/api"
import { Building2, UserPlus } from "lucide-react"

interface AssignTenantModalProps {
  user: User | null
  tenants: TenantWithStats[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (userId: string, tenantId: string, role: UserRole, isDefault: boolean) => Promise<void>
}

const ROLE_OPTIONS = [
  { value: "tenant_admin", label: "Administrador" },
  { value: "manager", label: "Manager" },
  { value: "medico", label: "Médico" },
  { value: "closer", label: "Closer/Comercial" },
  { value: "recepcionista", label: "Recepcionista" },
]

export function AssignTenantModal({
  user,
  tenants,
  open,
  onOpenChange,
  onAssign,
}: AssignTenantModalProps) {
  const [selectedTenant, setSelectedTenant] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("medico")
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Filter out tenants the user already belongs to
  const availableTenants = tenants.filter((tenant) => {
    if (!user?.memberships) return true
    return !user.memberships.some((m) => m.tenant_id === tenant.id)
  })

  const handleSubmit = async () => {
    if (!user || !selectedTenant || !selectedRole) {
      setError("Selecciona un tenant y un rol")
      return
    }

    setLoading(true)
    setError("")

    try {
      await onAssign(user.id, selectedTenant, selectedRole, isDefault)
      onOpenChange(false)
      // Reset form
      setSelectedTenant("")
      setSelectedRole("medico")
      setIsDefault(false)
    } catch (err: any) {
      setError(err.message || "Error al asignar usuario")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    setSelectedTenant("")
    setSelectedRole("medico")
    setIsDefault(false)
    onOpenChange(false)
  }

  if (!user) return null

  const userName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.full_name || user.email

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Asignar a Organización
          </DialogTitle>
          <DialogDescription>
            Asignar a <strong>{userName}</strong> a una nueva organización.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {availableTenants.length === 0 ? (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Este usuario ya pertenece a todas las organizaciones disponibles.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Organización</Label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rol en esta organización</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <Label htmlFor="is_default" className="text-sm font-normal cursor-pointer">
                  Establecer como organización por defecto
                </Label>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedTenant || availableTenants.length === 0}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Asignando...
              </>
            ) : (
              "Asignar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
