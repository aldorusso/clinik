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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { User } from "@/lib/api"
import { ClientFormData, EditClientFormData } from "@/hooks/use-clients-management"

interface CreateClientDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: ClientFormData
  onFormChange: (data: ClientFormData) => void
  onSubmit: () => Promise<boolean>
}

export function CreateClientDialog({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit
}: CreateClientDialogProps) {
  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Agrega un nuevo cliente a tu organizacion
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => onFormChange({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => onFormChange({ ...formData, last_name: e.target.value })}
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
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              placeholder="cliente@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => onFormChange({ ...formData, password: e.target.value })}
              placeholder="Minimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_company_name">Empresa</Label>
            <Input
              id="client_company_name"
              value={formData.client_company_name}
              onChange={(e) => onFormChange({ ...formData, client_company_name: e.target.value })}
              placeholder="Nombre de la empresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_tax_id">RUC/NIT</Label>
            <Input
              id="client_tax_id"
              value={formData.client_tax_id}
              onChange={(e) => onFormChange({ ...formData, client_tax_id: e.target.value })}
              placeholder="Identificacion fiscal"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Crear Cliente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditClientDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: EditClientFormData
  onFormChange: (data: EditClientFormData) => void
  onSubmit: () => Promise<boolean>
}

export function EditClientDialog({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit
}: EditClientDialogProps) {
  const handleSubmit = async () => {
    const success = await onSubmit()
    if (success) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifica la informacion del cliente
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_first_name">Nombre</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => onFormChange({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_last_name">Apellido</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => onFormChange({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_phone">Telefono</Label>
            <Input
              id="edit_phone"
              value={formData.phone}
              onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_client_company_name">Empresa</Label>
            <Input
              id="edit_client_company_name"
              value={formData.client_company_name}
              onChange={(e) => onFormChange({ ...formData, client_company_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_client_tax_id">RUC/NIT</Label>
            <Input
              id="edit_client_tax_id"
              value={formData.client_tax_id}
              onChange={(e) => onFormChange({ ...formData, client_tax_id: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteClientDialogProps {
  isOpen: boolean
  onClose: () => void
  client: User | null
  onConfirm: () => Promise<boolean>
}

export function DeleteClientDialog({
  isOpen,
  onClose,
  client,
  onConfirm
}: DeleteClientDialogProps) {
  const handleConfirm = async () => {
    const success = await onConfirm()
    if (success) onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Estas seguro de que deseas eliminar al cliente{" "}
            <strong>{client?.email}</strong>? Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
