import { Appointment } from "@/lib/api"

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  appointments: Appointment[]
}

export interface CalendarHour {
  hour: number
  timeSlot: string
  appointments: Appointment[]
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  })
}

export function formatWeekRange(date: Date): string {
  const startOfWeek = getStartOfWeek(date)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function getMonthDays(currentDate: Date, appointments: Appointment[]): CalendarDay[] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = getStartOfWeek(new Date(firstDay))
  const days: CalendarDay[] = []

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

export function getWeekDays(currentDate: Date, appointments: Appointment[]): CalendarDay[] {
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

export function getHourSlots(appointments: Appointment[]): CalendarHour[] {
  const hours: CalendarHour[] = []

  for (let hour = 8; hour <= 20; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`

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

export function getStatusColor(status: string): string {
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

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
