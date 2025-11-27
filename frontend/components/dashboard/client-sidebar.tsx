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
import { Lock, LogOut, User as UserIcon, LayoutDashboard, FileText, MessageSquare, Building2 } from "lucide-react"
import { auth } from "@/lib/auth"
import { User as UserType } from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface ClientSidebarProps {
  user: UserType | null
}

export function ClientSidebar({ user }: ClientSidebarProps) {
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
    if (user?.client_company_name) {
      return user.client_company_name.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return "CL"
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl">Portal</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      {/* Tenant/Organization Name */}
      {user?.tenant_name && (
        <div className="border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Organizacion
              </span>
              <span className="text-sm font-medium truncate">
                {user.tenant_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          <Button
            variant={pathname === "/portal" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/portal")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Inicio
          </Button>

          <Separator className="my-4" />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Mis Documentos
          </p>

          <Button
            variant={pathname.startsWith("/portal/documentos") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/portal/documentos")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentos
          </Button>

          <Button
            variant={pathname.startsWith("/portal/mensajes") ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/portal/mensajes")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Mensajes
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
                    {user?.first_name || user?.client_company_name || "Cliente"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {user?.email}
                  </span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/portal/profile")} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/portal/profile?tab=security")} className="cursor-pointer">
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
