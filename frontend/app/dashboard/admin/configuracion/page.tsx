"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Building2, Mail, Save, Loader2 } from "lucide-react"
import { api, TenantSettings, TenantSettingsUpdate } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { OrganizationSettings, SmtpSettings } from "@/components/settings"

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [form, setForm] = useState<TenantSettingsUpdate>({})
  const [smtpPassword, setSmtpPassword] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      const userData = await api.getCurrentUser(token)
      setUserRole(userData.role)

      if (userData.role !== 'tenant_admin') {
        return
      }

      const settingsData = await api.getMyTenantSettings(token)
      setSettings(settingsData)
      setForm({
        name: settingsData.name,
        email: settingsData.email || "",
        phone: settingsData.phone || "",
        website: settingsData.website || "",
        address: settingsData.address || "",
        city: settingsData.city || "",
        country: settingsData.country || "",
        tax_id: settingsData.tax_id || "",
        legal_name: settingsData.legal_name || "",
        primary_color: settingsData.primary_color || "",
        smtp_host: settingsData.smtp_host || "",
        smtp_port: settingsData.smtp_port || 587,
        smtp_username: settingsData.smtp_username || "",
        smtp_from_email: settingsData.smtp_from_email || "",
        smtp_from_name: settingsData.smtp_from_name || "",
        smtp_use_tls: settingsData.smtp_use_tls,
        smtp_use_ssl: settingsData.smtp_use_ssl,
        smtp_enabled: settingsData.smtp_enabled,
      })
    } catch (error: unknown) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Error al cargar la configuración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setSaving(true)
      const updateData: TenantSettingsUpdate = { ...form }
      if (smtpPassword) {
        updateData.smtp_password = smtpPassword
      }
      const updatedSettings = await api.updateMyTenantSettings(token, updateData)
      setSettings(updatedSettings)
      setSmtpPassword("")
      toast({
        title: "Guardado",
        description: "La configuración se ha guardado correctamente",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al guardar"
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleTestSmtp = async (testEmail: string) => {
    const token = auth.getToken()
    if (!token || !testEmail) return

    try {
      setTesting(true)
      const result = await api.testSmtpConnection(token, testEmail)
      toast({ title: "Éxito", description: result.message })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al probar SMTP"
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (userRole !== 'tenant_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo los administradores pueden acceder.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la información y configuración de tu organización
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organización
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Correo Electrónico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrganizationSettings form={form} setForm={setForm} />
        </TabsContent>

        <TabsContent value="smtp">
          <SmtpSettings
            form={form}
            setForm={setForm}
            settings={settings}
            smtpPassword={smtpPassword}
            setSmtpPassword={setSmtpPassword}
            onTestSmtp={handleTestSmtp}
            testing={testing}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
