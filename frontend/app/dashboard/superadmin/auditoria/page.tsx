"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, AuditLog, AuditStats, AuditLogListResponse } from "@/lib/api"
import { auth } from "@/lib/auth"
import { RefreshCw } from "lucide-react"
import {
  AuditStatsCards,
  AuditFilters,
  AuditLogsTable,
  CriticalActionsTable,
  LogDetailsDialog,
} from "@/components/audit"

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
      <AuditStatsCards stats={stats} />

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Todos los Logs</TabsTrigger>
          <TabsTrigger value="critical">Acciones Criticas</TabsTrigger>
        </TabsList>

        {/* All Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <AuditFilters
            actions={actions}
            categories={categories}
            filterAction={filterAction}
            setFilterAction={setFilterAction}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onSearch={handleSearch}
            onClear={clearFilters}
          />

          <AuditLogsTable
            logsData={logsData}
            page={page}
            setPage={setPage}
            onViewDetails={setSelectedLog}
          />
        </TabsContent>

        {/* Critical Actions Tab */}
        <TabsContent value="critical" className="space-y-4">
          <CriticalActionsTable actions={stats?.recent_critical_actions || []} />
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <LogDetailsDialog
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  )
}
