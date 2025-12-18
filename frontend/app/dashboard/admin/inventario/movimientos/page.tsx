"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Package,
  Calendar,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import { auth } from "@/lib/auth"
import {
  getInventoryMovements,
  getInventoryProducts,
  type InventoryMovement,
  type InventoryProductWithStats,
  MOVEMENT_TYPES
} from "@/lib/api-inventory"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// Tipos de movimientos de entrada
const ENTRY_MOVEMENT_TYPES = ['compra', 'donacion', 'devolucion', 'ajuste_entrada']

export default function InventoryMovementsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [products, setProducts] = useState<InventoryProductWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    setLoading(true)
    try {
      // Construir parámetros de filtro
      const params: {
        product_id?: string
        movement_type?: string
        start_date?: string
        end_date?: string
        limit?: number
      } = { limit: 100 }

      if (selectedProduct && selectedProduct !== "all") {
        params.product_id = selectedProduct
      }
      if (selectedType && selectedType !== "all") {
        params.movement_type = selectedType
      }
      if (startDate) {
        params.start_date = startDate
      }
      if (endDate) {
        params.end_date = endDate
      }

      const [movementsData, productsData] = await Promise.all([
        getInventoryMovements(token, params),
        getInventoryProducts(token, { limit: 500 })
      ])

      setMovements(movementsData)
      setProducts(productsData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los movimientos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedProduct, selectedType, startDate, endDate])

  // Filtrar por búsqueda local (producto)
  const filteredMovements = movements.filter(movement => {
    if (!searchTerm) return true
    const productName = movement.product?.name?.toLowerCase() || ""
    const notes = movement.notes?.toLowerCase() || ""
    const reference = movement.reference_number?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()

    return productName.includes(search) || notes.includes(search) || reference.includes(search)
  })

  const isEntryMovement = (type: string) => ENTRY_MOVEMENT_TYPES.includes(type)

  const getMovementTypeBadge = (type: string) => {
    const isEntry = isEntryMovement(type)
    const label = MOVEMENT_TYPES[type as keyof typeof MOVEMENT_TYPES] || type

    return (
      <Badge
        variant={isEntry ? "default" : "destructive"}
        className={isEntry ? "bg-green-100 text-green-800" : ""}
      >
        {isEntry ? (
          <ArrowDownCircle className="mr-1 h-3 w-3" />
        ) : (
          <ArrowUpCircle className="mr-1 h-3 w-3" />
        )}
        {label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedProduct("all")
    setSelectedType("all")
    setStartDate("")
    setEndDate("")
  }

  // Calcular totales
  const totals = filteredMovements.reduce((acc, mov) => {
    const isEntry = isEntryMovement(mov.movement_type)
    if (isEntry) {
      acc.entries += Math.abs(mov.quantity)
      acc.entryCost += mov.total_cost || 0
    } else {
      acc.exits += Math.abs(mov.quantity)
      acc.exitCost += mov.total_cost || 0
    }
    return acc
  }, { entries: 0, exits: 0, entryCost: 0, exitCost: 0 })

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
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/admin/inventario">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Historial de Movimientos</h1>
          <p className="text-muted-foreground">
            Registro completo de entradas y salidas del inventario
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">+{totals.entries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Salidas</p>
                <p className="text-2xl font-bold text-red-600">-{totals.exits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Movimientos</p>
                <p className="text-2xl font-bold">{filteredMovements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Costo Total Entradas</p>
                <p className="text-2xl font-bold">${totals.entryCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto, referencia, notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Product Filter */}
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Todos los productos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Movement Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(MOVEMENT_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px]"
                placeholder="Desde"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px]"
                placeholder="Hasta"
              />
            </div>

            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Package className="h-8 w-8 mb-2" />
              <p>No se encontraron movimientos con los filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement) => {
                const isEntry = isEntryMovement(movement.movement_type)

                return (
                  <div
                    key={movement.id}
                    className={`p-4 rounded-lg border ${
                      isEntry ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">
                            {movement.product?.name || 'Producto desconocido'}
                          </span>
                          {getMovementTypeBadge(movement.movement_type)}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {formatDate(movement.created_at)}
                          </span>

                          {movement.reference_number && (
                            <span>Ref: {movement.reference_number}</span>
                          )}

                          {movement.supplier && (
                            <span>Proveedor: {movement.supplier}</span>
                          )}
                        </div>

                        {movement.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {movement.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${
                          isEntry ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isEntry ? '+' : '-'}{Math.abs(movement.quantity)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Stock después: {movement.stock_after}
                        </div>
                        {movement.unit_cost && (
                          <div className="text-xs text-muted-foreground">
                            ${movement.unit_cost.toFixed(2)} c/u
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
