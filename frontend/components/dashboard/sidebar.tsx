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
import { Separator } from "@/components/ui/separator"
import { User, Settings, Key, LogOut, User as UserIcon, Bell, Lock, LayoutDashboard } from "lucide-react"
import { auth } from "@/lib/auth"
import { User as UserType } from "@/lib/api"

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

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-center border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-xl">Scraper</span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          <Button
            variant={pathname === "/dashboard" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </nav>

        <Separator className="my-4" />

        {/* API Keys Section */}
        <div className="space-y-2">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              API Keys
            </h3>
          </div>
          <Button
            variant={pathname === "/dashboard/api-keys/google-maps" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/api-keys/google-maps")}
          >
            <Key className="mr-2 h-4 w-4" />
            Google Maps API
          </Button>
          <Button
            variant={pathname === "/dashboard/api-keys/serpapi" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => router.push("/dashboard/api-keys/serpapi")}
          >
            <Key className="mr-2 h-4 w-4" />
            SerpAPI Key
          </Button>
        </div>
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
                  <AvatarImage src="" alt={user?.full_name || user?.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user?.full_name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full">
                    {user?.full_name || "Usuario"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {user?.email}
                  </span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Perfil */}
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>

            {/* Configuración */}
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
