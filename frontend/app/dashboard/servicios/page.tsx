"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Stethoscope, Plus, Package } from "lucide-react"
import { api, Service, ServiceCategory, ServiceCreate, ServiceUpdate, ServiceCategoryCreate } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import {
  ServiceCardReadOnly,
  ServiceDialog,
  CategoryDialog,
  ServicesStatsCards,
  ServicesFilters,
  ServicesEmptyState
} from "@/components/services"

const defaultServiceForm: ServiceCreate = {
  category_id: "",
  name: "",
  short_description: "",
  description: "",
  price_min: 0,
  price_max: 0,
  duration_minutes: 60,
  requires_consultation: true,
  is_active: true,
  is_featured: false,
  is_online_bookable: true,
  display_order: 0
}

const defaultCategoryForm: ServiceCategoryCreate = {
  name: "",
  description: "",
  icon: "",
  color: "#2563eb",
  display_order: 0
}

export default function ServiciosPage() {
  const { toast } = useToast()
  const { user: currentUser } = useUser()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showOnlyActive, setShowOnlyActive] = useState(true)

  // Dialogs
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)

  // Form state
  const [serviceForm, setServiceForm] = useState<ServiceCreate>(defaultServiceForm)
  const [categoryForm, setCategoryForm] = useState<ServiceCategoryCreate>(defaultCategoryForm)

  // Check if user can edit services (only tenant_admin)
  const canEditServices = currentUser?.role === 'tenant_admin'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      const [categoriesData, servicesData] = await Promise.all([
        api.getServiceCategories(token, true),
        api.getServices(token, { active_only: showOnlyActive })
      ])
      setCategories(categoriesData)
      setServices(servicesData)
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
    if (!token || !canEditServices) return

    try {
      if (editingService) {
        const updatedService = await api.updateService(token, editingService.id, serviceForm as ServiceUpdate)
        setServices(services.map(s => s.id === editingService.id ? updatedService : s))
        toast({ title: "Exito", description: "Servicio actualizado correctamente" })
      } else {
        const newService = await api.createService(token, serviceForm)
        setServices([...services, newService])
        toast({ title: "Exito", description: "Servicio creado correctamente" })
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
    if (!token || !canEditServices) return

    try {
      if (editingCategory) {
        const updatedCategory = await api.updateServiceCategory(token, editingCategory.id, categoryForm)
        setCategories(categories.map(c => c.id === editingCategory.id ? updatedCategory : c))
        toast({ title: "Exito", description: "Categoria actualizada correctamente" })
      } else {
        const newCategory = await api.createServiceCategory(token, categoryForm)
        setCategories([...categories, newCategory])
        toast({ title: "Exito", description: "Categoria creada correctamente" })
      }
      resetCategoryForm()
      setShowCategoryDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar la categoria",
        variant: "destructive",
      })
    }
  }

  const resetServiceForm = () => {
    setServiceForm(defaultServiceForm)
    setEditingService(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm(defaultCategoryForm)
    setEditingCategory(null)
  }

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="h-8 w-8" />
            Servicios
          </h1>
          <p className="text-muted-foreground">
            {canEditServices
              ? "Gestiona los servicios disponibles en la clinica"
              : "Consulta los servicios disponibles en la clinica"
            }
          </p>
        </div>

        {canEditServices && (
          <div className="flex gap-2">
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetCategoryForm}>
                  <Package className="mr-2 h-4 w-4" />
                  Nueva Categoria
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
        )}
      </div>

      <ServicesStatsCards services={services} categories={categories} />

      <ServicesFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showOnlyActive={showOnlyActive}
        setShowOnlyActive={setShowOnlyActive}
        categories={categories}
      />

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <ServiceCardReadOnly key={service.id} service={service} />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <ServicesEmptyState
          searchTerm={searchTerm}
          canCreate={canEditServices}
          onCreate={() => { resetServiceForm(); setShowServiceDialog(true) }}
        />
      )}

      {/* Service Dialog */}
      <ServiceDialog
        open={showServiceDialog}
        onOpenChange={setShowServiceDialog}
        editingService={editingService}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        categories={categories}
        onSubmit={handleServiceSubmit}
      />

      {/* Category Dialog */}
      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        categories={categories}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        onSubmit={handleCategorySubmit}
        onEditCategory={(category) => {
          setEditingCategory(category)
          setCategoryForm({
            name: category.name,
            description: category.description || "",
            icon: category.icon || "",
            color: category.color || "#2563eb",
            display_order: category.display_order,
            is_active: category.is_active
          })
        }}
        onReset={resetCategoryForm}
      />
    </div>
  )
}
