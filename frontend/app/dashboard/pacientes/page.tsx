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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Edit,
  Trash2,
  Eye,
  FileText
} from "lucide-react"
import { User, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function PacientesPage() {
  const { toast } = useToast()
  const [pacientes, setPacientes] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Cargar pacientes desde la API
  const fetchPacientes = async () => {
    setLoading(true)
    const token = auth.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const patientsData = await api.getMyTenantClients(token)
      setPacientes(patientsData)
    } catch (error: any) {
      console.error('Error fetching patients:', error)
      toast({
        title: "Error",
        description: "Error al cargar los pacientes",
        variant: "destructive",
      })
      setPacientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacientes()
  }, [])

  // Función para eliminar paciente
  const handleDeletePatient = async (patientId: string) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteMyTenantClient(token, patientId)
      toast({
        title: "Éxito",
        description: "Paciente eliminado correctamente",
      })
      fetchPacientes() // Recargar lista
    } catch (error: any) {
      console.error('Error deleting patient:', error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Error al eliminar el paciente",
        variant: "destructive",
      })
    }
  }

  // Función para mostrar detalles del paciente
  const handleViewPatient = (patient: User) => {
    setSelectedPatient(patient)
    setIsDetailModalOpen(true)
  }

  // Filtrar pacientes según búsqueda
  const filteredPacientes = pacientes.filter(patient => {
    if (!searchTerm) return true
    const name = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase()
    const email = patient.email?.toLowerCase() || ""
    const phone = patient.phone?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    
    return name.includes(search) || email.includes(search) || phone.includes(search)
  })

  // Estadísticas calculadas
  const stats = {
    total: pacientes.length,
    activos: pacientes.filter(p => p.is_active).length,
    inactivos: pacientes.filter(p => !p.is_active).length,
    nuevos_este_mes: pacientes.filter(p => {
      const created = new Date(p.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default">Activo</Badge>
    } else {
      return <Badge variant="destructive">Inactivo</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">👥 Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona todos los pacientes de la clínica que ya son clientes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes registrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activos}</div>
            <p className="text-xs text-muted-foreground">
              En tratamiento actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nuevos_este_mes}</div>
            <p className="text-xs text-muted-foreground">
              Registrados este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactivos}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes dados de baja
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes por nombre, email o teléfono..."
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

      {/* Pacientes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            Pacientes que ya son clientes de la clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPacientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No se encontraron pacientes con ese criterio de búsqueda" : "No hay pacientes registrados"}
              </div>
            ) : (
              filteredPacientes.map((paciente: User) => (
                <div key={paciente.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {paciente.full_name || `${paciente.first_name || ''} ${paciente.last_name || ''}`.trim() || paciente.email}
                        </h3>
                        {getStatusBadge(paciente.is_active)}
                        {paciente.client_company_name && (
                          <Badge variant="outline">
                            {paciente.client_company_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {paciente.email}
                        </div>
                        {paciente.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {paciente.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Registrado: {formatDate(paciente.created_at)}
                        </div>
                      </div>
                      {paciente.client_tax_id && (
                        <div className="text-xs text-muted-foreground">
                          RFC/Tax ID: {paciente.client_tax_id}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewPatient(paciente)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Detalles
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Historial
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePatient(paciente.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del paciente */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Paciente</DialogTitle>
            <DialogDescription>
              Información completa del paciente seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <p className="text-sm text-muted-foreground">
                    {getStatusBadge(selectedPatient.is_active)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <p className="text-sm text-muted-foreground">{selectedPatient.phone || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Empresa</label>
                  <p className="text-sm text-muted-foreground">{selectedPatient.client_company_name || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">RFC/Tax ID</label>
                  <p className="text-sm text-muted-foreground">{selectedPatient.client_tax_id || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha de Registro</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedPatient.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Última Actualización</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedPatient.updated_at)}</p>
                </div>
              </div>
              
              {(selectedPatient.city || selectedPatient.country) && (
                <div>
                  <label className="text-sm font-medium">Ubicación</label>
                  <p className="text-sm text-muted-foreground">
                    {[selectedPatient.city, selectedPatient.country].filter(Boolean).join(', ') || 'No especificado'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              // TODO: Implementar edición
              setIsDetailModalOpen(false)
            }}>
              Editar Paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  )
}