"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Package, 
  Plus,
  Edit,
  Archive,
  Search
} from "lucide-react"
import { auth } from "@/lib/auth"
import { 
  getInventoryCategories,
  createInventoryCategory,
  updateInventoryCategory,
  getInventoryProducts,
  type InventoryCategory,
  type InventoryCategoryCreate,
  type InventoryProductWithStats
} from "@/lib/api-inventory"
import { useToast } from "@/hooks/use-toast"

export default function InventoryCategoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [categoryProducts, setCategoryProducts] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null)
  
  const [formData, setFormData] = useState<InventoryCategoryCreate>({
    name: "",
    description: "",
    color: "",
    icon: "",
    is_active: true,
  })

  const loadCategories = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const [categoriesData, productsData] = await Promise.all([
        getInventoryCategories(token),
        getInventoryProducts(token, { is_active: true })
      ])
      
      setCategories(categoriesData)
      
      // Count products per category
      const productCounts: Record<string, number> = {}
      productsData.forEach((product: InventoryProductWithStats) => {
        if (product.category_id) {
          productCounts[product.category_id] = (productCounts[product.category_id] || 0) + 1
        }
      })
      setCategoryProducts(productCounts)
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async () => {
    const token = auth.getToken()
    if (!token) return

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      await createInventoryCategory(token, formData)
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente",
      })
      setIsCreateDialogOpen(false)
      setFormData({
        name: "",
        description: "",
        color: "",
        icon: "",
        is_active: true,
      })
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la categoría",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    const token = auth.getToken()
    if (!token || !selectedCategory) return

    try {
      await updateInventoryCategory(token, selectedCategory.id, formData)
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente",
      })
      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la categoría",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (category: InventoryCategory) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "",
      icon: category.icon || "",
      is_active: category.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const colorPresets = [
    { name: "Rojo", value: "#ef4444" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#10b981" },
    { name: "Amarillo", value: "#f59e0b" },
    { name: "Púrpura", value: "#8b5cf6" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Índigo", value: "#6366f1" },
    { name: "Gris", value: "#6b7280" },
  ]

  const iconPresets = [
    { name: "Medicamento", value: "pill", emoji: "💊" },
    { name: "Jeringa", value: "syringe", emoji: "💉" },
    { name: "Venda", value: "bandage", emoji: "🩹" },
    { name: "Corazón", value: "heart", emoji: "❤️" },
    { name: "Estetoscopio", value: "stethoscope", emoji: "🩺" },
    { name: "Termómetro", value: "thermometer", emoji: "🌡️" },
    { name: "Microscopio", value: "microscope", emoji: "🔬" },
    { name: "Tubo", value: "test-tube", emoji: "🧪" },
    { name: "Cápsula", value: "capsule", emoji: "💊" },
    { name: "Máscara", value: "mask", emoji: "😷" },
    { name: "Guantes", value: "gloves", emoji: "🧤" },
    { name: "Tijeras", value: "scissors", emoji: "✂️" },
  ]

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
            <h1 className="text-3xl font-bold">Categorías de Inventario</h1>
            <p className="text-muted-foreground">
              Organiza los productos del inventario en categorías
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Categorías</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Activas: {categories.filter(c => c.is_active).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  Inactivas: {categories.filter(c => !c.is_active).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <p className="text-2xl font-bold">{Object.values(categoryProducts).reduce((a, b) => a + b, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <Archive className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron categorías con los filtros aplicados"
                      : "No hay categorías registradas aún"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: category.color ? category.color + "20" : "#f1f5f9", 
                          color: category.color || "#64748b" 
                        }}
                      >
                        {category.icon ? (
                          <span className="text-xl">
                            {iconPresets.find(icon => icon.value === category.icon)?.emoji || "📦"}
                          </span>
                        ) : (
                          <Package className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {categoryProducts[category.id] || 0} productos
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Top Categories by Product Count */}
        {categories.length > 0 && Object.keys(categoryProducts).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Categorías Más Utilizadas
              </CardTitle>
              <CardDescription>
                Categorías con mayor número de productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories
                  .filter(cat => cat.is_active)
                  .sort((a, b) => (categoryProducts[b.id] || 0) - (categoryProducts[a.id] || 0))
                  .slice(0, 5)
                  .map((category, index) => {
                    const productCount = categoryProducts[category.id] || 0
                    if (productCount === 0) return null
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ 
                              backgroundColor: category.color ? category.color + "20" : "#f1f5f9", 
                              color: category.color || "#64748b" 
                            }}
                          >
                            {category.icon ? (
                              <span className="text-sm">
                                {iconPresets.find(icon => icon.value === category.icon)?.emoji || "📦"}
                              </span>
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge>
                          {productCount} producto{productCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )
                  })
                  .filter(Boolean)}
                
                {categories.filter(cat => cat.is_active && (categoryProducts[cat.id] || 0) > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay categorías con productos asignados aún
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
              <DialogDescription>
                Crea una nueva categoría para organizar los productos del inventario
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nombre *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Medicamentos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Descripción</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la categoría"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                          formData.color === preset.value ? 'border-foreground shadow-lg scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icono</Label>
                  <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                    {iconPresets.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={formData.icon === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, icon: preset.value }))}
                        className="h-12 flex flex-col gap-0 p-1"
                        title={preset.name}
                      >
                        <span className="text-lg">{preset.emoji}</span>
                        <span className="text-[10px] leading-none truncate">{preset.name.slice(0, 6)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {(formData.color || formData.icon) && (
                <div className="space-y-2">
                  <Label>Vista Previa</Label>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: formData.color ? formData.color + "20" : "#f1f5f9", 
                        color: formData.color || "#64748b" 
                      }}
                    >
                      {formData.icon ? (
                        <span className="text-xl">
                          {iconPresets.find(icon => icon.value === formData.icon)?.emoji || "📦"}
                        </span>
                      ) : (
                        <Package className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{formData.name || "Nombre de la categoría"}</p>
                      {formData.description && (
                        <p className="text-sm text-muted-foreground">{formData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>
                Crear Categoría
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
              <DialogDescription>
                Modifica los datos de la categoría
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Medicamentos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la categoría"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                          formData.color === preset.value ? 'border-foreground shadow-lg scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Icono</Label>
                  <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                    {iconPresets.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={formData.icon === preset.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, icon: preset.value }))}
                        className="h-12 flex flex-col gap-0 p-1"
                        title={preset.name}
                      >
                        <span className="text-lg">{preset.emoji}</span>
                        <span className="text-[10px] leading-none truncate">{preset.name.slice(0, 6)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {(formData.color || formData.icon) && (
                <div className="space-y-2">
                  <Label>Vista Previa</Label>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: formData.color ? formData.color + "20" : "#f1f5f9", 
                        color: formData.color || "#64748b" 
                      }}
                    >
                      {formData.icon ? (
                        <span className="text-xl">
                          {iconPresets.find(icon => icon.value === formData.icon)?.emoji || "📦"}
                        </span>
                      ) : (
                        <Package className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{formData.name || "Nombre de la categoría"}</p>
                      {formData.description && (
                        <p className="text-sm text-muted-foreground">{formData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-active" className="text-sm font-normal">
                  Categoría activa
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedCategory(null)
              }}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}