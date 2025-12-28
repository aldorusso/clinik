"use client"

import { useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Building2 } from "lucide-react"

interface ClientHeaderCardProps {
  firstName: string
  lastName: string
  email?: string
  companyName?: string
  profilePhoto: string
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ClientHeaderCard({
  firstName,
  lastName,
  email,
  companyName,
  profilePhoto,
  onFileSelect
}: ClientHeaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase()
    }
    if (companyName) {
      return companyName.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "CL"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profilePhoto || ""} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelect}
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <CardTitle className="text-2xl">
              {firstName && lastName ? `${firstName} ${lastName}` : companyName || email}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" />
              Cliente
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-1">{email}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
