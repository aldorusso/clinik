"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Service, ServiceCategory, ServiceCreate } from "@/lib/api"

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingService: Service | null
  serviceForm: ServiceCreate
  setServiceForm: (form: ServiceCreate) => void
  categories: ServiceCategory[]
  onSubmit: () => void
}

export function ServiceDialog({
  open,
  onOpenChange,
  editingService,
  serviceForm,
  setServiceForm,
  categories,
  onSubmit
}: ServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? "Actualiza la información del servicio médico."
              : "Define un nuevo servicio médico para tu clínica."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service-name">Nombre del Servicio</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Ej. Limpieza Facial Profunda"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={serviceForm.category_id}
                onValueChange={(value) => setServiceForm({ ...serviceForm, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.is_active).map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Descripción detallada del servicio"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="60"
              />
            </div>
            <div>
              <Label htmlFor="price-min">Precio Mín (MXN)</Label>
              <Input
                id="price-min"
                type="number"
                value={serviceForm.price_min}
                onChange={(e) => setServiceForm({ ...serviceForm, price_min: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="price-max">Precio Máx (MXN)</Label>
              <Input
                id="price-max"
                type="number"
                value={serviceForm.price_max}
                onChange={(e) => setServiceForm({ ...serviceForm, price_max: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preparation">Instrucciones de Preparación</Label>
            <Textarea
              id="preparation"
              value={serviceForm.preparation_instructions}
              onChange={(e) => setServiceForm({ ...serviceForm, preparation_instructions: e.target.value })}
              placeholder="Instrucciones para el paciente antes del procedimiento..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="contraindications">Contraindicaciones</Label>
            <Textarea
              id="contraindications"
              value={serviceForm.contraindications}
              onChange={(e) => setServiceForm({ ...serviceForm, contraindications: e.target.value })}
              placeholder="Contraindicaciones y advertencias..."
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="requires-consultation"
                checked={serviceForm.requires_consultation}
                onCheckedChange={(checked) => setServiceForm({ ...serviceForm, requires_consultation: checked })}
              />
              <Label htmlFor="requires-consultation">Requiere consulta previa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={serviceForm.is_active}
                onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_active: checked })}
              />
              <Label htmlFor="is-active">Servicio activo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>
              {editingService ? "Actualizar" : "Crear"} Servicio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
