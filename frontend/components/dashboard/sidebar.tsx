"use client"

import { useState } from "react"
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
import {
  LogOut,
  User as UserIcon,
  Lock,
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Calendar,
  CalendarDays,
  Stethoscope,
  Target,
  BarChart3,
  ChevronRight,
  Settings
} from "lucide-react"
import { auth } from "@/lib/auth"
import { User as UserType } from "@/lib/api"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: UserType | null
}

export function Sidebar({ user }: SidebarProps) {
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
    return "U"
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "manager":
        return "Gestor de Leads"
      case "medico":
        return "Medico"
      case "closer":
        return "Closer/Comercial"
      case "recepcionista":
        return "Recepcionista"
      default:
        return "Usuario"
    }
  }

  const NavItem = ({
    href,
    icon: Icon,
    label,
    isActive
  }: {
    href: string
    icon: React.ElementType
    label: string
    isActive: boolean
  }) => (
    <button
      onClick={() => router.push(href)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <Icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
      <span>{label}</span>
      {isActive && <ChevronRight className="ml-auto h-4 w-4 text-sidebar-primary" />}
    </button>
  )

  const NavSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider px-3 mb-2">
        {title}
      </p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )

  const renderNavigation = () => {
    if (!user) return null

    const isManager = user.role === "manager"
    const isDoctor = user.role === "medico"
    const isCommercial = user.role === "closer"
    const isReceptionist = user.role === "recepcionista"

    return (
      <nav className="space-y-1">
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={pathname === "/dashboard"}
        />

        {/* Gestion de Leads - Solo Managers y Recepcionistas */}
        {(isManager || isReceptionist) && (
          <NavSection title="Gestion de Leads">
            <NavItem
              href="/dashboard/leads"
              icon={Users}
              label="Leads"
              isActive={pathname.startsWith("/dashboard/leads")}
            />
            <NavItem
              href="/dashboard/pacientes"
              icon={UserCheck}
              label="Pacientes"
              isActive={pathname.startsWith("/dashboard/pacientes")}
            />
          </NavSection>
        )}

        {/* Mi Gestion Comercial - Solo para Comerciales */}
        {isCommercial && (
          <NavSection title="Mi Gestion Comercial">
            <NavItem
              href="/dashboard/mis-leads"
              icon={Users}
              label="Mis Leads"
              isActive={pathname.startsWith("/dashboard/mis-leads")}
            />
            <NavItem
              href="/dashboard/mis-pacientes"
              icon={UserCheck}
              label="Mis Pacientes"
              isActive={pathname.startsWith("/dashboard/mis-pacientes")}
            />
          </NavSection>
        )}

        {/* Para medicos - solo pacientes */}
        {isDoctor && (
          <NavSection title="Mi Consulta">
            <NavItem
              href="/dashboard/mis-pacientes"
              icon={UserCheck}
              label="Mis Pacientes"
              isActive={pathname.startsWith("/dashboard/mis-pacientes")}
            />
          </NavSection>
        )}

        {/* Citas Section */}
        <NavSection title="Agenda">
          {(isManager || isReceptionist) && (
            <>
              <NavItem
                href="/dashboard/citas"
                icon={Calendar}
                label="Citas"
                isActive={pathname.startsWith("/dashboard/citas")}
              />
              <NavItem
                href="/dashboard/calendario"
                icon={CalendarDays}
                label="Calendario"
                isActive={pathname.startsWith("/dashboard/calendario")}
              />
            </>
          )}
          {(isCommercial || isDoctor) && (
            <NavItem
              href="/dashboard/mis-citas"
              icon={Calendar}
              label="Mis Citas"
              isActive={pathname.startsWith("/dashboard/mis-citas")}
            />
          )}
        </NavSection>

        {/* Reportes - Solo para Managers */}
        {isManager && (
          <NavSection title="Reportes">
            <NavItem
              href="/dashboard/estadisticas"
              icon={BarChart3}
              label="Estadisticas"
              isActive={pathname.startsWith("/dashboard/estadisticas")}
            />
          </NavSection>
        )}

        {/* Mi Performance - Solo para Comerciales */}
        {isCommercial && (
          <NavSection title="Mi Performance">
            <NavItem
              href="/dashboard/estadisticas"
              icon={BarChart3}
              label="Mi Performance"
              isActive={pathname.startsWith("/dashboard/estadisticas")}
            />
            <NavItem
              href="/dashboard/objetivos"
              icon={Target}
              label="Mis Objetivos"
              isActive={pathname.startsWith("/dashboard/objetivos")}
            />
          </NavSection>
        )}

        {/* Organizacion */}
        {(isManager || isDoctor || isReceptionist) && (
          <NavSection title="Organizacion">
            <NavItem
              href="/dashboard/directorio"
              icon={Users}
              label="Directorio"
              isActive={pathname.startsWith("/dashboard/directorio")}
            />
            <NavItem
              href="/dashboard/servicios"
              icon={Stethoscope}
              label="Servicios Medicos"
              isActive={pathname.startsWith("/dashboard/servicios")}
            />
          </NavSection>
        )}
      </nav>
    )
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo Section */}
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
            <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sidebar-foreground">Clinik</span>
            <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">CRM</span>
          </div>
        </div>
      </div>

      {/* Tenant/Organization Name */}
      {user?.tenant_name && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-sidebar-muted" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">
                Clinica
              </span>
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user.tenant_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {renderNavigation()}
      </div>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-border">
                <AvatarImage src={user?.profile_photo || ""} alt={user?.full_name || user?.email} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate w-full text-left">
                  {user?.first_name || user?.full_name || "Usuario"}
                </span>
                <span className="text-xs text-sidebar-muted truncate w-full text-left">
                  {user ? getRoleName(user.role) : "Usuario"}
                </span>
              </div>
              <Settings className="h-4 w-4 text-sidebar-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name || user?.first_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/dashboard/profile?tab=security")} className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4" />
              <span>Seguridad</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
