"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, UserPlus, Building2, Search } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useClientsManagement } from "@/hooks/use-clients-management"
import { CreateClientDialog, EditClientDialog, DeleteClientDialog } from "./clients/client-form-dialogs"
import { ClientsTable } from "./clients/clients-table"

export function ClientesManagement() {
  const {
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
  } = useClientsManagement()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleOpenEdit = (client: typeof selectedClient) => {
    if (client) {
      openEditDialog(client)
      setIsEditDialogOpen(true)
    }
  }

  const handleOpenDelete = (client: typeof selectedClient) => {
    if (client) {
      setSelectedClient(client)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleCloseCreate = () => {
    setIsCreateDialogOpen(false)
    resetFormData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Clientes</h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona los clientes de tu organizacion
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
          <p className="text-xs text-muted-foreground">
            {clients.filter((c) => c.is_active).length} activos
          </p>
        </CardContent>
      </Card>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                {filteredClients.length} de {clients.length} clientes
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ClientsTable
            clients={filteredClients}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onToggleActive={handleToggleActive}
            emptyMessage={searchTerm ? "No hay clientes que coincidan con la busqueda" : "No hay clientes registrados"}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClientDialog
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreate}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreate}
      />

      <EditClientDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        formData={editFormData}
        onFormChange={setEditFormData}
        onSubmit={handleEdit}
      />

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        client={selectedClient}
        onConfirm={handleDelete}
      />
    </div>
  )
}
