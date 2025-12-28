"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package } from "lucide-react"
import { InventoryCategoryCreate } from "@/lib/api-inventory"
import { colorPresets, iconPresets, getIconEmoji } from "./category-presets"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: InventoryCategoryCreate
  setFormData: (data: InventoryCategoryCreate | ((prev: InventoryCategoryCreate) => InventoryCategoryCreate)) => void
  onSubmit: () => void
  isEdit?: boolean
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEdit = false
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Categoria" : "Nueva Categoria"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la categoria"
              : "Crea una nueva categoria para organizar los productos del inventario"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre *</Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Medicamentos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Descripcion</Label>
            <Textarea
              id="category-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripcion de la categoria"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      formData.color === preset.value ? 'border-foreground shadow-lg scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                {iconPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={formData.icon === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, icon: preset.value }))}
                    className="h-12 flex flex-col gap-0 p-1"
                    title={preset.name}
                  >
                    <span className="text-lg">{preset.emoji}</span>
                    <span className="text-[10px] leading-none truncate">{preset.name.slice(0, 6)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {(formData.color || formData.icon) && (
            <div className="space-y-2">
              <Label>Vista Previa</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: formData.color ? formData.color + "20" : "#f1f5f9",
                    color: formData.color || "#64748b"
                  }}
                >
                  {formData.icon ? (
                    <span className="text-xl">{getIconEmoji(formData.icon)}</span>
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{formData.name || "Nombre de la categoria"}</p>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isEdit && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="category-active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="category-active" className="text-sm font-normal">
                Categoria activa
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>
            {isEdit ? "Guardar Cambios" : "Crear Categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
