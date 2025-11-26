"use client"

import { AdminDashboardLayout } from "@/components/dashboard/admin-dashboard-layout"
import { ClientesManagement } from "@/components/dashboard/clientes-management"

export default function AdminClientesPage() {
  return (
    <AdminDashboardLayout>
      <ClientesManagement />
    </AdminDashboardLayout>
  )
}
