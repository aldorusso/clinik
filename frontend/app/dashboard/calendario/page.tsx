"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CalendarView, CalendarViewType } from "@/components/calendar/calendar-view"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
  Mail,
  MapPin,
  CreditCard,
  Stethoscope,
  UserPlus,
  CalendarCheck,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  RefreshCw,
  X,
  CalendarDays,
  CalendarIcon
} from "lucide-react"
import { Appointment, AppointmentStatus, AppointmentCreate, User as UserType, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function CalendarioPage() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [availableProviders, setAvailableProviders] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  
  // Calendar state
  const [viewType, setViewType] = useState<CalendarViewType>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  
  // Modals and sheets
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false)
  const [quickCreateDate, setQuickCreateDate] = useState<Date | null>(null)
  const [quickCreateTime, setQuickCreateTime] = useState<string>("")

  // Form state
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    provider_id: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    notes: '',
    type: 'consultation' as const
  })

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        setLoading(true)
        
        // Load current user
        const userData = await api.getCurrentUser(token)
        setCurrentUser(userData)

        // Load appointments with extended date range for calendar
        const startDate = new Date(currentDate)
        startDate.setDate(1) // First day of month
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0) // Last day of next month
        
        const appointmentsData = await api.getAppointments(token, {
          page_size: 500,
          date_from: startDate.toISOString(),
          date_to: endDate.toISOString(),
          order_by: 'scheduled_at',
          order_direction: 'asc'
        })
        setAppointments(appointmentsData)

        // Load available providers (doctors)
        const directoryData = await api.getMyTenantUsers(token)
        const providers = directoryData.filter(user => 
          user.role === 'user' || user.role === 'tenant_admin' || user.role === 'manager'
        )
        setAvailableProviders(providers)

      } catch (error: any) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Error al cargar la información del calendario",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentDate])

  // Filter appointments by selected provider
  const filteredAppointments = selectedProvider 
    ? appointments.filter(apt => apt.provider_id === selectedProvider)
    : appointments

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsAppointmentDetailsOpen(true)
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    // Open quick appointment creation
    setQuickCreateDate(date)
    setQuickCreateTime(time)
    
    // Pre-fill the form
    const formattedDate = date.toISOString().split('T')[0]
    setNewAppointmentForm({
      ...newAppointmentForm,
      scheduled_date: formattedDate,
      scheduled_time: time,
      provider_id: selectedProvider || ''
    })
    
    setIsNewAppointmentOpen(true)
  }

  const handleStatusUpdate = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateAppointmentStatus(token, appointmentId, newStatus)
      
      let message = "Estado actualizado correctamente"
      if (newStatus === 'confirmed') message = "Cita confirmada"
      else if (newStatus === 'in_progress') message = "Cita iniciada"
      else if (newStatus === 'completed') message = "Cita completada"
      else if (newStatus === 'no_show') message = "Paciente marcado como No Show"
      else if (newStatus === 'cancelled_by_patient') message = "Cita cancelada por paciente"
      else if (newStatus === 'cancelled_by_clinic') message = "Cita cancelada por clínica"

      toast({
        title: "Éxito",
        description: message,
      })
      
      // Reload appointments
      reloadAppointments()
    } catch (error: any) {
      console.error('Error updating appointment status:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const reloadAppointments = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const startDate = new Date(currentDate)
      startDate.setDate(1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)
      
      const appointmentsData = await api.getAppointments(token, {
        page_size: 500,
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString(),
        order_by: 'scheduled_at',
        order_direction: 'asc'
      })
      setAppointments(appointmentsData)
    } catch (error: any) {
      console.error('Error reloading appointments:', error)
    }
  }

  const handleCreateAppointment = async () => {
    const token = auth.getToken()
    if (!token) return

    if (!newAppointmentForm.patient_name || !newAppointmentForm.patient_phone || 
        !newAppointmentForm.provider_id || !newAppointmentForm.scheduled_date || 
        !newAppointmentForm.scheduled_time) {
      toast({
        title: "Campos requeridos",
        description: "Complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const scheduledAt = new Date(`${newAppointmentForm.scheduled_date}T${newAppointmentForm.scheduled_time}`)
      
      const appointmentData: AppointmentCreate = {
        patient_name: newAppointmentForm.patient_name,
        patient_phone: newAppointmentForm.patient_phone,
        patient_email: newAppointmentForm.patient_email || undefined,
        provider_id: newAppointmentForm.provider_id,
        service_id: newAppointmentForm.service_id || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: newAppointmentForm.duration_minutes,
        notes: newAppointmentForm.notes || undefined,
        type: newAppointmentForm.type
      }

      await api.createAppointment(token, appointmentData)
      
      toast({
        title: "✓ Cita creada",
        description: `Cita agendada para ${newAppointmentForm.patient_name}`,
      })
      
      // Reset form
      setNewAppointmentForm({
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        provider_id: '',
        service_id: '',
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        notes: '',
        type: 'consultation'
      })
      
      setIsNewAppointmentOpen(false)
      setQuickCreateDate(null)
      setQuickCreateTime("")
      reloadAppointments()
      
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      
      let errorMessage = "Error al crear la cita"
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message).join(', ')
        } else {
          errorMessage = error.response.data.detail
        }
      } else if (error.message && error.message !== '[object Object]') {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusMap = {
      scheduled: { label: "Programada", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      confirmed: { label: "Confirmada", variant: "default" as const, icon: CheckCircle, color: "text-blue-600" },
      in_progress: { label: "En Consulta", variant: "secondary" as const, icon: Stethoscope, color: "text-green-600" },
      completed: { label: "Completada", variant: "secondary" as const, icon: CheckCircle2, color: "text-green-600" },
      no_show: { label: "No Asistió", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      cancelled_by_patient: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      cancelled_by_clinic: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      rescheduled: { label: "Reprogramada", variant: "outline" as const, icon: RefreshCw, color: "text-orange-600" }
    }
    
    const statusInfo = statusMap[status] || { 
      label: status, 
      variant: "default" as const, 
      icon: Clock,
      color: "text-gray-600"
    }
    const IconComponent = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${statusInfo.color}`}>
        <IconComponent className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  }

  const getProviderName = (providerId: string) => {
    const provider = availableProviders.find(p => p.id === providerId)
    return provider?.full_name || provider?.first_name || 'Proveedor'
  }

  // Calculate quick stats for current view
  const currentViewAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_at)
    const now = new Date()
    
    if (viewType === 'month') {
      return aptDate.getMonth() === currentDate.getMonth() && 
             aptDate.getFullYear() === currentDate.getFullYear()
    } else {
      // Week view - get week range
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return aptDate >= startOfWeek && aptDate <= endOfWeek
    }
  })

  const stats = {
    total: currentViewAppointments.length,
    confirmed: currentViewAppointments.filter(apt => apt.status === 'confirmed').length,
    inProgress: currentViewAppointments.filter(apt => apt.status === 'in_progress').length,
    completed: currentViewAppointments.filter(apt => apt.status === 'completed').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              📅 Calendario de Citas
            </h1>
            <p className="text-muted-foreground">
              Vista calendario para gestión visual de citas médicas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reloadAppointments}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            {currentUser?.role !== 'user' && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsNewAppointmentOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total {viewType === 'month' ? 'del Mes' : 'de la Semana'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">citas programadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground">listas para atender</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Consulta</CardTitle>
              <Stethoscope className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">actualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedProvider || "all"} onValueChange={(value) => setSelectedProvider(value === "all" ? "" : value)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los médicos</SelectItem>
              {availableProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    {provider.full_name || `${provider.first_name} ${provider.last_name}`}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                {quickCreateDate ? `Nueva Cita - ${quickCreateDate.toLocaleDateString('es-ES')} ${quickCreateTime}` : 'Agendar Nueva Cita'}
              </DialogTitle>
              <DialogDescription>
                Complete la información del paciente y confirme el horario
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Patient Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Nombre del Paciente *</Label>
                  <Input
                    id="patient_name"
                    placeholder="Nombre completo"
                    value={newAppointmentForm.patient_name}
                    onChange={(e) => setNewAppointmentForm({...newAppointmentForm, patient_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient_phone">Teléfono *</Label>
                  <Input
                    id="patient_phone"
                    placeholder="+52 55 1234 5678"
                    value={newAppointmentForm.patient_phone}
                    onChange={(e) => setNewAppointmentForm({...newAppointmentForm, patient_phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patient_email">Email (Opcional)</Label>
                <Input
                  id="patient_email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newAppointmentForm.patient_email}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, patient_email: e.target.value})}
                />
              </div>

              {/* Appointment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider_id">Médico/Especialista *</Label>
                  <Select value={newAppointmentForm.provider_id} onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, provider_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            {provider.full_name || `${provider.first_name} ${provider.last_name}`}
                            {provider.job_title && (
                              <span className="text-xs text-muted-foreground">• {provider.job_title}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duración (min)</Label>
                  <Select value={String(newAppointmentForm.duration_minutes)} onValueChange={(value) => setNewAppointmentForm({...newAppointmentForm, duration_minutes: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Fecha *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={newAppointmentForm.scheduled_date}
                    onChange={(e) => setNewAppointmentForm({...newAppointmentForm, scheduled_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Hora *</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={newAppointmentForm.scheduled_time}
                    onChange={(e) => setNewAppointmentForm({...newAppointmentForm, scheduled_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Motivo de la consulta, síntomas, etc."
                  value={newAppointmentForm.notes}
                  onChange={(e) => setNewAppointmentForm({...newAppointmentForm, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsNewAppointmentOpen(false)
                setQuickCreateDate(null)
                setQuickCreateTime("")
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment} className="bg-blue-600 hover:bg-blue-700">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Agendar Cita
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Appointment Details Sheet */}
        <Sheet open={isAppointmentDetailsOpen} onOpenChange={setIsAppointmentDetailsOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalles de la Cita
              </SheetTitle>
              <SheetDescription>
                Información completa de la cita médica
              </SheetDescription>
            </SheetHeader>

            {selectedAppointment && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedAppointment.patient_name}</h3>
                    <p className="text-muted-foreground">{formatDateTime(selectedAppointment.scheduled_at)}</p>
                  </div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Información del Paciente</Label>
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span>{selectedAppointment.patient_phone}</span>
                      </div>
                      {selectedAppointment.patient_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span>{selectedAppointment.patient_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Información de la Cita</Label>
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-purple-600" />
                        <span>{selectedAppointment.provider_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{selectedAppointment.duration_minutes} minutos</span>
                      </div>
                      {selectedAppointment.service_name && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-indigo-600" />
                          <span>{selectedAppointment.service_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedAppointment.notes && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
                      <p className="mt-1 text-sm">{selectedAppointment.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    {selectedAppointment.status === 'scheduled' && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          handleStatusUpdate(selectedAppointment.id, 'confirmed')
                          setIsAppointmentDetailsOpen(false)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar Cita
                      </Button>
                    )}
                    
                    {selectedAppointment.status === 'confirmed' && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          handleStatusUpdate(selectedAppointment.id, 'in_progress')
                          setIsAppointmentDetailsOpen(false)
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Iniciar Consulta
                      </Button>
                    )}
                    
                    {selectedAppointment.status === 'in_progress' && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          handleStatusUpdate(selectedAppointment.id, 'completed')
                          setIsAppointmentDetailsOpen(false)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completar Consulta
                      </Button>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open(`tel:${selectedAppointment.patient_phone}`, '_self')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  )
}