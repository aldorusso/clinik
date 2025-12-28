"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
import { Plan, PlanCreate } from "@/lib/api"

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan: Plan | null
  planForm: PlanCreate
  setPlanForm: (form: PlanCreate) => void
  onSave: () => void
  saving: boolean
}

export function PlanDialog({
  open,
  onOpenChange,
  editingPlan,
  planForm,
  setPlanForm,
  onSave,
  saving
}: PlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingPlan ? "Editar Plan" : "Nuevo Plan"}
          </DialogTitle>
          <DialogDescription>
            {editingPlan
              ? "Modifica los detalles del plan"
              : "Crea un nuevo plan de suscripcion"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="Ej: Pro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={planForm.slug}
                onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                placeholder="Ej: pro"
                disabled={!!editingPlan}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Descripcion del plan..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_monthly">Precio Mensual</Label>
              <Input
                id="price_monthly"
                type="number"
                step="0.01"
                value={planForm.price_monthly}
                onChange={(e) =>
                  setPlanForm({ ...planForm, price_monthly: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_yearly">Precio Anual</Label>
              <Input
                id="price_yearly"
                type="number"
                step="0.01"
                value={planForm.price_yearly}
                onChange={(e) =>
                  setPlanForm({ ...planForm, price_yearly: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={planForm.currency}
                onValueChange={(value) => setPlanForm({ ...planForm, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_users">Max Usuarios (-1 = ilimitado)</Label>
              <Input
                id="max_users"
                type="number"
                value={planForm.max_users}
                onChange={(e) =>
                  setPlanForm({ ...planForm, max_users: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_clients">Max Clientes (-1 = ilimitado)</Label>
              <Input
                id="max_clients"
                type="number"
                value={planForm.max_clients}
                onChange={(e) =>
                  setPlanForm({ ...planForm, max_clients: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_storage_gb">Almacenamiento (GB)</Label>
              <Input
                id="max_storage_gb"
                type="number"
                value={planForm.max_storage_gb}
                onChange={(e) =>
                  setPlanForm({ ...planForm, max_storage_gb: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={planForm.is_active}
                onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
              />
              <Label htmlFor="is_active">Activo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={planForm.is_default}
                onCheckedChange={(checked) => setPlanForm({ ...planForm, is_default: checked })}
              />
              <Label htmlFor="is_default">Plan por defecto</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
