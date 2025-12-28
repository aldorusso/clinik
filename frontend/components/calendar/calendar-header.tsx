"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, CalendarDays, CalendarIcon } from "lucide-react"
import { CalendarViewType } from "./calendar-view"
import { formatMonthYear, formatWeekRange } from "./calendar-helpers"

interface CalendarHeaderProps {
  viewType: CalendarViewType
  currentDate: Date
  onViewTypeChange: (viewType: CalendarViewType) => void
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  onGoToToday: () => void
}

export function CalendarHeader({
  viewType,
  currentDate,
  onViewTypeChange,
  onNavigatePrevious,
  onNavigateNext,
  onGoToToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onNavigatePrevious}
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
          onClick={onNavigateNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onGoToToday}
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
  )
}
