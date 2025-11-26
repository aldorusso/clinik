"use client"

import { useEffect, useState } from "react"
import { SuperadminDashboardLayout } from "@/components/dashboard/superadmin-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, AuditLog, AuditStats, AuditLogListResponse } from "@/lib/api"
import { auth } from "@/lib/auth"
import {
  Shield,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogIn,
  AlertTriangle,
  Building2,
  Users,
  Settings,
  Eye,
  Calendar,
  Filter,
} from "lucide-react"

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOGIN_SUCCESS: { label: "Login Exitoso", variant: "default" },
  LOGIN_FAILED: { label: "Login Fallido", variant: "destructive" },
  LOGOUT: { label: "Logout", variant: "secondary" },
  PASSWORD_CHANGED: { label: "Cambio de Contraseña", variant: "outline" },
  PASSWORD_RESET_REQUESTED: { label: "Reset Password Solicitado", variant: "outline" },
  TENANT_CREATED: { label: "Tenant Creado", variant: "default" },
  TENANT_UPDATED: { label: "Tenant Actualizado", variant: "secondary" },
  TENANT_DELETED: { label: "Tenant Eliminado", variant: "destructive" },
  TENANT_SUSPENDED: { label: "Tenant Suspendido", variant: "destructive" },
  TENANT_ACTIVATED: { label: "Tenant Activado", variant: "default" },
  USER_CREATED: { label: "Usuario Creado", variant: "default" },
  USER_UPDATED: { label: "Usuario Actualizado", variant: "secondary" },
  USER_DELETED: { label: "Usuario Eliminado", variant: "destructive" },
  USER_ACTIVATED: { label: "Usuario Activado", variant: "default" },
  USER_DEACTIVATED: { label: "Usuario Desactivado", variant: "destructive" },
  PLAN_CHANGED: { label: "Plan Cambiado", variant: "outline" },
  SYSTEM_CONFIG_CHANGED: { label: "Config. Sistema Cambiada", variant: "outline" },
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  auth: { label: "Autenticación", icon: LogIn },
  tenant: { label: "Organizaciones", icon: Building2 },
  user: { label: "Usuarios", icon: Users },
  system: { label: "Sistema", icon: Settings },
  billing: { label: "Facturación", icon: Activity },
}

export default function AuditoriaPage() {
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [logsData, setLogsData] = useState<AuditLogListResponse | null>(null)
  const [actions, setActions] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Filters
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [filterAction, setFilterAction] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      const [statsData, actionsData, categoriesData] = await Promise.all([
        api.getAuditStats(token),
        api.getAuditActions(token),
        api.getAuditCategories(token),
      ])

      setStats(statsData)
      setActions(actionsData)
      setCategories(categoriesData)

      await loadLogs()
    } catch (error) {
      console.error("Error loading audit data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const data = await api.getAuditLogs(token, {
        page,
        page_size: pageSize,
        action: filterAction || undefined,
        category: filterCategory || undefined,
        search: searchQuery || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      setLogsData(data)
    } catch (error) {
      console.error("Error loading logs:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [page, filterAction, filterCategory])

  const handleSearch = () => {
    setPage(1)
    loadLogs()
  }

  const clearFilters = () => {
    setFilterAction("")
    setFilterCategory("")
    setSearchQuery("")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const parseDetails = (details?: string): Record<string, unknown> | null => {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <SuperadminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SuperadminDashboardLayout>
    )
  }

  return (
    <SuperadminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
            <p className="text-muted-foreground">
              Monitorea la actividad del sistema y eventos de seguridad
            </p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_logs.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Registros totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logins Hoy</CardTitle>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.logins_today || 0}</div>
              <p className="text-xs text-muted-foreground">Accesos exitosos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logins Fallidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.failed_logins_today || 0}</div>
              <p className="text-xs text-muted-foreground">Intentos fallidos hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Categoria</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats?.actions_by_category && Object.entries(stats.actions_by_category).slice(0, 3).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{CATEGORY_LABELS[cat]?.label || cat}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Todos los Logs</TabsTrigger>
            <TabsTrigger value="critical">Acciones Criticas</TabsTrigger>
          </TabsList>

          {/* All Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Email, IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accion</Label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {actions.map((action) => (
                          <SelectItem key={action} value={action}>
                            {ACTION_LABELS[action]?.label || action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]?.label || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registros de Actividad</CardTitle>
                <CardDescription>
                  {logsData?.total || 0} registros encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead className="text-right">Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData?.items.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {log.user_email || "Sistema"}
                            </span>
                            {log.tenant_id && (
                              <span className="text-xs text-muted-foreground">
                                Tenant: {log.tenant_id.slice(0, 8)}...
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ACTION_LABELS[log.action]?.variant || "secondary"}>
                            {ACTION_LABELS[log.action]?.label || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {CATEGORY_LABELS[log.category] && (
                              <>
                                {(() => {
                                  const Icon = CATEGORY_LABELS[log.category].icon
                                  return <Icon className="h-3 w-3" />
                                })()}
                              </>
                            )}
                            <span className="text-sm">
                              {CATEGORY_LABELS[log.category]?.label || log.category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!logsData?.items || logsData.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {logsData && logsData.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Pagina {logsData.page} de {logsData.total_pages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= logsData.total_pages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Critical Actions Tab */}
          <TabsContent value="critical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Acciones Criticas Recientes
                </CardTitle>
                <CardDescription>
                  Ultimas acciones que requieren atencion especial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.recent_critical_actions.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">
                            {log.user_email || "Sistema"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ACTION_LABELS[log.action]?.variant || "destructive"}>
                            {ACTION_LABELS[log.action]?.label || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.entity_type && (
                            <span className="text-sm">
                              {log.entity_type}: {log.entity_id?.slice(0, 8)}...
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.recent_critical_actions || stats.recent_critical_actions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay acciones criticas recientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Log Details Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Registro</DialogTitle>
              <DialogDescription>
                Informacion completa del evento de auditoria
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha/Hora</Label>
                    <p className="font-mono">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Accion</Label>
                    <p>
                      <Badge variant={ACTION_LABELS[selectedLog.action]?.variant || "secondary"}>
                        {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Usuario</Label>
                    <p>{selectedLog.user_email || "Sistema"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Categoria</Label>
                    <p>{CATEGORY_LABELS[selectedLog.category]?.label || selectedLog.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">IP</Label>
                    <p className="font-mono">{selectedLog.ip_address || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tenant ID</Label>
                    <p className="font-mono text-sm">{selectedLog.tenant_id || "Global"}</p>
                  </div>
                  {selectedLog.entity_type && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Tipo de Entidad</Label>
                        <p>{selectedLog.entity_type}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">ID de Entidad</Label>
                        <p className="font-mono text-sm">{selectedLog.entity_id}</p>
                      </div>
                    </>
                  )}
                </div>

                {selectedLog.user_agent && (
                  <div>
                    <Label className="text-muted-foreground">User Agent</Label>
                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <Label className="text-muted-foreground">Detalles Adicionales</Label>
                    <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperadminDashboardLayout>
  )
}
