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
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
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
  type InventoryCategory,
  type InventoryCategoryCreate
} from "@/lib/api-inventory"
import { useToast } from "@/hooks/use-toast"

export default function InventoryCategoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
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
      const data = await getInventoryCategories(token)
      setCategories(data)
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
    { name: "Medicamento", value: "pill" },
    { name: "Jeringa", value: "syringe" },
    { name: "Venda", value: "bandage" },
    { name: "Corazón", value: "heart" },
    { name: "Estetoscopio", value: "stethoscope" },
    { name: "Termómetro", value: "thermometer" },
    { name: "Microscopio", value: "microscope" },
    { name: "Tubo", value: "test-tube" },
  ]

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
            <h1 className="text-3xl font-bold">📂 Categorías de Inventario</h1>
            <p className="text-muted-foreground">
              Organiza los productos del inventario en categorías
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
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
                      {category.color && (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + "20", color: category.color }}
                        >
                          {category.icon ? (
                            <span className="text-lg">
                              {category.icon === "pill" && "💊"}
                              {category.icon === "syringe" && "💉"}
                              {category.icon === "bandage" && "🩹"}
                              {category.icon === "heart" && "❤️"}
                              {category.icon === "stethoscope" && "🩺"}
                              {category.icon === "thermometer" && "🌡️"}
                              {category.icon === "microscope" && "🔬"}
                              {category.icon === "test-tube" && "🧪"}
                              {!["pill", "syringe", "bandage", "heart", "stethoscope", "thermometer", "microscope", "test-tube"].includes(category.icon) && <Package className="h-5 w-5" />}
                            </span>
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <Badge variant={category.is_active ? "default" : "secondary"} className="mt-1">
                          {category.is_active ? "Activa" : "Inactiva"}
                        </Badge>
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
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`w-8 h-8 rounded-md border-2 ${
                        formData.color === preset.value ? 'border-foreground' : 'border-transparent'
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
                <div className="flex flex-wrap gap-2">
                  {iconPresets.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={formData.icon === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, icon: preset.value }))}
                    >
                      {preset.value === "pill" && "💊"}
                      {preset.value === "syringe" && "💉"}
                      {preset.value === "bandage" && "🩹"}
                      {preset.value === "heart" && "❤️"}
                      {preset.value === "stethoscope" && "🩺"}
                      {preset.value === "thermometer" && "🌡️"}
                      {preset.value === "microscope" && "🔬"}
                      {preset.value === "test-tube" && "🧪"}
                    </Button>
                  ))}
                </div>
              </div>
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
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`w-8 h-8 rounded-md border-2 ${
                        formData.color === preset.value ? 'border-foreground' : 'border-transparent'
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
                <div className="flex flex-wrap gap-2">
                  {iconPresets.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={formData.icon === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, icon: preset.value }))}
                    >
                      {preset.value === "pill" && "💊"}
                      {preset.value === "syringe" && "💉"}
                      {preset.value === "bandage" && "🩹"}
                      {preset.value === "heart" && "❤️"}
                      {preset.value === "stethoscope" && "🩺"}
                      {preset.value === "thermometer" && "🌡️"}
                      {preset.value === "microscope" && "🔬"}
                      {preset.value === "test-tube" && "🧪"}
                    </Button>
                  ))}
                </div>
              </div>

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
    </AdminDashboardLayout>
  )
}