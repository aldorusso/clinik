"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Mail, Eye, Edit } from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { EmailTemplate, EmailTemplateType } from "@/types/email-template"
import { toast } from "sonner"

const templateTypeLabels: Record<EmailTemplateType, string> = {
  [EmailTemplateType.PASSWORD_RESET]: "Recuperacion de Contrasena",
  [EmailTemplateType.WELCOME]: "Bienvenida",
  [EmailTemplateType.NOTIFICATION]: "Notificacion",
}

export default function SuperadminEmailsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const templatesData = await api.getEmailTemplates(token)
      setTemplates(templatesData)
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const handleEditTemplate = (templateId: string) => {
    router.push(`/dashboard/superadmin/emails/${templateId}`)
  }

  const handlePreviewTemplate = (templateType: EmailTemplateType) => {
    window.open(`/dashboard/superadmin/emails/preview/${templateType}`, "_blank")
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

  return (
    <SuperadminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Plantillas de Email</h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona las plantillas de correo electronico del sistema
          </p>
        </div>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Plantillas Disponibles</CardTitle>
            <CardDescription>
              Edita el contenido HTML y el asunto de cada plantilla
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay plantillas disponibles</p>
              </div>
            ) : (
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{template.name}</span>
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
                            onClick={() => handlePreviewTemplate(template.template_type)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Vista Previa
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditTemplate(template.id)}
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
            )}
          </CardContent>
        </Card>

        {/* Variables Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 dark:text-blue-100 text-sm">
              Variables Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>
              <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {"{{ project_name }}"}
              </code>{" "}
              - Nombre del proyecto
            </p>
            <p>
              <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {"{{ user_name }}"}
              </code>{" "}
              - Nombre del usuario
            </p>
            <p>
              <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {"{{ current_year }}"}
              </code>{" "}
              - Ano actual
            </p>
          </CardContent>
        </Card>
      </div>
    </SuperadminDashboardLayout>
  )
}
