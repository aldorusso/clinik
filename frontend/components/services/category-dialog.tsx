"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Edit } from "lucide-react"
import { ServiceCategory, ServiceCategoryCreate } from "@/lib/api"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ServiceCategory[]
  editingCategory: ServiceCategory | null
  categoryForm: ServiceCategoryCreate
  setCategoryForm: (form: ServiceCategoryCreate) => void
  onSubmit: () => void
  onEditCategory: (category: ServiceCategory) => void
  onReset: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  categories,
  editingCategory,
  categoryForm,
  setCategoryForm,
  onSubmit,
  onEditCategory,
  onReset
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestión de Categorías</DialogTitle>
          <DialogDescription>
            Administra las categorías de servicios médicos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Categories */}
          {categories.length > 0 && (
            <div>
              <Label>Categorías Existentes</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditCategory(category)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Category */}
          <div className="border-t pt-4">
            <Label>{editingCategory ? "Editar Categoría" : "Crear Nueva Categoría"}</Label>

            <div className="space-y-3 mt-2">
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Nombre de la categoría"
              />

              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Descripción de la categoría"
                rows={2}
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="category-active"
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                />
                <Label htmlFor="category-active">Categoría activa</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { onOpenChange(false); onReset() }}>
                {editingCategory ? "Cancelar" : "Cerrar"}
              </Button>
              <Button onClick={onSubmit}>
                {editingCategory ? "Actualizar" : "Crear"} Categoría
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
