"use client"

import { Appointment } from "@/lib/api"
import { CalendarDay, CalendarHour, getStatusColor, formatTime } from "./calendar-helpers"

interface WeekViewProps {
  days: CalendarDay[]
  hours: CalendarHour[]
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, time: string) => void
}

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function WeekView({ days, hours, onAppointmentClick, onTimeSlotClick }: WeekViewProps) {
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
                {WEEK_DAYS[index]}
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
