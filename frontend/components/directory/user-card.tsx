"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Mail,
  Phone,
  Stethoscope,
  Building,
  Calendar,
  MapPin,
  MessageCircle
} from "lucide-react"
import { User as UserType } from "@/lib/api"
import { getRoleInfo, getInitials, getDisplayName } from "./directory-helpers"

interface UserCardProps {
  user: UserType
}

export function UserCard({ user }: UserCardProps) {
  const roleInfo = getRoleInfo(user.role)

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-full ${roleInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={getDisplayName(user)}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <span className={`font-semibold text-lg ${roleInfo.color}`}>
                {getInitials(user)}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">
                {getDisplayName(user)}
              </h3>
              {!user.is_active && (
                <Badge variant="outline" className="text-xs">
                  Inactivo
                </Badge>
              )}
            </div>

            <Badge variant={roleInfo.variant} className="text-xs mb-2">
              {roleInfo.label}
            </Badge>

            <div className="space-y-1.5 mt-3">
              {/* Email */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <a href={`mailto:${user.email}`} className="truncate hover:text-primary transition-colors">
                  {user.email}
                </a>
              </div>

              {/* Phone */}
              {user.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <a href={`tel:${user.phone}`} className="hover:text-primary transition-colors">
                    {user.phone}
                  </a>
                </div>
              )}

              {/* Job title for medical staff */}
              {user.role === "medico" && user.job_title && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Stethoscope className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Especialidad: {user.job_title}</span>
                </div>
              )}

              {/* Company name */}
              {user.client_company_name && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{user.client_company_name}</span>
                </div>
              )}

              {/* Location */}
              {(user.city || user.country) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {[user.city, user.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {/* Member since */}
              {user.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}</span>
                </div>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-1.5 text-xs">
                <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'} flex-shrink-0`} />
                <span className={user.is_active ? 'text-green-600' : 'text-gray-500'}>
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-4 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.open(`mailto:${user.email}`, '_blank')}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Email
              </Button>
              {user.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open(`tel:${user.phone}`, '_self')}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Llamar
                </Button>
              )}
              {user.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open(`https://wa.me/${user.phone?.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
