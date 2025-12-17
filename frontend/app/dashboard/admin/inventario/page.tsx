"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Archive, 
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  Activity
} from "lucide-react"
import { auth } from "@/lib/auth"
import { 
  getInventoryStats, 
  getLowStockAlerts, 
  type InventoryStats,
  type LowStockAlert 
} from "@/lib/api-inventory"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function InventoryDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const [statsData, alertsData] = await Promise.all([
          getInventoryStats(token),
          getLowStockAlerts(token)
        ])
        
        setStats(statsData)
        setLowStockAlerts(alertsData)
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del inventario",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

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
            <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
            <p className="text-muted-foreground">
              Administra productos, stock y alertas del inventario médico
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Link href="/dashboard/admin/inventario/productos/nuevo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_categories || 0} categorías activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.products_low_stock || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos con stock mínimo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats?.products_out_of_stock || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos agotados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats?.total_inventory_value.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(stats?.products_expired || 0) > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Productos Vencidos
              </CardTitle>
              <CardDescription className="text-red-600">
                {stats?.products_expired} productos han vencido y necesitan ser retirados
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {(stats?.products_expiring_soon || 0) > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Próximos a Vencer
              </CardTitle>
              <CardDescription className="text-orange-600">
                {stats?.products_expiring_soon} productos vencen en los próximos 7 días
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                Alertas de Stock Bajo
              </CardTitle>
              <CardDescription>
                Productos que requieren reabastecimiento urgente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay productos con stock bajo
                  </p>
                ) : (
                  lowStockAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{alert.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.category_name} • {alert.current_stock} {alert.unit_type} disponibles
                        </p>
                        {alert.days_of_supply !== null && (
                          <p className="text-xs text-orange-600">
                            ~{alert.days_of_supply} días de suministro
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        Mín: {alert.minimum_stock}
                      </Badge>
                    </div>
                  ))
                )}
                
                {lowStockAlerts.length > 5 && (
                  <div className="text-center">
                    <Link href="/dashboard/admin/inventario/alertas">
                      <Button variant="ghost" size="sm">
                        Ver todas las alertas ({lowStockAlerts.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-blue-500" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Últimos movimientos de inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!stats?.recent_movements || stats.recent_movements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay movimientos recientes
                  </p>
                ) : (
                  stats.recent_movements.slice(0, 5).map((movement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{movement.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.movement_type} • {movement.notes || 'Sin notas'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge variant={movement.quantity > 0 ? "default" : "destructive"}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/admin/inventario/productos">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Productos
                </CardTitle>
                <CardDescription>
                  Gestionar catálogo de productos y stock
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/inventario/categorias">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Archive className="mr-2 h-5 w-5" />
                  Categorías
                </CardTitle>
                <CardDescription>
                  Organizar productos por categorías
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/admin/inventario/movimientos">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Movimientos
                </CardTitle>
                <CardDescription>
                  Historial de entradas y salidas
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Most Used Products */}
        {stats?.most_used_products && stats.most_used_products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Utilizados (30 días)</CardTitle>
              <CardDescription>
                Productos con mayor consumo en el último mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.most_used_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <Badge>{product.total_used} unidades</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Management Link */}
        <Card className="border-dashed bg-muted/50 hover:bg-muted/70 transition-colors">
          <CardContent className="p-6">
            <Link href="/dashboard/admin/inventario/categorias" className="block">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Gestionar Categorías del Inventario
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Crea y personaliza categorías para organizar mejor tus productos médicos
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Categoría
                </Button>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
  )
}