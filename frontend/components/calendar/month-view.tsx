"use client"

import { Appointment } from "@/lib/api"
import { CalendarDay, getStatusColor, formatTime } from "./calendar-helpers"

interface MonthViewProps {
  days: CalendarDay[]
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, time: string) => void
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function MonthView({ days, onAppointmentClick, onTimeSlotClick }: MonthViewProps) {
  return (
    <div className="grid grid-cols-7">
      {/* Header con días de la semana */}
      {WEEK_DAYS.map((day) => (
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
            {day.appointments.slice(0, 3).map((appointment) => (
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
