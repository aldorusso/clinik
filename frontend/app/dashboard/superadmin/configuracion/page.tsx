"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, CreditCard } from "lucide-react"
import { api, Plan, PlanCreate, PlanUpdate, SystemConfig } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import {
  PlansTable,
  PlanDialog,
  SystemConfigsTab,
  DeletePlanDialog
} from "@/components/superadmin-config"

const defaultPlanForm: PlanCreate = {
  name: "",
  slug: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  currency: "USD",
  max_users: 5,
  max_clients: 10,
  max_storage_gb: 1,
  is_active: true,
  is_default: false,
  display_order: 0,
}

export default function SuperadminConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState<PlanCreate>(defaultPlanForm)

  // System config state
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [hasConfigChanges, setHasConfigChanges] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const [plansData, configsData] = await Promise.all([
        api.getPlans(token, true),
        api.getSystemConfigs(token),
      ])
      setPlans(plansData)
      setConfigs(configsData)

      const values: Record<string, string> = {}
      configsData.forEach((config) => {
        values[config.key] = config.value || ""
      })
      setConfigValues(values)
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  // Plan handlers
  const handleCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm({ ...defaultPlanForm, display_order: plans.length })
    setShowPlanDialog(true)
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
      max_users: plan.max_users,
      max_clients: plan.max_clients,
      max_storage_gb: plan.max_storage_gb,
      is_active: plan.is_active,
      is_default: plan.is_default,
      display_order: plan.display_order,
    })
    setShowPlanDialog(true)
  }

  const handleSavePlan = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setSaving(true)
      if (editingPlan) {
        await api.updatePlan(token, editingPlan.id, planForm as PlanUpdate)
        toast.success("Plan actualizado correctamente")
      } else {
        await api.createPlan(token, planForm)
        toast.success("Plan creado correctamente")
      }
      setShowPlanDialog(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar plan")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!deletingPlan) return
    const token = auth.getToken()
    if (!token) return

    try {
      await api.deletePlan(token, deletingPlan.id)
      toast.success("Plan eliminado correctamente")
      setDeletingPlan(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar plan")
    }
  }

  const handleSetDefaultPlan = async (plan: Plan) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updatePlan(token, plan.id, { is_default: true })
      toast.success("Plan establecido como predeterminado")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar plan")
    }
  }

  // Config handlers
  const handleConfigChange = (key: string, value: string) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }))
    setHasConfigChanges(true)
  }

  const handleSaveConfigs = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setSaving(true)
      await api.bulkUpdateSystemConfigs(token, configValues)
      toast.success("Configuraciones guardadas correctamente")
      setHasConfigChanges(false)
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Error al guardar configuraciones")
    } finally {
      setSaving(false)
    }
  }

  // Group configs by category
  const configsByCategory = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, SystemConfig[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configuracion</h1>
        </div>
        <p className="text-muted-foreground">
          Gestiona la configuracion global del sistema y los planes disponibles
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Parametros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <PlansTable
            plans={plans}
            onCreatePlan={handleCreatePlan}
            onEditPlan={handleEditPlan}
            onDeletePlan={setDeletingPlan}
            onSetDefault={handleSetDefaultPlan}
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <SystemConfigsTab
            configsByCategory={configsByCategory}
            configValues={configValues}
            onConfigChange={handleConfigChange}
            onSave={handleSaveConfigs}
            hasChanges={hasConfigChanges}
            saving={saving}
          />
        </TabsContent>
      </Tabs>

      <PlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        editingPlan={editingPlan}
        planForm={planForm}
        setPlanForm={setPlanForm}
        onSave={handleSavePlan}
        saving={saving}
      />

      <DeletePlanDialog
        plan={deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDeletePlan}
      />
    </div>
  )
}
