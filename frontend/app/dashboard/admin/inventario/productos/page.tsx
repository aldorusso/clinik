"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
import { 
  Package, 
  Search, 
  Filter,
  Plus,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react"
import { auth } from "@/lib/auth"
import { 
  getInventoryProducts, 
  getInventoryCategories,
  type InventoryProductWithStats,
  type InventoryCategory,
  UNIT_TYPES 
} from "@/lib/api-inventory"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function InventoryProductsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<InventoryProductWithStats[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [stockFilter, setStockFilter] = useState<string>("")

  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const [productsData, categoriesData] = await Promise.all([
          getInventoryProducts(token),
          getInventoryCategories(token, { is_active: true })
        ])
        
        setProducts(productsData)
        setCategories(categoriesData)
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    
    const matchesStockFilter = 
      !stockFilter ||
      (stockFilter === "low" && product.is_low_stock) ||
      (stockFilter === "out" && product.current_stock === 0) ||
      (stockFilter === "ok" && !product.is_low_stock && product.current_stock > 0)
    
    return matchesSearch && matchesCategory && matchesStockFilter
  })

  const getStockBadge = (product: InventoryProductWithStats) => {
    if (product.current_stock === 0) {
      return <Badge variant="destructive">Sin Stock</Badge>
    }
    if (product.is_low_stock) {
      return <Badge variant="outline" className="text-orange-600 border-orange-300">Stock Bajo</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Stock OK</Badge>
  }

  const getExpiryStatus = (product: InventoryProductWithStats) => {
    if (!product.days_until_expiry) return null
    
    if (product.days_until_expiry <= 0) {
      return <Badge variant="destructive" className="ml-2">Vencido</Badge>
    }
    if (product.days_until_expiry <= 7) {
      return <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">Vence Pronto</Badge>
    }
    return null
  }

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold">📦 Productos del Inventario</h1>
            <p className="text-muted-foreground">
              Gestiona el catálogo de productos médicos y su stock
            </p>
          </div>
          <Link href="/dashboard/admin/inventario/productos/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </Link>
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
                  placeholder="Buscar por nombre, SKU, código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Filter */}
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado del stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ok">Stock OK</SelectItem>
                  <SelectItem value="low">Stock Bajo</SelectItem>
                  <SelectItem value="out">Sin Stock</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm("")
                setSelectedCategory("")
                setStockFilter("")
              }}>
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid gap-4">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCategory || stockFilter
                      ? "No se encontraron productos con los filtros aplicados"
                      : "No hay productos registrados aún"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Product Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {getStockBadge(product)}
                        {getExpiryStatus(product)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Categoría: {product.category?.name || "Sin categoría"}</span>
                        {product.sku && <span>SKU: {product.sku}</span>}
                        <span>
                          Unidad: {UNIT_TYPES.find(type => type.value === product.unit_type)?.label || product.unit_type}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Stock Actual:</span>
                          <Badge variant="outline" className={
                            product.current_stock === 0 ? "text-red-600 border-red-300" :
                            product.is_low_stock ? "text-orange-600 border-orange-300" :
                            "text-green-600 border-green-300"
                          }>
                            {product.current_stock} {product.unit_type}
                          </Badge>
                        </div>
                        
                        <div className="text-muted-foreground">
                          Mín: {product.minimum_stock} {product.unit_type}
                        </div>
                        
                        {product.cost_per_unit && (
                          <div className="text-muted-foreground">
                            Costo: ${product.cost_per_unit.toFixed(2)}
                          </div>
                        )}

                        {product.total_used_this_month > 0 && (
                          <div className="text-muted-foreground">
                            Usado este mes: {product.total_used_this_month}
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {product.supplier && (
                          <span>Proveedor: {product.supplier}</span>
                        )}
                        
                        {product.expiration_date && (
                          <span>
                            Vence: {new Date(product.expiration_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                        
                        {product.requires_prescription && (
                          <Badge variant="outline" className="text-xs">
                            Requiere Receta
                          </Badge>
                        )}
                        
                        {product.is_controlled && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                            Controlado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/dashboard/admin/inventario/productos/${product.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Link href={`/dashboard/admin/inventario/productos/${product.id}/editar`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredProducts.length} de {products.length} productos
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {filteredProducts.filter(p => !p.is_low_stock && p.current_stock > 0).length} con stock OK
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  {filteredProducts.filter(p => p.is_low_stock).length} con stock bajo
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-red-500" />
                  {filteredProducts.filter(p => p.current_stock === 0).length} sin stock
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}