"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/user-context"
import { LeadFormModal } from "@/components/leads/lead-form-modal"
import {
  Users,
  Plus,
  Search,
  Filter,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Eye,
  Clock,
  Star,
  Target
} from "lucide-react"
import { api, Lead } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function MisLeadsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Function to load data (extracted so it can be called from modal success)
  const loadData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      // Cargar solo MIS leads (asignados a mí)
      const response = await api.get<{ items?: Lead[]; leads?: Lead[] } | Lead[]>(`/api/v1/leads?assigned_to_me=true`)
      const leadsData = Array.isArray(response)
        ? response
        : response.items || response.leads || []

      setLeads(leadsData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Error al cargar mis leads",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [router, toast])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      nuevo: { label: "Nuevo", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      contactado: { label: "Contactado", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      calificado: { label: "Calificado", variant: "default" as const, color: "bg-green-100 text-green-800" },
      cita_agendada: { label: "Cita Agendada", variant: "default" as const, color: "bg-purple-100 text-purple-800" },
      vino_a_cita: { label: "Vino a Cita", variant: "default" as const, color: "bg-indigo-100 text-indigo-800" },
      convertido: { label: "Convertido", variant: "default" as const, color: "bg-green-100 text-green-800" },
      perdido: { label: "Perdido", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      no_contesta: { label: "No Contesta", variant: "outline" as const, color: "bg-gray-100 text-gray-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.nuevo
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta":
        return <Star className="h-4 w-4 text-red-500" />
      case "media":
        return <Star className="h-4 w-4 text-yellow-500" />
      default:
        return <Star className="h-4 w-4 text-gray-400" />
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === "" || 
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm)
    
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Calcular estadísticas de mis leads
  const myStats = {
    total: leads.length,
    nuevo: leads.filter(l => l.status === "nuevo").length,
    en_proceso: leads.filter(l => ["contactado", "calificado", "cita_agendada"].includes(l.status)).length,
    convertidos: leads.filter(l => l.status === "convertido").length,
    perdidos: leads.filter(l => l.status === "perdido").length,
  }

  const conversionRate = myStats.total > 0 ? ((myStats.convertidos / myStats.total) * 100).toFixed(1) : "0"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              Mis Leads
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus leads asignados - {user?.first_name || "Comercial"}
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{myStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nuevos</p>
                  <p className="text-2xl font-bold text-blue-600">{myStats.nuevo}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Proceso</p>
                  <p className="text-2xl font-bold text-yellow-600">{myStats.en_proceso}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Convertidos</p>
                  <p className="text-2xl font-bold text-green-600">{myStats.convertidos}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversión</p>
                  <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
                </div>
                <Star className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en mis leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="calificado">Calificado</option>
            <option value="cita_agendada">Cita Agendada</option>
            <option value="convertido">Convertido</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Leads Asignados</CardTitle>
            <CardDescription>
              Leads que tienes asignados para gestión comercial
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedStatus !== "all" 
                    ? "No se encontraron leads con los filtros aplicados" 
                    : "No tienes leads asignados actualmente"
                  }
                </p>
                {searchTerm || selectedStatus !== "all" ? (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("")
                    setSelectedStatus("all")
                  }}>
                    Limpiar Filtros
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {getPriorityIcon(lead.priority)}
                        <div>
                          <h3 className="font-semibold">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {lead.service_interest_name || "Sin servicio específico"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(lead.status)}
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.phone || "Sin teléfono"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {lead.created_at 
                            ? new Date(lead.created_at).toLocaleDateString()
                            : "Fecha desconocida"
                          }
                        </span>
                      </div>
                    </div>
                    
                    {lead.initial_notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <strong>Notas:</strong> {lead.initial_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Modal para crear lead */}
      <LeadFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          loadData() // Recargar la lista
        }}
        mode="create"
        currentUser={user}
      />
    </div>
  )
}