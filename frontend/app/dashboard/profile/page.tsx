"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { User as UserIcon, MapPin, Building2, Mail, Save, X, Camera } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { api, User, UserUpdate } from "@/lib/api"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>("")
  const [formData, setFormData] = useState<UserUpdate>({
    first_name: "",
    last_name: "",
    phone: "",
    country: "",
    city: "",
    office_address: "",
    company_name: "",
    profile_photo: "",
  })

  useEffect(() => {
    const loadUser = async () => {
      const token = auth.getToken()
      if (!token) {
        router.push("/")
        return
      }

      try {
        const userData = await api.getCurrentUser(token)
        setUser(userData)
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          phone: userData.phone || "",
          country: userData.country || "",
          city: userData.city || "",
          office_address: userData.office_address || "",
          company_name: userData.company_name || "",
          profile_photo: userData.profile_photo || "",
        })
      } catch (error) {
        auth.removeToken()
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleInputChange = (field: keyof UserUpdate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande", {
          description: "El tamaño máximo es 2MB"
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
        setCropDialogOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setFormData((prev) => ({ ...prev, profile_photo: croppedImage }))
    toast.success("Foto actualizada", {
      description: "No olvides guardar los cambios"
    })
  }

  const handleSave = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    setIsSaving(true)
    try {
      const updatedUser = await api.updateProfile(token, formData)
      setUser(updatedUser)
      toast.success("Perfil actualizado", {
        description: "Tus cambios han sido guardados correctamente"
      })
    } catch (error) {
      toast.error("Error al actualizar", {
        description: "No se pudo guardar tu perfil. Intenta de nuevo."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        country: user.country || "",
        city: user.city || "",
        office_address: user.office_address || "",
        company_name: user.company_name || "",
        profile_photo: user.profile_photo || "",
      })
      toast.info("Cambios cancelados", {
        description: "Se restauraron los valores originales"
      })
    }
  }

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <UserIcon className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu información personal
            </p>
          </div>
        </div>

        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Actualiza tu foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.profile_photo || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(formData.first_name, formData.last_name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Seleccionar Foto
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG o GIF. Tamaño máximo 2MB.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Crop Dialog */}
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Actualiza tus datos personales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  Nombres <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Carlos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Apellidos <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Canción"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+330624455428"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Ubicación y datos de contacto adicionales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venezuela">Venezuela</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                    <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    className="pl-10"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Caracas"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_address">Dirección de Oficina</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="office_address"
                  className="pl-10"
                  value={formData.office_address}
                  onChange={(e) => handleInputChange("office_address", e.target.value)}
                  placeholder="Santa Fe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_name"
                  className="pl-10"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Inertia"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Detalles de tu cuenta en el sistema (no editables)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  className="pl-10 bg-muted"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">
                No editable por seguridad
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Rol</Label>
              <p className="text-sm capitalize">{user?.role}</p>
            </div>
            <div className="space-y-2">
              <Label>Fecha de Registro</Label>
              <p className="text-sm">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
