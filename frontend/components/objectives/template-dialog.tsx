"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ObjectiveTemplate, ObjectiveTemplateCreate, ObjectiveType } from "@/lib/api"
import { getTypeLabel } from "./objective-helpers"

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: ObjectiveTemplate[]
  templateForm: ObjectiveTemplateCreate
  setTemplateForm: (form: ObjectiveTemplateCreate) => void
  onSubmit: () => void
}

export function TemplateDialog({
  open,
  onOpenChange,
  templates,
  templateForm,
  setTemplateForm,
  onSubmit
}: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plantillas de Objetivos</DialogTitle>
          <DialogDescription>
            Crea plantillas para generar objetivos recurrentes rápidamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Templates */}
          {templates.length > 0 && (
            <div>
              <Label>Plantillas Existentes</Label>
              <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getTypeLabel(template.type)} - {template.default_target_value} {template.default_unit}
                      </p>
                    </div>
                    <Badge variant="secondary">{template.usage_count} usos</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Template */}
          <div className="border-t pt-4">
            <Label>Crear Nueva Plantilla</Label>

            <div className="space-y-3 mt-2">
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="Nombre de la plantilla"
              />

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={templateForm.type}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, type: value as ObjectiveType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="conversions">Conversiones</SelectItem>
                    <SelectItem value="revenue">Ingresos</SelectItem>
                    <SelectItem value="appointments">Citas</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={templateForm.default_target_value}
                  onChange={(e) => setTemplateForm({ ...templateForm, default_target_value: parseFloat(e.target.value) || 0 })}
                  placeholder="Meta por defecto"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onSubmit}>
                Crear Plantilla
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
