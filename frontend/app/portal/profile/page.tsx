"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { User, Shield, Loader2 } from "lucide-react"
import { api, User as UserType, UserUpdate } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import { ChangePasswordDialog } from "@/components/profile"
import {
  ClientHeaderCard,
  CompanyInfoForm,
  ClientContactForm,
  ClientSecurityTab
} from "@/components/portal-profile"

function ClientProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "profile"

  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [clientCompanyName, setClientCompanyName] = useState("")
  const [clientTaxId, setClientTaxId] = useState("")
  const [profilePhoto, setProfilePhoto] = useState("")

  // Image crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState("")

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const token = auth.getToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const userData = await api.getMe(token)
      setUser(userData)
      setFirstName(userData.first_name || "")
      setLastName(userData.last_name || "")
      setPhone(userData.phone || "")
      setCountry(userData.country || "")
      setCity(userData.city || "")
      setClientCompanyName(userData.client_company_name || "")
      setClientTaxId(userData.client_tax_id || "")
      setProfilePhoto(userData.profile_photo || "")
    } catch (error) {
      console.error("Error loading user:", error)
      toast.error("No se pudo cargar la informacion del perfil")
      auth.removeToken()
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Maximo 2MB")
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
    setProfilePhoto(croppedImage)
    toast.success("Foto actualizada. No olvides guardar los cambios")
  }

  const handleSaveProfile = async () => {
    const token = auth.getToken()
    if (!token) return

    setSaving(true)
    try {
      const updateData: UserUpdate = {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
        country: country || undefined,
        city: city || undefined,
        client_company_name: clientCompanyName || undefined,
        client_tax_id: clientTaxId || undefined,
        profile_photo: profilePhoto || undefined,
      }

      const updatedUser = await api.updateProfile(token, updateData)
      setUser(updatedUser)
      toast.success("Perfil actualizado correctamente")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (newPassword.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres")
      return
    }

    const token = auth.getToken()
    if (!token) return

    setChangingPassword(true)
    try {
      await api.changePassword(token, currentPassword, newPassword)
      toast.success("Contrasena actualizada correctamente")
      setShowPasswordDialog(false)
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar la contrasena")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y configuracion de seguridad
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ClientHeaderCard
            firstName={firstName}
            lastName={lastName}
            email={user?.email}
            companyName={clientCompanyName}
            profilePhoto={profilePhoto}
            onFileSelect={handleFileSelect}
          />

          <ImageCropDialog
            open={cropDialogOpen}
            onOpenChange={setCropDialogOpen}
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
          />

          <CompanyInfoForm
            companyName={clientCompanyName}
            setCompanyName={setClientCompanyName}
            taxId={clientTaxId}
            setTaxId={setClientTaxId}
          />

          <ClientContactForm
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={user?.email}
            phone={phone}
            setPhone={setPhone}
            country={country}
            setCountry={setCountry}
            city={city}
            setCity={setCity}
            saving={saving}
            onSave={handleSaveProfile}
          />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <ClientSecurityTab
            user={user}
            onChangePassword={() => setShowPasswordDialog(true)}
          />
        </TabsContent>
      </Tabs>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSubmit={handleChangePassword}
        loading={changingPassword}
      />
    </div>
  )
}

export default function ClientProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ClientProfilePageContent />
    </Suspense>
  )
}
