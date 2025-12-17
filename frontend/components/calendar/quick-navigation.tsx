"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarViewType } from "./calendar-view"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarIcon
} from "lucide-react"

interface QuickNavigationProps {
  viewType: CalendarViewType
  currentDate: Date
  onDateChange: (date: Date) => void
  onViewTypeChange: (viewType: CalendarViewType) => void
  stats?: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
  }
}

export function QuickNavigation({ 
  viewType, 
  currentDate, 
  onDateChange, 
  onViewTypeChange,
  stats 
}: QuickNavigationProps) {
  
  const formatCurrentPeriod = () => {
    if (viewType === 'month') {
      return currentDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long'
      })
    } else {
      const startOfWeek = getStartOfWeek(currentDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('es-ES', { 
          month: 'long', 
          year: 'numeric' 
        })}`
      } else {
        return `${startOfWeek.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short' 
        })} - ${endOfWeek.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })}`
      }
    }
  }

  const getStartOfWeek = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
    return new Date(date.setDate(diff))
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

  const getQuickDates = () => {
    const today = new Date()
    const thisWeek = getStartOfWeek(new Date())
    const nextWeek = new Date(thisWeek)
    nextWeek.setDate(thisWeek.getDate() + 7)
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    return {
      today,
      thisWeek,
      nextWeek,
      thisMonth,
      nextMonth
    }
  }

  const quickDates = getQuickDates()
  const isCurrentPeriod = () => {
    if (viewType === 'month') {
      return currentDate.getMonth() === new Date().getMonth() && 
             currentDate.getFullYear() === new Date().getFullYear()
    } else {
      const thisWeek = getStartOfWeek(new Date())
      const currentWeek = getStartOfWeek(new Date(currentDate))
      return thisWeek.getTime() === currentWeek.getTime()
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center min-w-[200px]">
              <h3 className="font-semibold">
                {formatCurrentPeriod()}
              </h3>
              {isCurrentPeriod() && (
                <Badge variant="outline" className="mt-1">
                  Actual
                </Badge>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Type Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewTypeChange('month')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Mes
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewTypeChange('week')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Semana
            </Button>
          </div>
        </div>

        {/* Quick Navigation Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-blue-600 hover:text-blue-700"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Hoy
          </Button>

          {viewType === 'week' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateChange(quickDates.thisWeek)}
              >
                Esta semana
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateChange(quickDates.nextWeek)}
              >
                Próxima semana
              </Button>
            </>
          )}

          {viewType === 'month' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateChange(quickDates.thisMonth)}
              >
                Este mes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateChange(quickDates.nextMonth)}
              >
                Próximo mes
              </Button>
            </>
          )}

          {/* Stats display if provided */}
          {stats && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline">
                {stats.total} total
              </Badge>
              {viewType === 'month' ? (
                <Badge variant="secondary">
                  {stats.thisMonth} este mes
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {stats.thisWeek} esta semana
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}