"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Settings, Stethoscope, AlertTriangle } from "lucide-react"
import { api, Service, ServiceCategory, ServiceCreate, ServiceUpdate, ServiceCategoryCreate, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  ServiceCard,
  ServiceDialog,
  CategoryDialog,
  ServiceDetailsDialog,
  ServicesDashboardCards
} from "@/components/services"

export default function AdminServiciosPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showOnlyActive, setShowOnlyActive] = useState(true)

  // Dialogs
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showServiceDetails, setShowServiceDetails] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [viewingService, setViewingService] = useState<Service | null>(null)

  // Service form state
  const [serviceForm, setServiceForm] = useState<ServiceCreate>({
    name: "",
    description: "",
    category_id: "",
    duration_minutes: 60,
    price_min: 0,
    price_max: 0,
    requires_consultation: true,
    is_active: true,
    preparation_instructions: "",
    contraindications: ""
  })

  // Category form state
  const [categoryForm, setCategoryForm] = useState<ServiceCategoryCreate>({
    name: "",
    description: "",
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      const userData = await api.getCurrentUser(token)
      setCurrentUser(userData)

      if (userData.role !== 'tenant_admin') {
        toast({
          title: "Error",
          description: "No tienes permisos para administrar servicios",
          variant: "destructive",
        })
        return
      }

      const [servicesData, categoriesData] = await Promise.all([
        api.getServices(token),
        api.getServiceCategories(token)
      ])

      setServices(servicesData)
      setCategories(categoriesData)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Error al cargar los servicios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      if (editingService) {
        const updatedService = await api.updateService(token, editingService.id, serviceForm as ServiceUpdate)
        setServices(services.map(s => s.id === editingService.id ? updatedService : s))
        toast({ title: "Éxito", description: "Servicio actualizado correctamente" })
      } else {
        const newService = await api.createService(token, serviceForm)
        setServices([...services, newService])
        toast({ title: "Éxito", description: "Servicio creado correctamente" })
      }
      resetServiceForm()
      setShowServiceDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el servicio",
        variant: "destructive",
      })
    }
  }

  const handleCategorySubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      if (editingCategory) {
        const updatedCategory = await api.updateServiceCategory(token, editingCategory.id, categoryForm)
        setCategories(categories.map(c => c.id === editingCategory.id ? updatedCategory : c))
        toast({ title: "Éxito", description: "Categoría actualizada correctamente" })
      } else {
        const newCategory = await api.createServiceCategory(token, categoryForm)
        setCategories([...categories, newCategory])
        toast({ title: "Éxito", description: "Categoría creada correctamente" })
      }
      resetCategoryForm()
      setShowCategoryDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar la categoría",
        variant: "destructive",
      })
    }
  }

  const handleDeleteService = async (service: Service) => {
    const token = auth.getToken()
    if (!token) return

    if (!confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) return

    try {
      await api.deleteService(token, service.id)
      setServices(services.filter(s => s.id !== service.id))
      toast({ title: "Éxito", description: "Servicio eliminado correctamente" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el servicio",
        variant: "destructive",
      })
    }
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description,
      category_id: service.category_id,
      duration_minutes: service.duration_minutes,
      price_min: service.price_min || 0,
      price_max: service.price_max || 0,
      requires_consultation: service.requires_consultation,
      is_active: service.is_active,
      preparation_instructions: service.preparation_instructions || "",
      contraindications: service.contraindications || ""
    })
    setShowServiceDialog(true)
  }

  const handleViewService = (service: Service) => {
    setViewingService(service)
    setShowServiceDetails(true)
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active
    })
    setShowCategoryDialog(true)
  }

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      description: "",
      category_id: "",
      duration_minutes: 60,
      price_min: 0,
      price_max: 0,
      requires_consultation: true,
      is_active: true,
      preparation_instructions: "",
      contraindications: ""
    })
    setEditingService(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", is_active: true })
    setEditingCategory(null)
  }

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesCategory = selectedCategory === "all" || service.category_id === selectedCategory
    const matchesActive = !showOnlyActive || service.is_active
    return matchesSearch && matchesCategory && matchesActive
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (currentUser?.role !== 'tenant_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo los administradores pueden administrar servicios.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Administración de Servicios
          </h1>
          <p className="text-muted-foreground">
            Gestiona los servicios médicos y categorías de tu clínica
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetCategoryForm}>
                <Settings className="mr-2 h-4 w-4" />
                Categorías
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetServiceForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <ServicesDashboardCards services={services} categories={categories} />

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicios por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id="show-active"
            checked={showOnlyActive}
            onCheckedChange={setShowOnlyActive}
          />
          <Label htmlFor="show-active">Solo activos</Label>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={handleEditService}
            onView={handleViewService}
            onDelete={handleDeleteService}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">
              {searchTerm || selectedCategory !== "all" ? "No se encontraron servicios" : "No hay servicios creados"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || selectedCategory !== "all"
                ? "Intenta con otros filtros de búsqueda."
                : "Comienza creando servicios para tu clínica."
              }
            </p>
            {(!searchTerm && selectedCategory === "all") && (
              <div className="mt-6">
                <Button onClick={() => { resetServiceForm(); setShowServiceDialog(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Servicio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ServiceDialog
        open={showServiceDialog}
        onOpenChange={setShowServiceDialog}
        editingService={editingService}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        categories={categories}
        onSubmit={handleServiceSubmit}
      />

      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        categories={categories}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        onSubmit={handleCategorySubmit}
        onEditCategory={handleEditCategory}
        onReset={resetCategoryForm}
      />

      <ServiceDetailsDialog
        open={showServiceDetails}
        onOpenChange={setShowServiceDetails}
        service={viewingService}
        onEdit={handleEditService}
      />
    </div>
  )
}
