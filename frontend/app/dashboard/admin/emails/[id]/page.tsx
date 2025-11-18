"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { EmailTemplate, EmailTemplateType } from "@/types/email-template"
import { ArrowLeft, Save, Eye } from "lucide-react"
import { toast } from "sonner"
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"

const templateTypeLabels: Record<EmailTemplateType, string> = {
  [EmailTemplateType.PASSWORD_RESET]: "Recuperación de Contraseña",
  [EmailTemplateType.WELCOME]: "Bienvenida",
  [EmailTemplateType.NOTIFICATION]: "Notificación",
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
      console.error(err)
      router.push("/dashboard/admin/emails")
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
      router.push("/dashboard/admin/emails")
    } catch (err) {
      toast.error("Error al guardar la plantilla")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (template) {
      window.open(`/dashboard/admin/emails/preview/${template.template_type}`, '_blank')
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando plantilla...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!template) {
    return null
  }

  return (
    <AdminDashboardLayout>
      <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/emails")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Plantillas
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar Plantilla</h1>
            <p className="text-gray-600 mt-1">
              {template.name} - {templateTypeLabels[template.template_type]}
            </p>
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
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>
              Configura el asunto y estado de la plantilla
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto del Correo</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Asunto del correo electrónico"
              />
              <p className="text-sm text-gray-500">
                Puedes usar variables como {'{{ project_name }}'} o {'{{ user_name }}'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Plantilla Activa</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenido HTML</CardTitle>
            <CardDescription>
              Edita el contenido HTML de la plantilla (sintaxis Jinja2)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.html_content}
              onChange={(e) =>
                setFormData({ ...formData, html_content: e.target.value })
              }
              className="font-mono text-sm min-h-[500px]"
              placeholder="<html>...</html>"
            />
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">
                Variables Disponibles:
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                {template.variables && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(JSON.parse(template.variables)).map(
                      ([key, value]) => (
                        <div key={key}>
                          <code className="bg-white px-2 py-1 rounded border">
                            {'{{ ' + key + ' }}'}
                          </code>
                          <span className="ml-2 text-gray-500">{value as string}</span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin/emails")}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
      </div>
    </AdminDashboardLayout>
  )
}
