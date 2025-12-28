"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Users, Search } from "lucide-react"
import { User as UserType, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  getRoleInfo,
  getDisplayName,
  groupUsersByRole,
  DirectoryStatsCards,
  RoleFilter,
  UsersByRoleList,
  DirectoryEmptyState
} from "@/components/directory"

export default function AdminDirectorioPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")

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

  const filteredUsers = users.filter(user => {
    if (selectedRole !== "all" && user.role !== selectedRole) return false
    if (!searchTerm) return true

    const name = getDisplayName(user).toLowerCase()
    const email = user.email?.toLowerCase() || ""
    const role = getRoleInfo(user.role).label.toLowerCase()
    const phone = user.phone?.toLowerCase() || ""
    const company = user.client_company_name?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()

    return name.includes(search) || email.includes(search) || role.includes(search) || phone.includes(search) || company.includes(search)
  })

  const usersByRole = groupUsersByRole(filteredUsers)

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedRole("all")
  }

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
          <h1 className="text-3xl font-bold">Directorio de la Clinica</h1>
          <p className="text-muted-foreground">
            Directorio completo con contactos de todo el equipo de tu clinica
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {users.length} miembros del equipo
        </div>
      </div>

      {/* Quick Stats */}
      <DirectoryStatsCards usersByRole={groupUsersByRole(users)} />

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, rol, telefono o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <RoleFilter
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          searchTerm={searchTerm}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Users by Role */}
      <UsersByRoleList usersByRole={usersByRole} />

      {filteredUsers.length === 0 && (
        <DirectoryEmptyState
          hasFilters={!!searchTerm || selectedRole !== "all"}
          onClearFilters={clearFilters}
        />
      )}
    </div>
  )
}
