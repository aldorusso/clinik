"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CommercialObjective } from "@/lib/api"
import { formatValue } from "./objective-helpers"

interface ProgressFormData {
  increment: number
  notes: string
}

interface ProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objective: CommercialObjective | null
  formData: ProgressFormData
  onFormChange: (data: ProgressFormData) => void
  onSubmit: () => void
}

export function ProgressDialog({
  open,
  onOpenChange,
  objective,
  formData,
  onFormChange,
  onSubmit
}: ProgressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar Progreso</DialogTitle>
          <DialogDescription>
            Registra el avance en tu objetivo "{objective?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {objective && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Progreso actual</p>
              <p className="font-medium">
                {formatValue(objective.type, objective.current_value, objective.unit)} / {formatValue(objective.type, objective.target_value, objective.unit)}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="increment">Incremento</Label>
            <Input
              id="increment"
              type="number"
              value={formData.increment}
              onChange={(e) => onFormChange({ ...formData, increment: parseFloat(e.target.value) || 0 })}
              placeholder="Cantidad a agregar (puede ser negativa)"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
              placeholder="Describe el progreso realizado..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>
              Actualizar Progreso
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
