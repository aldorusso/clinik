"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CommercialObjective,
  CommercialObjectiveCreate,
  ObjectiveType,
  ObjectivePeriod,
  ObjectiveTemplate,
  User
} from "@/lib/api"

interface ObjectiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingObjective: CommercialObjective | null
  objectiveForm: CommercialObjectiveCreate
  setObjectiveForm: (form: CommercialObjectiveCreate) => void
  commercials: User[]
  templates: ObjectiveTemplate[]
  onSubmit: () => void
  onApplyTemplate: (template: ObjectiveTemplate) => void
}

export function ObjectiveDialog({
  open,
  onOpenChange,
  editingObjective,
  objectiveForm,
  setObjectiveForm,
  commercials,
  templates,
  onSubmit,
  onApplyTemplate
}: ObjectiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingObjective ? "Editar Objetivo" : "Crear Nuevo Objetivo"}
          </DialogTitle>
          <DialogDescription>
            {editingObjective
              ? "Actualiza la información del objetivo comercial."
              : "Define un nuevo objetivo para tu equipo comercial."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates Section */}
          {!editingObjective && templates.length > 0 && (
            <div>
              <Label>Usar Plantilla (Opcional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {templates.map(template => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="commercial">Comercial</Label>
              <Select
                value={objectiveForm.commercial_id}
                onValueChange={(value) => setObjectiveForm({ ...objectiveForm, commercial_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar comercial" />
                </SelectTrigger>
                <SelectContent>
                  {commercials.map(commercial => (
                    <SelectItem key={commercial.id} value={commercial.id}>
                      {commercial.full_name || commercial.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Tipo de Objetivo</Label>
              <Select
                value={objectiveForm.type}
                onValueChange={(value) => setObjectiveForm({ ...objectiveForm, type: value as ObjectiveType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="conversions">Conversiones</SelectItem>
                  <SelectItem value="revenue">Ingresos</SelectItem>
                  <SelectItem value="appointments">Citas</SelectItem>
                  <SelectItem value="calls">Llamadas</SelectItem>
                  <SelectItem value="meetings">Reuniones</SelectItem>
                  <SelectItem value="satisfaction">Satisfacción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Título del Objetivo</Label>
            <Input
              id="title"
              value={objectiveForm.title}
              onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
              placeholder="Ej. Capturar 50 leads este mes"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={objectiveForm.description}
              onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
              placeholder="Descripción detallada del objetivo"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="target_value">Meta</Label>
              <Input
                id="target_value"
                type="number"
                value={objectiveForm.target_value}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, target_value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unidad</Label>
              <Input
                id="unit"
                value={objectiveForm.unit}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, unit: e.target.value })}
                placeholder="leads, MXN, %, etc."
              />
            </div>
            <div>
              <Label htmlFor="period">Período</Label>
              <Select
                value={objectiveForm.period}
                onValueChange={(value) => setObjectiveForm({ ...objectiveForm, period: value as ObjectivePeriod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={objectiveForm.start_date}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Fecha de Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={objectiveForm.end_date}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Reward Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Incentivo (Opcional)</h4>

            <div>
              <Label htmlFor="reward_description">Descripción del Incentivo</Label>
              <Input
                id="reward_description"
                value={objectiveForm.reward_description}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, reward_description: e.target.value })}
                placeholder="Ej. Bono por cumplimiento de meta"
              />
            </div>

            <div>
              <Label htmlFor="reward_amount">Monto del Incentivo</Label>
              <Input
                id="reward_amount"
                type="number"
                value={objectiveForm.reward_amount}
                onChange={(e) => setObjectiveForm({ ...objectiveForm, reward_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={objectiveForm.is_public}
                onCheckedChange={(checked) => setObjectiveForm({ ...objectiveForm, is_public: checked })}
              />
              <Label htmlFor="is_public">Visible para otros comerciales</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_calculate"
                checked={objectiveForm.auto_calculate}
                onCheckedChange={(checked) => setObjectiveForm({ ...objectiveForm, auto_calculate: checked })}
              />
              <Label htmlFor="auto_calculate">Cálculo automático</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>
              {editingObjective ? "Actualizar" : "Crear"} Objetivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
