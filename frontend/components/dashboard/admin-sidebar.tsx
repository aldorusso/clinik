"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Users,
  Building2,
  Activity,
  Stethoscope,
  Target,
  CalendarDays,
  Package,
  ChevronRight,
  Settings
} from "lucide-react"
import { auth } from "@/lib/auth"
import { User as UserType } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  user: UserType | null
}

export function AdminSidebar({ user }: AdminSidebarProps) {
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
    return "A"
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
    <Link
      href={href}
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
    </Link>
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

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo Section */}
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
            <span className="text-sidebar-primary-foreground font-bold text-lg">C</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-sidebar-foreground">Clinik</span>
            <span className="text-[10px] text-sidebar-muted uppercase tracking-wider">Admin</span>
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
                Organizacion
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
        <nav className="space-y-1">
          <NavItem
            href="/dashboard/admin"
            icon={LayoutDashboard}
            label="Dashboard"
            isActive={pathname === "/dashboard/admin"}
          />

          <NavSection title="Gestion">
            <NavItem
              href="/dashboard/admin/usuarios"
              icon={Users}
              label="Usuarios"
              isActive={pathname.startsWith("/dashboard/admin/usuarios")}
            />
            <NavItem
              href="/dashboard/admin/directorio"
              icon={Users}
              label="Directorio"
              isActive={pathname.startsWith("/dashboard/admin/directorio")}
            />
            <NavItem
              href="/dashboard/admin/clientes"
              icon={Building2}
              label="Clientes"
              isActive={pathname.startsWith("/dashboard/admin/clientes")}
            />
            <NavItem
              href="/dashboard/admin/servicios"
              icon={Stethoscope}
              label="Servicios Medicos"
              isActive={pathname.startsWith("/dashboard/admin/servicios")}
            />
            <NavItem
              href="/dashboard/admin/objetivos"
              icon={Target}
              label="Objetivos Comerciales"
              isActive={pathname.startsWith("/dashboard/admin/objetivos")}
            />
            <NavItem
              href="/dashboard/admin/inventario"
              icon={Package}
              label="Inventario"
              isActive={pathname.startsWith("/dashboard/admin/inventario")}
            />
          </NavSection>

          <NavSection title="Agenda">
            <NavItem
              href="/dashboard/admin/calendario"
              icon={CalendarDays}
              label="Calendario"
              isActive={pathname.startsWith("/dashboard/admin/calendario")}
            />
          </NavSection>

          <NavSection title="Monitoreo">
            <NavItem
              href="/dashboard/admin/actividad"
              icon={Activity}
              label="Registro de Actividad"
              isActive={pathname.startsWith("/dashboard/admin/actividad")}
            />
          </NavSection>
        </nav>
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
                  {user?.first_name || user?.full_name || "Admin"}
                </span>
                <span className="text-xs text-sidebar-muted truncate w-full text-left">
                  {user?.email}
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

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/admin/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/admin/profile?tab=security">
                <Lock className="mr-2 h-4 w-4" />
                <span>Seguridad</span>
              </Link>
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
