"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, BarChart3 } from "lucide-react"
import {
  api,
  CommercialObjective,
  ObjectiveProgressCreate,
  CommercialDashboard
} from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  CommercialStatsCards,
  CommercialQuickStats,
  CommercialObjectiveCard,
  ProgressDialog,
  ObjectivesEmptyState
} from "@/components/objectives"

export default function ObjetivosPage() {
  const { toast } = useToast()
  const [objectives, setObjectives] = useState<CommercialObjective[]>([])
  const [dashboard, setDashboard] = useState<CommercialDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Progress dialog
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [selectedObjective, setSelectedObjective] = useState<CommercialObjective | null>(null)
  const [progressForm, setProgressForm] = useState({
    increment: 0,
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
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
        title: "Exito",
        description: "Progreso actualizado correctamente",
      })

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

  const openProgressDialog = (objective: CommercialObjective) => {
    setSelectedObjective(objective)
    setProgressForm({ increment: 0, notes: "" })
    setShowProgressDialog(true)
  }

  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = !searchTerm ||
      objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      objective.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
      <CommercialStatsCards dashboard={dashboard} />

      {/* Quick Stats */}
      <CommercialQuickStats dashboard={dashboard} />

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar objetivos por titulo o descripcion..."
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
        {filteredObjectives.map((objective) => (
          <CommercialObjectiveCard
            key={objective.id}
            objective={objective}
            onUpdateProgress={openProgressDialog}
          />
        ))}
      </div>

      {filteredObjectives.length === 0 && (
        <ObjectivesEmptyState hasSearchTerm={!!searchTerm} />
      )}

      {/* Progress Update Dialog */}
      <ProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        objective={selectedObjective}
        formData={progressForm}
        onFormChange={setProgressForm}
        onSubmit={handleAddProgress}
      />
    </div>
  )
}
