"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
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
  Trash2,
  BarChart3,
  PhoneCall,
  MessageSquare,
  Settings,
  Eye,
  UserCheck
} from "lucide-react"
import { 
  api, 
  CommercialObjective, 
  ObjectiveType, 
  ObjectivePeriod, 
  ObjectiveStatus,
  CommercialObjectiveCreate,
  CommercialObjectiveUpdate,
  AdminObjectiveDashboard,
  ObjectiveTemplate,
  ObjectiveTemplateCreate,
  User
} from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function AdminObjetivosPage() {
  const { toast } = useToast()
  const [objectives, setObjectives] = useState<CommercialObjective[]>([])
  const [dashboard, setDashboard] = useState<AdminObjectiveDashboard | null>(null)
  const [commercials, setCommercials] = useState<User[]>([])
  const [templates, setTemplates] = useState<ObjectiveTemplate[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCommercial, setSelectedCommercial] = useState<string>("all")
  
  // Dialogs
  const [showObjectiveDialog, setShowObjectiveDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingObjective, setEditingObjective] = useState<CommercialObjective | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ObjectiveTemplate | null>(null)

  // Objective form state
  const [objectiveForm, setObjectiveForm] = useState<CommercialObjectiveCreate>({
    commercial_id: "",
    title: "",
    description: "",
    type: "leads" as ObjectiveType,
    period: "monthly" as ObjectivePeriod,
    target_value: 0,
    unit: "",
    start_date: "",
    end_date: "",
    is_public: true,
    auto_calculate: true,
    reward_description: "",
    reward_amount: 0
  })

  // Template form state
  const [templateForm, setTemplateForm] = useState<ObjectiveTemplateCreate>({
    name: "",
    description: "",
    type: "leads" as ObjectiveType,
    period: "monthly" as ObjectivePeriod,
    default_target_value: 0,
    default_unit: "",
    default_reward_description: "",
    default_reward_amount: 0
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
      
      // Get current user (must be tenant_admin)
      const userData = await api.getCurrentUser(token)
      setCurrentUser(userData)

      if (userData.role !== 'tenant_admin') {
        toast({
          title: "Error",
          description: "No tienes permisos para acceder a esta página",
          variant: "destructive",
        })
        return
      }

      // Load data in parallel
      const [
        dashboardData, 
        objectivesData, 
        commercialsData,
        templatesData
      ] = await Promise.all([
        api.getAdminObjectiveDashboard(token),
        api.getCommercialObjectives(token),
        api.getMyTenantUsers(token, 'client'), // Get commercials
        api.getObjectiveTemplates(token, true)
      ])

      setDashboard(dashboardData)
      setObjectives(objectivesData)
      setCommercials(commercialsData)
      setTemplates(templatesData)
      
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Error al cargar los datos de administración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle objective creation/update
  const handleObjectiveSubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      if (editingObjective) {
        // Update existing objective
        const updatedObjective = await api.updateCommercialObjective(token, editingObjective.id, objectiveForm as CommercialObjectiveUpdate)
        setObjectives(objectives.map(o => o.id === editingObjective.id ? updatedObjective : o))
        toast({
          title: "Éxito",
          description: "Objetivo actualizado correctamente",
        })
      } else {
        // Create new objective
        const newObjective = await api.createCommercialObjective(token, objectiveForm)
        setObjectives([...objectives, newObjective])
        toast({
          title: "Éxito",
          description: "Objetivo creado correctamente",
        })
      }
      
      resetObjectiveForm()
      setShowObjectiveDialog(false)
      await loadData() // Refresh dashboard data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el objetivo",
        variant: "destructive",
      })
    }
  }

  // Handle template creation
  const handleTemplateSubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const newTemplate = await api.createObjectiveTemplate(token, templateForm)
      setTemplates([...templates, newTemplate])
      toast({
        title: "Éxito",
        description: "Plantilla creada correctamente",
      })
      
      resetTemplateForm()
      setShowTemplateDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la plantilla",
        variant: "destructive",
      })
    }
  }

  const handleDeleteObjective = async (objective: CommercialObjective) => {
    const token = auth.getToken()
    if (!token) return

    if (!confirm(`¿Estás seguro de que quieres eliminar el objetivo "${objective.title}"?`)) return

    try {
      await api.deleteCommercialObjective(token, objective.id)
      setObjectives(objectives.filter(o => o.id !== objective.id))
      toast({
        title: "Éxito",
        description: "Objetivo eliminado correctamente",
      })
      await loadData() // Refresh dashboard data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el objetivo",
        variant: "destructive",
      })
    }
  }

  const handleEditObjective = (objective: CommercialObjective) => {
    setEditingObjective(objective)
    setObjectiveForm({
      commercial_id: objective.commercial_id,
      title: objective.title,
      description: objective.description || "",
      type: objective.type,
      period: objective.period,
      target_value: objective.target_value,
      unit: objective.unit || "",
      start_date: objective.start_date.split('T')[0],
      end_date: objective.end_date.split('T')[0],
      is_public: objective.is_public,
      auto_calculate: objective.auto_calculate,
      reward_description: objective.reward_description || "",
      reward_amount: objective.reward_amount || 0
    })
    setShowObjectiveDialog(true)
  }

  const applyTemplate = (template: ObjectiveTemplate) => {
    setObjectiveForm({
      ...objectiveForm,
      title: template.name,
      description: template.description || "",
      type: template.type,
      period: template.period,
      target_value: template.default_target_value,
      unit: template.default_unit || "",
      reward_description: template.default_reward_description || "",
      reward_amount: template.default_reward_amount || 0
    })
  }

  const resetObjectiveForm = () => {
    setObjectiveForm({
      commercial_id: "",
      title: "",
      description: "",
      type: "leads" as ObjectiveType,
      period: "monthly" as ObjectivePeriod,
      target_value: 0,
      unit: "",
      start_date: "",
      end_date: "",
      is_public: true,
      auto_calculate: true,
      reward_description: "",
      reward_amount: 0
    })
    setEditingObjective(null)
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      type: "leads" as ObjectiveType,
      period: "monthly" as ObjectivePeriod,
      default_target_value: 0,
      default_unit: "",
      default_reward_description: "",
      default_reward_amount: 0
    })
    setEditingTemplate(null)
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

  // Filter objectives
  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = !searchTerm || 
      objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      objective.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      objective.commercial_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCommercial = selectedCommercial === "all" || objective.commercial_id === selectedCommercial

    return matchesSearch && matchesCommercial
  })

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (currentUser?.role !== 'tenant_admin') {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-2 text-lg font-semibold">Acceso Denegado</h2>
            <p className="text-muted-foreground">Solo los administradores pueden acceder a esta página.</p>
          </div>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Gestión de Objetivos
            </h1>
            <p className="text-muted-foreground">
              Administra los objetivos y performance de tu equipo comercial
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetTemplateForm}>
                  <Settings className="mr-2 h-4 w-4" />
                  Plantillas
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={showObjectiveDialog} onOpenChange={setShowObjectiveDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetObjectiveForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Objetivo
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comerciales Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.total_commercials || 0}</div>
              <p className="text-xs text-muted-foreground">
                Con objetivos asignados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos Activos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.total_active_objectives || 0}</div>
              <p className="text-xs text-muted-foreground">
                En progreso actualmente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cumplimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.overall_completion_rate.toFixed(0) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Promedio del equipo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboard?.overdue_objectives.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard?.objectives_by_status && Object.entries(dashboard.objectives_by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objetivos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard?.objectives_by_type && Object.entries(dashboard.objectives_by_type).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span>{getTypeLabel(type as ObjectiveType)}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar objetivos por título, descripción o comercial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los comerciales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los comerciales</SelectItem>
              {commercials.map(commercial => (
                <SelectItem key={commercial.id} value={commercial.id}>
                  {commercial.full_name || commercial.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Más Filtros
          </Button>
        </div>

        {/* Objectives Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
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
                        <Badge variant="secondary">{objective.commercial_name}</Badge>
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
                        {objective.current_value} / {objective.target_value} {objective.unit}
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
                    <Button variant="outline" size="sm" onClick={() => handleEditObjective(objective)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Detalles
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteObjective(objective)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
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
                {searchTerm || selectedCommercial !== "all" ? "No se encontraron objetivos" : "No hay objetivos creados"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || selectedCommercial !== "all"
                  ? "Intenta con otros filtros de búsqueda."
                  : "Comienza creando objetivos para tu equipo comercial."
                }
              </p>
              {(!searchTerm && selectedCommercial === "all") && (
                <div className="mt-6">
                  <Button onClick={() => { resetObjectiveForm(); setShowObjectiveDialog(true) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Objetivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Objective Create/Edit Dialog */}
      <Dialog open={showObjectiveDialog} onOpenChange={setShowObjectiveDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingObjective ? "Editar Objetivo" : "Crear Nuevo Objetivo"}
            </DialogTitle>
            <DialogDescription>
              {editingObjective 
                ? "Actualiza la información del objetivo comercial."
                : "Define un nuevo objetivo para tu equipo comercial."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Templates Section */}
            {!editingObjective && templates.length > 0 && (
              <div>
                <Label>Usar Plantilla (Opcional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {templates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commercial">Comercial</Label>
                <Select 
                  value={objectiveForm.commercial_id} 
                  onValueChange={(value) => setObjectiveForm({...objectiveForm, commercial_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar comercial" />
                  </SelectTrigger>
                  <SelectContent>
                    {commercials.map(commercial => (
                      <SelectItem key={commercial.id} value={commercial.id}>
                        {commercial.full_name || commercial.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Tipo de Objetivo</Label>
                <Select 
                  value={objectiveForm.type} 
                  onValueChange={(value) => setObjectiveForm({...objectiveForm, type: value as ObjectiveType})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="conversions">Conversiones</SelectItem>
                    <SelectItem value="revenue">Ingresos</SelectItem>
                    <SelectItem value="appointments">Citas</SelectItem>
                    <SelectItem value="calls">Llamadas</SelectItem>
                    <SelectItem value="meetings">Reuniones</SelectItem>
                    <SelectItem value="satisfaction">Satisfacción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Título del Objetivo</Label>
              <Input
                id="title"
                value={objectiveForm.title}
                onChange={(e) => setObjectiveForm({...objectiveForm, title: e.target.value})}
                placeholder="Ej. Capturar 50 leads este mes"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={objectiveForm.description}
                onChange={(e) => setObjectiveForm({...objectiveForm, description: e.target.value})}
                placeholder="Descripción detallada del objetivo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="target_value">Meta</Label>
                <Input
                  id="target_value"
                  type="number"
                  value={objectiveForm.target_value}
                  onChange={(e) => setObjectiveForm({...objectiveForm, target_value: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidad</Label>
                <Input
                  id="unit"
                  value={objectiveForm.unit}
                  onChange={(e) => setObjectiveForm({...objectiveForm, unit: e.target.value})}
                  placeholder="leads, MXN, %, etc."
                />
              </div>
              <div>
                <Label htmlFor="period">Período</Label>
                <Select 
                  value={objectiveForm.period} 
                  onValueChange={(value) => setObjectiveForm({...objectiveForm, period: value as ObjectivePeriod})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={objectiveForm.start_date}
                  onChange={(e) => setObjectiveForm({...objectiveForm, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end_date">Fecha de Fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={objectiveForm.end_date}
                  onChange={(e) => setObjectiveForm({...objectiveForm, end_date: e.target.value})}
                />
              </div>
            </div>

            {/* Reward Section */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Incentivo (Opcional)</h4>
              
              <div>
                <Label htmlFor="reward_description">Descripción del Incentivo</Label>
                <Input
                  id="reward_description"
                  value={objectiveForm.reward_description}
                  onChange={(e) => setObjectiveForm({...objectiveForm, reward_description: e.target.value})}
                  placeholder="Ej. Bono por cumplimiento de meta"
                />
              </div>

              <div>
                <Label htmlFor="reward_amount">Monto del Incentivo</Label>
                <Input
                  id="reward_amount"
                  type="number"
                  value={objectiveForm.reward_amount}
                  onChange={(e) => setObjectiveForm({...objectiveForm, reward_amount: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={objectiveForm.is_public}
                  onCheckedChange={(checked) => setObjectiveForm({...objectiveForm, is_public: checked})}
                />
                <Label htmlFor="is_public">Visible para otros comerciales</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_calculate"
                  checked={objectiveForm.auto_calculate}
                  onCheckedChange={(checked) => setObjectiveForm({...objectiveForm, auto_calculate: checked})}
                />
                <Label htmlFor="auto_calculate">Cálculo automático</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowObjectiveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleObjectiveSubmit}>
                {editingObjective ? "Actualizar" : "Crear"} Objetivo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plantillas de Objetivos</DialogTitle>
            <DialogDescription>
              Crea plantillas para generar objetivos recurrentes rápidamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing Templates */}
            {templates.length > 0 && (
              <div>
                <Label>Plantillas Existentes</Label>
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                  {templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getTypeLabel(template.type)} - {template.default_target_value} {template.default_unit}
                        </p>
                      </div>
                      <Badge variant="secondary">{template.usage_count} usos</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Template */}
            <div className="border-t pt-4">
              <Label>Crear Nueva Plantilla</Label>
              
              <div className="space-y-3 mt-2">
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="Nombre de la plantilla"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={templateForm.type} 
                    onValueChange={(value) => setTemplateForm({...templateForm, type: value as ObjectiveType})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="conversions">Conversiones</SelectItem>
                      <SelectItem value="revenue">Ingresos</SelectItem>
                      <SelectItem value="appointments">Citas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    value={templateForm.default_target_value}
                    onChange={(e) => setTemplateForm({...templateForm, default_target_value: parseFloat(e.target.value) || 0})}
                    placeholder="Meta por defecto"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleTemplateSubmit}>
                  Crear Plantilla
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  )
}