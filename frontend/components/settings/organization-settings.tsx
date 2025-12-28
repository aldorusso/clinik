"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { TenantSettingsUpdate } from "@/lib/api"

interface OrganizationSettingsProps {
  form: TenantSettingsUpdate
  setForm: (form: TenantSettingsUpdate) => void
}

export function OrganizationSettings({ form, setForm }: OrganizationSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Organización</CardTitle>
        <CardDescription>
          Datos básicos de tu clínica u organización
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Organización *</Label>
            <Input
              id="name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mi Clínica"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legal_name">Razón Social</Label>
            <Input
              id="legal_name"
              value={form.legal_name || ""}
              onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
              placeholder="Mi Clínica S.A. de C.V."
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email de Contacto</Label>
            <Input
              id="email"
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@miclinica.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+52 55 1234 5678"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="website">Sitio Web</Label>
            <Input
              id="website"
              value={form.website || ""}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://www.miclinica.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">RFC / NIT / RUC</Label>
            <Input
              id="tax_id"
              value={form.tax_id || ""}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              placeholder="ABC123456789"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Av. Principal #123, Colonia Centro"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={form.city || ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Ciudad de México"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={form.country || ""}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="México"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="primary_color">Color Principal (Hex)</Label>
          <div className="flex gap-2">
            <Input
              id="primary_color"
              value={form.primary_color || ""}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              placeholder="#3B82F6"
              className="flex-1"
            />
            {form.primary_color && (
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: form.primary_color }}
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            El color principal se usa para personalizar la apariencia de la plataforma
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
