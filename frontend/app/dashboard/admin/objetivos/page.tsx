"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, Plus, Search, Filter, AlertTriangle, Settings } from "lucide-react"
import {
  api,
  CommercialObjective,
  ObjectiveType,
  ObjectivePeriod,
  CommercialObjectiveCreate,
  CommercialObjectiveUpdate,
  AdminObjectiveDashboard,
  ObjectiveTemplate,
  ObjectiveTemplateCreate,
  User
} from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  ObjectiveCard,
  ObjectiveDialog,
  TemplateDialog,
  ObjectivesDashboardCards,
  ObjectivesStatsCharts
} from "@/components/objectives"

const initialObjectiveForm: CommercialObjectiveCreate = {
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
}

const initialTemplateForm: ObjectiveTemplateCreate = {
  name: "",
  description: "",
  type: "leads" as ObjectiveType,
  period: "monthly" as ObjectivePeriod,
  default_target_value: 0,
  default_unit: "",
  default_reward_description: "",
  default_reward_amount: 0
}

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

  // Form state
  const [objectiveForm, setObjectiveForm] = useState<CommercialObjectiveCreate>(initialObjectiveForm)
  const [templateForm, setTemplateForm] = useState<ObjectiveTemplateCreate>(initialTemplateForm)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
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

      const [dashboardData, objectivesData, commercialsData, templatesData] = await Promise.all([
        api.getAdminObjectiveDashboard(token),
        api.getCommercialObjectives(token),
        api.getMyTenantUsers(token, 'closer'),
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

  const handleObjectiveSubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      if (editingObjective) {
        const updatedObjective = await api.updateCommercialObjective(token, editingObjective.id, objectiveForm as CommercialObjectiveUpdate)
        setObjectives(objectives.map(o => o.id === editingObjective.id ? updatedObjective : o))
        toast({ title: "Éxito", description: "Objetivo actualizado correctamente" })
      } else {
        const newObjective = await api.createCommercialObjective(token, objectiveForm)
        setObjectives([...objectives, newObjective])
        toast({ title: "Éxito", description: "Objetivo creado correctamente" })
      }
      resetObjectiveForm()
      setShowObjectiveDialog(false)
      await loadData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al guardar el objetivo", variant: "destructive" })
    }
  }

  const handleTemplateSubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const newTemplate = await api.createObjectiveTemplate(token, templateForm)
      setTemplates([...templates, newTemplate])
      toast({ title: "Éxito", description: "Plantilla creada correctamente" })
      resetTemplateForm()
      setShowTemplateDialog(false)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al crear la plantilla", variant: "destructive" })
    }
  }

  const handleDeleteObjective = async (objective: CommercialObjective) => {
    const token = auth.getToken()
    if (!token) return
    if (!confirm(`¿Estás seguro de que quieres eliminar el objetivo "${objective.title}"?`)) return

    try {
      await api.deleteCommercialObjective(token, objective.id)
      setObjectives(objectives.filter(o => o.id !== objective.id))
      toast({ title: "Éxito", description: "Objetivo eliminado correctamente" })
      await loadData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al eliminar el objetivo", variant: "destructive" })
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
    setObjectiveForm(initialObjectiveForm)
    setEditingObjective(null)
  }

  const resetTemplateForm = () => {
    setTemplateForm(initialTemplateForm)
  }

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (currentUser?.role !== 'tenant_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo los administradores pueden acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">Gestión de Objetivos</h1>
          <p className="text-muted-foreground">Administra los objetivos y performance de tu equipo comercial</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetTemplateForm}>
                <Settings className="mr-2 h-4 w-4" />Plantillas
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showObjectiveDialog} onOpenChange={setShowObjectiveDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetObjectiveForm}>
                <Plus className="mr-2 h-4 w-4" />Nuevo Objetivo
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <ObjectivesDashboardCards dashboard={dashboard} />
      <ObjectivesStatsCharts dashboard={dashboard} />

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
          <Filter className="mr-2 h-4 w-4" />Más Filtros
        </Button>
      </div>

      {/* Objectives Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredObjectives.map((objective) => (
          <ObjectiveCard
            key={objective.id}
            objective={objective}
            onEdit={handleEditObjective}
            onDelete={handleDeleteObjective}
          />
        ))}
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
                : "Comienza creando objetivos para tu equipo comercial."}
            </p>
            {(!searchTerm && selectedCommercial === "all") && (
              <div className="mt-6">
                <Button onClick={() => { resetObjectiveForm(); setShowObjectiveDialog(true) }}>
                  <Plus className="mr-2 h-4 w-4" />Crear Primer Objetivo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ObjectiveDialog
        open={showObjectiveDialog}
        onOpenChange={setShowObjectiveDialog}
        editingObjective={editingObjective}
        objectiveForm={objectiveForm}
        setObjectiveForm={setObjectiveForm}
        commercials={commercials}
        templates={templates}
        onSubmit={handleObjectiveSubmit}
        onApplyTemplate={applyTemplate}
      />

      <TemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        templates={templates}
        templateForm={templateForm}
        setTemplateForm={setTemplateForm}
        onSubmit={handleTemplateSubmit}
      />
    </div>
  )
}
