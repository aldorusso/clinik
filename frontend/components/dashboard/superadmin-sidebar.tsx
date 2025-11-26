"use client"

import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Settings, LogOut, User as UserIcon, LayoutDashboard, Users, Mail, Building2, Shield, ClipboardList } from "lucide-react"
import { auth } from "@/lib/auth"
import { User as UserType } from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"

interface SuperadminSidebarProps {
  user: UserType | null
}

export function SuperadminSidebar({ user }: SuperadminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    auth.removeToken()
    router.push("/")
  }

  const getInitials = (user?: UserType | null) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user?.first_name) {
      return user.first_name.slice(0, 2).toUpperCase()
    }
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return "SA"
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">SuperAdmin</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          <Button
            variant={pathname === "/dashboard/superadmin" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/superadmin")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>

          <Separator className="my-4" />

          {/* Tenants Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Multi-Tenant
          </p>
          <Button
            variant={pathname.startsWith("/dashboard/superadmin/tenants") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/superadmin/tenants")}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Organizaciones
          </Button>

          <Separator className="my-4" />

          {/* System Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Sistema
          </p>
          <Button
            variant={pathname.startsWith("/dashboard/superadmin/usuarios") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/superadmin/usuarios")}
          >
            <Users className="mr-2 h-4 w-4" />
            Todos los Usuarios
          </Button>

          <Button
            variant={pathname.startsWith("/dashboard/superadmin/emails") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/superadmin/emails")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Plantillas de Email
          </Button>

          <Button
            variant={pathname.startsWith("/dashboard/superadmin/configuracion") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/superadmin/configuracion")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuracion
          </Button>

          <Button
            variant={pathname.startsWith("/dashboard/superadmin/auditoria") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/superadmin/auditoria")}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Logs / Auditoria
          </Button>
        </nav>
      </div>

      {/* User Section */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start px-2 hover:bg-accent"
            >
              <div className="flex items-center space-x-3 w-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profile_photo || ""} alt={user?.full_name || user?.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full text-left">
                    {user?.first_name || user?.full_name || "SuperAdmin"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {user?.email}
                  </span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta (SuperAdmin)</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/dashboard/superadmin/profile")} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/dashboard/superadmin/profile?tab=security")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Seguridad</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesi&oacute;n</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
