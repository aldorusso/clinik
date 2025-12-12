"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DialogFooter } from "@/components/ui/dialog"
import { Lead } from "@/lib/api"

interface ConvertToPatientFormProps {
  lead: Lead | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ConvertToPatientForm({ lead, onSubmit, onCancel }: ConvertToPatientFormProps) {
  const [createUserAccount, setCreateUserAccount] = useState(true)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  const [password, setPassword] = useState("")
  const [conversionNotes, setConversionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!lead) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const conversionData = {
      create_user_account: createUserAccount,
      send_welcome_email: sendWelcomeEmail,
      password: password || undefined, // Solo enviar si se proporcionó
      conversion_notes: conversionNotes || undefined,
    }

    try {
      await onSubmit(conversionData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Información del Lead */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Información del Lead</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nombre:</span> {lead.first_name} {lead.last_name}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span> {lead.email || "No especificado"}
          </div>
          <div>
            <span className="text-muted-foreground">Teléfono:</span> {lead.phone}
          </div>
          <div>
            <span className="text-muted-foreground">Estado actual:</span> {lead.status}
          </div>
        </div>
      </div>

      {/* Opciones de conversión */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="create-account"
            checked={createUserAccount}
            onCheckedChange={setCreateUserAccount}
          />
          <Label htmlFor="create-account">Crear cuenta de usuario para el paciente</Label>
        </div>

        {createUserAccount && (
          <>
            <div className="ml-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-email"
                  checked={sendWelcomeEmail}
                  onCheckedChange={setSendWelcomeEmail}
                />
                <Label htmlFor="send-email">Enviar email de bienvenida</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar vacío para generar automáticamente"
                />
                <p className="text-xs text-muted-foreground">
                  Si no se especifica, se generará una contraseña aleatoria de 12 caracteres.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notas de conversión (opcional)</Label>
          <Textarea
            id="notes"
            value={conversionNotes}
            onChange={(e) => setConversionNotes(e.target.value)}
            placeholder="Agregar notas sobre la conversión del lead..."
            rows={3}
          />
        </div>
      </div>

      {/* Advertencia si no hay email */}
      {createUserAccount && !lead.email && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Este lead no tiene email. No se podrá crear la cuenta de usuario.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || (createUserAccount && !lead.email)}
        >
          {isSubmitting ? "Convirtiendo..." : "Convertir en Paciente"}
        </Button>
      </DialogFooter>
    </form>
  )
}