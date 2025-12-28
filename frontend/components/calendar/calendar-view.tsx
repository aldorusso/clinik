"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Appointment } from "@/lib/api"
import { CalendarHeader } from "./calendar-header"
import { MonthView } from "./month-view"
import { WeekView } from "./week-view"
import { getMonthDays, getWeekDays, getHourSlots } from "./calendar-helpers"

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

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewType === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setDate(currentDate.getDate() - 7)
    }
    onDateChange(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewType === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1)
    } else {
      newDate.setDate(currentDate.getDate() + 7)
    }
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <CalendarHeader
        viewType={viewType}
        currentDate={currentDate}
        onViewTypeChange={onViewTypeChange}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
        onGoToToday={goToToday}
      />

      <Card>
        <CardContent className="p-0">
          {viewType === 'month' ? (
            <MonthView
              days={getMonthDays(currentDate, appointments)}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          ) : (
            <WeekView
              days={getWeekDays(currentDate, appointments)}
              hours={getHourSlots(appointments)}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
