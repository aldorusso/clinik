"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LeadFormModal } from "@/components/leads/lead-form-modal"
import { ConvertToPatientForm } from "@/components/leads/convert-to-patient-form"
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react"
import { Lead, LeadStats, LeadStatus, LeadSource, LeadPriority, User, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function LeadsPage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null)
  const [doctors, setDoctors] = useState<User[]>([])

  // Cargar leads desde la API
  const fetchLeads = async (ignoreSearch: boolean = false) => {
    setLoading(true)
    const token = auth.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Try to get leads first
      const searchParams = ignoreSearch ? {} : { search: searchTerm }
      const leadsResponse = await api.getLeads(token, searchParams)
      
      // Debug logging
      console.log('Leads API response:', leadsResponse)
      console.log('Response type:', typeof leadsResponse)
      console.log('Is array?', Array.isArray(leadsResponse))
      console.log('Has leads property?', 'leads' in (leadsResponse || {}))
      
      // Handle response format - should be LeadListResponse with items array
      const leadsArray = leadsResponse?.items || []
      console.log('Extracted leads array:', leadsArray, 'Length:', leadsArray.length)
      
      setLeads(leadsArray)
      
      // Try to get stats, but don't fail if it doesn't work
      try {
        const statsResponse = await api.getLeadStats(token)
        setStats(statsResponse)
      } catch (statsError) {
        console.warn('Stats not available:', statsError)
        // Set default stats based on current leads count
        const currentLeadsCount = leadsArray.length
        setStats({
          total_leads: currentLeadsCount,
          new_leads_today: 0,
          new_leads_this_week: 0,
          new_leads_this_month: 0,
          unassigned_leads: currentLeadsCount,
          conversion_rate: 0,
          average_conversion_time_days: null,
          overdue_follow_ups: 0,
          leads_by_status: {} as Record<LeadStatus, number>,
          leads_by_source: {} as Record<LeadSource, number>,
          leads_by_priority: {} as Record<LeadPriority, number>,
          leads_trend_last_30_days: []
        })
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error)
      
      // Show user-friendly message
      toast({
        title: "Información",
        description: "No hay leads disponibles. Crea tu primer lead.",
      })
      
      // Set empty states safely
      setLeads([])
      setStats({
        total_leads: 0,
        new_leads_today: 0,
        new_leads_this_week: 0,
        new_leads_this_month: 0,
        unassigned_leads: 0,
        conversion_rate: 0,
        average_conversion_time_days: null,
        overdue_follow_ups: 0,
        leads_by_status: {} as Record<LeadStatus, number>,
        leads_by_source: {} as Record<LeadSource, number>,
        leads_by_priority: {} as Record<LeadPriority, number>,
        leads_trend_last_30_days: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh leads after creation/edit (ignores search)
  const refreshLeads = () => {
    fetchLeads(true) // ignoreSearch = true
  }

  // Load doctors for assignment
  const loadDoctors = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const doctorsData = await api.getMyTenantUsers(token, 'medico')
      setDoctors(doctorsData)
    } catch (error) {
      console.warn('Could not load doctors:', error)
      setDoctors([])
    }
  }

  useEffect(() => {
    fetchLeads()
    loadDoctors()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchLeads()
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const handleCreateLead = () => {
    setEditingLead(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lead?')) {
      return
    }

    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteLead(token, leadId)
      toast({
        title: "Lead eliminado",
        description: "El lead ha sido eliminado exitosamente",
      })
      refreshLeads()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al eliminar el lead",
        variant: "destructive",
      })
    }
  }

  const handleAssignLead = async (doctorId: string) => {
    if (!assigningLead) return

    const token = auth.getToken()
    if (!token) return

    try {
      await api.assignLead(token, assigningLead.id, doctorId)
      toast({
        title: "Lead asignado",
        description: "El lead ha sido asignado exitosamente",
      })
      setAssigningLead(null)
      refreshLeads()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al asignar el lead",
        variant: "destructive",
      })
    }
  }

  const handleShowAssignModal = (lead: Lead) => {
    setAssigningLead(lead)
  }

  const handleShowConvertModal = (lead: Lead) => {
    setConvertingLead(lead)
    setIsConvertModalOpen(true)
  }

  const handleConvertToPatient = async (conversionData: any) => {
    if (!convertingLead) return

    const token = auth.getToken()
    if (!token) return

    try {
      await api.convertLeadToPatient(token, convertingLead.id, conversionData)
      
      toast({
        title: "Éxito",
        description: `Lead ${convertingLead.first_name} ${convertingLead.last_name} convertido en paciente`,
      })
      
      setIsConvertModalOpen(false)
      setConvertingLead(null)
      fetchLeads() // Refresh leads list
    } catch (error: any) {
      console.error('Error converting lead:', error)
      
      // Handle specific error cases
      const errorMessage = error.message || error.response?.data?.detail || "Error al convertir el lead en paciente"
      
      if (errorMessage.includes("ya existe") && errorMessage.includes("email")) {
        toast({
          title: "Email ya registrado",
          description: `El email ${convertingLead.email} ya está registrado en el sistema. Puedes convertir el lead sin crear cuenta de usuario, o usar un email diferente.`,
          variant: "destructive",
        })
      } else if (errorMessage.includes("no puede convertir") && errorMessage.includes("perdido")) {
        toast({
          title: "Lead no convertible",
          description: "Este lead no se puede convertir porque está marcado como perdido, rechazado o no califica.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      nuevo: { label: "Nuevo", variant: "default" as const },
      contactado: { label: "Contactado", variant: "secondary" as const },
      calificado: { label: "Calificado", variant: "outline" as const },
      cita_agendada: { label: "Cita Agendada", variant: "default" as const },
      en_tratamiento: { label: "En Tratamiento", variant: "default" as const },
      completado: { label: "Completado", variant: "default" as const },
      no_califica: { label: "No Califica", variant: "destructive" as const },
      perdido: { label: "Perdido", variant: "destructive" as const }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      alta: "text-red-600",
      media: "text-yellow-600", 
      baja: "text-green-600",
      urgente: "text-red-800"
    }
    return colors[priority as keyof typeof colors] || "text-gray-600"
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
            <h1 className="text-3xl font-bold">Gestión de Leads</h1>
            <p className="text-muted-foreground">
              Administra y gestiona todos los leads de la clínica
            </p>
          </div>
          <Button onClick={handleCreateLead}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.new_leads_today || 0} desde ayer
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos Hoy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.new_leads_today || 0}</div>
              <p className="text-xs text-muted-foreground">
                Hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversion_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Tasa de conversión
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.unassigned_leads || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requieren asignación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads por nombre, email o teléfono..."
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

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Leads</CardTitle>
            <CardDescription>
              Todos los leads capturados en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead: Lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lead.first_name} {lead.last_name}</h3>
                        {getStatusBadge(lead.status)}
                        <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                          {lead.priority.toUpperCase()}
                        </span>
                        {lead.assigned_to_name && (
                          <Badge variant="outline" className="text-xs">
                            Asignado a: {lead.assigned_to_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                        <div>
                          Fuente: {lead.source}
                        </div>
                        <div>
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {lead.notes && (
                        <div className="text-sm text-muted-foreground">
                          {lead.notes.substring(0, 100)}{lead.notes.length > 100 && '...'}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditLead(lead)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      {!lead.assigned_to_id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShowAssignModal(lead)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Asignar
                        </Button>
                      )}
                      {/* Botón para convertir en paciente */}
                      {lead.status !== 'en_tratamiento' && lead.status !== 'completado' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShowConvertModal(lead)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Convertir
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {leads.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No hay leads</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comienza creando tu primer lead.
                </p>
                <div className="mt-6">
                  <Button onClick={handleCreateLead}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Lead
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para asignar lead */}
        <Dialog open={assigningLead !== null} onOpenChange={() => setAssigningLead(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Lead</DialogTitle>
              <DialogDescription>
                Selecciona un médico para asignar el lead: {assigningLead?.first_name} {assigningLead?.last_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="doctor-select" className="text-sm font-medium">
                  Médico
                </label>
                <Select onValueChange={handleAssignLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.first_name} {doctor.last_name} ({doctor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {doctors.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay médicos disponibles para asignar
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssigningLead(null)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para crear/editar lead */}
        <LeadFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={refreshLeads}
          lead={editingLead}
          mode={modalMode}
        />

        {/* Modal para convertir lead en paciente */}
        <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Convertir Lead en Paciente</DialogTitle>
              <DialogDescription>
                Vas a convertir a {convertingLead?.first_name} {convertingLead?.last_name} en paciente.
                Esto cambiará su estado a "En Tratamiento" y opcionalmente creará una cuenta de usuario.
              </DialogDescription>
            </DialogHeader>
            
            <ConvertToPatientForm
              lead={convertingLead}
              onSubmit={handleConvertToPatient}
              onCancel={() => setIsConvertModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}