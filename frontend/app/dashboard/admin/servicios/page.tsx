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
import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
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
  Star,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { api, Service, ServiceCategory, ServiceCreate, ServiceUpdate, ServiceCategoryCreate, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

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

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      
      // Get current user (must be tenant_admin)
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

      // Load data in parallel
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

  // Handle service creation/update
  const handleServiceSubmit = async () => {
    const token = auth.getToken()
    if (!token) return

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

  // Handle category creation
  const handleCategorySubmit = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      if (editingCategory) {
        // Update category
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

  const handleDeleteService = async (service: Service) => {
    const token = auth.getToken()
    if (!token) return

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
    setCategoryForm({
      name: "",
      description: "",
      is_active: true
    })
    setEditingCategory(null)
  }

  const formatPrice = (min?: number, max?: number) => {
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    })
    
    if (!min && !max) return 'Consultar precio'
    if (min === max) return formatter.format(min || 0)
    return `${formatter.format(min || 0)} - ${formatter.format(max || 0)}`
  }

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || service.category_id === selectedCategory
    const matchesActive = !showOnlyActive || service.is_active

    return matchesSearch && matchesCategory && matchesActive
  })

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (currentUser?.role !== 'tenant_admin') {
    return (
      <AdminDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-2 text-lg font-semibold">Acceso Denegado</h2>
            <p className="text-muted-foreground">Solo los administradores pueden administrar servicios.</p>
          </div>
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🏥 Administración de Servicios
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground">
                {services.filter(s => s.is_active).length} activos
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
                {categories.filter(c => c.is_active).length} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Consulta</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(s => s.requires_consultation).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren consulta previa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.length ? Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length) : 0} min
              </div>
              <p className="text-xs text-muted-foreground">
                Por procedimiento
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
            <Card key={service.id} className={`hover:bg-muted/50 transition-colors ${!service.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{service.category_name}</Badge>
                      {!service.is_active && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                      {service.requires_consultation && (
                        <Badge variant="outline">Consulta requerida</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">{service.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPrice(service.price_min, service.price_max)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditService(service)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewService(service)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteService(service)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
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
      </div>

      {/* Service Create/Edit Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? "Actualiza la información del servicio médico."
                : "Define un nuevo servicio médico para tu clínica."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-name">Nombre del Servicio</Label>
                <Input
                  id="service-name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  placeholder="Ej. Limpieza Facial Profunda"
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
                    {categories.filter(c => c.is_active).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
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
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({...serviceForm, duration_minutes: parseInt(e.target.value) || 0})}
                  placeholder="60"
                />
              </div>
              <div>
                <Label htmlFor="price-min">Precio Mín (MXN)</Label>
                <Input
                  id="price-min"
                  type="number"
                  value={serviceForm.price_min}
                  onChange={(e) => setServiceForm({...serviceForm, price_min: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-max">Precio Máx (MXN)</Label>
                <Input
                  id="price-max"
                  type="number"
                  value={serviceForm.price_max}
                  onChange={(e) => setServiceForm({...serviceForm, price_max: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preparation">Instrucciones de Preparación</Label>
              <Textarea
                id="preparation"
                value={serviceForm.preparation_instructions}
                onChange={(e) => setServiceForm({...serviceForm, preparation_instructions: e.target.value})}
                placeholder="Instrucciones para el paciente antes del procedimiento..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="contraindications">Contraindicaciones</Label>
              <Textarea
                id="contraindications"
                value={serviceForm.contraindications}
                onChange={(e) => setServiceForm({...serviceForm, contraindications: e.target.value})}
                placeholder="Contraindicaciones y advertencias..."
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires-consultation"
                  checked={serviceForm.requires_consultation}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, requires_consultation: checked})}
                />
                <Label htmlFor="requires-consultation">Requiere consulta previa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={serviceForm.is_active}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, is_active: checked})}
                />
                <Label htmlFor="is-active">Servicio activo</Label>
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
            <DialogTitle>Gestión de Categorías</DialogTitle>
            <DialogDescription>
              Administra las categorías de servicios médicos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing Categories */}
            {categories.length > 0 && (
              <div>
                <Label>Categorías Existentes</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Category */}
            <div className="border-t pt-4">
              <Label>{editingCategory ? "Editar Categoría" : "Crear Nueva Categoría"}</Label>
              
              <div className="space-y-3 mt-2">
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="Nombre de la categoría"
                />
                
                <Textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="Descripción de la categoría"
                  rows={2}
                />
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="category-active"
                    checked={categoryForm.is_active}
                    onCheckedChange={(checked) => setCategoryForm({...categoryForm, is_active: checked})}
                  />
                  <Label htmlFor="category-active">Categoría activa</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => {setShowCategoryDialog(false); resetCategoryForm()}}>
                  {editingCategory ? "Cancelar" : "Cerrar"}
                </Button>
                <Button onClick={handleCategorySubmit}>
                  {editingCategory ? "Actualizar" : "Crear"} Categoría
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Details Dialog */}
      <Dialog open={showServiceDetails} onOpenChange={setShowServiceDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Detalles del Servicio
            </DialogTitle>
            <DialogDescription>
              Información completa del servicio médico
            </DialogDescription>
          </DialogHeader>

          {viewingService && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nombre del Servicio</Label>
                  <p className="text-lg font-medium">{viewingService.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Categoría</Label>
                  <p className="text-lg font-medium">{viewingService.category_name}</p>
                </div>
              </div>

              {viewingService.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                  <p className="text-sm mt-1">{viewingService.description}</p>
                </div>
              )}

              {/* Pricing and Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duración</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{viewingService.duration_minutes} minutos</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Precio Mínimo</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN'
                      }).format(viewingService.price_min || 0)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Precio Máximo</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN'
                      }).format(viewingService.price_max || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2">
                <Badge variant={viewingService.is_active ? "default" : "secondary"}>
                  {viewingService.is_active ? "Activo" : "Inactivo"}
                </Badge>
                <Badge variant={viewingService.requires_consultation ? "outline" : "secondary"}>
                  {viewingService.requires_consultation ? "Requiere Consulta" : "Sin Consulta Previa"}
                </Badge>
              </div>

              {/* Instructions */}
              {viewingService.preparation_instructions && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Instrucciones de Preparación</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg border">
                    <p className="text-sm">{viewingService.preparation_instructions}</p>
                  </div>
                </div>
              )}

              {/* Contraindications */}
              {viewingService.contraindications && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Contraindicaciones</Label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg border">
                    <p className="text-sm">{viewingService.contraindications}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span>Creado: </span>
                    <span>{new Date(viewingService.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div>
                    <span>Actualizado: </span>
                    <span>{new Date(viewingService.updated_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowServiceDetails(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  setShowServiceDetails(false)
                  handleEditService(viewingService)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Servicio
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminDashboardLayout>
  )
}