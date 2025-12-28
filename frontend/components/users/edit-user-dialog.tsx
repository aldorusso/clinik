"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { UserRole } from "@/lib/api"

interface EditUserFormData {
  email: string
  first_name: string
  last_name: string
  phone: string
  role: UserRole
  is_active: boolean
}

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: EditUserFormData
  setFormData: (data: EditUserFormData) => void
  onSubmit: () => void
}

export function EditUserDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Modifica la informacion del usuario</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_first_name">Nombre</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_last_name">Apellido</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_email">Email</Label>
            <Input
              id="edit_email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_phone">Telefono</Label>
            <Input
              id="edit_phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="tenant_admin">Admin de Tenant</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="medico">Usuario</SelectItem>
                <SelectItem value="closer">Closer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
