"use client"

import { useEffect, useState } from "react"
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
import { api, AuditLog, AuditStats, AuditLogListResponse } from "@/lib/api"
import { auth } from "@/lib/auth"
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogIn,
  Building2,
  Users,
  Settings,
  Eye,
  Calendar,
  Filter,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOGIN_SUCCESS: { label: "Login Exitoso", variant: "default" },
  LOGIN_FAILED: { label: "Login Fallido", variant: "destructive" },
  LOGOUT: { label: "Logout", variant: "secondary" },
  PASSWORD_CHANGED: { label: "Cambio de Contraseña", variant: "outline" },
  PASSWORD_RESET_REQUESTED: { label: "Reset Password Solicitado", variant: "outline" },
  USER_CREATED: { label: "Usuario Creado", variant: "default" },
  USER_UPDATED: { label: "Usuario Actualizado", variant: "secondary" },
  USER_DELETED: { label: "Usuario Eliminado", variant: "destructive" },
  USER_ACTIVATED: { label: "Usuario Activado", variant: "default" },
  USER_DEACTIVATED: { label: "Usuario Desactivado", variant: "destructive" },
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  auth: { label: "Autenticación", icon: LogIn },
  user: { label: "Usuarios", icon: Users },
  system: { label: "Sistema", icon: Settings },
  billing: { label: "Facturación", icon: Activity },
}

export default function ActividadPage() {
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [logsData, setLogsData] = useState<AuditLogListResponse | null>(null)
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
      const statsData = await api.getTenantActivityStats(token)
      setStats(statsData)
      await loadLogs()
    } catch (error) {
      console.error("Error loading activity data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const data = await api.getTenantActivityLogs(token, {
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

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es,
    })
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Registro de Actividad
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico de acciones y eventos de la organización
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_logs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Registrados en la organización
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Logins Hoy</CardTitle>
                <LogIn className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.logins_today}</div>
                <p className="text-xs text-muted-foreground">
                  Inicios de sesión exitosos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Intentos Fallidos</CardTitle>
                <LogIn className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.failed_logins_today}</div>
                <p className="text-xs text-muted-foreground">
                  Fallos de autenticación hoy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.actions_by_category || {}).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tipos de actividad
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtra el registro de actividad por diferentes criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="action">Acción</Label>
                <Select value={filterAction || undefined} onValueChange={(value) => setFilterAction(value)}>
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={filterCategory || undefined} onValueChange={(value) => setFilterCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha Fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por email, IP o detalles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
              <Button variant="outline" onClick={() => loadData()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividad</CardTitle>
            <CardDescription>
              {logsData?.total || 0} eventos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logsData && logsData.items.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.items.map((log) => {
                      const actionInfo = ACTION_LABELS[log.action] || {
                        label: log.action,
                        variant: "outline" as const,
                      }
                      const CategoryIcon = CATEGORY_LABELS[log.category]?.icon || Settings

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.user_email || "Sistema"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={actionInfo.variant}>
                              {actionInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {CATEGORY_LABELS[log.category]?.label || log.category}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.ip_address || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {logsData.page} de {logsData.total_pages} ({logsData.total} eventos)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= logsData.total_pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron eventos con los filtros aplicados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Evento</DialogTitle>
            <DialogDescription>
              Información completa sobre esta acción
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Usuario</Label>
                  <p className="font-medium">{selectedLog.user_email || "Sistema"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Acción</Label>
                  <p className="font-medium">
                    {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Categoría</Label>
                  <p className="font-medium">
                    {CATEGORY_LABELS[selectedLog.category]?.label || selectedLog.category}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString("es-ES")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dirección IP</Label>
                  <p className="font-medium">{selectedLog.ip_address || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="font-medium text-sm break-all">
                    {selectedLog.user_agent || "-"}
                  </p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <Label className="text-muted-foreground">Detalles</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                    {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
