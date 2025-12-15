"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Settings,
  Eye,
  Stethoscope,
  Package,
  Star
} from "lucide-react"
import { api, Service, ServiceCategory, ServiceCreate, ServiceUpdate, ServiceCategoryCreate, User, UserRole } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function ServiciosPage() {
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
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)

  // Service form state
  const [serviceForm, setServiceForm] = useState<ServiceCreate>({
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
  })

  // Category form state
  const [categoryForm, setCategoryForm] = useState<ServiceCategoryCreate>({
    name: "",
    description: "",
    icon: "",
    color: "#2563eb",
    display_order: 0
  })

  // Check if user can edit services (only tenant_admin)
  const canEditServices = currentUser?.role === 'tenant_admin'

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      
      // Get current user
      const userData = await api.getCurrentUser(token)
      setCurrentUser(userData)

      // Load categories and services in parallel
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

  // Handle service creation/update
  const handleServiceSubmit = async () => {
    const token = auth.getToken()
    if (!token || !canEditServices) return

    try {
      if (editingService) {
        // Update existing service
        const updatedService = await api.updateService(token, editingService.id, serviceForm as ServiceUpdate)
        setServices(services.map(s => s.id === editingService.id ? updatedService : s))
        toast({
          title: "Éxito",
          description: "Servicio actualizado correctamente",
        })
      } else {
        // Create new service
        const newService = await api.createService(token, serviceForm)
        setServices([...services, newService])
        toast({
          title: "Éxito",
          description: "Servicio creado correctamente",
        })
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

  // Handle category creation/update
  const handleCategorySubmit = async () => {
    const token = auth.getToken()
    if (!token || !canEditServices) return

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory = await api.updateServiceCategory(token, editingCategory.id, categoryForm)
        setCategories(categories.map(c => c.id === editingCategory.id ? updatedCategory : c))
        toast({
          title: "Éxito",
          description: "Categoría actualizada correctamente",
        })
      } else {
        // Create new category
        const newCategory = await api.createServiceCategory(token, categoryForm)
        setCategories([...categories, newCategory])
        toast({
          title: "Éxito",
          description: "Categoría creada correctamente",
        })
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

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      category_id: service.category_id,
      name: service.name,
      short_description: service.short_description || "",
      description: service.description || "",
      price_min: service.price_min || 0,
      price_max: service.price_max || 0,
      duration_minutes: service.duration_minutes || 60,
      requires_consultation: service.requires_consultation,
      is_active: service.is_active,
      is_featured: service.is_featured,
      is_online_bookable: service.is_online_bookable,
      display_order: service.display_order
    })
    setShowServiceDialog(true)
  }

  const handleDeleteService = async (service: Service) => {
    const token = auth.getToken()
    if (!token || !canEditServices) return

    if (!confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) return

    try {
      await api.deleteService(token, service.id)
      setServices(services.filter(s => s.id !== service.id))
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el servicio",
        variant: "destructive",
      })
    }
  }

  const resetServiceForm = () => {
    setServiceForm({
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
    })
    setEditingService(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      icon: "",
      color: "#2563eb",
      display_order: 0
    })
    setEditingCategory(null)
  }

  const getCategoryBadge = (categoryName: string) => {
    return <Badge variant="secondary">{categoryName}</Badge>
  }

  const formatPrice = (price?: number) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price)
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${remainingMinutes}min`
    }
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
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
                ? "Gestiona los servicios disponibles en la clínica"
                : "Consulta los servicios disponibles en la clínica"
              }
            </p>
          </div>
          
          {canEditServices && (
            <div className="flex gap-2">
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={resetCategoryForm}>
                    <Package className="mr-2 h-4 w-4" />
                    Nueva Categoría
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground">
                Servicios configurados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(service => service.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponibles para citas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destacados</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(service => service.is_featured).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Servicios destacados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Categorías activas
              </p>
            </CardContent>
          </Card>
        </div>

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

          <div className="flex items-center gap-2">
            <Switch
              checked={showOnlyActive}
              onCheckedChange={setShowOnlyActive}
            />
            <Label>Solo activos</Label>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {getCategoryBadge(service.category_name)}
                  </div>
                  
                  {canEditServices && (
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteService(service)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {!canEditServices && (
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.short_description && (
                  <p className="text-sm text-muted-foreground">
                    {service.short_description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{service.price_range_text}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDuration(service.duration_minutes)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-1">
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    {service.requires_consultation && (
                      <Badge variant="outline">
                        Requiere consulta
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No hay servicios</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm 
                  ? "No se encontraron servicios que coincidan con la búsqueda."
                  : "Comienza creando el primer servicio de la clínica."
                }
              </p>
              {canEditServices && !searchTerm && (
                <div className="mt-6">
                  <Button onClick={() => { resetServiceForm(); setShowServiceDialog(true) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Servicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Actualiza la información del servicio."
                : "Completa los datos para crear un nuevo servicio médico."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Servicio</Label>
                <Input
                  id="name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  placeholder="Ej. Consulta de Evaluación"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select 
                  value={serviceForm.category_id} 
                  onValueChange={(value) => setServiceForm({...serviceForm, category_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="short_description">Descripción Corta</Label>
              <Input
                id="short_description"
                value={serviceForm.short_description}
                onChange={(e) => setServiceForm({...serviceForm, short_description: e.target.value})}
                placeholder="Breve descripción del servicio"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción Completa</Label>
              <Textarea
                id="description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                placeholder="Descripción detallada del servicio"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_min">Precio Mínimo</Label>
                <Input
                  id="price_min"
                  type="number"
                  value={serviceForm.price_min || ""}
                  onChange={(e) => setServiceForm({...serviceForm, price_min: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price_max">Precio Máximo</Label>
                <Input
                  id="price_max"
                  type="number"
                  value={serviceForm.price_max || ""}
                  onChange={(e) => setServiceForm({...serviceForm, price_max: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="duration_minutes">Duración (min)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({...serviceForm, duration_minutes: parseInt(e.target.value) || 60})}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_consultation"
                  checked={serviceForm.requires_consultation}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, requires_consultation: checked})}
                />
                <Label htmlFor="requires_consultation">Requiere consulta previa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={serviceForm.is_featured}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, is_featured: checked})}
                />
                <Label htmlFor="is_featured">Servicio destacado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={serviceForm.is_active}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, is_active: checked})}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleServiceSubmit}>
                {editingService ? "Actualizar" : "Crear"} Servicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Crear Nueva Categoría"}
            </DialogTitle>
            <DialogDescription>
              Las categorías ayudan a organizar los servicios médicos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category_name">Nombre de la Categoría</Label>
              <Input
                id="category_name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="Ej. Consultas"
              />
            </div>

            <div>
              <Label htmlFor="category_description">Descripción</Label>
              <Textarea
                id="category_description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Descripción de la categoría"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category_icon">Icono</Label>
                <Input
                  id="category_icon"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                  placeholder="stethoscope"
                />
              </div>
              <div>
                <Label htmlFor="category_color">Color</Label>
                <Input
                  id="category_color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCategorySubmit}>
                {editingCategory ? "Actualizar" : "Crear"} Categoría
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}