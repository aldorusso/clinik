"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { EmailTemplate, EmailTemplateType } from "@/types/email-template"
import { Eye, Edit, Mail } from "lucide-react"
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"

const templateTypeLabels: Record<EmailTemplateType, string> = {
  [EmailTemplateType.PASSWORD_RESET]: "Recuperación de Contraseña",
  [EmailTemplateType.WELCOME]: "Bienvenida",
  [EmailTemplateType.NOTIFICATION]: "Notificación",
}

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const token = auth.getToken()

      if (!token) {
        router.push("/")
        return
      }

      const data = await api.getEmailTemplates(token)
      setTemplates(data)
    } catch (err) {
      setError("Error al cargar las plantillas de email")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (templateId: string) => {
    router.push(`/dashboard/admin/emails/${templateId}`)
  }

  const handlePreview = (templateType: EmailTemplateType) => {
    window.open(`/dashboard/admin/emails/preview/${templateType}`, '_blank')
  }

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando plantillas...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout>
      <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plantillas de Email</h1>
        <p className="text-gray-600">
          Gestiona las plantillas de correo electrónico utilizadas en el sistema
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plantillas Disponibles</CardTitle>
          <CardDescription>
            Edita el contenido HTML y el asunto de cada plantilla de correo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {template.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {templateTypeLabels[template.template_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {template.subject}
                  </TableCell>
                  <TableCell>
                    {template.is_active ? (
                      <Badge className="bg-green-500">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template.template_type)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vista Previa
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(template.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No hay plantillas de email disponibles
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Variables Disponibles
        </h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            <code className="bg-blue-100 px-2 py-1 rounded">
              {'{{ project_name }}'}
            </code>{" "}
            - Nombre del proyecto
          </p>
          <p>
            <code className="bg-blue-100 px-2 py-1 rounded">
              {'{{ user_name }}'}
            </code>{" "}
            - Nombre del usuario
          </p>
          <p>
            <code className="bg-blue-100 px-2 py-1 rounded">
              {'{{ current_year }}'}
            </code>{" "}
            - Año actual
          </p>
          <p className="text-xs mt-2">
            Usa sintaxis Jinja2 para incluir variables en el HTML y asunto
          </p>
        </div>
      </div>
      </div>
    </AdminDashboardLayout>
  )
}
