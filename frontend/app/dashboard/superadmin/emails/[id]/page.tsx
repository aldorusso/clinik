"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { EmailTemplate, EmailTemplateType } from "@/types/email-template"
import { ArrowLeft, Save, Eye } from "lucide-react"
import { toast } from "sonner"

const templateTypeLabels: Record<EmailTemplateType, string> = {
  [EmailTemplateType.PASSWORD_RESET]: "Recuperacion de Contrasena",
  [EmailTemplateType.WELCOME]: "Bienvenida",
  [EmailTemplateType.NOTIFICATION]: "Notificacion",
}

export default function EditEmailTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    html_content: "",
    is_active: true,
  })

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const token = auth.getToken()

      if (!token) {
        router.push("/")
        return
      }

      const data = await api.getEmailTemplate(token, templateId)
      setTemplate(data)
      setFormData({
        subject: data.subject,
        html_content: data.html_content,
        is_active: data.is_active,
      })
    } catch (err) {
      toast.error("Error al cargar la plantilla")
      router.push("/dashboard/superadmin/emails")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = auth.getToken()

      if (!token) {
        router.push("/")
        return
      }

      await api.updateEmailTemplate(token, templateId, formData)
      toast.success("Plantilla actualizada correctamente")
      router.push("/dashboard/superadmin/emails")
    } catch (err) {
      toast.error("Error al guardar la plantilla")
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (template) {
      window.open(`/dashboard/superadmin/emails/preview/${template.template_type}`, "_blank")
    }
  }

  if (loading) {
    return (
      <SuperadminDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SuperadminDashboardLayout>
    )
  }

  if (!template) {
    return null
  }

  return (
    <SuperadminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/superadmin/emails")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Editar Plantilla</h1>
              <p className="text-muted-foreground">
                {template.name} - {templateTypeLabels[template.template_type]}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion General</CardTitle>
              <CardDescription>Configura el asunto y estado de la plantilla</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto del Correo</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Asunto del correo electronico"
                />
                <p className="text-sm text-muted-foreground">
                  Puedes usar variables como {"{{ project_name }}"} o {"{{ user_name }}"}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Plantilla Activa</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenido HTML</CardTitle>
              <CardDescription>Edita el contenido HTML de la plantilla (sintaxis Jinja2)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                className="font-mono text-sm min-h-[500px]"
                placeholder="<html>...</html>"
              />
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Variables Disponibles:</h4>
                <div className="text-xs space-y-1">
                  {template.variables ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(JSON.parse(template.variables)).map(([key, value]) => (
                        <div key={key}>
                          <code className="bg-background px-2 py-1 rounded border">
                            {"{{ " + key + " }}"}
                          </code>
                          <span className="ml-2 text-muted-foreground">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <code className="bg-background px-2 py-1 rounded border">
                          {"{{ project_name }}"}
                        </code>
                        <span className="ml-2 text-muted-foreground">Nombre del proyecto</span>
                      </div>
                      <div>
                        <code className="bg-background px-2 py-1 rounded border">
                          {"{{ user_name }}"}
                        </code>
                        <span className="ml-2 text-muted-foreground">Nombre del usuario</span>
                      </div>
                      <div>
                        <code className="bg-background px-2 py-1 rounded border">
                          {"{{ current_year }}"}
                        </code>
                        <span className="ml-2 text-muted-foreground">Ano actual</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/superadmin/emails")}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>
    </SuperadminDashboardLayout>
  )
}
