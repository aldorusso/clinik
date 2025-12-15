"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Phone,
  Mail,
  Heart,
  FileText,
  User,
  MapPin,
  Building2,
  CreditCard,
  Eye,
  Stethoscope
} from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { MedicalHistory } from "@/components/medical/medical-history"

export default function MisPacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [patientDetails, setPatientDetails] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadPatients()
  }, [searchTerm])

  const loadPatients = async () => {
    const token = auth.getToken()
    if (!token) {
      toast({
        title: "Error de autenticación",
        description: "No se encontró un token válido. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await api.getPatients(token, searchTerm)
      setPacientes(response)
    } catch (error: any) {
      console.error('Error loading patients:', error)
      toast({
        title: "Error al cargar pacientes",
        description: error.message || "No se pudo cargar la lista de pacientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPatientDetails = async (patientId: string) => {
    const token = auth.getToken()
    if (!token) return

    try {
      const response = await api.getPatientDetails(token, patientId)
      setPatientDetails(response)
      setIsDetailsOpen(true)
    } catch (error: any) {
      console.error('Error loading patient details:', error)
      toast({
        title: "Error al cargar detalles",
        description: error.message || "No se pudo cargar el expediente del paciente",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">👥 Mis Pacientes</h1>
            <p className="text-muted-foreground">
              Pacientes bajo mi cuidado médico
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Pacientes</CardTitle>
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pacientes.length}</div>
              <p className="text-xs text-muted-foreground">
                Bajo mi cuidado médico
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceso Completo</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {pacientes.filter((paciente: any) => paciente.can_view_details).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Expedientes disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Información Médica</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {pacientes.filter((paciente: any) => paciente.access_level === 'full').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Con historial completo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mis pacientes por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Pacientes List */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Pacientes</CardTitle>
            <CardDescription>
              Acceso completo a expedientes médicos como doctor autorizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pacientes.map((paciente: any) => (
                <div key={paciente.id} className="border rounded-lg p-5 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{paciente.full_name}</h3>
                          <div className="flex items-center gap-2">
                            {paciente.access_level === 'full' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Acceso Médico Completo
                              </Badge>
                            ) : (
                              <Badge variant="outline">Acceso Básico</Badge>
                            )}
                            {paciente.is_active && (
                              <Badge variant="secondary">Activo</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span>{paciente.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span>{paciente.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span>Desde {new Date(paciente.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {(paciente.city || paciente.client_company_name) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {paciente.city && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 text-orange-600" />
                              <span>{paciente.city}, {paciente.country}</span>
                            </div>
                          )}
                          {paciente.client_company_name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4 text-slate-600" />
                              <span>{paciente.client_company_name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Medical Actions */}
                    <div className="ml-4">
                      {paciente.can_view_details && (
                        <Button 
                          onClick={() => loadPatientDetails(paciente.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Expediente Médico
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {pacientes.length === 0 && !loading && (
              <div className="text-center py-12">
                <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes pacientes asignados</h3>
                <p className="text-muted-foreground mb-4">
                  Los pacientes convertidos de tus leads aparecerán aquí con acceso médico completo.
                </p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Ver Leads Disponibles
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Medical Record Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Expediente Médico Completo
              </DialogTitle>
              <DialogDescription>
                Información médica detallada del paciente - Solo visible para médicos autorizados
              </DialogDescription>
            </DialogHeader>
            
            {patientDetails && (
              <div className="space-y-6">
                {/* Patient Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Nombre:</span>
                          <span>{patientDetails.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Email:</span>
                          <span>{patientDetails.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Teléfono:</span>
                          <span>{patientDetails.phone}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {patientDetails.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">Ubicación:</span>
                            <span>{patientDetails.city}, {patientDetails.country}</span>
                          </div>
                        )}
                        
                        {patientDetails.client_company_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-600" />
                            <span className="font-medium">Empresa:</span>
                            <span>{patientDetails.client_company_name}</span>
                          </div>
                        )}
                        
                        {patientDetails.client_tax_id && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">RFC/ID Fiscal:</span>
                            <span>{patientDetails.client_tax_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Registrado: {new Date(patientDetails.created_at).toLocaleString()}</span>
                        {patientDetails.updated_at !== patientDetails.created_at && (
                          <span>Actualizado: {new Date(patientDetails.updated_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Medical History Section */}
                <MedicalHistory 
                  patientId={patientDetails.id} 
                  patientName={patientDetails.full_name || patientDetails.email}
                />

                {/* Access Control Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Stethoscope className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-green-800 font-medium">Acceso Médico Autorizado</p>
                      <p className="text-green-700 text-sm">
                        Tienes acceso completo a la información médica de este paciente como doctor autorizado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}