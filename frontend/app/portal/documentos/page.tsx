"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Clock, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import {
  Document,
  MedicalHistoryResponse,
  transformMedicalHistoryToDocuments,
  DocumentStatsCards,
  DocumentsTable,
  DocumentsInfoCard,
} from "@/components/portal-documents"

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
        const medicalHistory: MedicalHistoryResponse = await api.getPatientMedicalHistory(token)
        const treatments = await api.getPatientTreatments(token)
        const allDocuments = transformMedicalHistoryToDocuments(medicalHistory, treatments)
        setDocuments(allDocuments)
      } catch (error) {
        console.error('Error loading medical documents:', error)
        toast.error("Error al cargar documentos médicos")
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const pendingDocuments = documents.filter(d => d.status === "pending")
  const completedDocuments = documents.filter(d => d.status === "completed" || d.status === "signed")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p>Cargando documentos...</p>
        </div>
      </div>
    )
  }

  return (
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
      <DocumentStatsCards
        total={documents.length}
        pending={pendingDocuments.length}
        completed={completedDocuments.length}
      />

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
                <DocumentsTable documents={documents} showStatus={true} showActions="all" />
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
                <DocumentsTable documents={pendingDocuments} showStatus={false} showActions="pending" />
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
                <DocumentsTable documents={completedDocuments} showStatus={true} showActions="completed" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <DocumentsInfoCard />
    </div>
  )
}
