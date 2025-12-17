"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClientPortalLayout } from "@/components/dashboard/client-portal-layout"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Download,
  Eye,
  Calendar,
  Shield
} from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"

interface Document {
  id: string
  title: string
  category: "consent" | "prescription" | "report" | "treatment_plan" | "invoice" | "medical_record"
  date: string
  status: "pending" | "signed" | "completed"
  description: string
  file_url?: string
  file_type?: string
  file_size?: string
}

interface Consultation {
  id: string
  date: string
  doctor_name: string
  type: string
  diagnosis: string
  notes: string
  status: string
}

interface MedicalHistoryResponse {
  consultations: Consultation[]
  documents: {
    id: string
    name: string
    type: string
    date: string
    size: string
  }[]
  treatments: any[]
  medications: any[]
  allergies: any[]
  medical_conditions: any[]
  surgical_history: any[]
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true)
      
      const token = auth.getToken()
      if (!token) {
        toast.error("No estás autenticado")
        setLoading(false)
        return
      }

      try {
        // Obtener historial médico que incluye documentos y consultas
        const medicalHistory: MedicalHistoryResponse = await api.getPatientMedicalHistory(token)
        
        // Convertir documentos médicos a formato Document
        const documentsFromHistory: Document[] = medicalHistory.documents.map(doc => ({
          id: doc.id,
          title: doc.name,
          category: "medical_record" as const,
          date: doc.date,
          status: "completed" as const,
          description: `Documento médico - ${doc.type}`,
          file_url: `/api/v1/documents/${doc.id}/download`, // Endpoint hipotético para descarga
          file_type: doc.type,
          file_size: doc.size
        }))

        // Convertir consultas a documentos de reporte
        const consultsAsDocuments: Document[] = medicalHistory.consultations.map(consultation => ({
          id: consultation.id,
          title: `Informe de Consulta - ${consultation.type}`,
          category: "report" as const,
          date: consultation.date,
          status: "completed" as const,
          description: consultation.diagnosis || consultation.notes || "Consulta médica completada",
          file_url: `/api/v1/consultations/${consultation.id}/report`, // Endpoint hipotético
          file_type: "pdf"
        }))

        // Obtener tratamientos para generar documentos de plan de tratamiento
        const treatments = await api.getPatientTreatments(token)
        const treatmentDocuments: Document[] = treatments.map(treatment => ({
          id: `treatment-${treatment.id}`,
          title: `Plan de Tratamiento - ${treatment.name}`,
          category: "treatment_plan" as const,
          date: treatment.start_date,
          status: "completed" as const,
          description: treatment.description || `Plan para ${treatment.name}`,
          file_url: `/api/v1/treatments/${treatment.id}/plan`, // Endpoint hipotético
          file_type: "pdf"
        }))

        // Combinar todos los documentos
        const allDocuments = [
          ...documentsFromHistory,
          ...consultsAsDocuments,
          ...treatmentDocuments
        ]

        // Agregar algunos documentos pendientes simulados (consentimientos)
        const pendingConsents: Document[] = []
        
        // Si hay tratamientos activos, agregar consentimientos pendientes
        const activeTreatments = treatments.filter(t => t.status === 'active')
        activeTreatments.forEach((treatment, index) => {
          if (index < 2) { // Solo agregar algunos consentimientos pendientes
            pendingConsents.push({
              id: `consent-${treatment.id}`,
              title: `Consentimiento Informado - ${treatment.name}`,
              category: "consent" as const,
              date: new Date().toISOString(),
              status: "pending" as const,
              description: `Consentimiento requerido para ${treatment.name}`,
              file_type: "pdf"
            })
          }
        })

        setDocuments([...allDocuments, ...pendingConsents])
        
      } catch (error) {
        console.error('Error loading medical documents:', error)
        toast.error("Error al cargar documentos médicos")
        // En caso de error, mostrar algunos documentos de ejemplo
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pendiente</Badge>
      case "signed":
        return <Badge variant="default" className="bg-green-500">Firmado</Badge>
      case "completed":
        return <Badge variant="default" className="bg-blue-500">Completado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      consent: { label: "Consentimiento", variant: "destructive" as const },
      prescription: { label: "Receta", variant: "secondary" as const },
      report: { label: "Informe", variant: "outline" as const },
      treatment_plan: { label: "Plan Tratamiento", variant: "default" as const },
      invoice: { label: "Factura", variant: "secondary" as const },
      medical_record: { label: "Registro Médico", variant: "default" as const }
    }
    
    const config = categoryMap[category as keyof typeof categoryMap] || { label: category, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const handleViewDocument = (document: Document) => {
    // Abrir documento en nueva ventana
    if (document.file_url) {
      window.open(document.file_url, '_blank')
    }
  }

  const handleDownloadDocument = (document: Document) => {
    // Descargar documento
    if (document.file_url) {
      const link = window.document.createElement('a')
      link.href = document.file_url
      link.download = `${document.title}.pdf`
      link.click()
    }
  }

  const pendingDocuments = documents.filter(d => d.status === "pending")
  const completedDocuments = documents.filter(d => d.status === "completed" || d.status === "signed")

  if (loading) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p>Cargando documentos...</p>
          </div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mis Documentos</h1>
          <p className="text-muted-foreground">
            Documentación médica, consentimientos y archivos relacionados con su tratamiento
          </p>
        </div>

        {/* Alert for pending documents */}
        {pendingDocuments.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Atención:</strong> Tienes {pendingDocuments.length} documento(s) pendiente(s) de revisión o firma.
              Es importante revisarlos antes de tu próxima cita.
            </AlertDescription>
          </Alert>
        )}

        {/* Document Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-10 w-10 text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-muted-foreground">Total Documentos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-10 w-10 text-amber-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{pendingDocuments.length}</p>
                <p className="text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-10 w-10 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{completedDocuments.length}</p>
                <p className="text-muted-foreground">Completados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Todos los Documentos ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pendientes
              {pendingDocuments.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {pendingDocuments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completados ({completedDocuments.length})
            </TabsTrigger>
          </TabsList>

          {/* All Documents */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Todos los Documentos
                </CardTitle>
                <CardDescription>
                  Todos sus documentos médicos organizados por fecha
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No hay documentos disponibles</p>
                    <p className="text-muted-foreground">Los documentos aparecerán aquí cuando estén disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {doc.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(doc.category)}
                          </TableCell>
                          <TableCell>{formatDate(doc.date)}</TableCell>
                          <TableCell>
                            {getStatusBadge(doc.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
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
          </TabsContent>

          {/* Pending Documents */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Documentos Pendientes
                </CardTitle>
                <CardDescription>
                  Documentos que requieren su atención o firma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">¡Perfecto!</p>
                    <p className="text-muted-foreground">No tienes documentos pendientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {doc.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(doc.category)}
                          </TableCell>
                          <TableCell>{formatDate(doc.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {doc.category === 'consent' ? 'Revisar y Firmar' : 'Revisar'}
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
          </TabsContent>

          {/* Completed Documents */}
          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Documentos Completados
                </CardTitle>
                <CardDescription>
                  Documentos firmados y archivados de forma segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Sin documentos completados</p>
                    <p className="text-muted-foreground">Los documentos completados aparecerán aquí</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {doc.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(doc.category)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(doc.status)}
                          </TableCell>
                          <TableCell>{formatDate(doc.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Button>
                              <Button
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
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
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Información sobre sus documentos</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Todos sus documentos están protegidos y encriptados</li>
                  <li>• Puede acceder a ellos las 24 horas desde su portal</li>
                  <li>• Los consentimientos deben firmarse antes del tratamiento</li>
                  <li>• Si tiene dudas, contacte a su médico tratante</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientPortalLayout>
  )
}