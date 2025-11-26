"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ClientesManagement } from "@/components/dashboard/clientes-management"

export default function ClientesPage() {
  return (
    <DashboardLayout>
      <ClientesManagement />
    </DashboardLayout>
  )
}
