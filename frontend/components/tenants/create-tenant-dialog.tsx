"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Search, User, UserPlus } from "lucide-react"
import { TenantCreateWithAdmin, User as UserType } from "@/lib/api"

type AdminMode = "new" | "existing"

interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: TenantCreateWithAdmin
  setFormData: (data: TenantCreateWithAdmin) => void
  adminMode: AdminMode
  setAdminMode: (mode: AdminMode) => void
  availableUsers: UserType[]
  userSearchTerm: string
  setUserSearchTerm: (term: string) => void
  selectedUserId: string | null
  setSelectedUserId: (id: string | null) => void
  loadingUsers: boolean
  onNameChange: (name: string) => void
  onSubmit: () => void
  onReset: () => void
}

export function CreateTenantDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  adminMode,
  setAdminMode,
  availableUsers,
  userSearchTerm,
  setUserSearchTerm,
  selectedUserId,
  setSelectedUserId,
  loadingUsers,
  onNameChange,
  onSubmit,
  onReset,
}: CreateTenantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Organizacion</DialogTitle>
          <DialogDescription>
            Crea una nueva organizacion con su administrador inicial
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Organizacion</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Mi Empresa S.A."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="mi-empresa"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium mb-3">Administrador Inicial</h4>

            <RadioGroup
              value={adminMode}
              onValueChange={(value) => {
                setAdminMode(value as AdminMode)
                setSelectedUserId(null)
              }}
              className="flex gap-4 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="admin-new" />
                <Label htmlFor="admin-new" className="flex items-center gap-1 cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  Crear nuevo usuario
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="admin-existing" />
                <Label htmlFor="admin-existing" className="flex items-center gap-1 cursor-pointer">
                  <User className="h-4 w-4" />
                  Usuario existente
                </Label>
              </div>
            </RadioGroup>

            {adminMode === "new" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_first_name">Nombre</Label>
                    <Input
                      id="admin_first_name"
                      value={formData.admin_first_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_first_name: e.target.value })
                      }
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_last_name">Apellido</Label>
                    <Input
                      id="admin_last_name"
                      value={formData.admin_last_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_last_name: e.target.value })
                      }
                      placeholder="Perez"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Email del Admin</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={formData.admin_email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_email: e.target.value })
                      }
                      placeholder="admin@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Contrasena</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      value={formData.admin_password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_password: e.target.value })
                      }
                      placeholder="******"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email o nombre..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Buscando usuarios...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {userSearchTerm
                        ? "No se encontraron usuarios"
                        : "Escribe para buscar usuarios"}
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                          selectedUserId === user.id
                            ? "bg-primary/10 border-primary"
                            : ""
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        {user.role && (
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {selectedUserId && (
                  <p className="text-sm text-green-600">Usuario seleccionado para admin</p>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              onReset()
            }}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Crear Organizacion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
