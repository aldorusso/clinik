"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Stethoscope, 
  Calendar,
  User,
  CheckCircle
} from "lucide-react"

export default function PatientTreatmentsPage() {
  const [treatments] = useState([
    {
      id: "1",
      name: "Botox Facial",
      doctor: "Dr. Carlos Mendez",
      date: "25 de Noviembre, 2024",
      status: "En Progreso"
    },
    {
      id: "2", 
      name: "Limpieza Facial",
      doctor: "Dr. María García",
      date: "15 de Octubre, 2024",
      status: "Completado"
    }
  ])

  const getStatusBadge = (status: string) => {
    if (status === "Completado") {
      return <Badge className="bg-green-100 text-green-800">Completado</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-green-500" />
            Mis Tratamientos
          </h1>
          <p className="text-muted-foreground mt-2">
            Aquí puedes ver todos tus tratamientos médicos
          </p>
        </div>

        {/* Simple Treatment List */}
        <div className="space-y-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{treatment.name}</h3>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{treatment.doctor}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{treatment.date}</span>
                    </div>
                  </div>
                  
                  <div>
                    {getStatusBadge(treatment.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {treatments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes tratamientos</h3>
              <p className="text-muted-foreground">
                Cuando tengas tratamientos médicos, aparecerán aquí
              </p>
            </CardContent>
          </Card>
        )}
      </div>
  )
}