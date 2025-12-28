"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarView, CalendarViewType } from "@/components/calendar/calendar-view"
import { CalendarStats } from "@/components/calendar/calendar-stats"
import { AppointmentFilters } from "@/components/calendar/appointment-filters"
import { AppointmentFormDialog, AppointmentFormData } from "@/components/calendar/appointment-form-dialog"
import { AppointmentDetailsSheet } from "@/components/calendar/appointment-details-sheet"
import { useCalendarAppointments } from "@/hooks/use-calendar-appointments"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Plus, RefreshCw } from "lucide-react"
import { Appointment, User, api } from "@/lib/api"
import { auth } from "@/lib/auth"

export default function AdminCalendarioPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const {
    appointments,
    availableProviders,
    loading,
    currentDate,
    setCurrentDate,
    reloadAppointments,
    updateStatus,
    createAppointment,
    updateAppointment,
    calculateStats,
    appointmentToFormData,
    emptyFormData
  } = useCalendarAppointments()

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const token = auth.getToken()
      if (!token) return
      try {
        const user = await api.getCurrentUser(token)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadUser()
  }, [])

  // View state
  const [viewType, setViewType] = useState<CalendarViewType>('month')

  // Filter state
  const [selectedProvider, setSelectedProvider] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Modal state
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false)
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Form state
  const [newAppointmentForm, setNewAppointmentForm] = useState<AppointmentFormData>(emptyFormData)
  const [editAppointmentForm, setEditAppointmentForm] = useState<AppointmentFormData>(emptyFormData)

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (selectedProvider && apt.provider_id !== selectedProvider) return false
    if (selectedStatus && apt.status !== selectedStatus) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesName = apt.patient_name?.toLowerCase().includes(search)
      const matchesPhone = apt.patient_phone?.toLowerCase().includes(search)
      const matchesEmail = apt.patient_email?.toLowerCase().includes(search)
      if (!matchesName && !matchesPhone && !matchesEmail) return false
    }
    return true
  })

  const stats = calculateStats(filteredAppointments, viewType)

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsAppointmentDetailsOpen(true)
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    const formattedDate = date.toISOString().split('T')[0]
    setNewAppointmentForm({
      ...emptyFormData,
      scheduled_date: formattedDate,
      scheduled_time: time,
      provider_id: selectedProvider || ''
    })
    setIsNewAppointmentOpen(true)
  }

  const handleCreateAppointment = async () => {
    const success = await createAppointment(newAppointmentForm)
    if (success) {
      setNewAppointmentForm(emptyFormData)
      setIsNewAppointmentOpen(false)
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditAppointmentForm(appointmentToFormData(appointment))
    setSelectedAppointment(appointment)
    setIsEditAppointmentOpen(true)
    setIsAppointmentDetailsOpen(false)
  }

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return
    const success = await updateAppointment(selectedAppointment.id, editAppointmentForm)
    if (success) {
      setIsEditAppointmentOpen(false)
      setSelectedAppointment(null)
    }
  }

  const handleClearFilters = () => {
    setSelectedProvider("")
    setSelectedStatus("")
    setSearchTerm("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Calendario de Citas (Admin)
          </h1>
          <p className="text-muted-foreground">
            Vista calendario para gestión de citas de la clínica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reloadAppointments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setIsNewAppointmentOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Stats */}
      <CalendarStats viewType={viewType} stats={stats} />

      {/* Filters */}
      <AppointmentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        providers={availableProviders}
        onClearFilters={handleClearFilters}
      />

      {/* Calendar */}
      <CalendarView
        appointments={filteredAppointments}
        viewType={viewType}
        onViewTypeChange={setViewType}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAppointmentClick={handleAppointmentClick}
        onTimeSlotClick={handleTimeSlotClick}
        loading={loading}
      />

      {/* New Appointment Dialog */}
      <AppointmentFormDialog
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSubmit={handleCreateAppointment}
        title="Agendar Nueva Cita"
        description="Complete la información del paciente y confirme el horario"
        submitLabel="Agendar Cita"
        formData={newAppointmentForm}
        onFormChange={setNewAppointmentForm}
        providers={availableProviders}
      />

      {/* Edit Appointment Dialog */}
      <AppointmentFormDialog
        isOpen={isEditAppointmentOpen}
        onClose={() => setIsEditAppointmentOpen(false)}
        onSubmit={handleUpdateAppointment}
        title="Editar Cita"
        description="Modifique la información de la cita según sea necesario"
        submitLabel="Actualizar Cita"
        formData={editAppointmentForm}
        onFormChange={setEditAppointmentForm}
        providers={availableProviders}
        isEdit
      />

      {/* Appointment Details Sheet */}
      <AppointmentDetailsSheet
        isOpen={isAppointmentDetailsOpen}
        onClose={() => setIsAppointmentDetailsOpen(false)}
        appointment={selectedAppointment}
        onStatusUpdate={updateStatus}
        onEdit={handleEditAppointment}
        onInventoryClick={() => {
          toast({
            title: "Función pendiente",
            description: "Inventario próximamente disponible para admin",
          })
        }}
      />
    </div>
  )
}
