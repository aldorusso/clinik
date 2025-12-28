"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"

export interface ClientFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  client_company_name: string
  client_tax_id: string
}

export interface EditClientFormData {
  first_name: string
  last_name: string
  phone: string
  client_company_name: string
  client_tax_id: string
  is_active: boolean
}

const emptyFormData: ClientFormData = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  client_company_name: "",
  client_tax_id: "",
}

const emptyEditFormData: EditClientFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  client_company_name: "",
  client_tax_id: "",
  is_active: true,
}

export function useClientsManagement() {
  const router = useRouter()
  const [clients, setClients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<User | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData)
  const [editFormData, setEditFormData] = useState<EditClientFormData>(emptyEditFormData)

  const loadData = useCallback(async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const clientsData = await api.getMyTenantClients(token)
      setClients(clientsData)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.email.toLowerCase().includes(searchLower) ||
      (client.first_name?.toLowerCase().includes(searchLower)) ||
      (client.last_name?.toLowerCase().includes(searchLower)) ||
      (client.client_company_name?.toLowerCase().includes(searchLower)) ||
      (client.client_tax_id?.toLowerCase().includes(searchLower))
    )
  })

  const handleCreate = async (): Promise<boolean> => {
    const token = auth.getToken()
    if (!token) return false

    try {
      await api.createMyTenantClient(token, formData)
      toast.success("Cliente creado exitosamente")
      setFormData(emptyFormData)
      loadData()
      return true
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Error al crear cliente")
      return false
    }
  }

  const handleEdit = async (): Promise<boolean> => {
    if (!selectedClient) return false
    const token = auth.getToken()
    if (!token) return false

    try {
      await api.updateMyTenantClient(token, selectedClient.id, editFormData)
      toast.success("Cliente actualizado")
      setSelectedClient(null)
      loadData()
      return true
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Error al actualizar cliente")
      return false
    }
  }

  const handleDelete = async (): Promise<boolean> => {
    if (!selectedClient) return false
    const token = auth.getToken()
    if (!token) return false

    try {
      await api.deleteMyTenantClient(token, selectedClient.id)
      toast.success("Cliente eliminado")
      setSelectedClient(null)
      loadData()
      return true
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Error al eliminar cliente")
      return false
    }
  }

  const handleToggleActive = async (client: User) => {
    const token = auth.getToken()
    if (!token) return

    try {
      await api.updateMyTenantClient(token, client.id, { is_active: !client.is_active })
      toast.success(client.is_active ? "Cliente desactivado" : "Cliente activado")
      loadData()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || "Error al cambiar estado")
    }
  }

  const openEditDialog = (client: User) => {
    setSelectedClient(client)
    setEditFormData({
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      phone: client.phone || "",
      client_company_name: client.client_company_name || "",
      client_tax_id: client.client_tax_id || "",
      is_active: client.is_active,
    })
  }

  const resetFormData = () => {
    setFormData(emptyFormData)
  }

  return {
    clients,
    filteredClients,
    loading,
    searchTerm,
    setSearchTerm,
    selectedClient,
    setSelectedClient,
    formData,
    setFormData,
    editFormData,
    setEditFormData,
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    openEditDialog,
    resetFormData
  }
}
