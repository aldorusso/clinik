"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { User, Shield, Loader2, Bell } from "lucide-react"
import { api, UserUpdate } from "@/lib/api"
import { auth } from "@/lib/auth"
import { toast } from "sonner"
import {
  ProfileHeaderCard,
  PersonalInfoForm,
  SecurityTab,
  NotificationsTab,
  ChangePasswordDialog,
} from "@/components/profile"

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "profile"

  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [officeAddress, setOfficeAddress] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [profilePhoto, setProfilePhoto] = useState("")

  // Image crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState("")

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Notifications state
  const [notificationStats, setNotificationStats] = useState({ total: 0, unread: 0, read: 0 })

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "")
      setLastName(user.last_name || "")
      setPhone(user.phone || "")
      setCountry(user.country || "")
      setCity(user.city || "")
      setOfficeAddress(user.office_address || "")
      setCompanyName(user.company_name || "")
      setProfilePhoto(user.profile_photo || "")
    }

    if (initialTab === "notifications") {
      loadNotificationStats()
    }
  }, [user, initialTab])

  const loadNotificationStats = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      const response = await api.getNotifications(token, { skip: 0, limit: 1 })
      setNotificationStats({
        total: response.total,
        unread: response.unread_count,
        read: response.total - response.unread_count
      })
    } catch (error) {
      console.error("Error loading notification stats:", error)
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
        office_address: officeAddress || undefined,
        company_name: companyName || undefined,
        profile_photo: profilePhoto || undefined,
      }

      await api.updateProfile(token, updateData)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y configuracion de seguridad
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6" onValueChange={(value) => {
        if (value === "notifications") {
          loadNotificationStats()
        }
      }}>
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
            {notificationStats.unread > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {notificationStats.unread}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileHeaderCard
            firstName={firstName}
            lastName={lastName}
            email={user?.email}
            role={user?.role}
            profilePhoto={profilePhoto}
            onFileSelect={handleFileSelect}
          />

          <ImageCropDialog
            open={cropDialogOpen}
            onOpenChange={setCropDialogOpen}
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
          />

          <PersonalInfoForm
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
            officeAddress={officeAddress}
            setOfficeAddress={setOfficeAddress}
            companyName={companyName}
            setCompanyName={setCompanyName}
            saving={saving}
            onSave={handleSaveProfile}
          />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <SecurityTab
            user={user}
            onChangePassword={() => setShowPasswordDialog(true)}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationsTab stats={notificationStats} />
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
