"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Mail, Send, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { TenantSettings, TenantSettingsUpdate } from "@/lib/api"

interface SmtpSettingsProps {
  form: TenantSettingsUpdate
  setForm: (form: TenantSettingsUpdate) => void
  settings: TenantSettings | null
  smtpPassword: string
  setSmtpPassword: (password: string) => void
  onTestSmtp: (email: string) => Promise<void>
  testing: boolean
}

export function SmtpSettings({
  form,
  setForm,
  settings,
  smtpPassword,
  setSmtpPassword,
  onTestSmtp,
  testing
}: SmtpSettingsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [testEmail, setTestEmail] = useState("")

  const handleTest = () => {
    if (testEmail) {
      onTestSmtp(testEmail)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configuración de Correo Electrónico
        </CardTitle>
        <CardDescription>
          Configura tu servidor SMTP para enviar correos con la identidad de tu organización.
          Si no configuras SMTP, los correos se enviarán desde el sistema central.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="smtp_enabled" className="text-base">Habilitar SMTP Personalizado</Label>
            <p className="text-sm text-muted-foreground">
              Activa esta opción para usar tu propio servidor de correo
            </p>
          </div>
          <Switch
            id="smtp_enabled"
            checked={form.smtp_enabled || false}
            onCheckedChange={(checked) => setForm({ ...form, smtp_enabled: checked })}
          />
        </div>

        {form.smtp_enabled && (
          <>
            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Servidor SMTP *</Label>
                <Input
                  id="smtp_host"
                  value={form.smtp_host || ""}
                  onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">Puerto *</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={form.smtp_port || 587}
                  onChange={(e) => setForm({ ...form, smtp_port: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp_username">Usuario SMTP *</Label>
                <Input
                  id="smtp_username"
                  value={form.smtp_username || ""}
                  onChange={(e) => setForm({ ...form, smtp_username: e.target.value })}
                  placeholder="tu-correo@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_password">
                  Contraseña SMTP {settings?.smtp_password_set && "(Ya configurada)"}
                </Label>
                <div className="relative">
                  <Input
                    id="smtp_password"
                    type={showPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder={settings?.smtp_password_set ? "••••••••" : "Ingresa la contraseña"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {settings?.smtp_password_set && (
                  <p className="text-sm text-muted-foreground">
                    Deja en blanco para mantener la contraseña actual
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp_from_email">Email Remitente</Label>
                <Input
                  id="smtp_from_email"
                  type="email"
                  value={form.smtp_from_email || ""}
                  onChange={(e) => setForm({ ...form, smtp_from_email: e.target.value })}
                  placeholder="noreply@miclinica.com"
                />
                <p className="text-sm text-muted-foreground">
                  Si no se especifica, se usará el usuario SMTP
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_from_name">Nombre Remitente</Label>
                <Input
                  id="smtp_from_name"
                  value={form.smtp_from_name || ""}
                  onChange={(e) => setForm({ ...form, smtp_from_name: e.target.value })}
                  placeholder="Mi Clínica"
                />
                <p className="text-sm text-muted-foreground">
                  Si no se especifica, se usará el nombre de la organización
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_use_tls"
                  checked={form.smtp_use_tls ?? true}
                  onCheckedChange={(checked) => setForm({ ...form, smtp_use_tls: checked })}
                />
                <Label htmlFor="smtp_use_tls">Usar TLS (STARTTLS)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_use_ssl"
                  checked={form.smtp_use_ssl ?? false}
                  onCheckedChange={(checked) => setForm({ ...form, smtp_use_ssl: checked })}
                />
                <Label htmlFor="smtp_use_ssl">Usar SSL</Label>
              </div>
            </div>

            <Separator />

            {/* Test SMTP */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Probar Configuración</CardTitle>
                <CardDescription>
                  Envía un correo de prueba para verificar que la configuración es correcta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTest}
                    disabled={testing || !testEmail || !settings?.smtp_password_set}
                    variant="secondary"
                  >
                    {testing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar Prueba
                  </Button>
                </div>
                {!settings?.smtp_password_set && (
                  <p className="text-sm text-amber-600 mt-2">
                    Guarda la contraseña SMTP primero antes de probar
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!form.smtp_enabled && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Correos del sistema central
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Los correos se enviarán desde el servidor central de la plataforma.
                  Activa el SMTP personalizado si deseas enviar correos con la identidad de tu organización.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
