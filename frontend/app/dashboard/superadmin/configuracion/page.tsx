"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  CreditCard,
  Shield,
  Save,
  Plus,
  Pencil,
  Trash2,
  Check,
  Users,
  HardDrive,
} from "lucide-react"
import { api, Plan, PlanCreate, PlanUpdate, SystemConfig, SystemConfigUpdate } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"

export default function SuperadminConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState<PlanCreate>({
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
  })

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

      // Initialize config values
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
    setPlanForm({
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
      display_order: plans.length,
    })
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

  const categoryLabels: Record<string, { label: string; icon: typeof Settings }> = {
    general: { label: "General", icon: Settings },
    security: { label: "Seguridad", icon: Shield },
    billing: { label: "Facturacion", icon: CreditCard },
  }

  if (loading) {
    return (
      <SuperadminDashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SuperadminDashboardLayout>
    )
  }

  return (
    <SuperadminDashboardLayout>
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

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Planes de Suscripcion</CardTitle>
                  <CardDescription>
                    Gestiona los planes disponibles para los tenants
                  </CardDescription>
                </div>
                <Button onClick={handleCreatePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Plan
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Precio Mensual</TableHead>
                      <TableHead>Precio Anual</TableHead>
                      <TableHead>Limites</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {plan.name}
                              {plan.is_default && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {plan.slug}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.price_monthly === 0 ? (
                            <span className="text-green-600 font-medium">Gratis</span>
                          ) : (
                            <span>
                              ${Number(plan.price_monthly).toFixed(2)}/{plan.currency}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {plan.price_yearly === 0 ? (
                            <span className="text-green-600 font-medium">Gratis</span>
                          ) : (
                            <span>
                              ${Number(plan.price_yearly).toFixed(2)}/{plan.currency}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {plan.max_users === -1 ? "∞" : plan.max_users}
                            </span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {plan.max_storage_gb}GB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.is_active ? (
                            <Badge className="bg-green-500">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!plan.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefaultPlan(plan)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!plan.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingPlan(plan)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Config Tab */}
          <TabsContent value="general" className="space-y-4">
            {Object.entries(configsByCategory).map(([category, categoryConfigs]) => {
              const categoryInfo = categoryLabels[category] || {
                label: category,
                icon: Settings,
              }
              const Icon = categoryInfo.icon

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {categoryInfo.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryConfigs.map((config) => (
                      <div key={config.id} className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={config.key}>{config.description || config.key}</Label>
                          {config.value_type === "boolean" ? (
                            <Switch
                              id={config.key}
                              checked={configValues[config.key] === "true"}
                              onCheckedChange={(checked) =>
                                handleConfigChange(config.key, checked ? "true" : "false")
                              }
                            />
                          ) : (
                            <Input
                              id={config.key}
                              type={config.value_type === "number" ? "number" : "text"}
                              value={configValues[config.key] || ""}
                              onChange={(e) => handleConfigChange(config.key, e.target.value)}
                              className="max-w-xs"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}

            {hasConfigChanges && (
              <div className="flex justify-end">
                <Button onClick={handleSaveConfigs} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plan" : "Nuevo Plan"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Modifica los detalles del plan"
                : "Crea un nuevo plan de suscripcion"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ej: Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={planForm.slug}
                  onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                  placeholder="Ej: pro"
                  disabled={!!editingPlan}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Descripcion del plan..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Precio Mensual</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  step="0.01"
                  value={planForm.price_monthly}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, price_monthly: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Precio Anual</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  step="0.01"
                  value={planForm.price_yearly}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, price_yearly: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={planForm.currency}
                  onValueChange={(value) => setPlanForm({ ...planForm, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Usuarios (-1 = ilimitado)</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={planForm.max_users}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, max_users: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_clients">Max Clientes (-1 = ilimitado)</Label>
                <Input
                  id="max_clients"
                  type="number"
                  value={planForm.max_clients}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, max_clients: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_storage_gb">Almacenamiento (GB)</Label>
                <Input
                  id="max_storage_gb"
                  type="number"
                  value={planForm.max_storage_gb}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, max_storage_gb: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={planForm.is_default}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_default: checked })}
                />
                <Label htmlFor="is_default">Plan por defecto</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Plan</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar el plan &quot;{deletingPlan?.name}&quot;? Esta
              accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperadminDashboardLayout>
  )
}
