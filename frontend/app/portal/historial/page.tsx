"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileHeart, 
  Calendar,
  Stethoscope,
  Pill,
  AlertTriangle,
  FileText,
  Download,
  Eye,
  Activity,
  Heart
} from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function PatientMedicalHistoryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [medicalHistory, setMedicalHistory] = useState<any>({
    consultations: [],
    treatments: [],
    medications: [],
    allergies: [],
    documents: []
  })

  useEffect(() => {
    const loadMedicalHistory = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Get patient's medical history using the real API
        const response = await api.getPatientMedicalHistory(token)
        setMedicalHistory(response)
        setLoading(false)
      } catch (error: any) {
        console.error('Error loading medical history:', error)
        toast({
          title: "Error",
          description: "Error al cargar el historial médico",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadMedicalHistory()
  }, [toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "mild":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Leve</Badge>
      case "moderate":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moderada</Badge>
      case "severe":
        return <Badge variant="destructive">Severa</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Activo</Badge>
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileHeart className="h-8 w-8 text-red-500" />
              Mi Historial Médico
            </h1>
            <p className="text-muted-foreground">
              Accede a tu información médica completa
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar Historial
          </Button>
        </div>

        <Tabs defaultValue="consultations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="consultations">Consultas</TabsTrigger>
            <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
            <TabsTrigger value="medications">Medicamentos</TabsTrigger>
            <TabsTrigger value="allergies">Alergias</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          {/* Consultations Tab */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Consultas Médicas
                </CardTitle>
                <CardDescription>
                  Historial de todas tus consultas y diagnósticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalHistory.consultations.map((consultation: any) => (
                    <div key={consultation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {consultation.type}
                            {getStatusBadge(consultation.status)}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(consultation.date)} - {consultation.doctor_name}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {consultation.diagnosis && (
                        <div className="mb-2">
                          <span className="text-sm font-medium">Diagnóstico: </span>
                          <span className="text-sm">{consultation.diagnosis}</span>
                        </div>
                      )}
                      
                      {consultation.notes && (
                        <p className="text-sm bg-muted p-3 rounded">
                          {consultation.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tratamientos
                </CardTitle>
                <CardDescription>
                  Tratamientos realizados y en curso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalHistory.treatments.map((treatment: any) => (
                    <div key={treatment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {treatment.name}
                            {getStatusBadge(treatment.status)}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            Inicio: {formatDate(treatment.start_date)} - {treatment.doctor_name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">Sesiones: </span>
                          <span>{treatment.sessions_completed}/{treatment.sessions_total}</span>
                        </div>
                      </div>
                      
                      {treatment.notes && (
                        <p className="text-sm bg-muted p-3 rounded">
                          {treatment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicamentos
                </CardTitle>
                <CardDescription>
                  Medicamentos recetados y tratamientos farmacológicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalHistory.medications.map((medication: any) => (
                    <div key={medication.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          {medication.name}
                          {getStatusBadge(medication.status)}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Dosis: </span>
                          <span>{medication.dosage}</span>
                        </div>
                        <div>
                          <span className="font-medium">Duración: </span>
                          <span>{medication.duration}</span>
                        </div>
                        <div>
                          <span className="font-medium">Prescrito: </span>
                          <span>{formatDate(medication.prescribed_date)}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-2">
                        Prescrito por: {medication.doctor_name}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alergias e Intolerancias
                </CardTitle>
                <CardDescription>
                  Información importante sobre alergias conocidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicalHistory.allergies.map((allergy: any) => (
                    <div key={allergy.id} className="border rounded-lg p-4 border-orange-200 bg-orange-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-orange-900">
                          {allergy.allergen}
                        </h3>
                        {getSeverityBadge(allergy.severity)}
                      </div>
                      
                      <div className="text-sm text-orange-800 mb-2">
                        <span className="font-medium">Reacciones: </span>
                        {allergy.reactions.join(", ")}
                      </div>
                      
                      <div className="text-xs text-orange-700">
                        Reportado: {formatDate(allergy.reported_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos Médicos
                </CardTitle>
                <CardDescription>
                  Consentimientos, resultados de laboratorio y otros documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {medicalHistory.documents.map((document: any) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(document.date)} • {document.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}