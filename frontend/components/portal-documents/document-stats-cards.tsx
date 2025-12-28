"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Clock, CheckCircle } from "lucide-react"

interface DocumentStatsCardsProps {
  total: number
  pending: number
  completed: number
}

export function DocumentStatsCards({ total, pending, completed }: DocumentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center p-6">
          <FileText className="h-10 w-10 text-blue-500 mr-4" />
          <div>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-muted-foreground">Total Documentos</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <Clock className="h-10 w-10 text-amber-500 mr-4" />
          <div>
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-muted-foreground">Pendientes</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center p-6">
          <CheckCircle className="h-10 w-10 text-green-500 mr-4" />
          <div>
            <p className="text-2xl font-bold">{completed}</p>
            <p className="text-muted-foreground">Completados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
