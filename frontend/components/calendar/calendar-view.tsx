"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  User,
  CalendarDays,
  CalendarIcon,
  Plus,
  Filter
} from "lucide-react"
import { Appointment } from "@/lib/api"

export type CalendarViewType = 'month' | 'week'

interface CalendarViewProps {
  appointments: Appointment[]
  viewType: CalendarViewType
  onViewTypeChange: (viewType: CalendarViewType) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  loading?: boolean
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  appointments: Appointment[]
}

interface CalendarHour {
  hour: number
  timeSlot: string
  appointments: Appointment[]
}

export function CalendarView({
  appointments,
  viewType,
  onViewTypeChange,
  currentDate,
  onDateChange,
  onAppointmentClick,
  onTimeSlotClick,
  loading = false
}: CalendarViewProps) {

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatWeekRange = (date: Date) => {
    const startOfWeek = getStartOfWeek(date)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
  }

  const getStartOfWeek = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
    return new Date(date.setDate(diff))
  }

  const getMonthDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = getStartOfWeek(new Date(firstDay))
    const days: CalendarDay[] = []

    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at)
        return aptDate.toDateString() === date.toDateString()
      })

      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === new Date().toDateString(),
        appointments: dayAppointments
      })
    }

    return days
  }

  const getWeekDays = (): CalendarDay[] => {
    const startOfWeek = getStartOfWeek(new Date(currentDate))
    const days: CalendarDay[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at)
        return aptDate.toDateString() === date.toDateString()
      })

      days.push({
        date: new Date(date),
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        appointments: dayAppointments
      })
    }

    return days
  }

  const getHourSlots = (): CalendarHour[] => {
    const hours: CalendarHour[] = []
    
    // Generar slots de 8 AM a 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`
      
      // Obtener citas para esta hora en la semana actual
      const hourAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at)
        return aptDate.getHours() === hour
      })

      hours.push({
        hour,
        timeSlot,
        appointments: hourAppointments
      })
    }

    return hours
  }

  const navigatePrevious = () => {
    if (viewType === 'month') {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() - 1)
      onDateChange(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 7)
      onDateChange(newDate)
    }
  }

  const navigateNext = () => {
    if (viewType === 'month') {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() + 1)
      onDateChange(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 7)
      onDateChange(newDate)
    }
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200", 
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      no_show: "bg-red-100 text-red-800 border-red-200",
      cancelled_by_patient: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled_by_clinic: "bg-gray-100 text-gray-800 border-gray-200"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={navigatePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {viewType === 'month' ? formatMonthYear(currentDate) : formatWeekRange(currentDate)}
            </h2>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={navigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goToToday}
          >
            Hoy
          </Button>
          
          <Select value={viewType} onValueChange={(value) => onViewTypeChange(value as CalendarViewType)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Mes
                </div>
              </SelectItem>
              <SelectItem value="week">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Semana
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-0">
          {viewType === 'month' ? (
            <MonthView 
              days={getMonthDays()}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
              getStatusColor={getStatusColor}
              formatTime={formatTime}
            />
          ) : (
            <WeekView 
              days={getWeekDays()}
              hours={getHourSlots()}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
              getStatusColor={getStatusColor}
              formatTime={formatTime}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface MonthViewProps {
  days: CalendarDay[]
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  getStatusColor: (status: string) => string
  formatTime: (dateString: string) => string
}

function MonthView({ days, onAppointmentClick, onTimeSlotClick, getStatusColor, formatTime }: MonthViewProps) {
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="grid grid-cols-7">
      {/* Header con días de la semana */}
      {weekDays.map((day) => (
        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
          {day}
        </div>
      ))}

      {/* Días del mes */}
      {days.map((day, index) => (
        <div
          key={index}
          className={`min-h-[120px] p-2 border-b border-r relative cursor-pointer hover:bg-muted/50 transition-colors ${
            !day.isCurrentMonth ? 'bg-muted/20' : ''
          } ${
            day.isToday ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onTimeSlotClick && onTimeSlotClick(day.date, '09:00')}
        >
          <div className={`text-sm mb-1 ${
            day.isToday ? 'font-bold text-blue-600' : 
            !day.isCurrentMonth ? 'text-muted-foreground' : ''
          }`}>
            {day.date.getDate()}
          </div>
          
          <div className="space-y-1">
            {day.appointments.slice(0, 3).map((appointment, idx) => (
              <div
                key={appointment.id}
                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(appointment.status)}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onAppointmentClick && onAppointmentClick(appointment)
                }}
              >
                <div className="font-medium truncate">
                  {formatTime(appointment.scheduled_at)} {appointment.patient_name}
                </div>
                {appointment.service_name && (
                  <div className="truncate opacity-75">
                    {appointment.service_name}
                  </div>
                )}
              </div>
            ))}
            
            {day.appointments.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{day.appointments.length - 3} más
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface WeekViewProps {
  days: CalendarDay[]
  hours: CalendarHour[]
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, time: string) => void
  getStatusColor: (status: string) => string
  formatTime: (dateString: string) => string
}

function WeekView({ days, hours, onAppointmentClick, onTimeSlotClick, getStatusColor, formatTime }: WeekViewProps) {
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header con días de la semana */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 text-center text-sm font-medium text-muted-foreground">
            Hora
          </div>
          {days.map((day, index) => (
            <div key={index} className={`p-3 text-center border-l ${
              day.isToday ? 'bg-blue-50 text-blue-600 font-semibold' : ''
            }`}>
              <div className="text-sm font-medium">
                {weekDays[index]}
              </div>
              <div className={`text-lg ${day.isToday ? 'font-bold' : ''}`}>
                {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Slots de tiempo */}
        {hours.map((hour) => (
          <div key={hour.hour} className="grid grid-cols-8 border-b">
            <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30">
              {hour.timeSlot}
            </div>
            {days.map((day, dayIndex) => {
              const dayHourAppointments = hour.appointments.filter(apt => {
                const aptDate = new Date(apt.scheduled_at)
                return aptDate.toDateString() === day.date.toDateString()
              })

              return (
                <div
                  key={dayIndex}
                  className={`p-1 border-l min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors ${
                    day.isToday ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => onTimeSlotClick && onTimeSlotClick(day.date, hour.timeSlot)}
                >
                  {dayHourAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${getStatusColor(appointment.status)}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick && onAppointmentClick(appointment)
                      }}
                    >
                      <div className="font-medium truncate">
                        {appointment.patient_name}
                      </div>
                      <div className="truncate opacity-75">
                        {formatTime(appointment.scheduled_at)}
                      </div>
                      {appointment.service_name && (
                        <div className="truncate opacity-75">
                          {appointment.service_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}