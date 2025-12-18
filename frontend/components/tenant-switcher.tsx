"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, ChevronDown, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { api, MyTenantsResponse } from "@/lib/api"
import { auth } from "@/lib/auth"

interface TenantSwitcherProps {
  className?: string
}

export function TenantSwitcher({ className }: TenantSwitcherProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [tenantsData, setTenantsData] = useState<MyTenantsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTenants = async () => {
    const token = auth.getToken()
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await api.getMyTenants(token)
      setTenantsData(data)
    } catch (err: any) {
      console.error("Error fetching tenants:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleSwitchTenant = async (tenantId: string) => {
    const token = auth.getToken()
    if (!token) return

    setIsSwitching(true)
    setError(null)

    try {
      const response = await api.switchTenant(token, tenantId)
      auth.switchTenant(response)

      // Refresh page to load new tenant context
      router.refresh()
      // Re-fetch tenant data
      await fetchTenants()
    } catch (err: any) {
      console.error("Error switching tenant:", err)
      setError(err.message)
    } finally {
      setIsSwitching(false)
    }
  }

  // Don't show if superadmin or only one tenant
  if (!tenantsData || tenantsData.is_superadmin || tenantsData.tenants.length <= 1) {
    return null
  }

  const currentTenant = tenantsData.tenants.find(t => t.is_current)
  const otherTenants = tenantsData.tenants.filter(t => !t.is_current)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 px-3 py-2 h-auto ${className}`}
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Spinner size="sm" />
          ) : currentTenant?.tenant_logo ? (
            <img
              src={currentTenant.tenant_logo}
              alt={currentTenant.tenant_name}
              className="w-6 h-6 rounded object-cover"
            />
          ) : (
            <Building2 className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="font-medium text-sm hidden sm:inline">
            {currentTenant?.tenant_name || "Organización"}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Cambiar organización
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Current Tenant */}
        {currentTenant && (
          <DropdownMenuItem
            className="flex items-center gap-3 py-3 cursor-default"
            disabled
          >
            {currentTenant.tenant_logo ? (
              <img
                src={currentTenant.tenant_logo}
                alt={currentTenant.tenant_name}
                className="w-8 h-8 rounded object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentTenant.tenant_name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentTenant.role.replace("_", " ")}
              </p>
            </div>
            <Check className="w-4 h-4 text-primary" />
          </DropdownMenuItem>
        )}

        {/* Other Tenants */}
        {otherTenants.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {otherTenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.tenant_id}
                className="flex items-center gap-3 py-3 cursor-pointer"
                onClick={() => handleSwitchTenant(tenant.tenant_id)}
                disabled={isSwitching}
              >
                {tenant.tenant_logo ? (
                  <img
                    src={tenant.tenant_logo}
                    alt={tenant.tenant_name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{tenant.tenant_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {tenant.role.replace("_", " ")}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-destructive">
              Error: {error}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
