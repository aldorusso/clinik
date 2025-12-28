export const statusMap = {
  nuevo: { label: "Nuevo", variant: "default" as const },
  contactado: { label: "Contactado", variant: "secondary" as const },
  calificado: { label: "Calificado", variant: "outline" as const },
  cita_agendada: { label: "Cita Agendada", variant: "default" as const },
  en_tratamiento: { label: "En Tratamiento", variant: "default" as const },
  completado: { label: "Completado", variant: "default" as const },
  no_califica: { label: "No Califica", variant: "destructive" as const },
  perdido: { label: "Perdido", variant: "destructive" as const }
} as const

export const priorityColors = {
  alta: "text-red-600",
  media: "text-yellow-600",
  baja: "text-green-600",
  urgente: "text-red-800"
} as const

export function getStatusInfo(status: string) {
  return statusMap[status as keyof typeof statusMap] || { label: status, variant: "default" as const }
}

export function getPriorityColor(priority: string) {
  return priorityColors[priority as keyof typeof priorityColors] || "text-gray-600"
}
