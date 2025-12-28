"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter } from "lucide-react"
import { Lead, LeadStats, LeadStatus, LeadSource, LeadPriority, User, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  LeadFormModal,
  LeadsStatsCards,
  LeadsList,
  AssignLeadDialog,
  ConvertLeadDialog,
} from "@/components/leads"

const defaultStats: LeadStats = {
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
}

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

  const fetchLeads = async (ignoreSearch: boolean = false) => {
    setLoading(true)
    const token = auth.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const searchParams = ignoreSearch ? {} : { search: searchTerm }
      const leadsResponse = await api.getLeads(token, searchParams)
      const leadsArray = leadsResponse?.items || []
      setLeads(leadsArray)

      try {
        const statsResponse = await api.getLeadStats(token)
        setStats(statsResponse)
      } catch {
        setStats({ ...defaultStats, total_leads: leadsArray.length, unassigned_leads: leadsArray.length })
      }
    } catch (error: any) {
      toast({
        title: "Información",
        description: "No hay leads disponibles. Crea tu primer lead.",
      })
      setLeads([])
      setStats(defaultStats)
    } finally {
      setLoading(false)
    }
  }

  const refreshLeads = () => fetchLeads(true)

  const loadDoctors = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const doctorsData = await api.getMyTenantUsers(token, 'medico')
      setDoctors(doctorsData)
    } catch {
      setDoctors([])
    }
  }

  // Initial load
  useEffect(() => {
    fetchLeads()
    loadDoctors()
  }, [])

  // Debounced search - only trigger when searchTerm actually changes (not on initial render)
  const [isInitialRender, setIsInitialRender] = useState(true)
  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false)
      return
    }
    const delayedSearch = setTimeout(() => fetchLeads(), 500)
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
    if (!confirm('¿Estás seguro de que quieres eliminar este lead?')) return

    const token = auth.getToken()
    if (!token) return

    try {
      await api.deleteLead(token, leadId)
      toast({ title: "Lead eliminado", description: "El lead ha sido eliminado exitosamente" })
      refreshLeads()
    } catch {
      toast({ title: "Error", description: "Error al eliminar el lead", variant: "destructive" })
    }
  }

  const handleAssignLead = async (doctorId: string) => {
    if (!assigningLead) return

    const token = auth.getToken()
    if (!token) return

    try {
      await api.assignLead(token, assigningLead.id, doctorId)
      toast({ title: "Lead asignado", description: "El lead ha sido asignado exitosamente" })
      setAssigningLead(null)
      refreshLeads()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al asignar el lead", variant: "destructive" })
    }
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
      fetchLeads()
    } catch (error: any) {
      const errorMessage = error.message || "Error al convertir el lead en paciente"

      if (errorMessage.includes("ya existe") && errorMessage.includes("email")) {
        toast({
          title: "Email ya registrado",
          description: `El email ${convertingLead.email} ya está registrado. Puedes convertir sin crear cuenta de usuario.`,
          variant: "destructive",
        })
      } else if (errorMessage.includes("no puede convertir") && errorMessage.includes("perdido")) {
        toast({
          title: "Lead no convertible",
          description: "Este lead no se puede convertir porque está marcado como perdido, rechazado o no califica.",
          variant: "destructive",
        })
      } else {
        toast({ title: "Error", description: errorMessage, variant: "destructive" })
      }
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
      <LeadsStatsCards stats={stats} />

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

      {/* Leads List */}
      <LeadsList
        leads={leads}
        onEdit={handleEditLead}
        onDelete={handleDeleteLead}
        onAssign={setAssigningLead}
        onConvert={(lead) => {
          setConvertingLead(lead)
          setIsConvertModalOpen(true)
        }}
        onCreateNew={handleCreateLead}
      />

      {/* Assign Lead Dialog */}
      <AssignLeadDialog
        lead={assigningLead}
        doctors={doctors}
        onClose={() => setAssigningLead(null)}
        onAssign={handleAssignLead}
      />

      {/* Create/Edit Lead Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshLeads}
        lead={editingLead}
        mode={modalMode}
      />

      {/* Convert Lead Dialog */}
      <ConvertLeadDialog
        lead={convertingLead}
        open={isConvertModalOpen}
        onOpenChange={setIsConvertModalOpen}
        onSubmit={handleConvertToPatient}
      />
    </div>
  )
}
