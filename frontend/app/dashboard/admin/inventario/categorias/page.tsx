"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Archive } from "lucide-react"
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
import {
  CategoryStatsCards,
  CategoryCard,
  CategoryFormDialog,
  TopCategoriesCard
} from "@/components/inventory-categories"

const defaultFormData: InventoryCategoryCreate = {
  name: "",
  description: "",
  color: "",
  icon: "",
  is_active: true,
}

export default function InventoryCategoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [categoryProducts, setCategoryProducts] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null)
  const [formData, setFormData] = useState<InventoryCategoryCreate>(defaultFormData)

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
        description: "No se pudieron cargar las categorias",
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
    if (!token) {
      toast({
        title: "Error de autenticacion",
        description: "No se encontro token de autenticacion. Por favor, inicie sesion nuevamente.",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoria es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      const cleanedData: Record<string, any> = {
        name: formData.name.trim(),
        is_active: formData.is_active,
      }
      if (formData.description?.trim()) {
        cleanedData.description = formData.description.trim()
      }
      if (formData.color?.trim()) {
        cleanedData.color = formData.color.trim()
      }
      if (formData.icon?.trim()) {
        cleanedData.icon = formData.icon.trim()
      }

      await createInventoryCategory(token, cleanedData as InventoryCategoryCreate)
      toast({
        title: "Categoria creada",
        description: "La categoria ha sido creada exitosamente",
      })
      setIsCreateDialogOpen(false)
      setFormData(defaultFormData)
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la categoria",
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
        title: "Categoria actualizada",
        description: "La categoria ha sido actualizada exitosamente",
      })
      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la categoria",
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

  const totalProducts = Object.values(categoryProducts).reduce((a, b) => a + b, 0)

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
          <h1 className="text-3xl font-bold">Categorias de Inventario</h1>
          <p className="text-muted-foreground">
            Organiza los productos del inventario en categorias
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoria
        </Button>
      </div>

      <CategoryStatsCards categories={categories} totalProducts={totalProducts} />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
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
                    ? "No se encontraron categorias con los filtros aplicados"
                    : "No hay categorias registradas aun"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={categoryProducts[category.id] || 0}
              onEdit={openEditDialog}
            />
          ))
        )}
      </div>

      {/* Top Categories */}
      {categories.length > 0 && Object.keys(categoryProducts).length > 0 && (
        <TopCategoriesCard categories={categories} categoryProducts={categoryProducts} />
      )}

      {/* Create Dialog */}
      <CategoryFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <CategoryFormDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setSelectedCategory(null)
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleEdit}
        isEdit
      />
    </div>
  )
}
