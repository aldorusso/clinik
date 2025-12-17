"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Target, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Award,
  Edit,
  BarChart3,
  PhoneCall,
  MessageSquare
} from "lucide-react"
import { 
  api, 
  CommercialObjective, 
  ObjectiveType, 
  ObjectivePeriod, 
  ObjectiveStatus,
  ObjectiveProgressCreate,
  CommercialDashboard,
  User
} from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function ObjetivosPage() {
  const { toast } = useToast()
  const [objectives, setObjectives] = useState<CommercialObjective[]>([])
  const [dashboard, setDashboard] = useState<CommercialDashboard | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Progress dialog
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [selectedObjective, setSelectedObjective] = useState<CommercialObjective | null>(null)
  const [progressForm, setProgressForm] = useState({
    increment: 0,
    notes: ""
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      
      // Get current user
      const userData = await api.getCurrentUser(token)
      setCurrentUser(userData)

      // Load dashboard and objectives in parallel
      const [dashboardData, objectivesData] = await Promise.all([
        api.getCommercialDashboard(token),
        api.getCommercialObjectives(token, { is_active: true })
      ])

      setDashboard(dashboardData)
      setObjectives(objectivesData)
      
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Error al cargar los objetivos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddProgress = async () => {
    const token = auth.getToken()
    if (!token || !selectedObjective) return

    try {
      const progressData: ObjectiveProgressCreate = {
        objective_id: selectedObjective.id,
        increment: progressForm.increment,
        notes: progressForm.notes || undefined
      }

      await api.addObjectiveProgress(token, selectedObjective.id, progressData)
      
      toast({
        title: "Éxito",
        description: "Progreso actualizado correctamente",
      })
      
      // Reload data
      await loadData()
      setShowProgressDialog(false)
      setProgressForm({ increment: 0, notes: "" })
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el progreso",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (objective: CommercialObjective) => {
    if (objective.is_completed) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>
    }
    if (objective.is_overdue) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Vencido</Badge>
    }
    if (objective.progress_percentage >= 90) {
      return <Badge variant="default"><Target className="h-3 w-3 mr-1" />Casi Listo</Badge>
    }
    if (objective.progress_percentage >= 50) {
      return <Badge variant="secondary"><TrendingUp className="h-3 w-3 mr-1" />En Progreso</Badge>
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Iniciando</Badge>
  }

  const getTypeIcon = (type: ObjectiveType) => {
    const icons = {
      leads: Users,
      conversions: Target,
      revenue: DollarSign,
      appointments: Calendar,
      calls: PhoneCall,
      meetings: MessageSquare,
      satisfaction: Award
    }
    return icons[type] || Target
  }

  const getTypeLabel = (type: ObjectiveType) => {
    const labels = {
      leads: "Leads",
      conversions: "Conversiones",
      revenue: "Ingresos",
      appointments: "Citas",
      calls: "Llamadas",
      meetings: "Reuniones",
      satisfaction: "Satisfacción"
    }
    return labels[type] || type
  }

  const getPeriodLabel = (period: ObjectivePeriod) => {
    const labels = {
      weekly: "Semanal",
      monthly: "Mensual", 
      quarterly: "Trimestral",
      yearly: "Anual"
    }
    return labels[period] || period
  }

  const formatValue = (type: ObjectiveType, value: number, unit?: string) => {
    if (unit) {
      return `${value} ${unit}`
    }
    
    if (type === "revenue") {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(value)
    }
    if (type === "satisfaction") {
      return `${value}/5`
    }
    return value.toString()
  }

  const openProgressDialog = (objective: CommercialObjective) => {
    setSelectedObjective(objective)
    setProgressForm({ increment: 0, notes: "" })
    setShowProgressDialog(true)
  }

  // Filter objectives
  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = !searchTerm || 
      objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      objective.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Mis Objetivos
            </h1>
            <p className="text-muted-foreground">
              Seguimiento de metas y objetivos comerciales
            </p>
          </div>
          
          <Button onClick={() => window.location.href = '/dashboard/estadisticas'}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver Performance
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos Activos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.active_objectives.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Objetivos en progreso
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.completed_objectives_this_period || 0}</div>
              <p className="text-xs text-muted-foreground">
                Este período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.objectives_completion_rate.toFixed(0) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Promedio de cumplimiento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboard?.overdue_objectives || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Este Mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Leads</span>
                <span className="font-medium">{dashboard?.total_leads_this_month || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ingresos</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  }).format(dashboard?.total_revenue_this_month || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conversión</span>
                <span className="font-medium">{dashboard?.conversion_rate_this_month.toFixed(1) || 0}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Próximas Fechas</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.upcoming_deadlines.length ? (
                <div className="space-y-2">
                  {dashboard.upcoming_deadlines.slice(0, 3).map((deadline, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{deadline.title}</span>
                      <span className="font-medium">{deadline.date}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay fechas próximas</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sugerencias</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.suggestions.length ? (
                <div className="space-y-1">
                  {dashboard.suggestions.slice(0, 3).map((suggestion, index) => (
                    <p key={index} className="text-sm text-muted-foreground">• {suggestion}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">¡Vas muy bien! Sigue así.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar objetivos por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Goals Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredObjectives.map((objective) => {
            const IconComponent = getTypeIcon(objective.type)
            
            return (
              <Card key={objective.id} className={`hover:bg-muted/50 transition-colors ${objective.is_overdue ? 'border-red-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">{objective.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getTypeLabel(objective.type)}</Badge>
                        <Badge variant="secondary">{getPeriodLabel(objective.period)}</Badge>
                      </div>
                      {objective.description && (
                        <CardDescription className="mt-1">{objective.description}</CardDescription>
                      )}
                    </div>
                    {getStatusBadge(objective)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progreso</span>
                      <span className="font-medium">
                        {formatValue(objective.type, objective.current_value, objective.unit)} / {formatValue(objective.type, objective.target_value, objective.unit)}
                      </span>
                    </div>
                    <Progress value={Math.min(objective.progress_percentage, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {objective.progress_percentage.toFixed(1)}% completado
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      {objective.days_remaining > 0 ? (
                        <>Quedan {objective.days_remaining} días</>
                      ) : objective.is_overdue ? (
                        <span className="text-red-600 font-medium">Vencido</span>
                      ) : (
                        <>Vence hoy</>
                      )}
                    </div>
                    {objective.reward_amount && (
                      <Badge variant="outline" className="text-green-600">
                        <Award className="h-3 w-3 mr-1" />
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN'
                        }).format(objective.reward_amount)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openProgressDialog(objective)}
                      disabled={objective.is_completed}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Actualizar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {filteredObjectives.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">
                {searchTerm ? "No se encontraron objetivos" : "No hay objetivos asignados"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm 
                  ? "Intenta con otros términos de búsqueda."
                  : "Tu administrador te asignará objetivos próximamente."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Progreso</DialogTitle>
            <DialogDescription>
              Registra el avance en tu objetivo "{selectedObjective?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedObjective && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Progreso actual</p>
                <p className="font-medium">
                  {formatValue(selectedObjective.type, selectedObjective.current_value, selectedObjective.unit)} / {formatValue(selectedObjective.type, selectedObjective.target_value, selectedObjective.unit)}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="increment">Incremento</Label>
              <Input
                id="increment"
                type="number"
                value={progressForm.increment}
                onChange={(e) => setProgressForm({...progressForm, increment: parseFloat(e.target.value) || 0})}
                placeholder="Cantidad a agregar (puede ser negativa)"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={progressForm.notes}
                onChange={(e) => setProgressForm({...progressForm, notes: e.target.value})}
                placeholder="Describe el progreso realizado..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProgress}>
                Actualizar Progreso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}