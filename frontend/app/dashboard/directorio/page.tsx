"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { 
  Users, 
  Search, 
  Mail, 
  Phone,
  User,
  Shield,
  UserCog,
  Stethoscope,
  Briefcase,
  HeadphonesIcon,
  Building,
  Calendar,
  MapPin,
  MessageCircle,
  FileText,
  Filter,
  X
} from "lucide-react"
import { User as UserType, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function DirectorioPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")

  // Cargar usuarios desde la API
  const fetchUsers = async () => {
    setLoading(true)
    const token = auth.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const usersData = await api.getMyTenantUsers(token)
      setUsers(usersData)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Error al cargar el directorio de usuarios",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "tenant_admin":
        return { 
          label: "Administrador", 
          icon: Shield, 
          variant: "destructive" as const,
          color: "text-red-600",
          bgColor: "bg-red-50"
        }
      case "manager":
        return { 
          label: "Gestor de Leads", 
          icon: UserCog, 
          variant: "default" as const,
          color: "text-blue-600",
          bgColor: "bg-blue-50"
        }
      case "user":
        return { 
          label: "Médico", 
          icon: Stethoscope, 
          variant: "secondary" as const,
          color: "text-green-600",
          bgColor: "bg-green-50"
        }
      case "closer":
        return {
          label: "Closer",
          icon: Briefcase,
          variant: "outline" as const,
          color: "text-purple-600",
          bgColor: "bg-purple-50"
        }
      case "recepcionista":
        return { 
          label: "Recepcionista", 
          icon: HeadphonesIcon, 
          variant: "outline" as const,
          color: "text-orange-600",
          bgColor: "bg-orange-50"
        }
      default:
        return { 
          label: "Usuario", 
          icon: User, 
          variant: "outline" as const,
          color: "text-gray-600",
          bgColor: "bg-gray-50"
        }
    }
  }

  const getInitials = (user: UserType) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user.first_name) {
      return user.first_name.slice(0, 2).toUpperCase()
    }
    if (user.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const getDisplayName = (user: UserType) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.full_name) {
      return user.full_name
    }
    return user.email
  }

  const filteredUsers = users.filter(user => {
    // Filtro por rol
    if (selectedRole !== "all" && user.role !== selectedRole) return false
    
    // Filtro por búsqueda
    if (!searchTerm) return true
    const name = getDisplayName(user).toLowerCase()
    const email = user.email?.toLowerCase() || ""
    const role = getRoleInfo(user.role).label.toLowerCase()
    const phone = user.phone?.toLowerCase() || ""
    const company = user.client_company_name?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    
    return name.includes(search) || email.includes(search) || role.includes(search) || phone.includes(search) || company.includes(search)
  })

  // Agrupar usuarios por rol
  const usersByRole = {
    tenant_admin: filteredUsers.filter(u => u.role === "tenant_admin"),
    manager: filteredUsers.filter(u => u.role === "manager"),
    user: filteredUsers.filter(u => u.role === "user"),
    closer: filteredUsers.filter(u => u.role === "closer"),
    recepcionista: filteredUsers.filter(u => u.role === "recepcionista"),
    others: filteredUsers.filter(u => !["tenant_admin", "manager", "user", "closer", "recepcionista"].includes(u.role))
  }

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
            <h1 className="text-3xl font-bold">Directorio de la Organización</h1>
            <p className="text-muted-foreground">
              Encuentra y contacta a todos los miembros de tu organización
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {users.length} miembros
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, rol, teléfono o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="tenant_admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrador
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Gestor de Leads
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Médico
                  </div>
                </SelectItem>
                <SelectItem value="closer">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Closer
                  </div>
                </SelectItem>
                <SelectItem value="recepcionista">
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="h-4 w-4" />
                    Recepcionista
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {(searchTerm || selectedRole !== "all") && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedRole("all")
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Users by Role */}
        <div className="space-y-6">
          {Object.entries(usersByRole).map(([role, roleUsers]) => {
            if (roleUsers.length === 0) return null
            
            const roleInfo = getRoleInfo(role)
            const RoleIcon = roleInfo.icon
            
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-4">
                  <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                  <h2 className="text-xl font-semibold">{roleInfo.label}s</h2>
                  <Badge variant="outline">{roleUsers.length}</Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roleUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className={`w-14 h-14 rounded-full ${roleInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                            {user.profile_photo ? (
                              <img 
                                src={user.profile_photo} 
                                alt={getDisplayName(user)}
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <span className={`font-semibold text-lg ${roleInfo.color}`}>
                                {getInitials(user)}
                              </span>
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base truncate">
                                {getDisplayName(user)}
                              </h3>
                              {!user.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                            
                            <Badge variant={roleInfo.variant} className="text-xs mb-2">
                              {roleInfo.label}
                            </Badge>
                            
                            <div className="space-y-1.5 mt-3">
                              {/* Email - always show */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <a href={`mailto:${user.email}`} className="truncate hover:text-primary transition-colors">
                                  {user.email}
                                </a>
                              </div>
                              
                              {/* Phone */}
                              {user.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <a href={`tel:${user.phone}`} className="hover:text-primary transition-colors">
                                    {user.phone}
                                  </a>
                                </div>
                              )}
                              
                              {/* Job title for medical staff */}
                              {user.role === "user" && user.job_title && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Stethoscope className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">Especialidad: {user.job_title}</span>
                                </div>
                              )}
                              
                              {/* Company name for clients */}
                              {user.client_company_name && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Building className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{user.client_company_name}</span>
                                </div>
                              )}
                              
                              {/* Location */}
                              {(user.city || user.country) && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {[user.city, user.country].filter(Boolean).join(", ")}
                                  </span>
                                </div>
                              )}
                              
                              {/* Member since */}
                              {user.created_at && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}</span>
                                </div>
                              )}
                              
                              {/* Status indicator */}
                              <div className="flex items-center gap-1.5 text-xs">
                                <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'} flex-shrink-0`} />
                                <span className={user.is_active ? 'text-green-600' : 'text-gray-500'}>
                                  {user.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-1.5 mt-4 pt-2 border-t border-border">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                              {user.phone && (
                                <Button
                                  variant="outline"
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => window.open(`tel:${user.phone}`, '_self')}
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  Llamar
                                </Button>
                              )}
                              {user.phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => window.open(`https://wa.me/${user.phone?.replace(/\D/g, '')}`, '_blank')}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  WhatsApp
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedRole !== "all"
                ? "Intenta con otros términos de búsqueda o filtros"
                : "No hay usuarios registrados en la organización"
              }
            </p>
            {(searchTerm || selectedRole !== "all") && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedRole("all")
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}