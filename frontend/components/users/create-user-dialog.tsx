"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { UserPlus, Shield, UserCog, Briefcase, User as UserIcon, UserCheck, Building2, Mail, Key } from "lucide-react"
import { UserRole, TenantWithStats } from "@/lib/api"

interface CreateUserFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  role: UserRole
  tenant_id: string
}

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CreateUserFormData
  setFormData: (data: CreateUserFormData) => void
  sendInvitation: boolean
  setSendInvitation: (value: boolean) => void
  isCreating: boolean
  tenants: TenantWithStats[]
  onSubmit: () => void
}

export function CreateUserDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  sendInvitation,
  setSendInvitation,
  isCreating,
  tenants,
  onSubmit,
}: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Crea un usuario en el sistema. Los superadmins no pertenecen a ningun tenant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Switch para elegir metodo de creacion */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {sendInvitation ? (
                  <Mail className="h-4 w-4 text-blue-500" />
                ) : (
                  <Key className="h-4 w-4 text-amber-500" />
                )}
                <Label htmlFor="send-invitation" className="font-medium">
                  {sendInvitation ? "Enviar invitacion por email" : "Crear con contrasena"}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {sendInvitation
                  ? "El usuario recibira un email para crear su contrasena"
                  : "Tu defines la contrasena del usuario"}
              </p>
            </div>
            <Switch
              id="send-invitation"
              checked={sendInvitation}
              onCheckedChange={setSendInvitation}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Perez"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
            />
          </div>
          {!sendInvitation && (
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimo 6 caracteres"
              />
            </div>
          )}
          {!sendInvitation && (
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Superadmin
                  </div>
                </SelectItem>
                <SelectItem value="tenant_admin">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Admin de Tenant
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Manager
                  </div>
                </SelectItem>
                <SelectItem value="medico">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Usuario
                  </div>
                </SelectItem>
                <SelectItem value="closer">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Cliente
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.role !== "superadmin" && (
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {tenant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isCreating}>
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">&#9696;</span>
                {sendInvitation ? "Enviando..." : "Creando..."}
              </>
            ) : (
              <>
                {sendInvitation ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Invitacion
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
