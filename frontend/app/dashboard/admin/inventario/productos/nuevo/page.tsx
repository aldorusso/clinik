"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
import { ArrowLeft, Save, Package } from "lucide-react"
import { auth } from "@/lib/auth"
import {
  createInventoryProduct,
  getInventoryCategories,
  type InventoryCategory,
  type InventoryProductCreate,
  UNIT_TYPES
} from "@/lib/api-inventory"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  
  const [formData, setFormData] = useState<InventoryProductCreate>({
    category_id: "",
    name: "",
    description: "",
    sku: "",
    barcode: "",
    unit_type: "piezas",
    unit_size: 1,
    current_stock: 0,
    minimum_stock: 10,
    maximum_stock: undefined,
    cost_per_unit: undefined,
    supplier: "",
    supplier_code: "",
    expiration_date: "",
    last_restock_date: "",
    is_active: true,
    requires_prescription: false,
    is_controlled: false,
  })

  useEffect(() => {
    const loadCategories = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const categoriesData = await getInventoryCategories(token, { is_active: true })
        setCategories(categoriesData)
      } catch (error: any) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        })
      }
    }

    loadCategories()
  }, [toast])

  const handleInputChange = (field: keyof InventoryProductCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const token = auth.getToken()
    if (!token) {
      toast({
        title: "Error",
        description: "No tienes autorización para realizar esta acción",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Validaciones básicas
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!formData.category_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una categoría",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Limpiar datos antes de enviar
      const cleanedData = { ...formData }
      
      // Convertir strings vacíos a undefined para campos opcionales
      if (cleanedData.description === "") cleanedData.description = undefined
      if (cleanedData.sku === "") cleanedData.sku = undefined
      if (cleanedData.barcode === "") cleanedData.barcode = undefined
      if (cleanedData.supplier === "") cleanedData.supplier = undefined
      if (cleanedData.supplier_code === "") cleanedData.supplier_code = undefined
      if (cleanedData.expiration_date === "") cleanedData.expiration_date = undefined
      if (cleanedData.last_restock_date === "") cleanedData.last_restock_date = undefined
      
      // Convertir cost_per_unit a undefined si es 0 o vacío
      if (!cleanedData.cost_per_unit || cleanedData.cost_per_unit <= 0) {
        cleanedData.cost_per_unit = undefined
      }
      
      // Convertir maximum_stock a undefined si es 0 o vacío
      if (!cleanedData.maximum_stock || cleanedData.maximum_stock <= 0) {
        cleanedData.maximum_stock = undefined
      }

      await createInventoryProduct(token, cleanedData)
      
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente",
      })

      router.push("/dashboard/admin/inventario/productos")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el producto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/inventario/productos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">➕ Nuevo Producto</h1>
            <p className="text-muted-foreground">
              Agrega un nuevo producto al inventario médico
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>
                  Datos principales del producto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Gasa estéril 10x10 cm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoría *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Link href="/dashboard/admin/inventario/categorias" className="text-primary hover:underline">
                        Crear una categoría primero
                      </Link>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descripción detallada del producto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">Código SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Ej: GAS-1010-EST"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Código de Barras</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      placeholder="Ej: 1234567890123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unidades y Stock */}
            <Card>
              <CardHeader>
                <CardTitle>Unidades y Stock</CardTitle>
                <CardDescription>
                  Configuración de medidas y cantidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_type">Tipo de Unidad *</Label>
                    <Select value={formData.unit_type} onValueChange={(value) => handleInputChange('unit_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unit_size">Tamaño por Unidad</Label>
                    <Input
                      id="unit_size"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.unit_size}
                      onChange={(e) => handleInputChange('unit_size', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_stock">Stock Actual</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => handleInputChange('current_stock', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minimum_stock">Stock Mínimo *</Label>
                    <Input
                      id="minimum_stock"
                      type="number"
                      min="1"
                      value={formData.minimum_stock}
                      onChange={(e) => handleInputChange('minimum_stock', parseInt(e.target.value) || 10)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maximum_stock">Stock Máximo</Label>
                    <Input
                      id="maximum_stock"
                      type="number"
                      min="1"
                      value={formData.maximum_stock || ""}
                      onChange={(e) => handleInputChange('maximum_stock', parseInt(e.target.value) || undefined)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Costo por Unidad ($)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_unit || ""}
                    onChange={(e) => handleInputChange('cost_per_unit', parseFloat(e.target.value) || undefined)}
                    placeholder="Ej: 15.50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información del Proveedor */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Proveedor</CardTitle>
                <CardDescription>
                  Datos del proveedor y códigos de referencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_code">Código del Proveedor</Label>
                  <Input
                    id="supplier_code"
                    value={formData.supplier_code}
                    onChange={(e) => handleInputChange('supplier_code', e.target.value)}
                    placeholder="Código de referencia del proveedor"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fechas y Control */}
            <Card>
              <CardHeader>
                <CardTitle>Fechas y Control</CardTitle>
                <CardDescription>
                  Fechas importantes y configuraciones de control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiration_date">Fecha de Vencimiento</Label>
                  <Input
                    id="expiration_date"
                    type="datetime-local"
                    value={formData.expiration_date}
                    onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_restock_date">Última Fecha de Restock</Label>
                  <Input
                    id="last_restock_date"
                    type="datetime-local"
                    value={formData.last_restock_date}
                    onChange={(e) => handleInputChange('last_restock_date', e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_prescription"
                      checked={formData.requires_prescription}
                      onCheckedChange={(checked) => handleInputChange('requires_prescription', checked)}
                    />
                    <Label htmlFor="requires_prescription" className="text-sm font-normal">
                      Requiere receta médica
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_controlled"
                      checked={formData.is_controlled}
                      onCheckedChange={(checked) => handleInputChange('is_controlled', checked)}
                    />
                    <Label htmlFor="is_controlled" className="text-sm font-normal">
                      Sustancia controlada
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active" className="text-sm font-normal">
                      Producto activo
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link href="/dashboard/admin/inventario/productos">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Crear Producto
            </Button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  )
}