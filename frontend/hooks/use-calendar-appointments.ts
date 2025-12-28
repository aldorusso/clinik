"use client"

import { useState, useEffect, useCallback } from "react"
import { Appointment, AppointmentStatus, AppointmentCreate, User, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { AppointmentFormData } from "@/components/calendar/appointment-form-dialog"
import { CalendarViewType } from "@/components/calendar/calendar-view"

const emptyFormData: AppointmentFormData = {
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
}

export function useCalendarAppointments() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [availableProviders, setAvailableProviders] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const loadData = useCallback(async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)

      const startDate = new Date(currentDate)
      startDate.setDate(1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)

      const appointmentsData = await api.getAppointments(token, {
        page_size: 500,
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
        order_by: 'scheduled_at',
        order_direction: 'asc'
      })
      setAppointments(appointmentsData)

      const directoryData = await api.getMyTenantUsers(token)
      const providers = directoryData.filter(user =>
        user.role === 'medico' || user.role === 'tenant_admin' || user.role === 'manager'
      )
      setAvailableProviders(providers)
    } catch (error: unknown) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Error al cargar la información del calendario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentDate, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const reloadAppointments = useCallback(async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const startDate = new Date(currentDate)
      startDate.setDate(1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)

      const appointmentsData = await api.getAppointments(token, {
        page_size: 500,
        date_from: startDate.toISOString().split('T')[0],
        date_to: endDate.toISOString().split('T')[0],
        order_by: 'scheduled_at',
        order_direction: 'asc'
      })
      setAppointments(appointmentsData)
    } catch (error: unknown) {
      console.error('Error reloading appointments:', error)
    }
  }, [currentDate])

  const updateStatus = useCallback(async (appointmentId: string, newStatus: AppointmentStatus) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateAppointmentStatus(token, appointmentId, newStatus)

      const messages: Record<AppointmentStatus, string> = {
        confirmed: "Cita confirmada",
        in_progress: "Cita iniciada",
        completed: "Cita completada",
        no_show: "Paciente marcado como No Show",
        cancelled_by_patient: "Cita cancelada por paciente",
        cancelled_by_clinic: "Cita cancelada por clínica",
        scheduled: "Estado actualizado correctamente",
        rescheduled: "Cita reprogramada"
      }

      toast({
        title: "Éxito",
        description: messages[newStatus] || "Estado actualizado correctamente",
      })

      reloadAppointments()
    } catch (error: unknown) {
      console.error('Error updating appointment status:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      })
    }
  }, [reloadAppointments, toast])

  const createAppointment = useCallback(async (formData: AppointmentFormData): Promise<boolean> => {
    const token = auth.getToken()
    if (!token) return false

    if (!formData.patient_name || !formData.patient_phone ||
        !formData.provider_id || !formData.scheduled_date ||
        !formData.scheduled_time) {
      toast({
        title: "Campos requeridos",
        description: "Complete todos los campos obligatorios",
        variant: "destructive",
      })
      return false
    }

    try {
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)

      const appointmentData: AppointmentCreate = {
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone,
        patient_email: formData.patient_email || undefined,
        provider_id: formData.provider_id,
        service_id: formData.service_id || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || undefined,
        type: formData.type
      }

      await api.createAppointment(token, appointmentData)

      toast({
        title: "Cita creada",
        description: `Cita agendada para ${formData.patient_name}`,
      })

      reloadAppointments()
      return true
    } catch (error: unknown) {
      console.error('Error creating appointment:', error)
      const err = error as { response?: { data?: { detail?: string | Array<{ msg?: string; message?: string }> } }; message?: string }
      let errorMessage = "Error al crear la cita"
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e) => e.msg || e.message).join(', ')
        } else {
          errorMessage = err.response.data.detail
        }
      } else if (err.message && err.message !== '[object Object]') {
        errorMessage = err.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    }
  }, [reloadAppointments, toast])

  const updateAppointment = useCallback(async (appointmentId: string, formData: AppointmentFormData): Promise<boolean> => {
    const token = auth.getToken()
    if (!token) return false

    if (!formData.patient_name || !formData.patient_phone ||
        !formData.provider_id || !formData.scheduled_date ||
        !formData.scheduled_time) {
      toast({
        title: "Campos requeridos",
        description: "Complete todos los campos obligatorios",
        variant: "destructive",
      })
      return false
    }

    try {
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)

      const appointmentData = {
        patient_name: formData.patient_name,
        patient_phone: formData.patient_phone,
        patient_email: formData.patient_email || undefined,
        provider_id: formData.provider_id,
        service_id: formData.service_id || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || undefined,
        type: formData.type
      }

      await api.updateAppointment(token, appointmentId, appointmentData)

      toast({
        title: "Cita actualizada",
        description: `Cita de ${formData.patient_name} actualizada correctamente`,
      })

      reloadAppointments()
      return true
    } catch (error: unknown) {
      console.error('Error updating appointment:', error)
      const err = error as { response?: { data?: { detail?: string | Array<{ msg?: string; message?: string }> } }; message?: string }
      let errorMessage = "Error al actualizar la cita"
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e) => e.msg || e.message).join(', ')
        } else {
          errorMessage = err.response.data.detail
        }
      } else if (err.message && err.message !== '[object Object]') {
        errorMessage = err.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    }
  }, [reloadAppointments, toast])

  const calculateStats = useCallback((filteredAppointments: Appointment[], viewType: CalendarViewType) => {
    const currentViewAppointments = filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at)

      if (viewType === 'month') {
        return aptDate.getMonth() === currentDate.getMonth() &&
               aptDate.getFullYear() === currentDate.getFullYear()
      } else {
        const startOfWeek = new Date(currentDate)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
        startOfWeek.setDate(diff)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        return aptDate >= startOfWeek && aptDate <= endOfWeek
      }
    })

    return {
      total: currentViewAppointments.length,
      confirmed: currentViewAppointments.filter(apt => apt.status === 'confirmed').length,
      inProgress: currentViewAppointments.filter(apt => apt.status === 'in_progress').length,
      completed: currentViewAppointments.filter(apt => apt.status === 'completed').length
    }
  }, [currentDate])

  const appointmentToFormData = useCallback((appointment: Appointment): AppointmentFormData => {
    const appointmentDate = new Date(appointment.scheduled_at)
    return {
      patient_name: appointment.patient_name || '',
      patient_phone: appointment.patient_phone || '',
      patient_email: appointment.patient_email || '',
      provider_id: appointment.provider_id || '',
      service_id: appointment.service_id || '',
      scheduled_date: appointmentDate.toISOString().split('T')[0],
      scheduled_time: appointmentDate.toTimeString().slice(0, 5),
      duration_minutes: appointment.duration_minutes || 60,
      notes: appointment.notes || '',
      type: appointment.type || 'consultation'
    }
  }, [])

  return {
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
  }
}
