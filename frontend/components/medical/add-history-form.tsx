"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, X } from "lucide-react"

interface AddHistoryFormProps {
  content: string
  onChange: (content: string) => void
  onSave: () => void
  onCancel: () => void
}

export function AddHistoryForm({ content, onChange, onSave, onCancel }: AddHistoryFormProps) {
  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-history">Nueva entrada en historia médica</Label>
            <Textarea
              id="new-history"
              placeholder="Escriba aquí las notas médicas, observaciones, diagnósticos, tratamientos..."
              value={content}
              onChange={(e) => onChange(e.target.value)}
              rows={6}
              className="mt-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!content.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              Guardar Entrada
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
